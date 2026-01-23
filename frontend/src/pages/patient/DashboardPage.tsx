/**
 * Patient Dashboard Page
 * Overview of patient's instructions, compliance, and recent activity
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Assignment as InstructionsIcon,
  CheckCircle as ComplianceIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import type { RootState } from '../../store/store';
import { instructionService } from '../../services/instructionService';
import { complianceService } from '../../services/complianceService';
import PageHeader from '../../components/common/PageHeader';

const PatientDashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState({
    activeInstructions: 0,
    pendingAcknowledgments: 0,
    complianceScore: 0,
  });

  // Fetch instructions
  const { data: instructions, isLoading: instructionsLoading } = useQuery({
    queryKey: ['patient-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'patient'),
    enabled: !!user?.id,
  });

  // Fetch compliance metrics
  const { data: complianceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['patient-compliance-metrics', user?.id],
    queryFn: () => complianceService.getComplianceMetrics(user?.id || ''),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (instructions) {
      const active = instructions.filter((i) => i.status === 'active').length;
      const pending = instructions.filter(
        (i) => i.status === 'active' && !i.acknowledgedDate
      ).length;
      setStats((prev) => ({ ...prev, activeInstructions: active, pendingAcknowledgments: pending }));
    }
    if (complianceMetrics) {
      setStats((prev) => ({ ...prev, complianceScore: complianceMetrics.overallScore }));
    }
  }, [instructions, complianceMetrics]);

  if (instructionsLoading || metricsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        subtitle="Here's an overview of your care instructions and compliance"
        showBack={false}
      />

      <Grid container spacing={3}>
        {/* Stats Cards with Gradients */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <InstructionsIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <TrendingUpIcon sx={{ opacity: 0.3, fontSize: 48 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.activeInstructions}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Instructions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <TrendingUpIcon sx={{ opacity: 0.3, fontSize: 48 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.pendingAcknowledgments}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending Acknowledgments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <ComplianceIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <TrendingUpIcon sx={{ opacity: 0.3, fontSize: 48 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.complianceScore}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Overall Compliance
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.complianceScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'translate(30px, -30px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <HospitalIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <TrendingUpIcon sx={{ opacity: 0.3, fontSize: 48 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {instructions?.length || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Instructions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Instructions */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    width: 48,
                    height: 48,
                  }}
                >
                  <InstructionsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Recent Instructions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your latest care instructions
                  </Typography>
                </Box>
              </Box>
              {instructions && instructions.length > 0 ? (
                <Box>
                  {instructions.slice(0, 5).map((instruction, index) => (
                    <Card
                      key={instruction.id}
                      sx={{
                        p: 2.5,
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        bgcolor: index % 2 === 0 ? 'background.paper' : alpha('#f0f4f8', 0.5),
                        '&:hover': {
                          transform: 'translateX(8px)',
                          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 2 }}>
                            {instruction.title}
                          </Typography>
                          <Chip
                            label={instruction.type}
                            size="small"
                            sx={{
                              bgcolor: alpha('#2563eb', 0.1),
                              color: 'primary.main',
                              fontWeight: 600,
                              height: 24,
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(instruction.assignedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • {instruction.providerName}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
                        color={
                          instruction.status === 'acknowledged'
                            ? 'success'
                            : instruction.status === 'active'
                            ? 'primary'
                            : 'default'
                        }
                        sx={{
                          fontWeight: 600,
                          height: 32,
                          px: 1,
                        }}
                      />
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 3,
                    '& .MuiAlert-icon': {
                      fontSize: 32,
                    },
                  }}
                >
                  No instructions assigned yet. Your provider will assign care instructions after your visit.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDashboard;
