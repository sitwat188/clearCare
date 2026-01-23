/**
 * Header component
 * Top navigation bar with notifications
 */

import { AppBar, Toolbar, IconButton, Badge, Box } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        boxShadow: '0px 4px 20px rgba(37, 99, 235, 0.3)',
        ml: { sm: '240px' }, // Account for sidebar width
        width: { sm: 'calc(100% - 240px)' },
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
