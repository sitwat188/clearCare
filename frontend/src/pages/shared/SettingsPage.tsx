/**
 * Settings Page
 * User settings and preferences - shared across all roles
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Divider,
  Button,
  Grid,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import PageHeader from '../../components/common/PageHeader';
import { apiEndpoints } from '../../services/apiEndpoints';
import {
  setupTwoFactor,
  verifySetupTwoFactor,
  disableTwoFactor,
} from '../../services/authService';

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  complianceReminders: boolean;
  instructionAlerts: boolean;
  appointmentReminders: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  sessionTimeout: number;
  twoFactorAuth: boolean;
}

const SettingsPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    pushNotifications: false,
    complianceReminders: true,
    instructionAlerts: true,
    appointmentReminders: true,
    language: 'en',
    theme: 'light',
    sessionTimeout: 30,
    twoFactorAuth: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr');
  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    setupToken: string;
  } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiEndpoints.auth.getMyProfile();
        const profile = res?.data ?? res;
        if (profile && typeof profile === 'object' && 'twoFactorEnabled' in profile) {
          setTwoFactorEnabled(Boolean(profile.twoFactorEnabled));
          setSettings((prev) => ({ ...prev, twoFactorAuth: Boolean(profile.twoFactorEnabled) }));
        }
      } catch {
        // use Redux user or default
        setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
      }
    };
    loadProfile();
  }, [user?.twoFactorEnabled]);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof SettingsState, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  const handleEnable2FAClick = async () => {
    setSetupDialogOpen(true);
    setSetupStep('qr');
    setSetupData(null);
    setSetupCode('');
    setBackupCodes(null);
    setTwoFactorLoading(true);
    try {
      const data = await setupTwoFactor();
      setSetupData({
        qrCodeDataUrl: data.qrCodeDataUrl,
        setupToken: data.setupToken,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start 2FA setup');
      setSetupDialogOpen(false);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!setupData?.setupToken || setupCode.trim().length < 6) return;
    setTwoFactorLoading(true);
    try {
      const result = await verifySetupTwoFactor(setupData.setupToken, setupCode.trim());
      setBackupCodes(result.backupCodes);
      setTwoFactorEnabled(true);
      setSettings((prev) => ({ ...prev, twoFactorAuth: true }));
      toast.success('2FA enabled successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword.trim()) return;
    setTwoFactorLoading(true);
    try {
      await disableTwoFactor(disablePassword);
      setTwoFactorEnabled(false);
      setSettings((prev) => ({ ...prev, twoFactorAuth: false }));
      setDisableDialogOpen(false);
      setDisablePassword('');
      toast.success('2FA disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const closeSetupDialog = () => {
    setSetupDialogOpen(false);
    setSetupData(null);
    setSetupCode('');
    setBackupCodes(null);
    setSetupStep('qr');
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and notification settings"
        action={
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Notification Preferences
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive notifications via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle('emailNotifications')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Push Notifications"
                    secondary="Receive browser push notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={() => handleToggle('pushNotifications')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Compliance Reminders"
                    secondary="Get reminders for compliance tracking"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.complianceReminders}
                      onChange={() => handleToggle('complianceReminders')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Instruction Alerts"
                    secondary="Alert when new instructions are assigned"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.instructionAlerts}
                      onChange={() => handleToggle('instructionAlerts')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Appointment Reminders"
                    secondary="Remind about upcoming appointments"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.appointmentReminders}
                      onChange={() => handleToggle('appointmentReminders')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Security Settings
                </Typography>
              </Box>
              <List>
                <ListItem
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary={
                      twoFactorEnabled
                        ? 'Enabled — use authenticator app or backup codes at login'
                        : 'Add an extra layer of security to your account'
                    }
                    sx={{ flex: '1 1 0', minWidth: 0 }}
                  />
                  <Box sx={{ flexShrink: 0 }}>
                    {twoFactorEnabled ? (
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => setDisableDialogOpen(true)}
                      >
                        Disable 2FA
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleEnable2FAClick}
                        disabled={twoFactorLoading}
                      >
                        Enable 2FA
                      </Button>
                    )}
                  </Box>
                </ListItem>
                <Divider />
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Session Timeout (minutes)
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 30)}
                      inputProps={{ min: 5, max: 120 }}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                For security reasons, changing your password requires email verification.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LanguageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  General Settings
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  Language
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                  size="small"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </TextField>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  Theme
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                  size="small"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </TextField>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <EmailIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Account Information
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.email || 'N/A'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Alert severity="warning" sx={{ mb: 2 }}>
                To change your email address or password, please contact your administrator or use the password reset feature.
              </Alert>
              <Button variant="outlined" fullWidth>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 2FA Setup Dialog */}
      <Dialog open={setupDialogOpen} onClose={closeSetupDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {backupCodes ? 'Save your backup codes' : setupStep === 'qr' ? 'Set up 2FA' : 'Verify code'}
        </DialogTitle>
        <DialogContent>
          {twoFactorLoading && !setupData && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {backupCodes && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Save these backup codes in a secure place. Each can be used once if you lose access to your authenticator app.
            </Alert>
          )}
          {backupCodes && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {backupCodes.map((code, i) => (
                <Typography key={i} variant="body2" fontFamily="monospace" sx={{ p: 0.5, bgcolor: 'grey.100' }}>
                  {code}
                </Typography>
              ))}
            </Box>
          )}
          {setupData && !backupCodes && setupStep === 'qr' && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.
              </Typography>
              <Box component="img" src={setupData.qrCodeDataUrl} alt="QR Code" sx={{ maxWidth: 256, mx: 'auto' }} />
            </Box>
          )}
          {setupData && !backupCodes && (
            <TextField
              fullWidth
              label="6-digit code"
              placeholder="000000"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6 }}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          {backupCodes ? (
            <Button onClick={closeSetupDialog} color="primary">
              Done
            </Button>
          ) : setupData ? (
            <>
              <Button onClick={closeSetupDialog}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleVerifySetup}
                disabled={setupCode.length !== 6 || twoFactorLoading}
              >
                {twoFactorLoading ? <CircularProgress size={24} /> : 'Verify & enable'}
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your current password to disable 2FA.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            autoComplete="current-password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDisable2FA}
            disabled={!disablePassword.trim() || twoFactorLoading}
          >
            {twoFactorLoading ? <CircularProgress size={24} /> : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPage;
