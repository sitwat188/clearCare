/**
 * Medplum Patient Detail Page
 * Displays one FHIR Patient from Medplum
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as IdentifierIcon,
  LocationOn as AddressIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
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

function formatAddress(addr: FhirPatient['address']): string[] {
  if (!addr?.length) return [];
  return addr.map((a) => {
    const parts = [
      a.line?.join(', '),
      [a.city, a.state].filter(Boolean).join(', '),
      a.postalCode,
      a.country,
    ].filter(Boolean);
    return parts.join(' ');
  });
}

const MedplumPatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const listRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_PATIENTS : ROUTES.PROVIDER.MEDPLUM_PATIENTS;

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['medplum-patient', id],
    queryFn: () => medplumService.getMedplumPatient(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <>
        <PageHeader title="Medplum Patient" subtitle="Patient details" showBack backPath={listRoute} />
        <Alert severity="error" sx={{ mt: 2 }}>
          Patient not found or you don&apos;t have access.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listRoute)} sx={{ mt: 2 }}>
          Back to Medplum patients
        </Button>
      </>
    );
  }

  const displayName = getDisplayName(patient);
  const email = patient.telecom?.find((t) => t.system === 'email')?.value;
  const phone = patient.telecom?.find((t) => t.system === 'phone')?.value;
  const addresses = formatAddress(patient.address);

  return (
    <>
      <PageHeader
        title="Medplum Patient Details"
        subtitle={displayName}
        showBack
        backPath={listRoute}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {displayName.slice(0, 2).toUpperCase()}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {displayName}
                </Typography>
                {patient.id && (
                  <Chip label={`FHIR ID: ${patient.id}`} size="small" sx={{ mb: 2 }} icon={<IdentifierIcon sx={{ fontSize: 16 }} />} />
                )}
                <Box sx={{ width: '100%', textAlign: 'left' }}>
                  {email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {email}
                      </Typography>
                    </Box>
                  )}
                  {phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {phone}
                      </Typography>
                    </Box>
                  )}
                  {patient.birthDate && (
                    <Typography variant="caption" color="text.secondary">
                      DOB: {format(new Date(patient.birthDate), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                  {patient.gender && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Gender: {patient.gender}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Identifiers
              </Typography>
              {patient.identifier?.length ? (
                <List dense>
                  {patient.identifier.map((id, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={id.value}
                        secondary={id.system ?? id.type?.text}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">None</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Addresses
              </Typography>
              {addresses.length ? (
                <List dense>
                  {addresses.map((line, i) => (
                    <ListItem key={i}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AddressIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText primary={line} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">None</Typography>
              )}

              {patient.meta?.lastUpdated && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {format(new Date(patient.meta.lastUpdated), 'PPpp')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default MedplumPatientDetailPage;
