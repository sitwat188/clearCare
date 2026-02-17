/**
 * Sidebar navigation component
 * Role-based navigation menu
 */

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Badge,
  IconButton,
  Tooltip,
  Chip,
  alpha,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dashboard as DashboardIcon,
  Assignment as InstructionsIcon,
  CheckCircle as ComplianceIcon,
  History as HistoryIcon,
  People as PatientsIcon,
  LocalHospital as MedplumIcon,
  AddCircle as CreateIcon,
  Assessment as ReportsIcon,
  Description as TemplatesIcon,
  Person as UsersIcon,
  Security as RolesIcon,
  ListAlt as AuditIcon,
  Settings as SettingsIcon,
  AccountCircle,
  LocalHospital as LogoIcon,
  InsertLink as HealthConnectionsIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { RootState } from '../../store/store';
import { ROUTES } from '../../config/routes';
import { logout } from '../../store/slices/authSlice';
import { APP_NAME } from '../../utils/constants';
import { notificationService } from '../../services/notificationService';

const drawerWidth = 240;
const collapsedWidth = 64;

const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    // Load from localStorage or default to false
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Save to localStorage whenever collapsed state changes
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const handleToggle = () => {
    setCollapsed(!collapsed);
    // Dispatch custom event for MainLayout to listen
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout()); // This will clear localStorage via authSlice
    navigate(ROUTES.LOGIN);
    handleProfileMenuClose();
  };

  const getRoleLabel = (role: string) => {
    const key = role === 'administrator' ? 'administrator' : role;
    return t(`nav.${key}` as const) || role;
  };

  const getPatientMenuItems = () => [
    { text: t('nav.dashboard'), icon: <DashboardIcon />, path: ROUTES.PATIENT.DASHBOARD },
    { text: t('nav.myInstructions'), icon: <InstructionsIcon />, path: ROUTES.PATIENT.INSTRUCTIONS },
    { text: t('nav.compliance'), icon: <ComplianceIcon />, path: ROUTES.PATIENT.COMPLIANCE },
    { text: t('nav.healthConnections'), icon: <HealthConnectionsIcon />, path: ROUTES.PATIENT.HEALTH_CONNECTIONS },
    { text: t('nav.history'), icon: <HistoryIcon />, path: ROUTES.PATIENT.HISTORY },
    { text: t('nav.notifications'), icon: <NotificationsIcon />, path: ROUTES.PATIENT.NOTIFICATIONS },
  ];

  const getProviderMenuItems = () => [
    { text: t('nav.dashboard'), icon: <DashboardIcon />, path: ROUTES.PROVIDER.DASHBOARD },
    { text: t('nav.myPatients'), icon: <PatientsIcon />, path: ROUTES.PROVIDER.PATIENTS },
    { text: t('nav.medplumPatients'), icon: <MedplumIcon />, path: ROUTES.PROVIDER.MEDPLUM_PATIENTS },
    // { text: t('nav.medplumProviders'), icon: <PersonIcon />, path: ROUTES.PROVIDER.MEDPLUM_PROVIDERS },
    { text: t('nav.medplumInstructions'), icon: <InstructionsIcon />, path: ROUTES.PROVIDER.MEDPLUM_INSTRUCTIONS },
    { text: t('nav.instructions'), icon: <InstructionsIcon />, path: ROUTES.PROVIDER.INSTRUCTIONS },
    { text: t('nav.createInstruction'), icon: <CreateIcon />, path: ROUTES.PROVIDER.CREATE_INSTRUCTION },
    { text: t('nav.compliance'), icon: <ComplianceIcon />, path: ROUTES.PROVIDER.COMPLIANCE },
    { text: t('nav.reports'), icon: <ReportsIcon />, path: ROUTES.PROVIDER.REPORTS },
    { text: t('nav.templates'), icon: <TemplatesIcon />, path: ROUTES.PROVIDER.TEMPLATES },
    { text: t('nav.notifications'), icon: <NotificationsIcon />, path: ROUTES.PROVIDER.NOTIFICATIONS },
  ];

  const getAdminMenuItems = () => [
    { text: t('nav.dashboard'), icon: <DashboardIcon />, path: ROUTES.ADMIN.DASHBOARD },
    { text: t('nav.users'), icon: <UsersIcon />, path: ROUTES.ADMIN.USERS },
    { text: t('nav.medplumPatients'), icon: <MedplumIcon />, path: ROUTES.ADMIN.MEDPLUM_PATIENTS },
    { text: t('nav.medplumProviders'), icon: <PersonIcon />, path: ROUTES.ADMIN.MEDPLUM_PROVIDERS },
    { text: t('nav.medplumInstructions'), icon: <InstructionsIcon />, path: ROUTES.ADMIN.MEDPLUM_INSTRUCTIONS },
    { text: t('nav.roles'), icon: <RolesIcon />, path: ROUTES.ADMIN.ROLES },
    { text: t('nav.auditLogs'), icon: <AuditIcon />, path: ROUTES.ADMIN.AUDIT_LOGS },
    { text: t('nav.reports'), icon: <ReportsIcon />, path: ROUTES.ADMIN.REPORTS },
    { text: t('nav.settings'), icon: <SettingsIcon />, path: ROUTES.ADMIN.SETTINGS },
    { text: t('nav.notifications'), icon: <NotificationsIcon />, path: ROUTES.ADMIN.NOTIFICATIONS },
  ];

  const getMenuItems = () => {
    if (user?.role === 'patient') return getPatientMenuItems();
    if (user?.role === 'provider') return getProviderMenuItems();
    if (user?.role === 'administrator') return getAdminMenuItems();
    return [];
  };

  const menuItems = getMenuItems();

  // Fetch notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationService.getNotifications(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Logo and Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          py: 3,
          px: collapsed ? 1 : 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'relative',
        }}
      >
        {!collapsed && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flex: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                color: 'white',
              }}
            >
              <LogoIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '1.1rem',
                whiteSpace: 'nowrap',
                opacity: collapsed ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {APP_NAME}
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              color: 'white',
            }}
          >
            <LogoIcon sx={{ fontSize: 24 }} />
          </Box>
        )}
        <IconButton
          onClick={handleToggle}
          sx={{
            position: collapsed ? 'absolute' : 'relative',
            right: collapsed ? -20 : 0,
            top: collapsed ? '50%' : 'auto',
            transform: collapsed ? 'translateY(-50%)' : 'none',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: collapsed ? 2 : 0,
            width: collapsed ? 32 : 36,
            height: collapsed ? 32 : 36,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            zIndex: 1300,
          }}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Navigation menu */}
      <List sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
        {menuItems.map((item) => {
          const isNotifications = item.path?.includes('notifications');
          const showBadge = isNotifications && unreadCount > 0;
          const isSelected = location.pathname === item.path;

          return (
            <Tooltip
              key={item.text}
              title={collapsed ? item.text : ''}
              placement="right"
              arrow
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: collapsed ? 0.5 : 1,
                    py: 1.5,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    minHeight: 48,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: collapsed ? 'none' : 'translateX(4px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isSelected ? 'white' : 'inherit',
                      minWidth: collapsed ? 0 : 40,
                      justifyContent: 'center',
                    }}
                  >
                    {showBadge ? (
                      <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            minWidth: '18px',
                            height: '18px',
                            padding: '0 4px',
                          },
                        }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      {/* User profile at bottom */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: alpha('#2563eb', 0.1),
          background: collapsed
            ? 'transparent'
            : 'linear-gradient(to top, rgba(37, 99, 235, 0.03) 0%, transparent 100%)',
          p: collapsed ? 1.5 : 2,
        }}
      >
        <Tooltip
          title={collapsed ? `${user?.firstName} ${user?.lastName}` : ''}
          placement="right"
          arrow
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 1.5,
              p: collapsed ? 0 : 1.5,
              borderRadius: 2.5,
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              position: 'relative',
              background: collapsed
                ? 'transparent'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
              border: collapsed ? 'none' : '1px solid',
              borderColor: collapsed ? 'transparent' : alpha('#2563eb', 0.1),
              boxShadow: collapsed
                ? 'none'
                : '0 2px 8px rgba(37, 99, 235, 0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: collapsed ? 'action.hover' : 'background.paper',
                transform: collapsed ? 'none' : 'translateY(-2px)',
                boxShadow: collapsed
                  ? 'none'
                  : '0 4px 12px rgba(37, 99, 235, 0.15)',
                borderColor: collapsed ? 'transparent' : alpha('#2563eb', 0.2),
              },
            }}
            onClick={handleProfileMenuOpen}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: collapsed ? 36 : 44,
                  height: collapsed ? 36 : 44,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  fontSize: collapsed ? '0.875rem' : '1.125rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  transition: 'all 0.3s ease',
                }}
              >
                {user?.firstName?.[0] || <AccountCircle />}
              </Avatar>
              {/* Online status indicator */}
              {!collapsed && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    border: '2px solid',
                    borderColor: 'background.paper',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                />
              )}
            </Box>
            {!collapsed && (
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'text.primary',
                      fontSize: '0.9375rem',
                    }}
                  >
                    {user?.firstName} {user?.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Chip
                    label={getRoleLabel(user?.role || '')}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: alpha('#2563eb', 0.1),
                      color: 'primary.main',
                      border: 'none',
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid',
              borderColor: alpha('#2563eb', 0.1),
            },
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                {user?.firstName?.[0] || <AccountCircle />}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={getRoleLabel(user?.role || '')}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: alpha('#2563eb', 0.1),
                color: 'primary.main',
              }}
            />
          </Box>
          <MenuItem
            onClick={() => {
              handleProfileMenuClose();
              if (user?.role === 'patient') {
                navigate(ROUTES.PATIENT.PROFILE);
              } else if (user?.role === 'provider') {
                navigate(ROUTES.PROVIDER.PROFILE);
              } else if (user?.role === 'administrator') {
                navigate(ROUTES.ADMIN.PROFILE);
              }
            }}
            sx={{
              py: 1.25,
              px: 2,
              '&:hover': {
                bgcolor: alpha('#2563eb', 0.08),
              },
            }}
          >
            <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
            {t('nav.profile')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleProfileMenuClose();
              if (user?.role === 'patient') {
                navigate(ROUTES.PATIENT.SETTINGS);
              } else if (user?.role === 'provider') {
                navigate(ROUTES.PROVIDER.SETTINGS);
              } else if (user?.role === 'administrator') {
                navigate(ROUTES.ADMIN.SETTINGS);
              }
            }}
            sx={{
              py: 1.25,
              px: 2,
              '&:hover': {
                bgcolor: alpha('#2563eb', 0.08),
              },
            }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
            {t('nav.settings')}
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.25,
              px: 2,
              color: 'error.main',
              '&:hover': {
                bgcolor: alpha('#ef4444', 0.08),
              },
            }}
          >
            <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
            {t('common.logout')}
          </MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
export { drawerWidth, collapsedWidth };
