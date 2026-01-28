/**
 * Provider Instructions Page
 * List of instructions created by the provider
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
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Assignment as InstructionsIcon,
  LocalPharmacy as MedicationIcon,
  FitnessCenter as LifestyleIcon,
  Event as FollowUpIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { instructionService } from '../../services/instructionService';
import { ROUTES } from '../../config/routes';
import { INSTRUCTION_TYPES, PRIORITY_LEVELS } from '../../utils/constants';
import type { InstructionStatus, InstructionType, InstructionPriority } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';

const ProviderInstructions = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstructionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InstructionType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<InstructionPriority | 'all'>('all');

  const { data: instructions, isLoading } = useQuery({
    queryKey: ['provider-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'provider'),
    enabled: !!user?.id,
  });

  const filteredInstructions = useMemo(() => {
    if (!instructions) return [];

    return instructions.filter((instruction) => {
      const matchesSearch =
        searchQuery === '' ||
        instruction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instruction.patientName.toLowerCase().includes(searchQuery.toLowerCase());

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
      case 'active':
        return 'success';
      case 'acknowledged':
        return 'info';
      case 'completed':
        return 'default';
      case 'expired':
        return 'warning';
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
    <>
      <PageHeader
        title="Instructions"
        subtitle="Manage care instructions for your patients"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.PROVIDER.CREATE_INSTRUCTION)}
          >
            Create Instruction
          </Button>
        }
      />

      {/* Filters */}
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
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
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
                  <MenuItem value="all">All</MenuItem>
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
                  <MenuItem value="all">All</MenuItem>
                  {PRIORITY_LEVELS.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Instructions List */}
      {filteredInstructions.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                ? 'No instructions found matching your filters'
                : 'No instructions created yet'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredInstructions.map((instruction) => (
            <Grid item xs={12} key={instruction.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: 3,
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => navigate(ROUTES.PROVIDER.INSTRUCTION_DETAIL(instruction.id))}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getTypeIcon(instruction.type)}
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {instruction.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Patient: {instruction.patientName}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {instruction.content.substring(0, 150)}
                        {instruction.content.length > 150 ? '...' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                      <Chip
                        label={instruction.status}
                        color={getStatusColor(instruction.status) as any}
                        size="small"
                      />
                      <Chip
                        label={PRIORITY_LEVELS.find((p) => p.value === instruction.priority)?.label || instruction.priority}
                        color={getPriorityColor(instruction.priority) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Assigned: {format(new Date(instruction.assignedDate), 'MMM dd, yyyy')}
                      {instruction.acknowledgedDate && ` • Acknowledged: ${format(new Date(instruction.acknowledgedDate), 'MMM dd, yyyy')}`}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.PROVIDER.INSTRUCTION_DETAIL(instruction.id));
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
    </>
  );
};

export default ProviderInstructions;
