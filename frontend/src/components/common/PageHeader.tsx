/**
 * Page Header Component
 * Displays page title and back button with enhanced visual design
 */

import { Box, Typography, IconButton, Breadcrumbs, Link, Paper, alpha } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { ROUTES } from '../../config/routes';

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  showBack?: boolean;
  backPath?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  action?: React.ReactNode;
}

const PageHeader = ({ 
  title, 
  subtitle, 
  showBack = true, 
  backPath,
  breadcrumbs,
  action 
}: PageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      // Navigate to dashboard based on role
      if (user?.role === 'patient') {
        navigate(ROUTES.PATIENT.DASHBOARD);
      } else if (user?.role === 'provider') {
        navigate(ROUTES.PROVIDER.DASHBOARD);
      } else if (user?.role === 'administrator') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(-1);
      }
    }
  };

  // Don't show back button on dashboard pages
  const isDashboard = location.pathname.includes('/dashboard');
  const shouldShowBack = showBack && !isDashboard;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(30, 64, 175, 0.02) 100%)',
        border: '1px solid',
        borderColor: alpha('#2563eb', 0.1),
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 50%, #3b82f6 100%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, flex: '1 1 auto', minWidth: 0 }}>
          {shouldShowBack && (
            <IconButton
              onClick={handleBack}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                width: 48,
                height: 48,
                mt: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  transform: 'translateX(-4px)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: subtitle ? 1 : 0,
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  maxWidth: { xs: '100%', sm: '80%' },
                  wordBreak: 'break-word',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            {action}
          </Box>
        )}
      </Box>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Box sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
          <Breadcrumbs
            sx={{
              '& .MuiBreadcrumbs-ol': {
                flexWrap: 'nowrap',
              },
              '& .MuiBreadcrumbs-separator': {
                color: 'text.secondary',
                mx: 1,
              },
            }}
          >
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                component="button"
                variant="body2"
                onClick={() => crumb.path && navigate(crumb.path)}
                sx={{
                  cursor: crumb.path ? 'pointer' : 'default',
                  color: crumb.path ? 'primary.main' : 'text.secondary',
                  textDecoration: 'none',
                  fontWeight: crumb.path ? 600 : 400,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: crumb.path ? 'primary.dark' : 'text.secondary',
                    textDecoration: crumb.path ? 'underline' : 'none',
                  },
                }}
              >
                {crumb.label}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
      )}
    </Paper>
  );
};

export default PageHeader;
