/**
 * Header component
 * Top navigation bar with notifications (wired to unread count and notifications route)
 */

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { AppBar, Toolbar, IconButton, Badge, Box } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import type { RootState } from '../../store/store';
import { notificationService } from '../../services/notificationService';
import { ROUTES } from '../../config/routes';

const getNotificationsPath = (role: string) => {
  if (role === 'patient') return ROUTES.PATIENT.NOTIFICATIONS;
  if (role === 'provider') return ROUTES.PROVIDER.NOTIFICATIONS;
  if (role === 'administrator') return ROUTES.ADMIN.NOTIFICATIONS;
  return ROUTES.PATIENT.NOTIFICATIONS;
};

const Header = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getNotifications(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const notificationsPath = user?.role ? getNotificationsPath(user.role) : ROUTES.PATIENT.NOTIFICATIONS;

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
          <IconButton
            color="inherit"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            onClick={() => navigate(notificationsPath)}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
