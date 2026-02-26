/**
 * Patient Instruction Detail Page
 * Shows full instruction details and acknowledgment options
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { ChipProps } from '@mui/material';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  alpha,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  LocalPharmacy as MedicationIcon,
  FitnessCenter as LifestyleIcon,
  Event as FollowUpIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';         
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import { instructionService } from '../../services/instructionService';
import { ROUTES } from '../../config/routes';
import { PRIORITY_LEVELS, INSTRUCTION_TYPES } from '../../utils/constants';
import type { AcknowledgmentType } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';
import { exportInstructionPDF } from '../../utils/exportUtils';

const PatientInstructionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedAcknowledgmentTypes, setSelectedAcknowledgmentTypes] = useState<AcknowledgmentType[]>([]);

  const { data: instruction, isLoading } = useQuery({
    queryKey: ['instruction', id],
    queryFn: () => instructionService.getInstruction(id || '', (user?.role as 'patient' | 'provider') ?? 'patient'),
    enabled: !!id,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (types: AcknowledgmentType[]) => {
      // Acknowledge each type
      for (const type of types) {
        await instructionService.acknowledgeInstruction(id || '', type);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruction', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-instructions', user?.id] });
      toast.success('Instruction acknowledged successfully');
      setAcknowledgeDialogOpen(false);
      setSelectedAcknowledgmentTypes([]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to acknowledge instruction');
    },
  });

  const handleAcknowledge = () => {
    if (selectedAcknowledgmentTypes.length === 0) {
      toast.warning('Please select at least one acknowledgment type');
      return;
    }
    acknowledgeMutation.mutate(selectedAcknowledgmentTypes);
  };

  const getTypeIcon = (type: string) => {
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
        return <DescriptionIcon />;
    }
  };

  const isAcknowledged = instruction?.acknowledgedDate || (instruction?.acknowledgments && instruction.acknowledgments.length > 0);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!instruction) {
    return (
      <Box>
        <Alert severity="error">Instruction not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(ROUTES.PATIENT.INSTRUCTIONS)} sx={{ mt: 2 }}>
          Back to Instructions
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={instruction.title}
        backPath={ROUTES.PATIENT.INSTRUCTIONS}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              icon={getTypeIcon(instruction.type)}
              label={INSTRUCTION_TYPES.find((t) => t.value === instruction.type)?.label || instruction.type}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={PRIORITY_LEVELS.find((p) => p.value === instruction.priority)?.label || instruction.priority}
              color={PRIORITY_LEVELS.find((p) => p.value === instruction.priority)?.color as ChipProps['color']}
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
              color={isAcknowledged ? 'success' : 'primary'}
              sx={{ fontWeight: 600 }}
            />
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={() => {
                try {
                  if (!instruction) {
                    toast.warning('Instruction not loaded');
                    return;
                  }
                  exportInstructionPDF(instruction);
                  toast.success('PDF downloaded successfully');
                } catch (error) {
                  console.error('PDF export error:', error);
                  toast.error('Failed to download PDF');
                }
              }}
            >
              Download PDF
            </Button>
         
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Instruction Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                {instruction.content}
              </Typography>

              {/* Medication Details */}
              {instruction.medicationDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicationIcon color="primary" />
                    Medication Information
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: alpha('#2563eb', 0.05) }}>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Medication"
                          secondary={instruction.medicationDetails.name}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Dosage"
                          secondary={`${instruction.medicationDetails.dosage} ${instruction.medicationDetails.unit}`}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Frequency"
                          secondary={instruction.medicationDetails.frequency}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Duration"
                          secondary={instruction.medicationDetails.duration}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      {instruction.medicationDetails.specialInstructions && (
                        <ListItem>
                          <ListItemText
                            primary="Special Instructions"
                            secondary={instruction.medicationDetails.specialInstructions}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      )}
                      {instruction.medicationDetails.sideEffects && (
                        <ListItem>
                          <ListItemText
                            primary="Side Effects to Watch For"
                            secondary={instruction.medicationDetails.sideEffects}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Lifestyle Details */}
              {instruction.lifestyleDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LifestyleIcon color="primary" />
                    Lifestyle Modifications
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: alpha('#10b981', 0.05) }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Category:</strong> {instruction.lifestyleDetails.category.charAt(0).toUpperCase() + instruction.lifestyleDetails.category.slice(1)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {instruction.lifestyleDetails.instructions}
                    </Typography>
                    {instruction.lifestyleDetails.goals && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Goals:
                        </Typography>
                        <Typography variant="body2">{instruction.lifestyleDetails.goals}</Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Follow-Up Details */}
              {instruction.followUpDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FollowUpIcon color="primary" />
                    Follow-Up Requirements
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: alpha('#06b6d4', 0.05) }}>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Appointment Type"
                          secondary={instruction.followUpDetails.appointmentType}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Timeframe"
                          secondary={instruction.followUpDetails.timeframe}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Contact Information"
                          secondary={instruction.followUpDetails.contactInformation}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Warning Details */}
              {instruction.warningDetails && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Warning Signs
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Symptoms to Monitor:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {instruction.warningDetails.symptoms}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      When to Seek Immediate Care:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {instruction.warningDetails.whenToSeekCare}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Emergency Contacts:
                    </Typography>
                    <Typography variant="body2">{instruction.warningDetails.emergencyContacts}</Typography>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Acknowledgment Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Acknowledgment Status
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {isAcknowledged ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    This instruction has been acknowledged
                  </Alert>
                  {instruction.acknowledgments && instruction.acknowledgments.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Acknowledgment Details:
                      </Typography>
                      {instruction.acknowledgments.map((ack) => (
                        <Box key={ack.id} sx={{ mb: 1, p: 1, bgcolor: alpha('#10b981', 0.1), borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {ack.acknowledgmentType.charAt(0).toUpperCase() + ack.acknowledgmentType.slice(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(ack.timestamp), 'MMM dd, yyyy hh:mm a')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Please acknowledge that you have received and understand this instruction.
                  </Alert>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setAcknowledgeDialogOpen(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      },
                    }}
                  >
                    Acknowledge Instruction
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Instruction Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Provider"
                    secondary={instruction.providerName}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Assigned Date"
                    secondary={format(new Date(instruction.assignedDate), 'MMM dd, yyyy')}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                {instruction.acknowledgmentDeadline && (
                  <ListItem>
                    <ListItemText
                      primary="Acknowledgment Deadline"
                      secondary={format(new Date(instruction.acknowledgmentDeadline), 'MMM dd, yyyy')}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                )}
                {instruction.expirationDate && (
                  <ListItem>
                    <ListItemText
                      primary="Expiration Date"
                      secondary={format(new Date(instruction.expirationDate), 'MMM dd, yyyy')}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Acknowledgment Dialog */}
      <Dialog open={acknowledgeDialogOpen} onClose={() => setAcknowledgeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Acknowledge Instruction</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please confirm that you have received and understand this instruction. You can select multiple acknowledgment types.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant={selectedAcknowledgmentTypes.includes('receipt') ? 'contained' : 'outlined'}
              onClick={() => {
                if (selectedAcknowledgmentTypes.includes('receipt')) {
                  setSelectedAcknowledgmentTypes(selectedAcknowledgmentTypes.filter((t) => t !== 'receipt'));
                } else {
                  setSelectedAcknowledgmentTypes([...selectedAcknowledgmentTypes, 'receipt']);
                }
              }}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              I have received this instruction
            </Button>
            <Button
              variant={selectedAcknowledgmentTypes.includes('understanding') ? 'contained' : 'outlined'}
              onClick={() => {
                if (selectedAcknowledgmentTypes.includes('understanding')) {
                  setSelectedAcknowledgmentTypes(selectedAcknowledgmentTypes.filter((t) => t !== 'understanding'));
                } else {
                  setSelectedAcknowledgmentTypes([...selectedAcknowledgmentTypes, 'understanding']);
                }
              }}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              I understand this instruction
            </Button>
            <Button
              variant={selectedAcknowledgmentTypes.includes('commitment') ? 'contained' : 'outlined'}
              onClick={() => {
                if (selectedAcknowledgmentTypes.includes('commitment')) {
                  setSelectedAcknowledgmentTypes(selectedAcknowledgmentTypes.filter((t) => t !== 'commitment'));
                } else {
                  setSelectedAcknowledgmentTypes([...selectedAcknowledgmentTypes, 'commitment']);
                }
              }}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              I commit to following this instruction
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcknowledgeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAcknowledge}
            variant="contained"
            disabled={selectedAcknowledgmentTypes.length === 0 || acknowledgeMutation.isPending}
          >
            {acknowledgeMutation.isPending ? <CircularProgress size={20} /> : 'Confirm Acknowledgment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientInstructionDetail;
