/**
 * OAuth callback page
 * Handles OAuth authorization code callback
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { handleOAuthCallback } from '../../services/authService';
import { ROUTES } from '../../config/routes';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        navigate(ROUTES.LOGIN);
        return;
      }

      if (code) {
        try {
          // Get code verifier from session storage
          const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
          if (!codeVerifier) {
            throw new Error('Code verifier not found');
          }

          // Exchange code for tokens
          const tokenResponse = await handleOAuthCallback(code, codeVerifier);

          // TODO: Decode ID token to get user info
          // For now, redirect to login
          navigate(ROUTES.LOGIN);
        } catch (err) {
          console.error('OAuth callback error:', err);
          navigate(ROUTES.LOGIN);
        }
      } else {
        navigate(ROUTES.LOGIN);
      }
    };

    processCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Processing authentication...
      </Typography>
    </Box>
  );
};

export default OAuthCallbackPage;
