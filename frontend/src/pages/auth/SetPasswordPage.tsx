/**
 * Set Password Page
 * Shown after first login with a temporary password (invitation flow).
 * User must set a new password before using the app.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import type { RootState } from '../../store/store';
import { ROUTES } from '../../config/routes';
import { apiEndpoints } from '../../services/apiEndpoints';
import { APP_NAME } from '../../utils/constants';

const SetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (!currentPassword.trim()) {
      setError(t('settings.currentPassword'));
      return;
    }

    setLoading(true);
    try {
      await apiEndpoints.auth.changePassword(currentPassword, newPassword);
      const redirectPath =
        user?.role === 'patient'
          ? ROUTES.PATIENT.DASHBOARD
          : user?.role === 'provider'
            ? ROUTES.PROVIDER.DASHBOARD
            : ROUTES.ADMIN.DASHBOARD;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.failedToResetPassword'));
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
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LockIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" component="h1">
              {t('auth.setPasswordTitle', 'Set your password')}
            </Typography>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('auth.setPasswordSubtitle', 'You signed in with a temporary password. Please set a new password to continue.')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('settings.currentPassword')}
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrent((s) => !s)}
                      edge="end"
                      aria-label="toggle current password visibility"
                    >
                      {showCurrent ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label={t('auth.newPassword')}
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNew((s) => !s)}
                      edge="end"
                      aria-label="toggle new password visibility"
                    >
                      {showNew ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label={t('auth.confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((s) => !s)}
                      edge="end"
                      aria-label="toggle confirm password visibility"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
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
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : t('auth.setPasswordButton', 'Set password')}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {APP_NAME}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SetPasswordPage;
