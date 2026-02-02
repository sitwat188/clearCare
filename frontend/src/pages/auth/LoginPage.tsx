/**
 * Login page
 * Handles user authentication
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  alpha,
  Link,
} from '@mui/material';
import { LocalHospital as HospitalIcon } from '@mui/icons-material';
import { loginSuccess } from '../../store/slices/authSlice';
import { login as loginService, verifyTwoFactor } from '../../services/authService';
import { ROUTES } from '../../config/routes';
import { APP_NAME } from '../../utils/constants';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const step = twoFactorToken ? '2fa' : 'credentials';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginService({ email, password });

      if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
        setTwoFactorToken(response.twoFactorToken);
        setLoading(false);
        return;
      }

      if ('user' in response && response.token) {
        dispatch(loginSuccess({ user: response.user, token: response.token }));
        const redirectPath =
          response.user.role === 'patient'
            ? ROUTES.PATIENT.DASHBOARD
            : response.user.role === 'provider'
            ? ROUTES.PROVIDER.DASHBOARD
            : ROUTES.ADMIN.DASHBOARD;
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorToken || !twoFactorCode.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await verifyTwoFactor(twoFactorToken, twoFactorCode.trim());
      dispatch(loginSuccess({ user: result.user, token: result.token }));
      const redirectPath =
        result.user.role === 'patient'
          ? ROUTES.PATIENT.DASHBOARD
          : result.user.role === 'provider'
          ? ROUTES.PROVIDER.DASHBOARD
          : ROUTES.ADMIN.DASHBOARD;
      navigate(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setTwoFactorToken(null);
    setTwoFactorCode('');
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: '50%',
              p: 2,
              mb: 2,
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <HospitalIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'white' }}>
            {APP_NAME}
          </Typography>
          <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.9), textAlign: 'center' }}>
            Post-Visit Care & Follow-Up Compliance Platform
          </Typography>
        </Box>

        <Card
          sx={{
            width: '100%',
            borderRadius: 4,
            boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography component="h2" variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
              {step === '2fa' ? 'Two-Factor Authentication' : 'Welcome Back'}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.9), mt: 1 }}>
              {step === '2fa'
                ? 'Enter the 6-digit code from your authenticator app or a backup code'
                : 'Sign in to access your care instructions'}
            </Typography>
          </Box>
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {step === '2fa' ? (
              <Box component="form" onSubmit={handleVerify2FA} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="twoFactorCode"
                  label="Authentication code"
                  name="code"
                  placeholder="000000 or backup code"
                  autoComplete="one-time-code"
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  disabled={loading}
                  inputProps={{ maxLength: 10 }}
                />
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  sx={{ mt: 2 }}
                  onClick={handleBackToCredentials}
                  disabled={loading}
                >
                  Back to sign in
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 2,
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0px 8px 20px rgba(37, 99, 235, 0.4)',
                    },
                  }}
                  disabled={loading || !twoFactorCode.trim()}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Link
                    component={RouterLink}
                    to={ROUTES.FORGOT_PASSWORD}
                    variant="body2"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0px 8px 20px rgba(37, 99, 235, 0.4)',
                    },
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </Box>
            )}

            {step === 'credentials' && (
            <Box
              sx={{
                mt: 3,
                p: 2.5,
                bgcolor: alpha('#2563eb', 0.1),
                borderRadius: 3,
                border: `1px solid ${alpha('#2563eb', 0.2)}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                Demo Credentials:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  👤 Patient: <strong>patient1@example.com</strong> / password123
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  👨‍⚕️ Provider: <strong>provider1@example.com</strong> / password123
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  ⚙️ Admin: <strong>admin@example.com</strong> / password123
                </Typography>
              </Box>
            </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
