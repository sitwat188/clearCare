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
import { Link as LinkIcon, Delete as DeleteIcon, LocalHospital as HealthIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../components/common/PageHeader';
import { healthConnectionsService } from '../../services/healthConnectionsService';
import type { HealthConnection } from '../../types/health-connections.types';

type StitchEventDetail = { data?: string } | { data?: unknown };

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-connections-me'] }),
  });

  const addConnectionMutation = useMutation({
    mutationFn: ({ orgConnectionId, sourceName }: { orgConnectionId: string; sourceName?: string }) =>
      healthConnectionsService.addConnection(orgConnectionId, sourceName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-connections-me'] }),
  });

  const handleConnect = () => {
    setConnectError(null);
    if (!fastenPublicId || !fastenPublicId.trim()) {
      setConnectError('Fasten Stitch is not configured (missing VITE_FASTEN_PUBLIC_ID).');
      return;
    }
    setOpenStitch(true);
  };

  const handleRemove = (conn: HealthConnection) => {
    if (window.confirm(`Remove connection "${conn.sourceName || conn.orgConnectionId}"?`)) {
      removeMutation.mutate(conn.orgConnectionId);
    }
  };

  useEffect(() => {
    if (!openStitch) return;
    const wrapper = stitchWrapperRef.current;
    if (!wrapper) return;
    let cleanup: (() => void) | undefined;
    const id = setTimeout(() => {
      const el = wrapper.querySelector('fasten-stitch-element');
      if (!el) return;

      const onEventBus = (event: Event) => {
      // Fasten docs: event.detail.data is JSON string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (event as any)?.detail as StitchEventDetail | undefined;
      const raw = (detail as { data?: unknown })?.data;
      const parsed =
        typeof raw === 'string'
          ? (() => {
              try {
                return JSON.parse(raw) as any;
              } catch {
                return null;
              }
            })()
          : raw;

      const eventType = parsed?.event_type as string | undefined;
      if (!eventType) return;

      const sendConnectionToBackend = (orgConnectionId: string, sourceName?: string) => {
        addConnectionMutation.mutate(
          { orgConnectionId, sourceName },
          {
            onSuccess: (data) => {
              setOpenStitch(false);
              setConnectError(null);
              if (data?.ehiExport) {
                setConnectSuccess(
                  'Connected. Medical record export has been requested; you will be notified when it is ready.',
                );
                setTimeout(() => setConnectSuccess(null), 8000);
              }
            },
            onError: (err: any) => setConnectError(err?.message || 'Failed to save connection. Please try again.'),
          },
        );
      };

      // Emitted as soon as one connection succeeds (no need to wait for modal close).
      if (eventType === 'patient.connection_success') {
        const data = parsed?.data as { org_connection_id?: string; endpoint_id?: string } | undefined;
        const orgConnectionId = data?.org_connection_id;
        const endpointId = data?.endpoint_id;
        if (orgConnectionId) {
          sendConnectionToBackend(orgConnectionId, endpointId);
          return;
        }
      }

      // Emitted when user closes the modal (array of all connections this session).
      if (eventType === 'widget.complete') {
        const items = Array.isArray(parsed?.data) ? parsed.data : [];
        const first = items[0];
        const orgConnectionId = first?.org_connection_id as string | undefined;
        const endpointId = first?.endpoint_id as string | undefined;
        if (orgConnectionId) {
          sendConnectionToBackend(orgConnectionId, endpointId);
        } else {
          setOpenStitch(false);
        }
      }

      if (eventType === 'patient.connection_failed') {
        const msg =
          (parsed?.data?.error_description as string | undefined) ||
          (parsed?.data?.error as string | undefined) ||
          'Connection failed. Please try again.';
        setConnectError(msg);
      }
    };

      el.addEventListener('eventBus', onEventBus);
      cleanup = () => el.removeEventListener('eventBus', onEventBus);
    }, 100);
    return () => {
      clearTimeout(id);
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
                  secondary={<>Connected {format(new Date(conn.connectedAt), 'MMM d, yyyy')}</>}
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
                  <Chip label="Connected" size="small" color="success" />
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

      <Dialog open={openStitch} onClose={() => setOpenStitch(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect a health record</DialogTitle>
        <DialogContent dividers>
          {!fastenPublicId ? (
            <Alert severity="warning">Missing `VITE_FASTEN_PUBLIC_ID`.</Alert>
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
