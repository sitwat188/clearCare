/**
 * Admin Users Page
 * User management and administration
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  // NOTE: admin user creation is disabled for now (UI disables + submit guard)
  role: 'patient' | 'provider' | 'administrator';
};

const ROLE_PERMISSIONS: Record<CreateUserForm['role'], string[]> = {
  patient: ['read:own-instructions', 'write:own-acknowledgment', 'read:own-compliance', 'read:own-profile', 'write:own-profile'],
  provider: ['read:patients', 'read:instructions', 'write:instructions', 'read:compliance', 'read:reports', 'write:templates'],
  administrator: ['admin:users', 'admin:roles', 'admin:system', 'admin:audit', 'admin:reports'],
};

/** Deleted = soft-deleted by admin. Inactive = never logged in (and not deleted). */
function getUserStatusBadge(user: { status?: string; deletedAt?: string | null; lastLoginAt?: string | null }) {
  if (user.status === 'inactive' || user.deletedAt) return 'deleted';
  if (!user.lastLoginAt) return 'inactive';
  return 'active';
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [inactiveRestoreDialogOpen, setInactiveRestoreDialogOpen] = useState(false);
  const [inactiveUserId, setInactiveUserId] = useState<string | null>(null);
  const [inactiveUserEmail, setInactiveUserEmail] = useState('');
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'patient',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminService.getUser(id!),
    enabled: !!id,
  });

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['admin-patient-by-user', id],
    queryFn: () => adminService.getPatientByUserId(id!),
    enabled: !!id && user?.role === 'patient',
  });

  const [assignedProviderIds, setAssignedProviderIds] = useState<string[]>([]);
  useEffect(() => {
    if (patient?.assignedProviderIds) setAssignedProviderIds(patient.assignedProviderIds);
    else if (patient && !patient.assignedProviderIds?.length) setAssignedProviderIds([]);
  }, [patient?.id, patient?.assignedProviderIds]);

  const updatePatientMutation = useMutation({
    mutationFn: (payload: { patientId: string; assignedProviderIds: string[] }) =>
      adminService.updatePatient(payload.patientId, { assignedProviderIds: payload.assignedProviderIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patient-by-user', id] });
      toast.success('Assigned providers updated');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update assigned providers');
    },
  });

  const providers = useMemo(
    () => users?.filter((u) => u.role === 'provider' && u.status !== 'inactive') ?? [],
    [users],
  );

  // Filter users
  const filteredUsers = useMemo(() => {
    return users?.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const createUserMutation = useMutation({
    mutationFn: async (form: CreateUserForm) => {
      const email = form.email.trim().toLowerCase();

      // Safety guard (even if someone manipulates the UI/state)
      if ((form as any).role === 'administrator') {
        throw new Error('Creating Administrator users is disabled for now');
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        role: form.role,
        permissions: ROLE_PERMISSIONS[form.role],
        createdAt: new Date().toISOString(),
        organizationId: form.role === 'patient' ? undefined : 'org-1',
      };

      // basic client-side duplicate check (active users only)
      if (users?.some((u) => u.email.toLowerCase() === email && u.status !== 'inactive')) {
        throw new Error('A user with this email already exists');
      }

      return adminService.createUser(payload as any);
    },
    onSuccess: async (createdUser) => {
      toast.success('User created. An invitation email with a temporary password has been sent. The user must set a new password on first login.');
      setAddDialogOpen(false);
      setCreateForm({ firstName: '', lastName: '', email: '', role: 'patient' });

      // Update cache after create
      queryClient.setQueryData(['admin-users'], (old: any) => {
        const prev = Array.isArray(old) ? old : [];
        return [createdUser, ...prev];
      });
      queryClient.setQueryData(['admin-user', createdUser.id], createdUser);

      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: unknown) => {
      const err = error as {
        code?: string;
        message?: string;
        inactiveUserId?: string;
        response?: { data?: { code?: string; message?: string; inactiveUserId?: string } };
      };
      const data = err?.code ? err : err?.response?.data;
      if (data?.code === 'USER_INACTIVE' && data?.inactiveUserId) {
        setInactiveUserId(data.inactiveUserId);
        setInactiveUserEmail(createForm.email.trim());
        setInactiveRestoreDialogOpen(true);
        toast.info('This email belongs to an inactive user. You can restore them in the dialog below.');
        return;
      }
      const message = data?.message || (error instanceof Error ? error.message : 'Failed to create user');
      toast.error(message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => adminService.deleteUser(userId),
    onSuccess: async () => {
      toast.success('User deleted');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.restoreUser(userId),
    onSuccess: async (restoredUser) => {
      toast.success('User reactivated');
      setInactiveRestoreDialogOpen(false);
      setInactiveUserId(null);
      setInactiveUserEmail('');
      setAddDialogOpen(false);
      setCreateForm({ firstName: '', lastName: '', email: '', role: 'patient' });
      queryClient.setQueryData(['admin-user', restoredUser.id], restoredUser);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to restore user');
    },
  });

  const handleDelete = (userId: string) => {
    setSelectedUser(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser);
    }
  };

  const openAddDialog = () => {
    setCreateForm({ firstName: '', lastName: '', email: '', role: 'patient' });
    setAddDialogOpen(true);
  };

  const canSubmitCreate =
    createForm.firstName.trim().length > 0 &&
    createForm.lastName.trim().length > 0 &&
    /^\S+@\S+\.\S+$/.test(createForm.email.trim());

  // User detail view
  if (id) {
    if (userLoading) {
      return (
        <>
          <PageHeader
            title="User Details"
            subtitle="View and manage user information"
            showBack
            backPath={ROUTES.ADMIN.USERS}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        </>
      );
    }

    if (!user) {
      return (
        <>
          <PageHeader
            title="User Details"
            subtitle="View and manage user information"
            showBack
            backPath={ROUTES.ADMIN.USERS}
          />
          <Alert severity="error">User not found</Alert>
        </>
      );
    }

    return (
      <>
        <PageHeader
          title="User Details"
          subtitle="View and manage user information"
          showBack
          backPath={ROUTES.ADMIN.USERS}
        />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, minWidth: 0 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', flexShrink: 0 }}>
                    {user.firstName[0]}{user.lastName[0]}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {getUserStatusBadge(user) === 'deleted' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip label="Deleted" color="default" variant="outlined" sx={{ fontWeight: 600 }} />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<RestoreIcon />}
                        onClick={() => restoreUserMutation.mutate(user.id)}
                        disabled={restoreUserMutation.isPending}
                      >
                        {restoreUserMutation.isPending ? 'Restoring...' : 'Restore user'}
                      </Button>
                    </Box>
                  )}
                  {getUserStatusBadge(user) === 'inactive' && (
                    <Chip label="Inactive (never logged in)" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
                  )}
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Role
                    </Typography>
                    <Chip
                      label={user.role}
                      color={user.role === 'administrator' ? 'error' : user.role === 'provider' ? 'primary' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Permissions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {user.permissions.map((permission) => (
                        <Chip key={permission} label={permission} size="small" />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(user.createdAt), 'PPpp')}
                    </Typography>
                  </Box>

                  {user.lastLoginAt && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Last Login
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(user.lastLoginAt), 'PPpp')}
                      </Typography>
                    </Box>
                  )}

                  {user.organizationId && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Organization ID
                      </Typography>
                      <Typography variant="body1">{user.organizationId}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {user.role === 'patient' && (
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon /> Assigned providers
                  </Typography>
                  {patientLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : !patient ? (
                    <Typography variant="body2" color="text.secondary">
                      No patient record found for this user.
                    </Typography>
                  ) : (
                    <>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel id="assigned-providers-label">Providers</InputLabel>
                        <Select
                          labelId="assigned-providers-label"
                          multiple
                          value={assignedProviderIds}
                          onChange={(e) => setAssignedProviderIds(typeof e.target.value === 'string' ? [] : e.target.value)}
                          label="Providers"
                          renderValue={(selected) =>
                            selected
                              .map((uid) => users?.find((u) => u.id === uid))
                              .filter(Boolean)
                              .map((u) => `${u!.firstName} ${u!.lastName}`)
                              .join(', ') || 'None'
                          }
                        >
                          {providers.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.firstName} {p.lastName} ({p.email})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={updatePatientMutation.isPending}
                        onClick={() =>
                          updatePatientMutation.mutate({
                            patientId: patient.id,
                            assignedProviderIds,
                          })
                        }
                      >
                        {updatePatientMutation.isPending ? 'Saving…' : 'Save assigned providers'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </>
    );
  }

  // Users list view
  if (isLoading) {
    return (
      <>
        <PageHeader
          title="User Management"
          subtitle="Manage system users and their permissions"
          showBack={false}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
              Add User
            </Button>
          }
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage system users and their permissions"
        showBack={false}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add User
          </Button>
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Role</InputLabel>
              <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="patient">Patient</MenuItem>
                <MenuItem value="provider">Provider</MenuItem>
                <MenuItem value="administrator">Administrator</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ overflow: 'hidden' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {user.firstName[0]}{user.lastName[0]}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          color={user.role === 'administrator' ? 'error' : user.role === 'provider' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const badge = getUserStatusBadge(user);
                          return (
                            <Chip
                              label={badge === 'deleted' ? 'Deleted' : badge === 'inactive' ? 'Inactive' : 'Active'}
                              size="small"
                              color={badge === 'deleted' ? 'default' : badge === 'inactive' ? 'warning' : 'success'}
                              variant={badge === 'active' ? 'filled' : 'outlined'}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.permissions?.length ?? 0} permission(s)
                        </Typography>
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy') : 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        {getUserStatusBadge(user) === 'deleted' ? (
                          <IconButton
                            size="small"
                            onClick={() => restoreUserMutation.mutate(user.id)}
                            color="primary"
                            title="Restore / Reactivate user"
                            disabled={restoreUserMutation.isPending}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => navigate(ROUTES.ADMIN.USER_DETAIL(user.id))}
                              sx={{ mr: 0.5 }}
                              title="Edit user"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(user.id)}
                              color="error"
                              title="Delete user"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Alert severity="info">No users found</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user? The user will be deactivated and can be restored later.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteUserMutation.isPending}>
            {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inactive user: restore instead of create */}
      <Dialog
        open={inactiveRestoreDialogOpen}
        onClose={() => {
          setInactiveRestoreDialogOpen(false);
          setInactiveUserId(null);
          setInactiveUserEmail('');
        }}
      >
        <DialogTitle>User already inactive</DialogTitle>
        <DialogContent>
          <Typography>
            A user with email <strong>{inactiveUserEmail}</strong> already exists in inactive state. Would you like to
            restore this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setInactiveRestoreDialogOpen(false);
              setInactiveUserId(null);
              setInactiveUserEmail('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => inactiveUserId && restoreUserMutation.mutate(inactiveUserId)}
            disabled={!inactiveUserId || restoreUserMutation.isPending}
          >
            {restoreUserMutation.isPending ? 'Restoring...' : 'Restore user'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="First Name"
              value={createForm.firstName}
              onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={createForm.lastName}
              onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              type="email"
              autoComplete="off"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={createForm.role}
                label="Role"
                onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as CreateUserForm['role'] }))}
              >
                <MenuItem value="patient">Patient</MenuItem>
                <MenuItem value="provider">Provider</MenuItem>
                <MenuItem value="administrator" disabled>
                  Administrator (disabled)
                </MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 0 }}>
              Permissions are assigned by role.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createUserMutation.mutate(createForm)}
            disabled={!canSubmitCreate || createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminUsers;
