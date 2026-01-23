/**
 * Patient Instructions List Page
 * Displays all care instructions assigned to the patient with filtering and search
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  alpha,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Assignment as InstructionsIcon,
  LocalPharmacy as MedicationIcon,
  FitnessCenter as LifestyleIcon,
  Event as FollowUpIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { instructionService } from '../../services/instructionService';
import { ROUTES } from '../../config/routes';
import { INSTRUCTION_TYPES, PRIORITY_LEVELS } from '../../utils/constants';
import type { InstructionStatus, InstructionType, InstructionPriority } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';

const PatientInstructions = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstructionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InstructionType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<InstructionPriority | 'all'>('all');

  const { data: instructions, isLoading } = useQuery({
    queryKey: ['patient-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'patient'),
    enabled: !!user?.id,
  });

  const filteredInstructions = useMemo(() => {
    if (!instructions) return [];

    return instructions.filter((instruction) => {
      const matchesSearch =
        searchQuery === '' ||
        instruction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instruction.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || instruction.status === statusFilter;
      const matchesType = typeFilter === 'all' || instruction.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || instruction.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [instructions, searchQuery, statusFilter, typeFilter, priorityFilter]);

  const getTypeIcon = (type: InstructionType) => {
    switch (type) {
      case 'medication':
        return <MedicationIcon />;
      case 'lifestyle':
        return <LifestyleIcon />;
      case 'follow-up':
        return <FollowUpIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <InstructionsIcon />;
    }
  };

  const getStatusColor = (status: InstructionStatus) => {
    switch (status) {
      case 'acknowledged':
        return 'success';
      case 'active':
        return 'primary';
      case 'completed':
        return 'info';
      case 'expired':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: InstructionPriority) => {
    const priorityConfig = PRIORITY_LEVELS.find((p) => p.value === priority);
    return priorityConfig?.color || 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="My Instructions"
        subtitle="View and manage your care instructions"
      />

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as InstructionStatus | 'all')}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value as InstructionType | 'all')}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {INSTRUCTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value as InstructionPriority | 'all')}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  {PRIORITY_LEVELS.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                }}
                sx={{ height: '56px' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Instructions List */}
      {filteredInstructions.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {instructions && instructions.length === 0
                ? 'No instructions assigned yet. Your provider will assign care instructions after your visit.'
                : 'No instructions match your filters. Try adjusting your search criteria.'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredInstructions.map((instruction) => (
            <Grid item xs={12} key={instruction.id}>
              <Card
                sx={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
                  },
                }}
                onClick={() => navigate(ROUTES.PATIENT.INSTRUCTION_DETAIL(instruction.id))}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Box
                        sx={{
                          bgcolor: alpha('#2563eb', 0.1),
                          borderRadius: 2,
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getTypeIcon(instruction.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {instruction.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip
                            label={INSTRUCTION_TYPES.find((t) => t.value === instruction.type)?.label || instruction.type}
                            size="small"
                            sx={{ bgcolor: alpha('#2563eb', 0.1), color: 'primary.main', fontWeight: 600 }}
                          />
                          <Chip
                            label={instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
                            size="small"
                            color={getStatusColor(instruction.status)}
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={PRIORITY_LEVELS.find((p) => p.value === instruction.priority)?.label || instruction.priority}
                            size="small"
                            color={getPriorityColor(instruction.priority) as any}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Assigned by {instruction.providerName} • {format(new Date(instruction.assignedDate), 'MMM dd, yyyy')}
                        </Typography>
                        {instruction.acknowledgmentDeadline && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: new Date(instruction.acknowledgmentDeadline) < new Date() ? 'error.main' : 'warning.main',
                              fontWeight: 600,
                            }}
                          >
                            {new Date(instruction.acknowledgmentDeadline) < new Date()
                              ? 'Acknowledgment overdue'
                              : `Acknowledge by ${format(new Date(instruction.acknowledgmentDeadline), 'MMM dd, yyyy')}`}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.PATIENT.INSTRUCTION_DETAIL(instruction.id));
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                        },
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default PatientInstructions;
