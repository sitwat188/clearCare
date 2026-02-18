/**
 * Medplum Providers (Practitioners) Page - Lists FHIR Practitioners from Medplum
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
  Avatar,
  Chip,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon, ArrowForward as ArrowForwardIcon, Phone as PhoneIcon, Badge as IdentifierIcon } from '@mui/icons-material';
import { medplumService } from '../../services/medplumService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';
import type { FhirPractitioner } from '../../types/medplum.types';

function getDisplayName(p: FhirPractitioner): string {
  const name = p.name?.[0];
  if (!name) return 'Unknown';
  if (name.text) return name.text;
  const given = name.given?.join(' ') ?? '';
  const family = name.family ?? '';
  return [given, family].filter(Boolean).join(' ') || 'Unknown';
}

function getFirstIdentifier(p: FhirPractitioner): string | undefined {
  const id = p.identifier?.[0];
  return id?.value ?? (id?.system ? `${id.system}` : undefined);
}

function getPhone(p: FhirPractitioner): string | undefined {
  return p.telecom?.find((t) => t.system === 'phone')?.value;
}

const MedplumProvidersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const detailRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_PROVIDER_DETAIL : ROUTES.PROVIDER.MEDPLUM_PROVIDER_DETAIL;
  const [searchQuery, setSearchQuery] = useState('');

  const { data: practitioners, isLoading, error } = useQuery({
    queryKey: ['medplum-practitioners'],
    queryFn: () => medplumService.getMedplumPractitioners(),
    staleTime: 60_000,
  });

  const { data: health } = useQuery({
    queryKey: ['medplum-health'],
    queryFn: () => medplumService.getMedplumHealth(),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!practitioners) return [];
    if (!searchQuery.trim()) return practitioners;
    const q = searchQuery.toLowerCase();
    return practitioners.filter((p) => {
      const name = getDisplayName(p).toLowerCase();
      const id = getFirstIdentifier(p)?.toLowerCase() ?? '';
      return name.includes(q) || id.includes(q);
    });
  }, [practitioners, searchQuery]);

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
        title="Medplum Providers"
        subtitle={
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            FHIR Practitioners from Medplum
            {health?.data?.medplum && (
              <Chip
                size="small"
                label={health.data.medplum === 'connected' ? 'Medplum: connected' : health.data.medplum === 'not_configured' ? 'Medplum: not configured' : `Medplum: ${health.data.medplum}`}
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
            ?? 'Could not load Medplum providers. Check that Medplum is configured and Practitioner read access is enabled for your project.'}
        </Alert>
      )}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name or identifier..."
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
              {searchQuery ? 'No providers found matching your search' : 'No Medplum practitioners yet. Create practitioners in Medplum to see them here.'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((p) => {
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
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'primary.main' },
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
                        {displayName[0]?.toUpperCase() || <PersonIcon />}
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
                    {phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minWidth: 0 }}>
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" noWrap title={phone}>
                          {phone}
                        </Typography>
                      </Box>
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

export default MedplumProvidersPage;
