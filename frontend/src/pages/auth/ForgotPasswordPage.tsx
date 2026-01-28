/**
 * Forgot Password Page
 * Allows users to request a password reset
 */

import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { ArrowBack as ArrowBackIcon, LocalHospital as HospitalIcon, Email as EmailIcon } from '@mui/icons-material';
import { ROUTES } from '../../config/routes';
import { APP_NAME } from '../../utils/constants';
import { forgotPassword } from '../../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
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
            Reset Your Password
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
              Forgot Password?
            </Typography>
            <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.9), mt: 1 }}>
              Enter your email to receive a password reset link
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
                    <EmailIcon sx={{ fontSize: 48, color: 'success.main' }} />
                  </Box>
                </Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Check your email
                  </Typography>
                  <Typography variant="body2">
                    We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the
                    instructions to reset your password.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  Didn't receive the email? Check your spam folder or try again.
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  sx={{ mb: 2 }}
                >
                  Try Another Email
                </Button>
                <Button
                  fullWidth
                  component={RouterLink}
                  to={ROUTES.LOGIN}
                  variant="text"
                  startIcon={<ArrowBackIcon />}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    helperText="Enter the email address associated with your account"
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
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
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

export default ForgotPasswordPage;
