/**
 * Provider Templates Page
 * Manage instruction templates
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  LocalPharmacy as MedicationIcon,
  FitnessCenter as LifestyleIcon,
  Event as FollowUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { INSTRUCTION_TYPES } from '../../utils/constants';
import { ROUTES } from '../../config/routes';
import type { InstructionType } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';

// Mock templates
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Post-Surgery Antibiotic',
    type: 'medication' as InstructionType,
    description: 'Standard post-surgery antibiotic protocol',
    content: 'Take the prescribed antibiotic as directed to prevent infection.',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Low-Sodium Diet',
    type: 'lifestyle' as InstructionType,
    description: 'Dietary restrictions for hypertension',
    content: 'Follow a low-sodium diet to help manage blood pressure.',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'template-3',
    name: 'Follow-Up Appointment',
    type: 'follow-up' as InstructionType,
    description: 'Standard follow-up appointment reminder',
    content: 'Please schedule a follow-up appointment within 2 weeks.',
    createdAt: '2024-01-05T10:00:00Z',
  },
];

const ProviderTemplates = () => {
  const navigate = useNavigate();
  const [templates] = useState(mockTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof mockTemplates[0] | null>(null);

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
        return null;
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: typeof mockTemplates[0]) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    toast.success('Template deleted');
  };

  const handleUseTemplate = (template: typeof mockTemplates[0]) => {
    // Navigate to create instruction page with template data
    navigate(ROUTES.PROVIDER.CREATE_INSTRUCTION, {
      state: {
        template: {
          title: template.name,
          type: template.type,
          content: template.content,
        },
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Instruction Templates"
        subtitle="Create and manage reusable instruction templates"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTemplate}>
            Create Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">No templates created yet. Create your first template to get started.</Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(template.type)}
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {template.name}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTemplate(template)}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Chip
                    label={INSTRUCTION_TYPES.find((t) => t.value === template.type)?.label || template.type}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                    "{template.content.substring(0, 100)}..."
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Created: {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CopyIcon />}
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Template Name"
              defaultValue={selectedTemplate?.name || ''}
              placeholder="e.g., Post-Surgery Antibiotic"
            />
            <FormControl fullWidth>
              <InputLabel>Instruction Type</InputLabel>
              <Select
                defaultValue={selectedTemplate?.type || 'medication'}
                label="Instruction Type"
              >
                {INSTRUCTION_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              defaultValue={selectedTemplate?.description || ''}
              placeholder="Brief description of the template"
            />
            <TextField
              fullWidth
              label="Template Content"
              defaultValue={selectedTemplate?.content || ''}
              multiline
              rows={6}
              placeholder="Enter the instruction content..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            toast.success(selectedTemplate ? 'Template updated' : 'Template created');
            setDialogOpen(false);
          }}>
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProviderTemplates;
