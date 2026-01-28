/**
 * Create Instruction Page
 * Form to create new care instructions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import { patientService } from '../../services/patientService';
import { instructionService } from '../../services/instructionService';
import { ROUTES } from '../../config/routes';
import { INSTRUCTION_TYPES, PRIORITY_LEVELS } from '../../utils/constants';
import type { InstructionType, InstructionPriority } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';

const CreateInstruction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();

  // Check if template data was passed via navigation state
  const templateData = (location.state as { template?: { title: string; type: InstructionType; content: string } })?.template;

  const [formData, setFormData] = useState({
    patientId: '',
    title: templateData?.title || '',
    type: (templateData?.type || 'medication') as InstructionType,
    priority: 'medium' as InstructionPriority,
    content: templateData?.content || '',
    medicationName: '',
    dosage: '',
    unit: 'mg',
    frequency: '',
    duration: '',
    complianceTrackingEnabled: true,
  });


  const { data: patients } = useQuery({
    queryKey: ['provider-patients', user?.id],
    queryFn: () => patientService.getPatients(user?.id || ''),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const selectedPatient = patients?.find((p) => p.id === formData.patientId);
      if (!user) throw new Error('Not authenticated');
      if (!selectedPatient) throw new Error('Please select a patient');

      const now = new Date().toISOString();
      const instructionPayload: any = {
        providerId: user.id,
        providerName: `${user.firstName} ${user.lastName}`,
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        title: formData.title,
        type: formData.type,
        status: 'active',
        priority: formData.priority,
        content: formData.content,
        assignedDate: now,
        complianceTrackingEnabled: formData.complianceTrackingEnabled,
        lifestyleTrackingEnabled: formData.type === 'lifestyle',
        version: 1,
        createdAt: now,
        updatedAt: now,
        medicationDetails:
          formData.type === 'medication'
            ? {
                name: formData.medicationName,
                dosage: formData.dosage,
                unit: formData.unit,
                frequency: formData.frequency,
                duration: formData.duration,
              }
            : undefined,
      };

      return instructionService.createInstruction(instructionPayload);
    },
    onSuccess: (createdInstruction) => {
      // Update cache immediately (mock backend doesn't persist new instructions yet)
      queryClient.setQueryData(['provider-instructions', user?.id], (old: any) => {
        const prev = Array.isArray(old) ? old : [];
        return [createdInstruction, ...prev];
      });
      queryClient.invalidateQueries({ queryKey: ['provider-instructions', user?.id] });
      toast.success('Instruction created successfully');
      navigate(ROUTES.PROVIDER.INSTRUCTIONS);
    },
    onError: () => {
      toast.error('Failed to create instruction');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate();
  };

  const handleCancel = () => {
    navigate(ROUTES.PROVIDER.INSTRUCTIONS);
  };

  return (
    <>
      <PageHeader
        title="Create Care Instruction"
        subtitle="Create a new care instruction for your patient"
      />

      {templateData && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Template "{templateData.title}" has been loaded. Please review and customize the instruction before creating.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Basic Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Select Patient</InputLabel>
                      <Select
                        value={formData.patientId}
                        label="Select Patient"
                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      >
                        {patients?.map((patient) => (
                          <MenuItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} - {patient.medicalRecordNumber}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Instruction Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Post-Surgery Medication Instructions"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Instruction Type</InputLabel>
                      <Select
                        value={formData.type}
                        label="Instruction Type"
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as InstructionType })}
                      >
                        {INSTRUCTION_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        label="Priority"
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as InstructionPriority })}
                      >
                        {PRIORITY_LEVELS.map((priority) => (
                          <MenuItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Instruction Content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      multiline
                      rows={6}
                      placeholder="Provide detailed instructions for the patient..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Medication Details (if type is medication) */}
            {formData.type === 'medication' && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Medication Details
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Medication Name"
                        value={formData.medicationName}
                        onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                        placeholder="e.g., Amoxicillin"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        placeholder="500"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={formData.unit}
                          label="Unit"
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        >
                          <MenuItem value="mg">mg</MenuItem>
                          <MenuItem value="g">g</MenuItem>
                          <MenuItem value="ml">ml</MenuItem>
                          <MenuItem value="tablet">tablet</MenuItem>
                          <MenuItem value="capsule">capsule</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Frequency"
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        placeholder="e.g., Every 8 hours"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 7 days"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Settings Sidebar */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Settings
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.complianceTrackingEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, complianceTrackingEnabled: e.target.checked })
                      }
                    />
                  }
                  label="Enable Compliance Tracking"
                />

                <Alert severity="info" sx={{ mt: 3 }}>
                  Once created, the instruction will be sent to the patient and they will be notified.
                </Alert>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Instruction'}
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default CreateInstruction;
