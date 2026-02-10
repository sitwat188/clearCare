/**
 * Medplum Instructions (Tasks) Page
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, Assignment as TaskIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { medplumService } from '../../services/medplumService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';
import type { FhirTask } from '../../types/medplum.types';

function getTaskDescription(t: FhirTask): string {
  return t.description ?? t.code?.text ?? 'No description';
}

function getTaskForDisplay(t: FhirTask): string {
  return t.for?.reference ?? t.for?.display ?? '—';
}

const MedplumInstructionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const detailRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_INSTRUCTION_DETAIL : ROUTES.PROVIDER.MEDPLUM_INSTRUCTION_DETAIL;
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['medplum-tasks'],
    queryFn: () => medplumService.getMedplumTasks(),
    staleTime: 60_000,
  });

  const { data: health } = useQuery({
    queryKey: ['medplum-health'],
    queryFn: () => medplumService.getMedplumHealth(),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!tasks) return [];
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter((t) => {
      const desc = getTaskDescription(t).toLowerCase();
      const forRef = getTaskForDisplay(t).toLowerCase();
      const status = (t.status ?? '').toLowerCase();
      return desc.includes(q) || forRef.includes(q) || status.includes(q);
    });
  }, [tasks, searchQuery]);

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
        title="Medplum Instructions"
        subtitle={
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            FHIR Tasks from Medplum
            {health?.data?.medplum && (
              <Chip
                size="small"
                label={health.data.medplum === 'connected' ? 'Medplum: connected' : `Medplum: ${health.data.medplum}`}
                color={health.data.medplum === 'connected' ? 'success' : 'default'}
                sx={{ fontWeight: 500 }}
              />
            )}
          </Box>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
            ?? (error as Error).message
            ?? 'Could not load Medplum instructions. Check that Medplum is configured and Task read access is enabled for your project.'}
        </Alert>
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by description, status, or patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        </CardContent>
      </Card>
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {searchQuery ? 'No instructions found' : 'No Medplum tasks yet.'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((t) => {
            const id = t.id ?? '';
            const description = getTaskDescription(t);
            const status = t.status ?? 'unknown';
            const forRef = getTaskForDisplay(t);
            const modified = t.lastModified ?? t.authoredOn ?? t.meta?.lastUpdated;
            return (
              <Grid item xs={12} sm={6} md={4} key={id}>
                <Card
                  sx={{ height: '100%', cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }, border: '1px solid', borderColor: 'divider' }}
                  onClick={() => navigate(detailRoute(id))}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <TaskIcon color="action" sx={{ mt: 0.25 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }} noWrap>
                        {description.length > 60 ? description.slice(0, 60) + '…' : description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip label={status} size="small" color={status === 'completed' ? 'success' : status === 'in-progress' ? 'primary' : 'default'} />
                    </Box>
                    {forRef !== '—' && <Typography variant="caption" color="text.secondary" display="block">For: {forRef}</Typography>}
                    {modified && <Typography variant="caption" color="text.secondary" display="block">Updated: {format(new Date(modified), 'MMM d, yyyy')}</Typography>}
                    <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />} sx={{ mt: 2 }} onClick={(e) => { e.stopPropagation(); navigate(detailRoute(id)); }}>View Details</Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
};

export default MedplumInstructionsPage;
