/**
 * Patient Notifications Page
 * View and manage notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  List,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ReadIcon,
  Circle as UnreadIcon,
  Delete as DeleteIcon,
  DoneAll as MarkAllReadIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import { notificationService } from '../../services/notificationService';
import PageHeader from '../../components/common/PageHeader';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
};

const NotificationsPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getNotifications(user?.id || ''),
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(user?.id || '', notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.deleteNotification(user?.id || '', notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast.success('Notification deleted');
    },
  });

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        action={
          unreadCount > 0 ? (
            <Button
              variant="outlined"
              startIcon={<MarkAllReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">No notifications</Alert>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <Box key={notification.id}>
              <Card
                sx={{
                  mb: 2,
                  bgcolor: notification.read ? 'background.paper' : 'action.hover',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        mt: 0.5,
                        color: notification.read ? 'text.secondary' : 'primary.main',
                      }}
                    >
                      {notification.read ? (
                        <ReadIcon fontSize="small" />
                      ) : (
                        <UnreadIcon fontSize="small" />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: notification.read ? 600 : 700,
                            flexGrow: 1,
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority) as 'error' | 'warning' | 'info' | 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                        {notification.actionLabel && (
                          <Chip
                            label={notification.actionLabel}
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, notification.id)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </List>
      )}
    </>
  );
};

export default NotificationsPage;
