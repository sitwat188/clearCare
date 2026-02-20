/**
 * Admin Roles Page
 * Role and permission management
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import type { Role } from '../../types/admin.types';
import PageHeader from '../../components/common/PageHeader';

const ALL_PERMISSIONS = [
  'read:patients',
  'read:instructions',
  'write:instructions',
  'read:compliance',
  'read:reports',
  'write:templates',
  'admin:users',
  'admin:roles',
  'admin:system',
  'admin:audit',
  'admin:reports',
] as const;

const AdminRoles = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminService.getRoles(),
  });

  const handleCreateRole = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  const handleEditRole = (roleId: string) => {
    setSelectedRole(roleId);
    const role = roles?.find((r) => r.id === roleId);
    if (role) {
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setSelectedPermissions(role.permissions || []);
    }
    setDialogOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setSelectedRole(roleId);
    setDeleteDialogOpen(true);
  };

  const selectedRoleData = useMemo(() => {
    return selectedRole ? roles?.find((r) => r.id === selectedRole) : null;
  }, [selectedRole, roles]);

  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      const name = roleName.trim();
      const description = roleDescription.trim();
      if (!name) throw new Error('Role name is required');
      if (selectedPermissions.length === 0) throw new Error('Select at least one permission');

      if (selectedRoleData) {
        return adminService.updateRole(selectedRoleData.id, {
          name,
          description,
          permissions: selectedPermissions,
          updatedAt: new Date().toISOString(),
        } as Partial<Role>);
      }

      return adminService.createRole({
        name,
        description,
        permissions: selectedPermissions,
        isSystemRole: false,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Partial<Role>);
    },
    onSuccess: async (savedRole) => {
      // Update cache after save
      queryClient.setQueryData(['admin-roles'], (old: Role[] | undefined) => {
        const prev = Array.isArray(old) ? old : [];
        const exists = prev.some((r: Role) => r?.id === savedRole.id);
        if (exists) return prev.map((r: Role) => (r?.id === savedRole.id ? savedRole : r));
        return [savedRole, ...prev];
      });

      toast.success(selectedRoleData ? 'Role updated (mock)' : 'Role created (mock)');
      setDialogOpen(false);
      setSelectedRole(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => adminService.deleteRole(roleId),
    onSuccess: async (_data, roleId) => {
      queryClient.setQueryData(['admin-roles'], (old: Role[] | undefined) => {
        const prev = Array.isArray(old) ? old : [];
        return prev.filter((r: Role) => r?.id !== roleId);
      });

      toast.success('Role deleted');
      setDeleteDialogOpen(false);
      setSelectedRole(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    },
  });

  const confirmDelete = () => {
    if (selectedRole) deleteRoleMutation.mutate(selectedRole);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Roles & Permissions" subtitle="Manage system roles and permissions" showBack={false} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage system roles and permissions"
        showBack={false}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRole}>
            Create Role
          </Button>
        }
      />

      <Grid container spacing={3}>
        {roles && roles.length > 0 ? (
          roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {role.isSystemRole ? (
                        <LockIcon sx={{ color: 'primary.main' }} />
                      ) : (
                        <SecurityIcon sx={{ color: 'text.secondary' }} />
                      )}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {role.name}
                        </Typography>
                        {role.isSystemRole && (
                          <Chip label="System Role" size="small" color="primary" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRole(role.id)}
                        disabled={role.isSystemRole}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.isSystemRole}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {role.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Permissions ({role.permissions.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.permissions.slice(0, 5).map((permission) => (
                        <Chip key={permission} label={permission} size="small" sx={{ fontSize: '0.7rem' }} />
                      ))}
                      {role.permissions.length > 5 && (
                        <Chip label={`+${role.permissions.length - 5} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      {role.userCount} user(s) assigned
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {format(new Date(role.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">No roles found</Alert>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., Nurse Practitioner"
            />
            <TextField
              fullWidth
              label="Description"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              multiline
              rows={3}
              placeholder="Describe the role and its purpose..."
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflow: 'auto' }}>
                {ALL_PERMISSIONS.map((permission) => (
                  <FormControlLabel
                    key={permission}
                    control={
                      <Checkbox
                        checked={selectedPermissions.includes(permission)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedPermissions((prev) =>
                            checked ? Array.from(new Set([...prev, permission])) : prev.filter((p) => p !== permission)
                          );
                        }}
                      />
                    }
                    label={permission}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveRoleMutation.mutate()}
            disabled={saveRoleMutation.isPending || !!selectedRoleData?.isSystemRole}
          >
            {saveRoleMutation.isPending ? 'Saving...' : selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this role? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteRoleMutation.isPending}>
            {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminRoles;
