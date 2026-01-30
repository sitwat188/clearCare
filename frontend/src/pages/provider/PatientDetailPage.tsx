/**
 * Provider Patient Detail Page
 * View a single patient's info with links to compliance and create instruction
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as ComplianceIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { useSelector } from 'react-redux';
import { patientService } from '../../services/patientService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const ProviderPatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['provider-patient', id],
    queryFn: () => patientService.getPatient(id || ''),
    enabled: !!id && !!user?.id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <>
        <PageHeader title="Patient" subtitle="Patient details" showBack backPath={ROUTES.PROVIDER.PATIENTS} />
        <Alert severity="error" sx={{ mt: 2 }}>
          Patient not found or you don&apos;t have access.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(ROUTES.PROVIDER.PATIENTS)} sx={{ mt: 2 }}>
          Back to patients
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Patient Details"
        subtitle={`${patient.firstName} ${patient.lastName}`}
        showBack
        backPath={ROUTES.PROVIDER.PATIENTS}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {patient.firstName?.[0]}
                  {patient.lastName?.[0]}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {patient.firstName} {patient.lastName}
                </Typography>
                <Chip label={`MRN: ${patient.medicalRecordNumber}`} size="small" sx={{ mb: 2 }} />
                <Box sx={{ width: '100%', textAlign: 'left' }}>
                  {patient.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {patient.email}
                      </Typography>
                    </Box>
                  )}
                  {patient.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {patient.phone}
                      </Typography>
                    </Box>
                  )}
                  {patient.dateOfBirth && (
                    <Typography variant="caption" color="text.secondary">
                      DOB: {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<ComplianceIcon />}
                  onClick={() => navigate(ROUTES.PROVIDER.PATIENT_COMPLIANCE(patient.id))}
                >
                  View compliance
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    navigate(ROUTES.PROVIDER.CREATE_INSTRUCTION, {
                      state: { preselectedPatientId: patient.id },
                    })
                  }
                >
                  Create instruction
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ProviderPatientDetail;
