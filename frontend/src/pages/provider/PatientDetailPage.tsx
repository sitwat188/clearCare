/**
 * Provider Patient Detail Page
 * View a single patient's info with links to compliance and create instruction
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as ComplianceIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Download as ExportIcon,
  InsertLink as HealthIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { useSelector } from 'react-redux';
import { patientService } from '../../services/patientService';
import { healthConnectionsService } from '../../services/healthConnectionsService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const ProviderPatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['provider-patient', id],
    queryFn: () => patientService.getPatient(id || ''),
    enabled: !!id && !!user?.id,
  });

  const { data: healthConnections = [] } = useQuery({
    queryKey: ['health-connections-patient', id],
    queryFn: () => healthConnectionsService.listForPatient(id || ''),
    enabled: !!id && !!patient,
  });

  const requestExportMutation = useMutation({
    mutationFn: ({ patientId, orgConnectionId }: { patientId: string; orgConnectionId: string }) =>
      healthConnectionsService.requestEhiExport(patientId, orgConnectionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-connections-patient', id] }),
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
          <Card sx={{ height: '100%', minWidth: 0 }}>
            <CardContent sx={{ minWidth: 0 }}>
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
                <Box sx={{ width: '100%', textAlign: 'left', minWidth: 0 }}>
                  {patient.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {patient.email}
                      </Typography>
                    </Box>
                  )}
                  {patient.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          <Card sx={{ mb: 3 }}>
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

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HealthIcon fontSize="small" />
                Health connections
              </Typography>
              {healthConnections.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  This patient has not connected any health records yet.
                </Typography>
              ) : (
                <List disablePadding>
                  {healthConnections.map((conn) => (
                    <ListItem
                      key={conn.id}
                      divider
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        py: 1.5,
                        gap: 1.5,
                      }}
                    >
                      <ListItemText
                        primary={conn.sourceName || 'Health record'}
                        secondary={`Connected ${format(new Date(conn.connectedAt), 'MMM d, yyyy')}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                        sx={{ flex: '1 1 auto', minWidth: 0 }}
                      />
                      <Box
                        sx={{
                          flex: '0 0 auto',
                          width: { xs: '100%', sm: 'auto' },
                          mt: { xs: 1, sm: 0 },
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            requestExportMutation.isPending ? (
                              <CircularProgress size={16} />
                            ) : (
                              <ExportIcon fontSize="small" />
                            )
                          }
                          onClick={() =>
                            requestExportMutation.mutate({ patientId: patient.id, orgConnectionId: conn.orgConnectionId })
                          }
                          disabled={requestExportMutation.isPending}
                          fullWidth={false}
                        >
                          Request export
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ProviderPatientDetail;
