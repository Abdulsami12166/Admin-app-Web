import React from 'react';

import {AuthProvider} from '../store/authStore';
import {DashboardProvider} from '../store/dashboardStore';

export const AppProviders = ({children}: React.PropsWithChildren) => {
  return (
    <AuthProvider>
      <DashboardProvider>{children}</DashboardProvider>
    </AuthProvider>
  );
};
