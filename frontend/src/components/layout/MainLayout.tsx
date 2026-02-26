/**
 * Main layout component
 * Provides sidebar and content area
 */

import { ReactNode, useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { drawerWidth, collapsedWidth } from './layoutConstants';

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
          minWidth: 0,
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'margin-left 0.3s ease, width 0.3s ease',
        }}
      >
        <Header />
        <Box sx={{ flexGrow: 1, pt: '64px', px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Container maxWidth="xl">{children}</Container>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
