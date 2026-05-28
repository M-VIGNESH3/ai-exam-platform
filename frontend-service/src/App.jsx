import React from 'react';
import { PlatformProvider, usePlatform } from './contexts/PlatformContext';
import Login from './components/auth/LoginForm';
import ForcedPasswordReset from './components/auth/ForcedPasswordReset';
import ToastContainer from './components/common/Toast';
import SuperAdminPortal from './layouts/SuperAdminLayout';
import ManagementPortal from './layouts/ManagementLayout';
import StudentPortal from './layouts/StudentLayout';

const AppContent = () => {
  const { currentUser } = usePlatform();

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.mustResetPassword) {
    return <ForcedPasswordReset />;
  }

  switch (currentUser.role) {
    case 'super_admin':
      return <SuperAdminPortal />;
    case 'college_admin':
    case 'management': // support both legacy and new names
      return <ManagementPortal />;
    case 'student':
      return <StudentPortal />;
    default:
      return <Login />;
  }
};

function App() {
  return (
    <PlatformProvider>
      <AppContent />
      <ToastContainer />
    </PlatformProvider>
  );
}

export default App;
