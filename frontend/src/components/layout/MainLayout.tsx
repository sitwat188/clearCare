/**
 * Main layout component
 * Provides sidebar and content area
 */

import { ReactNode, useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import Sidebar, { drawerWidth, collapsedWidth } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const collapsed = localStorage.getItem('sidebarCollapsed');
    return collapsed === 'true' ? collapsedWidth : drawerWidth;
  });

  useEffect(() => {
    // Listen for custom event (for same-window updates)
    const handleSidebarToggle = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed');
      setSidebarWidth(collapsed === 'true' ? collapsedWidth : drawerWidth);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: { sm: `${sidebarWidth}px` },
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          transition: 'margin-left 0.3s ease, width 0.3s ease',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
          }}
        >
          <Container maxWidth="xl">{children}</Container>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
