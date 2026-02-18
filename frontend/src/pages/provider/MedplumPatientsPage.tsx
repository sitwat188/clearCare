/**
 * Medplum Patients Page
 * Lists FHIR Patients from Medplum
 */

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Avatar,
  Chip,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PatientsIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Badge as IdentifierIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { medplumService } from '../../services/medplumService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';
import type { FhirPatient } from '../../types/medplum.types';

function getDisplayName(p: FhirPatient): string {
  const name = p.name?.[0];
  if (!name) return 'Unknown';
  if (name.text) return name.text;
  const given = name.given?.join(' ') ?? '';
  const family = name.family ?? '';
  return [given, family].filter(Boolean).join(' ') || 'Unknown';
}

function getFirstIdentifier(p: FhirPatient): string | undefined {
  const id = p.identifier?.[0];
  if (!id) return undefined;
  return id.value ?? (id.system ? `${id.system}` : undefined);
}

function getPhone(p: FhirPatient): string | undefined {
  return p.telecom?.find((t) => t.system === 'phone')?.value;
}

const MedplumPatientsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isAdmin = location.pathname.startsWith('/admin');
  // const listRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_PATIENTS : ROUTES.PROVIDER.MEDPLUM_PATIENTS;
  const detailRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_PATIENT_DETAIL : ROUTES.PROVIDER.MEDPLUM_PATIENT_DETAIL;
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);

  const { data: patients, isLoading, error } = useQuery({
    queryKey: ['medplum-patients'],
    queryFn: () => medplumService.getMedplumPatients(),
    staleTime: 60_000, // 1 min – avoid refetch on every focus
  });

  const { data: health } = useQuery({
    queryKey: ['medplum-health'],
    queryFn: () => medplumService.getMedplumHealth(),
    staleTime: 30_000,
  });

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const name = getDisplayName(p).toLowerCase();
      const id = getFirstIdentifier(p)?.toLowerCase() ?? '';
      return name.includes(q) || id.includes(q);
    });
  }, [patients, searchQuery]);

  const handleLoadSamplePatients = async () => {
    setSeeding(true);
    try {
      await medplumService.seedSamplePatients();
      await queryClient.invalidateQueries({ queryKey: ['medplum-patients'] });
      toast.success('Sample patients loaded (or already present).');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load sample patients.');
    } finally {
      setSeeding(false);
    }
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
        title="Medplum Patients"
        subtitle={
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            FHIR patients from Medplum
            {health?.data?.medplum && (
              <Chip
                size="small"
                label={
                  health.data.medplum === 'connected'
                    ? 'Medplum: connected'
                    : health.data.medplum === 'not_configured'
                      ? 'Medplum: not configured'
                      : `Medplum: ${health.data.medplum}`
                }
                color={health.data.medplum === 'connected' ? 'success' : 'default'}
                sx={{ fontWeight: 500 }}
              />
            )}
          </Box>
        }
        action={
          <Button
            variant="contained"
            startIcon={seeding ? null : <AddIcon />}
            disabled={seeding}
            onClick={handleLoadSamplePatients}
          >
            {seeding ? 'Loading…' : 'Load sample patients'}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load Medplum patients. Check that Medplum is configured and you have access.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name or identifier..."
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
        </CardContent>
      </Card>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              {searchQuery ? 'No patients found matching your search' : 'No Medplum patients yet. Create patients in ClearCare (they sync to Medplum) or load sample data to try the list.'}
            </Alert>
            {!searchQuery && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={seeding}
                onClick={handleLoadSamplePatients}
              >
                {seeding ? 'Loading…' : 'Load sample patients'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredPatients.map((p) => {
            const id = p.id ?? '';
            const displayName = getDisplayName(p);
            const identifier = getFirstIdentifier(p);
            const phone = getPhone(p);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: 'primary.main',
                    },
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  onClick={() => navigate(detailRoute(id))}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, minWidth: 0 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          flexShrink: 0,
                          bgcolor: 'primary.main',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                        }}
                      >
                        {displayName[0]?.toUpperCase() || <PatientsIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }} noWrap title={displayName}>
                          {displayName}
                        </Typography>
                        {identifier && (
                          <Tooltip title={identifier} placement="top" enterDelay={300}>
                            <Chip
                              label={identifier}
                              size="small"
                              icon={<IdentifierIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                fontSize: '0.75rem',
                                maxWidth: '100%',
                                '& .MuiChip-label': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                },
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2, minWidth: 0 }}>
                      {phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                          <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary" noWrap title={phone}>
                            {phone}
                          </Typography>
                        </Box>
                      )}
                      {p.birthDate && (
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          DOB: {format(new Date(p.birthDate), 'MMM dd, yyyy')}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 8 }} />
                    <Button
                      fullWidth
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(detailRoute(id));
                      }}
                    >
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

export default MedplumPatientsPage;
