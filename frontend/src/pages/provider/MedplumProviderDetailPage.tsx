/**
 * Medplum Provider (Practitioner) Detail Page
 * Displays one FHIR Practitioner from Medplum
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
  Person as PersonIcon,
} from '@mui/icons-material';
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

function formatAddress(addr: FhirPractitioner['address']): string[] {
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

const MedplumProviderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const listRoute = isAdmin ? ROUTES.ADMIN.MEDPLUM_PROVIDERS : ROUTES.PROVIDER.MEDPLUM_PROVIDERS;

  const { data: practitioner, isLoading, error } = useQuery({
    queryKey: ['medplum-practitioner', id],
    queryFn: () => medplumService.getMedplumPractitioner(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !practitioner) {
    return (
      <>
        <PageHeader title="Medplum Provider" subtitle="Provider details" showBack backPath={listRoute} />
        <Alert severity="error" sx={{ mt: 2 }}>
          Provider not found or you don&apos;t have access.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listRoute)} sx={{ mt: 2 }}>
          Back to Medplum providers
        </Button>
      </>
    );
  }

  const displayName = getDisplayName(practitioner);
  const email = practitioner.telecom?.find((t) => t.system === 'email')?.value;
  const phone = practitioner.telecom?.find((t) => t.system === 'phone')?.value;
  const addresses = formatAddress(practitioner.address);
  const qualifications = practitioner.qualification?.map((q) => q.code?.text ?? q.issuer?.display ?? '—').filter(Boolean) ?? [];

  return (
    <>
      <PageHeader
        title="Medplum Provider"
        subtitle={displayName}
        showBack
        backPath={listRoute}
      />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                  }}
                >
                  {displayName[0]?.toUpperCase() || <PersonIcon />}
                </Avatar>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  {displayName}
                </Typography>
                {practitioner.identifier?.map((id, i) => (
                  <Chip
                    key={i}
                    label={id.value ?? id.system}
                    size="small"
                    sx={{ mt: 1 }}
                    icon={<IdentifierIcon sx={{ fontSize: 16 }} />}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Contact &amp; details
              </Typography>
              <List disablePadding>
                {email && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EmailIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText primary={email} />
                  </ListItem>
                )}
                {phone && (
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PhoneIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText primary={phone} />
                  </ListItem>
                )}
                {addresses.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AddressIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={addresses.map((a, i) => (
                          <Typography key={i} variant="body2" color="text.secondary" component="span" display="block">
                            {a}
                          </Typography>
                        ))}
                      />
                    </ListItem>
                  </>
                )}
                {qualifications.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText
                        primary="Qualification(s)"
                        secondary={qualifications.join(', ')}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listRoute)} sx={{ mt: 2 }}>
        Back to Medplum providers
      </Button>
    </>
  );
};

export default MedplumProviderDetailPage;
