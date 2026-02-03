/**
 * Admin Settings Page
 * System configuration and settings
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import PageHeader from '../../components/common/PageHeader';

const AdminSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminService.getSystemSettings(),
  });

  // Sync query data to local state
  useEffect(() => {
    if (systemSettings) {
      setSettings(systemSettings);
    }
  }, [systemSettings]);

  const handleSettingChange = (field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
    setHasChanges(true);
  };

  const handleNestedSettingChange = (section: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
    setHasChanges(true);
  };

  const handleDeepNestedSettingChange = (section: string, subsection: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [subsection]: {
          ...settings[section][subsection],
          [field]: value,
        },
      },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.success('Settings saved');
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="System Settings" subtitle="Configure system-wide settings" showBack={false} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (!systemSettings || !settings) {
    return (
      <>
        <PageHeader title="System Settings" subtitle="Configure system-wide settings" showBack={false} />
        <Alert severity="error">Failed to load system settings. Please try again.</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        subtitle="Configure system-wide settings"
        showBack={false}
        action={
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        }
      />

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Session Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Session & Security
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    handleSettingChange('sessionTimeout', parseInt(e.target.value))
                  }
                  helperText="User session will expire after this many minutes of inactivity"
                />

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                  Password Policy
                </Typography>

                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Length"
                  value={settings.passwordPolicy.minLength}
                  onChange={(e) =>
                    handleDeepNestedSettingChange(
                      'passwordPolicy',
                      'passwordPolicy',
                      'minLength',
                      parseInt(e.target.value)
                    )
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passwordPolicy.requireUppercase}
                      onChange={(e) =>
                        handleNestedSettingChange(
                          'passwordPolicy',
                          'requireUppercase',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Require Uppercase Letters"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passwordPolicy.requireLowercase}
                      onChange={(e) =>
                        handleNestedSettingChange(
                          'passwordPolicy',
                          'requireLowercase',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Require Lowercase Letters"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passwordPolicy.requireNumbers}
                      onChange={(e) =>
                        handleNestedSettingChange(
                          'passwordPolicy',
                          'requireNumbers',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Require Numbers"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passwordPolicy.requireSpecialChars}
                      onChange={(e) =>
                        handleNestedSettingChange(
                          'passwordPolicy',
                          'requireSpecialChars',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Require Special Characters"
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Password Expiration (days)"
                  value={settings.passwordPolicy.expirationDays}
                  onChange={(e) =>
                    handleNestedSettingChange(
                      'passwordPolicy',
                      'expirationDays',
                      parseInt(e.target.value)
                    )
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Notifications
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationSettings.emailEnabled}
                      onChange={(e) =>
                        handleNestedSettingChange(
                          'notificationSettings',
                          'emailEnabled',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Enable Email Notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationSettings.smsEnabled}
                      onChange={(e) =>
                        handleNestedSettingChange(
                          'notificationSettings',
                          'smsEnabled',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Enable SMS Notifications"
                />

                <TextField
                  fullWidth
                  label="Default Notification Types"
                  value={settings.notificationSettings.defaultNotificationTypes.join(', ')}
                  onChange={(e) =>
                    handleNestedSettingChange(
                      'notificationSettings',
                      'defaultNotificationTypes',
                      e.target.value.split(',').map((s) => s.trim())
                    )
                  }
                  helperText="Comma-separated list of notification types"
                  multiline
                  rows={3}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Retention */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Data Retention
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Audit Logs Retention (days)"
                  value={settings.dataRetention.auditLogsDays}
                  onChange={(e) =>
                    handleNestedSettingChange(
                      'dataRetention',
                      'auditLogsDays',
                      parseInt(e.target.value)
                    )
                  }
                  helperText="How long to keep audit logs"
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Compliance Records Retention (days)"
                  value={settings.dataRetention.complianceRecordsDays}
                  onChange={(e) =>
                    handleNestedSettingChange(
                      'dataRetention',
                      'complianceRecordsDays',
                      parseInt(e.target.value)
                    )
                  }
                  helperText="How long to keep compliance records"
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Archived Instructions Retention (days)"
                  value={settings.dataRetention.archivedInstructionsDays}
                  onChange={(e) =>
                    handleNestedSettingChange(
                      'dataRetention',
                      'archivedInstructionsDays',
                      parseInt(e.target.value)
                    )
                  }
                  helperText="How long to keep archived instructions"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Flags */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Feature Flags
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(settings.featureFlags).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        checked={value as boolean}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            featureFlags: {
                              ...settings.featureFlags,
                              [key]: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default AdminSettings;
