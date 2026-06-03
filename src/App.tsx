/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAppStore } from './store';
import { AuthView } from './components/AuthView';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const { state } = useAppStore();

  if (!state.currentUser) {
    return <AuthView />;
  }

  return <Dashboard />;
}

