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
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as ComplianceIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Download as ExportIcon,
  InsertLink as HealthIcon,
  Science as LabIcon,
  Medication as MedIcon,
  Assignment as ConditionIcon,
  Event as EncounterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { useSelector } from 'react-redux';
import { patientService } from '../../services/patientService';
import { healthConnectionsService } from '../../services/healthConnectionsService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';
import type { HealthObservation } from '../../types/health-connections.types';
import { isUserFacingExportFailure } from '../../types/health-connections.types';

const observationCategoryLabel = (cat: string | undefined): string => {
  if (!cat) return 'Other';
  const c = cat.toLowerCase();
  if (c === 'laboratory' || c === 'lab') return 'Labs';
  if (c === 'vital-signs' || c === 'vitals') return 'Vitals';
  if (c === 'social-history') return 'Social history';
  return cat;
};

const groupObservationsByCategory = (observations: HealthObservation[]): { label: string; items: HealthObservation[] }[] => {
  const groups: Record<string, HealthObservation[]> = { Labs: [], Vitals: [], 'Social history': [], Other: [] };
  for (const o of observations) {
    const label = observationCategoryLabel(o.category);
    if (!groups[label]) groups[label] = [];
    groups[label].push(o);
  }
  return (['Labs', 'Vitals', 'Social history', 'Other'] as const).map((label) => ({ label, items: groups[label] ?? [] })).filter((g) => g.items.length > 0);
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-connections-patient', id] });
      queryClient.invalidateQueries({ queryKey: ['health-data-patient', id] });
    },
  });

  const { data: healthData, isLoading: healthDataLoading } = useQuery({
    queryKey: ['health-data-patient', id],
    queryFn: () => healthConnectionsService.getHealthDataForPatient(id || ''),
    enabled: !!id && !!patient && healthConnections.length > 0,
    refetchInterval: (query) => {
      const d = query.state.data;
      const empty = !d || (d.observations.length === 0 && d.medications.length === 0 && d.conditions.length === 0 && d.encounters.length === 0);
      const anyPending = healthConnections.some((c) => !c.lastExportFailureReason);
      return !!id && healthConnections.length > 0 && empty && anyPending ? 8_000 : false;
    },
  });

  const hasAnyHealthData = healthData && (healthData.observations.length > 0 || healthData.medications.length > 0 || healthData.conditions.length > 0 || healthData.encounters.length > 0);
  const allConnectionsFailedExport = healthConnections.length > 0 && healthConnections.every((c) => c.lastExportFailureReason);
  const isWaitingForExport = healthConnections.length > 0 && !allConnectionsFailedExport && healthData && !hasAnyHealthData;

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
                <Tooltip title={`${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()} placement="top" enterDelay={500}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }} noWrap component="span">
                    {patient.firstName} {patient.lastName}
                  </Typography>
                </Tooltip>
                <Chip label={`MRN: ${patient.medicalRecordNumber}`} size="small" sx={{ mb: 2 }} />
                <Box sx={{ width: '100%', textAlign: 'left', minWidth: 0 }}>
                  {patient.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Tooltip title={patient.email} placement="top" enterDelay={500}>
                        <Typography variant="body2" color="text.secondary" noWrap component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', minWidth: 0 }}>
                          {patient.email}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                  {patient.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Tooltip title={patient.phone} placement="top" enterDelay={500}>
                        <Typography variant="body2" color="text.secondary" noWrap component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', minWidth: 0 }}>
                          {patient.phone}
                        </Typography>
                      </Tooltip>
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
                        secondary={
                          <>
                            Connected {format(new Date(conn.connectedAt), 'MMM d, yyyy')}
                            {conn.lastSyncedAt && (
                              <> · Last synced {format(new Date(conn.lastSyncedAt), 'MMM d, yyyy')}</>
                            )}
                            {isUserFacingExportFailure(conn.lastExportFailureReason) && (
                              <Typography component="span" variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                Export failed: {conn.lastExportFailureReason}
                              </Typography>
                            )}
                          </>
                        }
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

          {healthConnections.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealthIcon fontSize="small" />
                  Data from health connections
                </Typography>
                {(healthDataLoading || isWaitingForExport) ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {healthDataLoading ? 'Loading health data…' : "Preparing this patient's health data. Export may take a minute. We'll refresh automatically."}
                    </Typography>
                  </Box>
                ) : healthData && hasAnyHealthData ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {healthData.observations.length > 0 &&
                      groupObservationsByCategory(healthData.observations).map(({ label, items }) => (
                        <Box key={label}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LabIcon fontSize="small" /> {label} ({items.length})
                          </Typography>
                          <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                            {items.slice(0, 10).map((o) => (
                              <ListItem key={o.id} sx={{ py: 0.5 }}>
                                <ListItemText
                                  primary={o.display || o.code || '—'}
                                  secondary={
                                    [o.value, o.effectiveAt && format(new Date(o.effectiveAt), 'MMM d, yyyy'), o.sourceName && `From ${o.sourceName}`].filter(Boolean).join(' · ') || undefined
                                  }
                                  primaryTypographyProps={{ variant: 'body2' }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                          {items.length > 10 && (
                            <Typography variant="caption" color="text.secondary">+ {items.length - 10} more</Typography>
                          )}
                        </Box>
                      ))}
                    {healthData.medications.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MedIcon fontSize="small" /> Medications ({healthData.medications.length})
                        </Typography>
                        <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                          {healthData.medications.slice(0, 10).map((m) => {
                            const isActive = m.status?.toLowerCase() === 'active';
                            return (
                              <ListItem key={m.id} sx={{ py: 0.5, opacity: isActive ? 1 : 0.85 }}>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <span>{m.name || 'Medication'}</span>
                                      {m.status && (
                                        <Chip label={m.status} size="small" color={isActive ? 'success' : 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    [m.dosage, m.prescribedAt && format(new Date(m.prescribedAt), 'MMM d, yyyy'), m.sourceName && `From ${m.sourceName}`].filter(Boolean).join(' · ') || undefined
                                  }
                                  primaryTypographyProps={{ variant: 'body2' }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                        {healthData.medications.length > 10 && (
                          <Typography variant="caption" color="text.secondary">+ {healthData.medications.length - 10} more</Typography>
                        )}
                      </Box>
                    )}
                    {healthData.conditions.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ConditionIcon fontSize="small" /> Conditions ({healthData.conditions.length})
                        </Typography>
                        <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                          {healthData.conditions.slice(0, 10).map((c) => (
                            <ListItem key={c.id} sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <span>{c.display || c.code || '—'}</span>
                                    {c.clinicalStatus && (
                                      <Chip
                                        label={c.clinicalStatus}
                                        size="small"
                                        color={c.clinicalStatus.toLowerCase() === 'active' ? 'warning' : 'default'}
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={[c.onsetAt && format(new Date(c.onsetAt), 'MMM d, yyyy'), c.sourceName && `From ${c.sourceName}`].filter(Boolean).join(' · ') || undefined}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                        {healthData.conditions.length > 10 && (
                          <Typography variant="caption" color="text.secondary">+ {healthData.conditions.length - 10} more</Typography>
                        )}
                      </Box>
                    )}
                    {healthData.encounters.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EncounterIcon fontSize="small" /> Encounters / visits ({healthData.encounters.length})
                        </Typography>
                        <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                          {healthData.encounters.slice(0, 5).map((e) => {
                            const primary = e.reasonText || e.serviceType || e.type || 'Visit';
                            const start = e.periodStart ? format(new Date(e.periodStart), 'MMM d, yyyy') : null;
                            const end = e.periodEnd ? format(new Date(e.periodEnd), 'MMM d, yyyy') : null;
                            const dateRange = start && end && start !== end ? `${start} – ${end}` : start || undefined;
                            const secondary = [dateRange, e.sourceName && `From ${e.sourceName}`].filter(Boolean).join(' · ') || undefined;
                            return (
                              <ListItem key={e.id} sx={{ py: 0.5 }}>
                                <ListItemText primary={primary} secondary={secondary} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ variant: 'caption' }} />
                              </ListItem>
                            );
                          })}
                        </List>
                        {healthData.encounters.length > 5 && (
                          <Typography variant="caption" color="text.secondary">+ {healthData.encounters.length - 5} more</Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No health data imported yet for this patient. Data appears after the export from their connected source completes.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default ProviderPatientDetail;
