/**
 * Provider Templates Page
 * Manage instruction templates via backend API
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  CircularProgress,
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
import { apiEndpoints } from '../../services/apiEndpoints';
import type { InstructionType } from '../../types/instruction.types';
import PageHeader from '../../components/common/PageHeader';

export type ProviderTemplate = {
  id: string;
  name: string;
  type: InstructionType;
  description?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

const ProviderTemplates = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['provider-templates'],
    queryFn: async () => {
      const res = await apiEndpoints.provider.getTemplates();
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        description: t.description ?? '',
        content: t.content,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { name: string; type: string; description?: string; content: string }) => {
      const res = await apiEndpoints.provider.createTemplate(body);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-templates'] });
      toast.success('Template created');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to create template'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { name: string; type: string; description?: string; content: string } }) => {
      const res = await apiEndpoints.provider.updateTemplate(id, body);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-templates'] });
      toast.success('Template updated');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to update template'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiEndpoints.provider.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-templates'] });
      toast.success('Template deleted');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to delete template'),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'medication' as InstructionType,
    description: '',
    content: '',
  });

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
    setTemplateForm({
      name: '',
      type: 'medication',
      description: '',
      content: '',
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: ProviderTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      description: template.description ?? '',
      content: template.content,
    });
    setDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleUseTemplate = (template: ProviderTemplate) => {
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

  const handleSaveTemplate = () => {
    const name = templateForm.name.trim();
    const description = templateForm.description.trim();
    const content = templateForm.content.trim();

    if (!name || !content) {
      toast.error('Please provide at least a name and content');
      return;
    }

    const body = { name, type: templateForm.type, description: description || undefined, content };

    if (selectedTemplate) {
      updateMutation.mutate(
        { id: selectedTemplate.id, body },
        { onSuccess: () => { setDialogOpen(false); setSelectedTemplate(null); } }
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => { setDialogOpen(false); setSelectedTemplate(null); },
      });
    }
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

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
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
                    {template.content.length > 100 ? `"${template.content.substring(0, 100)}..."` : `"${template.content}"`}
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
              value={templateForm.name}
              onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Post-Surgery Antibiotic"
            />
            <FormControl fullWidth>
              <InputLabel>Instruction Type</InputLabel>
              <Select
                value={templateForm.type}
                label="Instruction Type"
                onChange={(e) => setTemplateForm((p) => ({ ...p, type: e.target.value as InstructionType }))}
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
              value={templateForm.description}
              onChange={(e) => setTemplateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of the template"
            />
            <TextField
              fullWidth
              label="Template Content"
              value={templateForm.content}
              onChange={(e) => setTemplateForm((p) => ({ ...p, content: e.target.value }))}
              multiline
              rows={6}
              placeholder="Enter the instruction content..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={createMutation.isPending || updateMutation.isPending}
            startIcon={
              (createMutation.isPending || updateMutation.isPending) ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
          >
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProviderTemplates;
