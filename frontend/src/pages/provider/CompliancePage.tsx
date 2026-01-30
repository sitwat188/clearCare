/**
 * Provider Compliance Page
 * View patient compliance metrics and tracking
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import type { RootState } from '../../store/store';
import { patientService } from '../../services/patientService';
import { instructionService } from '../../services/instructionService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const ProviderCompliance = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId?: string }>();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['provider-patients', user?.id],
    queryFn: () => patientService.getPatients(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: instructions } = useQuery({
    queryKey: ['provider-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'provider'),
    enabled: !!user?.id,
  });

  // Get compliance data for each patient
  const patientComplianceData = useMemo(() => {
    if (!patients) return [];
    
    return patients.map((patient) => {
      const patientInstructions = instructions?.filter((inst) => inst.patientId === patient.id) || [];
      const acknowledgedCount = patientInstructions.filter((inst) => inst.acknowledgedDate).length;
      const activeCount = patientInstructions.filter((inst) => inst.status === 'active').length;

      return {
        patient,
        totalInstructions: patientInstructions.length,
        activeInstructions: activeCount,
        acknowledgedInstructions: acknowledgedCount,
        acknowledgmentRate: patientInstructions.length > 0
          ? Math.round((acknowledgedCount / patientInstructions.length) * 100)
          : 0,
      };
    });
  }, [patients, instructions]);

  if (patientsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Single-patient detail view when patientId is in the URL
  const singlePatientData = patientId
    ? patientComplianceData.find((d) => d.patient.id === patientId)
    : null;
  const patientInstructions = patientId
    ? (instructions ?? []).filter((inst) => inst.patientId === patientId)
    : [];

  if (patientId) {
    if (!singlePatientData) {
      return (
        <>
          <PageHeader
            title="Patient Compliance"
            subtitle="Monitor patient compliance with care instructions"
            showBack
            backPath={ROUTES.PROVIDER.COMPLIANCE}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Patient not found or not in your list.
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(ROUTES.PROVIDER.COMPLIANCE)}
            sx={{ mt: 2 }}
          >
            Back to compliance overview
          </Button>
        </>
      );
    }

    const { patient } = singlePatientData;
    return (
      <>
        <PageHeader
          title={`Compliance: ${patient.firstName} ${patient.lastName}`}
          subtitle={`MRN: ${patient.medicalRecordNumber}`}
          showBack
          backPath={ROUTES.PROVIDER.COMPLIANCE}
        />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {patient.firstName?.[0] || <PeopleIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {patient.medicalRecordNumber}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Acknowledgment rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={singlePatientData.acknowledgmentRate}
                  sx={{ height: 10, borderRadius: 1, mb: 1 }}
                  color={
                    singlePatientData.acknowledgmentRate >= 80
                      ? 'success'
                      : singlePatientData.acknowledgmentRate >= 50
                        ? 'warning'
                        : 'error'
                  }
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {singlePatientData.acknowledgmentRate}%
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={`${singlePatientData.acknowledgedInstructions} acknowledged`}
                    color="success"
                  />
                  <Chip
                    size="small"
                    label={`${singlePatientData.activeInstructions} pending`}
                    color="warning"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Instructions ({patientInstructions.length})
                </Typography>
                {patientInstructions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No instructions assigned yet.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title / Type</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="center">Acknowledged</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientInstructions.map((inst) => (
                          <TableRow key={inst.id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {inst.title || 'Untitled'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {inst.type || 'instruction'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={inst.status || 'active'}
                                color={inst.status === 'active' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {inst.acknowledgedDate ? (
                                <Chip size="small" icon={<CheckCircleIcon />} label="Yes" color="success" />
                              ) : (
                                <Chip size="small" label="No" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() => navigate(ROUTES.PROVIDER.INSTRUCTION_DETAIL(inst.id))}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Patient Compliance"
        subtitle="Monitor patient compliance with care instructions"
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {patients?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {patientComplianceData.reduce((sum, p) => sum + p.acknowledgedInstructions, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Acknowledged
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {patientComplianceData.reduce((sum, p) => sum + p.activeInstructions, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {patientComplianceData.length > 0
                      ? Math.round(
                          patientComplianceData.reduce((sum, p) => sum + p.acknowledgmentRate, 0) /
                            patientComplianceData.length
                        )
                      : 0}
                    %
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Acknowledgment
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patient Compliance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Patient Compliance Overview
          </Typography>

          {patientComplianceData.length === 0 ? (
            <Alert severity="info">No patients assigned yet</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell align="center">Total Instructions</TableCell>
                    <TableCell align="center">Active</TableCell>
                    <TableCell align="center">Acknowledged</TableCell>
                    <TableCell align="center">Acknowledgment Rate</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patientComplianceData.map((data) => (
                    <TableRow key={data.patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {data.patient.firstName?.[0] || <PeopleIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {data.patient.firstName} {data.patient.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {data.patient.medicalRecordNumber}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                        <TableCell align="center">
                          <Chip label={data.totalInstructions} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={data.activeInstructions}
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={data.acknowledgedInstructions}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={data.acknowledgmentRate}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                              color={data.acknowledgmentRate >= 80 ? 'success' : data.acknowledgmentRate >= 50 ? 'warning' : 'error'}
                            />
                            <Typography variant="body2" sx={{ minWidth: 45 }}>
                              {data.acknowledgmentRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate(ROUTES.PROVIDER.PATIENT_COMPLIANCE(data.patient.id))}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ProviderCompliance;
