/**
 * Profile Page
 * User profile management - shared across all roles
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { updateUser } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import PageHeader from '../../components/common/PageHeader';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: (data) => {
      dispatch(updateUser({ ...user, ...data }));
      setIsEditing(false);
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setIsEditing(false);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      patient: 'Patient',
      provider: 'Healthcare Provider',
      administrator: 'Administrator',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, 'primary' | 'success' | 'warning' | 'default'> = {
      patient: 'primary',
      provider: 'success',
      administrator: 'warning',
    };
    return colors[role] || 'default';
  };

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and account details"
      />

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    fontSize: '3rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {user?.firstName?.[0] || <PersonIcon />}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Chip
                  label={getRoleLabel(user?.role || '')}
                  color={getRoleColor(user?.role || '') as 'primary' | 'success' | 'warning' | 'default'}
                  sx={{ mb: 2, fontWeight: 600 }}
                />
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Personal Information
                </Typography>
                {!isEditing && (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              {isEditing ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    You can update your first name and last name. Email address cannot be changed.
                  </Alert>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        disabled={updateMutation.isPending}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        disabled={updateMutation.isPending}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={user?.email || ''}
                        disabled
                        helperText="Email address cannot be changed"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          onClick={handleCancel}
                          disabled={updateMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      First Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user?.firstName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Last Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user?.lastName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Email Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user?.email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Role
                    </Typography>
                    <Chip
                      label={getRoleLabel(user?.role || '')}
                      color={getRoleColor(user?.role || '') as 'primary' | 'success' | 'warning' | 'default'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Account Created
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user?.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ProfilePage;
