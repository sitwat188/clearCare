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
  Tooltip,
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
              <Grid item xs={12} sm={6} md={4} lg={3} key={id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'primary.main' },
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  onClick={() => navigate(detailRoute(id))}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, minWidth: 0 }}>
                      <TaskIcon color="action" sx={{ mt: 0.25, flexShrink: 0 }} />
                      <Tooltip title={description} placement="top" enterDelay={300}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
                          {description}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minWidth: 0 }}>
                      <Chip
                        label={status}
                        size="small"
                        color={status === 'completed' ? 'success' : status === 'in-progress' ? 'primary' : 'default'}
                        sx={{
                          maxWidth: '100%',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    </Box>
                    {forRef !== '—' && (
                      <Tooltip title={forRef} placement="top" enterDelay={300}>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 0.5 }}>
                          For: {forRef}
                        </Typography>
                      </Tooltip>
                    )}
                    {modified && (
                      <Typography variant="caption" color="text.secondary" display="block" component="span">
                        Updated: {format(new Date(modified), 'MMM d, yyyy')}
                      </Typography>
                    )}
                    <Box sx={{ flex: 1, minHeight: 8 }} />
                    <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />} onClick={(e) => { e.stopPropagation(); navigate(detailRoute(id)); }}>
                      View Details
                    </Button>
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
