/**
 * Patient History Page
 * View historical instructions and compliance
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  alpha,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import { instructionService } from '../../services/instructionService';
import { complianceService } from '../../services/complianceService';
import { ROUTES } from '../../config/routes';
import { INSTRUCTION_TYPES } from '../../utils/constants';
import type { CareInstruction, InstructionStatus, InstructionType } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';

const PatientHistory = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstructionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InstructionType | 'all'>('all');
  const [selectedInstruction, setSelectedInstruction] = useState<CareInstruction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: instructions, isLoading: instructionsLoading } = useQuery({
    queryKey: ['patient-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'patient'),
    enabled: !!user?.id,
  });

  const { data: complianceRecords } = useQuery({
    queryKey: ['patient-compliance', user?.id],
    queryFn: () => complianceService.getComplianceRecords(user?.id || ''),
    enabled: !!user?.id,
  });

  // Filter for historical instructions (completed, expired, or acknowledged with old dates)
  const historicalInstructions = useMemo(() => {
    if (!instructions) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Instructions older than 30 days

    return instructions.filter((instruction) => {
      const instructionDate = new Date(instruction.assignedDate);
      return (
        instruction.status === 'completed' ||
        instruction.status === 'expired' ||
        (instruction.status === 'acknowledged' && instructionDate < cutoffDate)
      );
    });
  }, [instructions]);

  const filteredInstructions = useMemo(() => {
    return historicalInstructions.filter((instruction) => {
      const matchesSearch =
        searchQuery === '' ||
        instruction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instruction.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || instruction.status === statusFilter;
      const matchesType = typeFilter === 'all' || instruction.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [historicalInstructions, searchQuery, statusFilter, typeFilter]);

  const getComplianceForInstruction = (instructionId: string) => {
    return complianceRecords?.find((r) => r.instructionId === instructionId);
  };

  if (instructionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Compliance History"
        subtitle="View your historical care instructions and compliance records"
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search history..."
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
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as InstructionStatus | 'all')}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
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
          </Grid>
        </CardContent>
      </Card>

      {/* History List */}
      {filteredInstructions.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {historicalInstructions.length === 0
                ? 'No historical instructions yet. Completed and expired instructions will appear here.'
                : 'No instructions match your filters. Try adjusting your search criteria.'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredInstructions.map((instruction) => {
            const compliance = getComplianceForInstruction(instruction.id);
            const startDate = new Date(instruction.assignedDate);
            const endDate = instruction.acknowledgedDate
              ? new Date(instruction.acknowledgedDate)
              : instruction.expirationDate
              ? new Date(instruction.expirationDate)
              : new Date();

            return (
              <Grid item xs={12} key={instruction.id}>
                <Card
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <HistoryIcon color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {instruction.title}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip
                            label={INSTRUCTION_TYPES.find((t) => t.value === instruction.type)?.label || instruction.type}
                            size="small"
                            sx={{ bgcolor: alpha('#2563eb', 0.1), color: 'primary.main', fontWeight: 600 }}
                          />
                          <Chip
                            label={instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
                            size="small"
                            color={instruction.status === 'completed' ? 'success' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={`${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Provider: {instruction.providerName}
                        </Typography>
                        {compliance && (
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Chip
                              label={`Final Compliance: ${compliance.overallPercentage}%`}
                              color={compliance.overallPercentage >= 80 ? 'success' : compliance.overallPercentage >= 60 ? 'warning' : 'error'}
                              sx={{ fontWeight: 600 }}
                            />
                            {compliance.medicationAdherence && (
                              <Chip
                                label={`Medication: ${compliance.medicationAdherence.adherencePercentage}%`}
                                size="small"
                                color="info"
                              />
                            )}
                            {compliance.lifestyleCompliance && (
                              <Chip
                                label={`Lifestyle: ${compliance.lifestyleCompliance.progress}%`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => {
                            setSelectedInstruction(instruction);
                            setDetailDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button variant="outlined" startIcon={<DownloadIcon />}>
                          Download Report
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* History Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedInstruction && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {selectedInstruction.title}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Instruction Period
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(selectedInstruction.assignedDate), 'MMM dd, yyyy')} -{' '}
                  {selectedInstruction.acknowledgedDate
                    ? format(new Date(selectedInstruction.acknowledgedDate), 'MMM dd, yyyy')
                    : selectedInstruction.expirationDate
                    ? format(new Date(selectedInstruction.expirationDate), 'MMM dd, yyyy')
                    : 'Present'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Instruction Content
              </Typography>
              <Paper sx={{ p: 2, bgcolor: alpha('#f0f4f8', 0.5), mb: 3 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedInstruction.content}
                </Typography>
              </Paper>

              {selectedInstruction.medicationDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Medication Details
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Medication"
                        secondary={selectedInstruction.medicationDetails.name}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Dosage"
                        secondary={`${selectedInstruction.medicationDetails.dosage} ${selectedInstruction.medicationDetails.unit}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Frequency"
                        secondary={selectedInstruction.medicationDetails.frequency}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {selectedInstruction.acknowledgments && selectedInstruction.acknowledgments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Acknowledgment History
                  </Typography>
                  <List>
                    {selectedInstruction.acknowledgments.map((ack) => (
                      <ListItem key={ack.id}>
                        <ListItemText
                          primary={ack.acknowledgmentType.charAt(0).toUpperCase() + ack.acknowledgmentType.slice(1)}
                          secondary={format(new Date(ack.timestamp), 'MMM dd, yyyy hh:mm a')}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {getComplianceForInstruction(selectedInstruction.id) && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Final Compliance Summary
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: alpha('#10b981', 0.1) }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                      {getComplianceForInstruction(selectedInstruction.id)?.overallPercentage}% Overall Compliance
                    </Typography>
                    {getComplianceForInstruction(selectedInstruction.id)?.medicationAdherence && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Medication Adherence: {getComplianceForInstruction(selectedInstruction.id)?.medicationAdherence?.adherencePercentage}%
                      </Typography>
                    )}
                    {getComplianceForInstruction(selectedInstruction.id)?.lifestyleCompliance && (
                      <Typography variant="body2">
                        Lifestyle Compliance: {getComplianceForInstruction(selectedInstruction.id)?.lifestyleCompliance?.progress}%
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // TODO: Generate and download report
                  toast.info('Report download feature coming soon');
                }}
              >
                Download Report
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PatientHistory;
