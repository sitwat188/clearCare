/**
 * Provider Dashboard Page
 * Overview of provider's patients, instructions, and compliance metrics
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  alpha,
} from '@mui/material';
import {
  People as PatientsIcon,
  Assignment as InstructionsIcon,
  CheckCircle as ComplianceIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { patientService } from '../../services/patientService';
import { instructionService } from '../../services/instructionService';
import { complianceService } from '../../services/complianceService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const ProviderDashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeInstructions: 0,
    pendingAcknowledgments: 0,
    averageCompliance: 0,
  });

  // Fetch patients
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['provider-patients', user?.id],
    queryFn: () => patientService.getPatients(user?.id || ''),
    enabled: !!user?.id,
  });

  // Fetch instructions
  const { data: instructions, isLoading: instructionsLoading } = useQuery({
    queryKey: ['provider-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'provider'),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (patients) {
      setStats((prev) => ({ ...prev, totalPatients: patients.length }));
    }
    if (instructions) {
      const active = instructions.filter((i) => i.status === 'active').length;
      const pending = instructions.filter(
        (i) => i.status === 'active' && !i.acknowledgedDate
      ).length;
      setStats((prev) => ({ ...prev, activeInstructions: active, pendingAcknowledgments: pending }));
    }
  }, [patients, instructions]);

  if (patientsLoading || instructionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const recentPatients = patients?.slice(0, 5) || [];
  const recentInstructions = instructions?.slice(0, 5) || [];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        subtitle="Overview of your patients, instructions, and compliance metrics"
        showBack={false}
      />

      <Grid container spacing={3}>
        {/* Stats Cards */}
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
                  <PatientsIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <TrendingUpIcon sx={{ opacity: 0.3, fontSize: 48 }} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stats.totalPatients}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Patients
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                  <WarningIcon sx={{ fontSize: 32 }} />
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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
                {stats.averageCompliance}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Avg Compliance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Patients */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Patients
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.PROVIDER.PATIENTS)}
                >
                  View All
                </Button>
              </Box>
              {recentPatients.length === 0 ? (
                <Alert severity="info">No patients assigned yet</Alert>
              ) : (
                <Box>
                  {recentPatients.map((patient) => (
                    <Box
                      key={patient.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: alpha('#2563eb', 0.03),
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha('#2563eb', 0.08),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                      onClick={() => navigate(ROUTES.PROVIDER.PATIENT_DETAIL(patient.id))}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 48,
                          height: 48,
                        }}
                      >
                        {patient.firstName?.[0] || <PatientsIcon />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          MRN: {patient.medicalRecordNumber}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Instructions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Instructions
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.PROVIDER.INSTRUCTIONS)}
                >
                  View All
                </Button>
              </Box>
              {recentInstructions.length === 0 ? (
                <Alert severity="info">No instructions created yet</Alert>
              ) : (
                <Box>
                  {recentInstructions.map((instruction) => (
                    <Box
                      key={instruction.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha('#2563eb', 0.05),
                          borderColor: 'primary.main',
                        },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => navigate(ROUTES.PROVIDER.INSTRUCTION_DETAIL(instruction.id))}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                          {instruction.title}
                        </Typography>
                        <Chip
                          label={instruction.status}
                          size="small"
                          color={instruction.status === 'active' ? 'success' : 'default'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Patient: {instruction.patientName} • {format(new Date(instruction.assignedDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ProviderDashboard;
