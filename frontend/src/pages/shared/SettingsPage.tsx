/**
 * Settings Page
 * User settings and preferences - shared across all roles
 */

import { useState } from 'react';
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

  const [isSaving, setIsSaving] = useState(false);

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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings saved successfully');
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
                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security to your account"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={() => handleToggle('twoFactorAuth')}
                    />
                  </ListItemSecondaryAction>
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
    </>
  );
};

export default SettingsPage;
