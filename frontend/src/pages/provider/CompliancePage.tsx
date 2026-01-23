/**
 * Provider Compliance Page
 * View patient compliance metrics and tracking
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Paper,
  Avatar,
  Button,
  alpha,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { patientService } from '../../services/patientService';
import { complianceService } from '../../services/complianceService';
import { instructionService } from '../../services/instructionService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const ProviderCompliance = () => {
  const navigate = useNavigate();
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
