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
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link as LinkIcon, Delete as DeleteIcon, Sync as SyncIcon, LocalHospital as HealthIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { healthConnectionsService } from '../../services/healthConnectionsService';
import type { HealthConnection } from '../../types/health-connections.types';
import { isUserFacingExportFailure } from '../../types/health-connections.types';

const observationCategoryLabel = (cat: string | undefined): string => {
  if (!cat) return 'Other';
  const c = cat.toLowerCase();
  if (c === 'laboratory' || c === 'lab') return 'Labs';
  if (c === 'vital-signs' || c === 'vitals') return 'Vitals';
  if (c === 'social-history') return 'Social history';
  return cat;
};

type HealthDataTab = 'observations' | 'medications' | 'conditions' | 'encounters';

const filterBySearch = <T,>(items: T[], getSearchText: (item: T) => string, search: string): T[] => {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
};

const HealthConnectionsPage = () => {
  const queryClient = useQueryClient();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [connectInfo, setConnectInfo] = useState<string | null>(null);
  const [openStitch, setOpenStitch] = useState(false);
  const stitchWrapperRef = useRef<HTMLDivElement | null>(null);
  const [healthDataTab, setHealthDataTab] = useState<HealthDataTab>('observations');
  const [healthDataSearch, setHealthDataSearch] = useState('');
  const [healthDataConnectionId, setHealthDataConnectionId] = useState<string>('');
  const hasSetDefaultSourceRef = useRef(false);

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

  const syncMutation = useMutation({
    mutationFn: (orgConnectionId: string) => healthConnectionsService.requestExport(orgConnectionId),
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

  const { data: healthData, isLoading: healthDataLoading, refetch: refetchHealthData, isRefetching: healthDataRefetching } = useQuery({
    queryKey: ['health-data-me'],
    queryFn: () => healthConnectionsService.getMyHealthData(),
    enabled: connections.length > 0,
    refetchInterval: false,
  });

  const hasAnyHealthData = healthData && (healthData.observations.length > 0 || healthData.medications.length > 0 || healthData.conditions.length > 0 || healthData.encounters.length > 0);
  const showHealthDataLoading = healthDataLoading || healthDataRefetching;

  useEffect(() => {
    if (connections.length === 0) {
      hasSetDefaultSourceRef.current = false;
      setHealthDataConnectionId('');
      return;
    }
    if (!hasSetDefaultSourceRef.current) {
      hasSetDefaultSourceRef.current = true;
      setHealthDataConnectionId('');
      return;
    }
    if (healthDataConnectionId && !connections.some((c) => c.id === healthDataConnectionId)) {
      setHealthDataConnectionId('');
    }
  }, [connections, healthDataConnectionId]);

  const filteredObservations = useMemo(() => {
    if (!healthData?.observations) return [];
    let list = healthData.observations;
    if (healthDataConnectionId) list = list.filter((o) => o.connectionId === healthDataConnectionId);
    return filterBySearch(list, (o) => [o.display, o.code, o.value].filter(Boolean).join(' '), healthDataSearch);
  }, [healthData?.observations, healthDataConnectionId, healthDataSearch]);

  const filteredMedications = useMemo(() => {
    if (!healthData?.medications) return [];
    let list = healthData.medications;
    if (healthDataConnectionId) list = list.filter((m) => m.connectionId === healthDataConnectionId);
    return filterBySearch(list, (m) => [m.name, m.dosage].filter(Boolean).join(' '), healthDataSearch);
  }, [healthData?.medications, healthDataConnectionId, healthDataSearch]);

  const filteredConditions = useMemo(() => {
    if (!healthData?.conditions) return [];
    let list = healthData.conditions;
    if (healthDataConnectionId) list = list.filter((c) => c.connectionId === healthDataConnectionId);
    return filterBySearch(list, (c) => [c.display, c.code].filter(Boolean).join(' '), healthDataSearch);
  }, [healthData?.conditions, healthDataConnectionId, healthDataSearch]);

  const filteredEncounters = useMemo(() => {
    if (!healthData?.encounters) return [];
    let list = healthData.encounters;
    if (healthDataConnectionId) list = list.filter((e) => e.connectionId === healthDataConnectionId);
    return filterBySearch(
      list,
      (e) => [e.reasonText, e.serviceType, e.type].filter(Boolean).join(' '),
      healthDataSearch,
    );
  }, [healthData?.encounters, healthDataConnectionId, healthDataSearch]);

  const handleConnect = () => {
    setConnectError(null);
    if (!fastenPublicId?.trim()) {
      setConnectError('Fasten is not configured (missing VITE_FASTEN_PUBLIC_ID).');
      return;
    }
    setOpenStitch(true);
  };

  const handleRemove = (conn: HealthConnection) => {
    if (window.confirm(`Remove connection "${conn.sourceName || 'Health record'}"?`)) {
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
          onError: (err: unknown) => {
            const anyErr = err as Record<string, unknown>;
            const response = anyErr?.response as { status?: number; data?: { message?: string } } | undefined;
            const status = response?.status;
            const data = response?.data;
            const apiMessage =
              (data && typeof data === 'object' && typeof (data as { message?: string }).message === 'string'
                ? (data as { message: string }).message
                : null) ?? (typeof anyErr?.message === 'string' ? anyErr.message : '');
            const isAlreadyConnected = status === 409 || (typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('already connected'));
            if (isAlreadyConnected) {
              setOpenStitch(false);
              setConnectError(null);
              const msg = typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : 'This organization is already connected.';
              setConnectInfo(msg);
              toast.info(msg);
              setTimeout(() => setConnectInfo(null), 6000);
            } else {
              setConnectError(apiMessage || 'Failed to save connection. Please try again.');
            }
          },
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
      {connectInfo && (
        <Alert severity="info" onClose={() => setConnectInfo(null)} sx={{ mb: 2 }}>
          {connectInfo}
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
                  primary={conn.sourceName ?? 'Health record'}
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: { xs: 1, sm: 0 },
                  }}
                >
                  {isUserFacingExportFailure(conn.lastExportFailureReason) ? (
                    <Chip label="Export failed" size="small" color="error" />
                  ) : conn.lastSyncedAt ? (
                    <Chip label="Synced" size="small" color="success" />
                  ) : (
                    <Chip label="Connected" size="small" color="success" />
                  )}
                  <IconButton
                    aria-label="Sync"
                    onClick={() => syncMutation.mutate(conn.orgConnectionId)}
                    disabled={syncMutation.isPending}
                    color="primary"
                    size="small"
                    title="Sync data from this source"
                  >
                    <SyncIcon />
                  </IconButton>
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HealthIcon fontSize="small" />
                Data from your connections
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => refetchHealthData()}
                disabled={showHealthDataLoading}
              >
                Refresh
              </Button>
            </Box>
            {(showHealthDataLoading) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Loading your health data…
                </Typography>
              </Box>
            ) : healthData && hasAnyHealthData ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Search…"
                    value={healthDataSearch}
                    onChange={(e) => setHealthDataSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: 200 }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Organization"
                    value={healthDataConnectionId}
                    onChange={(e) => setHealthDataConnectionId(e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ minWidth: 180 }}
                  >
                    <option value="">All organizations</option>
                    {connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.sourceName ?? 'Health record'}
                      </option>
                    ))}
                  </TextField>
                </Box>
                <Tabs
                  value={healthDataTab}
                  onChange={(_, v) => setHealthDataTab(v as HealthDataTab)}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
                >
                  <Tab label={`Labs & Vitals (${filteredObservations.length})`} value="observations" />
                  <Tab label={`Medications (${filteredMedications.length})`} value="medications" />
                  <Tab label={`Conditions (${filteredConditions.length})`} value="conditions" />
                  <Tab label={`Encounters (${filteredEncounters.length})`} value="encounters" />
                </Tabs>
                {healthDataTab === 'observations' && (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredObservations.map((o) => (
                          <TableRow key={o.id} hover>
                            <TableCell>{o.display || o.code || '—'}</TableCell>
                            <TableCell>{observationCategoryLabel(o.category)}</TableCell>
                            <TableCell>{o.value ? (o.unit ? `${o.value} ${o.unit}` : o.value) : '—'}</TableCell>
                            <TableCell>{o.effectiveAt ? format(new Date(o.effectiveAt), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{o.sourceName ?? 'Health record'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {healthDataTab === 'medications' && (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Dosage</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Prescribed</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredMedications.map((m) => {
                          const isActive = m.status?.toLowerCase() === 'active';
                          return (
                            <TableRow key={m.id} hover sx={{ opacity: isActive ? 1 : 0.9 }}>
                              <TableCell>{m.name || '—'}</TableCell>
                              <TableCell>{m.dosage ?? '—'}</TableCell>
                              <TableCell>
                                {m.status && (
                                  <Chip
                                    label={m.status}
                                    size="small"
                                    color={isActive ? 'success' : 'default'}
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>{m.prescribedAt ? format(new Date(m.prescribedAt), 'MMM d, yyyy') : '—'}</TableCell>
                              <TableCell sx={{ color: 'text.secondary' }}>{m.sourceName ?? 'Health record'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {healthDataTab === 'conditions' && (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Onset</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredConditions.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell>{c.display || c.code || '—'}</TableCell>
                            <TableCell>
                              {c.clinicalStatus && (
                                <Chip
                                  label={c.clinicalStatus}
                                  size="small"
                                  color={c.clinicalStatus.toLowerCase() === 'active' ? 'warning' : 'default'}
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>
                            <TableCell>{c.onsetAt ? format(new Date(c.onsetAt), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{c.sourceName ?? 'Health record'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {healthDataTab === 'encounters' && (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Reason / Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredEncounters.map((e) => (
                          <TableRow key={e.id} hover>
                            <TableCell>{e.reasonText || e.serviceType || e.type || 'Visit'}</TableCell>
                            <TableCell>{e.periodStart ? format(new Date(e.periodStart), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell>{e.periodEnd ? format(new Date(e.periodEnd), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{e.sourceName ?? 'Health record'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No health data imported yet. After you connect a source, we request your records; data will appear here once the export is ready (usually 1–2 minutes).
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => refetchHealthData()}
                  disabled={showHealthDataLoading}
                >
                  {showHealthDataLoading ? 'Checking…' : 'Refresh to check for new data'}
                </Button>
              </Box>
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
