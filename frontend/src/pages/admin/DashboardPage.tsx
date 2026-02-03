/**
 * Admin Dashboard Page
 * System overview and statistics
 */

import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  People as UsersIcon,
  Security as RolesIcon,
  Assessment as ReportsIcon,
  History as AuditIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import PageHeader from '../../components/common/PageHeader';

const AdminDashboard = () => {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminService.getRoles(),
  });

  const { data: auditLogsResult, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-logs-dashboard'],
    queryFn: () => adminService.getAuditLogs({ page: 1, limit: 100 }),
  });
  const auditLogs = auditLogsResult?.data ?? [];

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminService.getAdminReports(),
  });

  const isLoading = usersLoading || rolesLoading || auditLoading || reportsLoading;

  // Calculate stats
  const stats = {
    totalUsers: users?.length || 0,
    totalRoles: roles?.length || 0,
    totalAuditLogs: auditLogsResult?.total ?? auditLogs.length,
    recentReports: reports?.filter(r => {
      const reportDate = new Date(r.generatedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reportDate >= weekAgo;
    }).length || 0,
    activeUsers: users?.filter(u => {
      if (!u.lastLoginAt) return false;
      const lastLogin = new Date(u.lastLoginAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return lastLogin >= thirtyDaysAgo;
    }).length || 0,
    failedLogins: auditLogs.filter(log => log.status === 'failure').length,
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <UsersIcon />,
      color: '#2563eb',
      subtitle: `${stats.activeUsers} active`,
    },
    {
      title: 'Roles',
      value: stats.totalRoles,
      icon: <RolesIcon />,
      color: '#10b981',
      subtitle: 'System & custom roles',
    },
    {
      title: 'Audit Logs',
      value: stats.totalAuditLogs,
      icon: <AuditIcon />,
      color: '#f59e0b',
      subtitle: `${stats.failedLogins} failed logins`,
    },
    {
      title: 'Recent Reports',
      value: stats.recentReports,
      icon: <ReportsIcon />,
      color: '#8b5cf6',
      subtitle: 'Last 7 days',
    },
  ];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Admin Dashboard" subtitle="System overview and statistics" showBack={false} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="System overview and statistics" showBack={false} />

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(card.color, 0.1)} 0%, ${alpha(card.color, 0.05)} 100%)`,
                border: '1px solid',
                borderColor: alpha(card.color, 0.2),
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: alpha(card.color, 0.4),
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(card.color, 0.1),
                      color: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: card.color }}>
                  {card.value}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AuditIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Audit Activity
                </Typography>
              </Box>
              {auditLogs && auditLogs.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {auditLogs.slice(0, 5).map((log) => (
                    <Box
                      key={log.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(log.status === 'success' ? '#10b981' : '#ef4444', 0.1),
                        border: '1px solid',
                        borderColor: alpha(log.status === 'success' ? '#10b981' : '#ef4444', 0.2),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {log.userName} - {log.action}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {log.resourceType}: {log.resourceName || log.resourceId}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: log.status === 'success' ? '#10b981' : '#ef4444',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {log.status}
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleString()} • {log.ipAddress}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No recent audit activity</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Alerts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <WarningIcon color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  System Alerts
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.failedLogins > 0 && (
                  <Alert severity="warning">
                    {stats.failedLogins} failed login attempt(s) detected
                  </Alert>
                )}
                {stats.activeUsers < stats.totalUsers * 0.5 && (
                  <Alert severity="info">
                    Low user activity: Only {stats.activeUsers} of {stats.totalUsers} users active
                  </Alert>
                )}
                {stats.failedLogins === 0 && stats.activeUsers >= stats.totalUsers * 0.5 && (
                  <Alert severity="success">All systems operational</Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default AdminDashboard;
