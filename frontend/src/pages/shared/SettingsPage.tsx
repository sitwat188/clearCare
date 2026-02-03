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
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import PageHeader from '../../components/common/PageHeader';
import i18n from '../../i18n';
import { apiEndpoints } from '../../services/apiEndpoints';
import {
  setupTwoFactor,
  verifySetupTwoFactor,
  disableTwoFactor,
  changePassword as changePasswordService,
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
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    pushNotifications: false,
    complianceReminders: true,
    instructionAlerts: true,
    appointmentReminders: true,
    language: i18n.language || 'en',
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
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

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
    if (key === 'language' && typeof value === 'string') {
      i18n.changeLanguage(value);
      localStorage.setItem('language', value);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success(t('settings.settingsSaved'));
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
      toast.error(err instanceof Error ? err.message : t('settings.twoFactorSetupFailed'));
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
      toast.success(t('settings.twoFactorEnabled'));
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
      toast.error(err instanceof Error ? err.message : t('settings.disable2FA'));
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

  const handleChangePasswordSubmit = async () => {
    setChangePasswordError(null);
    if (changeNewPassword !== changeConfirmPassword) {
      setChangePasswordError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (changeNewPassword.length < 8) {
      setChangePasswordError(t('auth.passwordMinLength'));
      return;
    }
    if (!changeCurrentPassword.trim()) {
      setChangePasswordError(t('settings.currentPassword'));
      return;
    }
    setChangePasswordLoading(true);
    try {
      await changePasswordService(changeCurrentPassword, changeNewPassword);
      toast.success(t('settings.passwordChanged'));
      setChangePasswordDialogOpen(false);
      setChangeCurrentPassword('');
      setChangeNewPassword('');
      setChangeConfirmPassword('');
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const closeChangePasswordDialog = () => {
    setChangePasswordDialogOpen(false);
    setChangeCurrentPassword('');
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setChangePasswordError(null);
  };

  return (
    <>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        action={
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('settings.saving') : t('settings.saveSettings')}
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
                  {t('settings.notificationPreferences')}
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemText
                    primary={t('settings.emailNotifications')}
                    secondary={t('settings.emailNotificationsDesc')}
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
                    primary={t('settings.pushNotifications')}
                    secondary={t('settings.pushNotificationsDesc')}
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
                    primary={t('settings.complianceReminders')}
                    secondary={t('settings.complianceRemindersDesc')}
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
                    primary={t('settings.appointmentReminders')}
                    secondary={t('settings.appointmentRemindersDesc')}
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
                  {t('settings.securitySettings')}
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
                    primary={t('settings.twoFactorAuth')}
                    secondary={
                      twoFactorEnabled
                        ? t('settings.twoFactorAuthEnabledDesc')
                        : t('settings.twoFactorAuthDesc')
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
                      {t('settings.sessionTimeout')}
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
                {t('settings.passwordChangeNote')}
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
                  {t('settings.generalSettings')}
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {t('settings.language')}
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
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </TextField>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {t('settings.theme')}
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
                  <option value="light">{t('settings.themeLight')}</option>
                  <option value="dark">{t('settings.themeDark')}</option>
                  <option value="auto">{t('settings.themeAuto')}</option>
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
                  {t('settings.accountInformation')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  {t('settings.emailAddress')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.email || 'N/A'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('settings.changeEmailNote')}
              </Alert>
              <Button variant="outlined" fullWidth onClick={() => setChangePasswordDialogOpen(true)}>
                {t('nav.changePassword')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onClose={closeChangePasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.changePasswordTitle')}</DialogTitle>
        <DialogContent>
          {changePasswordError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setChangePasswordError(null)}>
              {changePasswordError}
            </Alert>
          )}
          <TextField
            fullWidth
            type="password"
            label={t('settings.currentPassword')}
            value={changeCurrentPassword}
            onChange={(e) => setChangeCurrentPassword(e.target.value)}
            autoComplete="current-password"
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label={t('settings.newPasswordLabel')}
            value={changeNewPassword}
            onChange={(e) => setChangeNewPassword(e.target.value)}
            autoComplete="new-password"
            helperText={t('auth.passwordMinLength')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label={t('settings.confirmNewPassword')}
            value={changeConfirmPassword}
            onChange={(e) => setChangeConfirmPassword(e.target.value)}
            autoComplete="new-password"
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeChangePasswordDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleChangePasswordSubmit}
            disabled={
              !changeCurrentPassword.trim() ||
              !changeNewPassword.trim() ||
              !changeConfirmPassword.trim() ||
              changePasswordLoading
            }
          >
            {changePasswordLoading ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

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
                {t('settings.twoFactorScanQR')}
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
              {t('common.done')}
            </Button>
          ) : setupData ? (
            <>
              <Button onClick={closeSetupDialog}>{t('common.cancel')}</Button>
              <Button
                variant="contained"
                onClick={handleVerifySetup}
                disabled={setupCode.length !== 6 || twoFactorLoading}
              >
                {twoFactorLoading ? <CircularProgress size={24} /> : t('settings.twoFactorVerifyEnable')}
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.twoFactorDisableTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('settings.twoFactorDisableMessage')}
          </Typography>
          <TextField
            fullWidth
            type="password"
            label={t('common.password')}
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            autoComplete="current-password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDisable2FA}
            disabled={!disablePassword.trim() || twoFactorLoading}
          >
            {twoFactorLoading ? <CircularProgress size={24} /> : t('settings.disable2FA')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPage;
