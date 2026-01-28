/**
 * Admin Users Page
 * User management and administration
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminService.getUser(id!),
    enabled: !!id,
  });

  // Filter users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = (userId: string) => {
    setSelectedUser(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      toast.success('User deleted (mock)');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                    {user.firstName[0]}{user.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            <Button variant="contained" startIcon={<AddIcon />}>
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
          <Button variant="contained" startIcon={<AddIcon />}>
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
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
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
                        <Typography variant="body2" color="text.secondary">
                          {user.permissions.length} permission(s)
                        </Typography>
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy') : 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(ROUTES.ADMIN.USER_DETAIL(user.id))}
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(user.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
          <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminUsers;
