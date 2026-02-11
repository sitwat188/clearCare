/**
 * Medplum Instruction (Task) Detail Page - Displays one FHIR Task from Medplum
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Assignment as TaskIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { medplumService } from '../../services/medplumService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const MedplumInstructionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const listRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_INSTRUCTIONS : ROUTES.PROVIDER.MEDPLUM_INSTRUCTIONS;

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['medplum-task', id],
    queryFn: () => medplumService.getMedplumTask(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !task) {
    return (
      <>
        <PageHeader title="Medplum Instruction" subtitle="Task details" showBack backPath={listRoute} />
        <Alert severity="error" sx={{ mt: 2 }}>
          Instruction not found or you don&apos;t have access.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listRoute)} sx={{ mt: 2 }}>
          Back to Medplum instructions
        </Button>
      </>
    );
  }

  const description = task.description ?? task.code?.text ?? 'No description';
  const status = task.status ?? 'unknown';
  const forRef = task.for?.reference ?? task.for?.display;
  const ownerRef = task.owner?.reference ?? task.owner?.display;
  const period = task.executionPeriod;
  const authoredOn = task.authoredOn;
  const lastModified = task.lastModified ?? task.meta?.lastUpdated;

  return (
    <>
      <PageHeader title="Medplum Instruction" subtitle={description.length > 50 ? description.slice(0, 50) + '…' : description} showBack backPath={listRoute} />
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TaskIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {description}
            </Typography>
            <Chip label={status} color={status === 'completed' ? 'success' : status === 'in-progress' ? 'primary' : 'default'} />
            {task.intent && <Chip label={task.intent} variant="outlined" size="small" />}
          </Box>
          <Divider sx={{ my: 2 }} />
          <List disablePadding>
            {forRef && (
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary="For (patient)" secondary={forRef} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            )}
            {ownerRef && (
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary="Owner" secondary={ownerRef} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            )}
            {period?.start && (
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary="Execution period" secondary={`${period.start}${period.end ? ` – ${period.end}` : ''}`} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            )}
            {authoredOn && (
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary="Authored" secondary={format(new Date(authoredOn), 'PPpp')} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            )}
            {lastModified && (
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary="Last modified" secondary={format(new Date(lastModified), 'PPpp')} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listRoute)}>
        Back to Medplum instructions
      </Button>
    </>
  );
};

export default MedplumInstructionDetailPage;
