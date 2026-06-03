import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for OTPs (In a real app, use a DB or Redis)
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, context } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return res.status(500).json({ error: "Email service is not configured on the server" });
    }

    const resend = new Resend(resendApiKey);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { code, expiresAt, attempts: 0 });

    const subjectText = context === 'Đăng ký tài khoản' ? 'Mã xác nhận đăng ký' : 'Mã khôi phục mật khẩu';

    const { data, error } = await resend.emails.send({
      from: "Kế Hoạch Cá Nhân <onboarding@resend.dev>",
      to: [email],
      subject: subjectText,
      html: `<p>Xin chào,</p><p>Mã xác nhận của bạn là: <strong>${code}</strong></p><p>Mã này sẽ hết hạn sau 5 phút.</p><p>Vui lòng không chia sẻ mã này với bất kỳ ai.</p>`,
    });

    if (error) {
      console.error("Resend API error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    res.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("Unexpected error in /api/auth/send-otp:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const storedData = otpStore.get(email);

  if (!storedData) {
    return res.status(400).json({ error: "Mã xác nhận không hợp lệ hoặc đã hết hạn." });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "Mã xác nhận đã hết hạn." });
  }

  if (storedData.attempts >= 5) {
    otpStore.delete(email);
    return res.status(400).json({ error: "Bạn đã nhập sai quá số lần quy định. Vui lòng gửi lại mã mới." });
  }

  if (storedData.code !== code) {
    storedData.attempts += 1;
    otpStore.set(email, storedData);
    return res.status(400).json({ error: "Mã xác nhận không đúng." });
  }

  // Success
  otpStore.delete(email);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
