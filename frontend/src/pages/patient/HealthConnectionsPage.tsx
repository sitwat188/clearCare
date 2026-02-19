/**
 * Patient Health Connections (Fasten Connect)
 * List connections, connect new, remove
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import { Link as LinkIcon, Delete as DeleteIcon, LocalHospital as HealthIcon, Science as LabIcon, Medication as MedIcon, Assignment as ConditionIcon, Event as EncounterIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../components/common/PageHeader';
import { healthConnectionsService } from '../../services/healthConnectionsService';
import type { HealthConnection, HealthObservation } from '../../types/health-connections.types';

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

const HealthConnectionsPage = () => {
  const queryClient = useQueryClient();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [openStitch, setOpenStitch] = useState(false);
  const stitchWrapperRef = useRef<HTMLDivElement | null>(null);

  const fastenPublicId = useMemo(() => import.meta.env.VITE_FASTEN_PUBLIC_ID as string | undefined, []);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['health-connections-me'],
    queryFn: () => healthConnectionsService.listMyConnections(),
  });

  const removeMutation = useMutation({
    mutationFn: (orgConnectionId: string) => healthConnectionsService.removeConnection(orgConnectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-connections-me'] });
      queryClient.invalidateQueries({ queryKey: ['health-data-me'] });
    },
  });

  const addConnectionMutation = useMutation({
    mutationFn: ({ orgConnectionId, sourceName }: { orgConnectionId: string; sourceName?: string }) =>
      healthConnectionsService.addConnection(orgConnectionId, sourceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-connections-me'] });
      queryClient.invalidateQueries({ queryKey: ['health-data-me'] });
    },
  });

  const { data: healthData, isLoading: healthDataLoading } = useQuery({
    queryKey: ['health-data-me'],
    queryFn: () => healthConnectionsService.getMyHealthData(),
    enabled: connections.length > 0,
    refetchInterval: (query) => {
      const d = query.state.data;
      const empty = !d || (d.observations.length === 0 && d.medications.length === 0 && d.conditions.length === 0 && d.encounters.length === 0);
      const anyPending = connections.some((c) => !c.lastExportFailureReason);
      return connections.length > 0 && empty && anyPending ? 8_000 : false;
    },
  });

  const hasAnyHealthData = healthData && (healthData.observations.length > 0 || healthData.medications.length > 0 || healthData.conditions.length > 0 || healthData.encounters.length > 0);
  const allConnectionsFailedExport = connections.length > 0 && connections.every((c) => c.lastExportFailureReason);
  const isWaitingForExport = connections.length > 0 && !allConnectionsFailedExport && healthData && !hasAnyHealthData;

  const handleConnect = () => {
    setConnectError(null);
    if (!fastenPublicId?.trim()) {
      setConnectError('Fasten is not configured (missing VITE_FASTEN_PUBLIC_ID).');
      return;
    }
    setOpenStitch(true);
  };

  const handleRemove = (conn: HealthConnection) => {
    if (window.confirm(`Remove connection "${conn.sourceName || conn.orgConnectionId}"?`)) {
      removeMutation.mutate(conn.orgConnectionId);
    }
  };

  // When Stitch modal is open, attach eventBus listener to fasten-stitch-element. Fasten: event.detail.data is JSON string.
  useEffect(() => {
    if (!openStitch) return;

    const sendToBackend = (orgConnectionId: string, sourceName?: string) => {
      addConnectionMutation.mutate(
        { orgConnectionId, sourceName },
        {
          onSuccess: (data) => {
            setOpenStitch(false);
            setConnectError(null);
            if (data?.ehiExport) {
              setConnectSuccess('Connected. Medical record export has been requested; you will be notified when it is ready.');
              setTimeout(() => setConnectSuccess(null), 8000);
            }
          },
          onError: (err: unknown) =>
            setConnectError((err as { message?: string })?.message || 'Failed to save connection. Please try again.'),
        },
      );
    };

    const onEventBus = (event: Event) => {
      const raw = (event as CustomEvent<{ data?: string }>)?.detail?.data;
      if (raw === undefined) return;
      let parsed: { event_type?: string; data?: { org_connection_id?: string; endpoint_id?: string } | unknown[] };
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return;
      }
      const eventType = parsed?.event_type;
      const data = parsed?.data;

      if (eventType === 'patient.connection_success') {
        const d = data as { org_connection_id?: string; endpoint_id?: string } | undefined;
        const id = d?.org_connection_id;
        if (id) sendToBackend(id, d?.endpoint_id);
        return;
      }
      if (eventType === 'widget.complete') {
        const arr = Array.isArray(data) ? data : data ? [data] : [];
        const first = arr[0] as { org_connection_id?: string; endpoint_id?: string } | undefined;
        const id = first?.org_connection_id;
        if (id) sendToBackend(id, first?.endpoint_id);
        else setOpenStitch(false);
        return;
      }
      if (eventType === 'patient.connection_failed') {
        const d = (data as { error_description?: string; error?: string }) ?? {};
        setConnectError(d.error_description || d.error || 'Connection failed. Please try again.');
      }
    };

    let cleanup: (() => void) | undefined;
    const tryAttach = () => {
      const wrapper = stitchWrapperRef.current;
      const el = wrapper?.querySelector('fasten-stitch-element');
      if (el && !cleanup) {
        el.addEventListener('eventBus', onEventBus);
        cleanup = () => el.removeEventListener('eventBus', onEventBus);
      }
    };
    tryAttach();
    const t1 = setTimeout(tryAttach, 100);
    const t2 = setTimeout(tryAttach, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cleanup?.();
    };
  }, [openStitch, addConnectionMutation]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Health connections"
        subtitle="Connect your health records from hospitals and clinics to share with your care team"
      />

      {connectError && (
        <Alert severity="warning" onClose={() => setConnectError(null)} sx={{ mb: 2 }}>
          {connectError}
        </Alert>
      )}
      {connectSuccess && (
        <Alert severity="success" onClose={() => setConnectSuccess(null)} sx={{ mb: 2 }}>
          {connectSuccess}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Your connected sources
            </Typography>
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
              disabled={addConnectionMutation.isPending}
            >
              Connect a health record
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Testing without real patient credentials?
        </Typography>
        <Typography variant="body2" component="span">
          Each health system uses its own login. To try the flow without a real account, use Fasten&apos;s{' '}
          <Link
            href="https://docs.connect.fastenhealth.com/guides/test-patient-credentials"
            target="_blank"
            rel="noopener noreferrer"
          >
            test patient credentials
          </Link>
          {' '}(e.g. Epic: fhircamila / epicepic1, Cerner: nancysmart / Cerner01). Your Fasten app must be in test mode.
        </Typography>
      </Alert>

      {connections.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <HealthIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No health connections yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Connect your hospital or clinic to share your health records with your provider.
              </Typography>
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={handleConnect}
                disabled={addConnectionMutation.isPending}
              >
                Connect a health record
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List disablePadding>
            {connections.map((conn) => (
              <ListItem
                key={conn.id}
                divider
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  py: 2,
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
                      {conn.lastExportFailureReason && (
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: { xs: 1, sm: 0 },
                  }}
                >
                  {conn.lastExportFailureReason ? (
                    <Chip label="Export failed" size="small" color="error" />
                  ) : conn.lastSyncedAt ? (
                    <Chip label="Synced" size="small" color="success" />
                  ) : (
                    <Chip label="Connected" size="small" color="success" />
                  )}
                  <IconButton
                    edge="end"
                    aria-label="Remove"
                    onClick={() => handleRemove(conn)}
                    disabled={removeMutation.isPending}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      {connections.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HealthIcon fontSize="small" />
              Data from your connections
            </Typography>
            {(healthDataLoading || isWaitingForExport) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {healthDataLoading ? 'Loading your health data…' : "Preparing your health data. Export may take a minute. We'll refresh automatically."}
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
                        {items.slice(0, 15).map((o) => (
                          <ListItem key={o.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={o.display || o.code || '—'}
                              secondary={
                                [
                                  o.value,
                                  o.effectiveAt && format(new Date(o.effectiveAt), 'MMM d, yyyy'),
                                  o.sourceName && `From ${o.sourceName}`,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || undefined
                              }
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      {items.length > 15 && (
                        <Typography variant="caption" color="text.secondary">+ {items.length - 15} more</Typography>
                      )}
                    </Box>
                  ))}
                {healthData.medications.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MedIcon fontSize="small" /> Medications ({healthData.medications.length})
                    </Typography>
                    <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                      {healthData.medications.slice(0, 15).map((m) => {
                        const isActive = m.status?.toLowerCase() === 'active';
                        return (
                          <ListItem key={m.id} sx={{ py: 0.5, opacity: isActive ? 1 : 0.85 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <span>{m.name || 'Medication'}</span>
                                  {m.status && (
                                    <Chip
                                      label={m.status}
                                      size="small"
                                      color={isActive ? 'success' : 'default'}
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                [m.dosage, m.prescribedAt && format(new Date(m.prescribedAt), 'MMM d, yyyy'), m.sourceName && `From ${m.sourceName}`]
                                  .filter(Boolean)
                                  .join(' · ') || undefined
                              }
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                    {healthData.medications.length > 15 && (
                      <Typography variant="caption" color="text.secondary">+ {healthData.medications.length - 15} more</Typography>
                    )}
                  </Box>
                )}
                {healthData.conditions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ConditionIcon fontSize="small" /> Conditions ({healthData.conditions.length})
                    </Typography>
                    <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                      {healthData.conditions.slice(0, 15).map((c) => (
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
                    {healthData.conditions.length > 15 && (
                      <Typography variant="caption" color="text.secondary">+ {healthData.conditions.length - 15} more</Typography>
                    )}
                  </Box>
                )}
                {healthData.encounters.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EncounterIcon fontSize="small" /> Encounters / visits ({healthData.encounters.length})
                    </Typography>
                    <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                      {healthData.encounters.slice(0, 10).map((e) => {
                        const primary = e.reasonText || e.serviceType || e.type || 'Visit';
                        const start = e.periodStart ? format(new Date(e.periodStart), 'MMM d, yyyy') : null;
                        const end = e.periodEnd ? format(new Date(e.periodEnd), 'MMM d, yyyy') : null;
                        const dateRange = start && end && start !== end ? `${start} – ${end}` : start || undefined;
                        const secondary = [dateRange, e.sourceName && `From ${e.sourceName}`].filter(Boolean).join(' · ') || undefined;
                        return (
                          <ListItem key={e.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={primary}
                              secondary={secondary}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                    {healthData.encounters.length > 10 && (
                      <Typography variant="caption" color="text.secondary">+ {healthData.encounters.length - 10} more</Typography>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No health data imported yet. After you connect a source, we request your records; data will appear here once the export is ready (usually within a few minutes).
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openStitch} onClose={() => setOpenStitch(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect a health record</DialogTitle>
        <DialogContent dividers>
          {!fastenPublicId ? (
            <Alert severity="warning">Missing VITE_FASTEN_PUBLIC_ID.</Alert>
          ) : (
            <Box ref={stitchWrapperRef}>
              <fasten-stitch-element public-id={fastenPublicId} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStitch(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthConnectionsPage;
