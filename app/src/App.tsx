import { RouterProvider } from 'react-router';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { UnifiedInstancesProvider } from './contexts/UnifiedInstancesContext';
import { ToastProvider } from './contexts/ToastContext';
import { TabsProvider } from './contexts/TabsContext';
import TitleBar from './components/TitleBar';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <AuthProvider>
      <UnifiedInstancesProvider>
        <ToastProvider>
          <TabsProvider>
            <RouterProvider router={router} />
          </TabsProvider>
        </ToastProvider>
      </UnifiedInstancesProvider>
    </AuthProvider>
  );
}

export default App;
