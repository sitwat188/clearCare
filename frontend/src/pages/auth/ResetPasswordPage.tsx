/**
 * Reset Password Page
 * Allows users to reset their password using a token from email
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocalHospital as HospitalIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../config/routes';
import { APP_NAME } from '../../utils/constants';
import { resetPassword } from '../../services/authService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Create New Password
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
              Reset Password
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.9), mt: 1 }}>
              Enter your new password below
            </Typography>
          </Box>
          <CardContent sx={{ p: 4 }}>
            {success ? (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: alpha('#10b981', 0.1),
                      borderRadius: '50%',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LockIcon sx={{ fontSize: 48, color: 'success.main' }} />
                  </Box>
                </Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Password Reset Successful
                  </Typography>
                  <Typography variant="body2">
                    Your password has been successfully reset. You will be redirected to the login page in a few
                    seconds.
                  </Typography>
                </Alert>
                <Button
                  fullWidth
                  component={RouterLink}
                  to={ROUTES.LOGIN}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    },
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {!token && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Invalid or expired reset token. Please request a new password reset link.
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !token}
                    helperText="Must be at least 8 characters long"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || !token}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
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
                    disabled={loading || !token}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    component={RouterLink}
                    to={ROUTES.LOGIN}
                    variant="body2"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    Back to Login
                  </Link>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
