/**
 * Callback after Fasten Connect redirect.
 * Reads org_connection_id (and optionally source_name) from query, adds connection via API, redirects to Health Connections page.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { healthConnectionsService } from '../../services/healthConnectionsService';
import { ROUTES } from '../../config/routes';

const HealthConnectionsCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const orgConnectionId = searchParams.get('org_connection_id');
    const sourceName = searchParams.get('source_name') ?? searchParams.get('endpoint_id'); // optional

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error || 'Connection was not completed.');
      return;
    }

    if (!orgConnectionId || !orgConnectionId.trim()) {
      setStatus('error');
      setMessage('Missing connection information. Please try connecting again.');
      return;
    }

    healthConnectionsService
      .addConnection(orgConnectionId.trim(), sourceName?.trim() || undefined)
      .then(() => {
        setStatus('success');
        setMessage('Health record connected successfully.');
        setTimeout(() => navigate(ROUTES.PATIENT.HEALTH_CONNECTIONS, { replace: true }), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || 'Failed to save connection. Please try again.');
      });
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        px: 2,
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Saving your health connection…
          </Typography>
        </>
      )}
      {status === 'success' && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Connection saved
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {message} Redirecting…
          </Typography>
        </>
      )}
      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ maxWidth: 400, mb: 2 }}>
            {message}
          </Alert>
          <Typography
            component="button"
            variant="body2"
            onClick={() => navigate(ROUTES.PATIENT.HEALTH_CONNECTIONS)}
            sx={{ textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none' }}
          >
            Back to Health connections
          </Typography>
        </>
      )}
    </Box>
  );
};

export default HealthConnectionsCallbackPage;
