/**
 * Provider Patients Page
 * List of patients assigned to the provider
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PatientsIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { RootState } from '../../store/store';
import { patientService } from '../../services/patientService';
import { ROUTES } from '../../config/routes';
import PageHeader from '../../components/common/PageHeader';

const ProviderPatients = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['provider-patients', user?.id],
    queryFn: () => patientService.getPatients(user?.id || ''),
    enabled: !!user?.id,
  });

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery) return patients;

    const query = searchQuery.toLowerCase();
    return patients.filter((patient) => {
      const name = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const mrn = patient.medicalRecordNumber?.toLowerCase() || '';
      const email = patient.email?.toLowerCase() || '';
      return name.includes(query) || mrn.includes(query) || email.includes(query);
    });
  }, [patients, searchQuery]);

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
        title="My Patients"
        subtitle="View and manage your assigned patients"
        action={
          <Button variant="contained" startIcon={<PatientsIcon />}>
            Add Patient
          </Button>
        }
      />

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search patients by name, MRN, or email..."
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

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {searchQuery ? 'No patients found matching your search' : 'No patients assigned yet'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredPatients.map((patient) => (
            <Grid item xs={12} sm={6} md={4} key={patient.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    borderColor: 'primary.main',
                  },
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                onClick={() => navigate(ROUTES.PROVIDER.PATIENT_DETAIL(patient.id))}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {patient.firstName?.[0] || <PatientsIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }} noWrap>
                        {patient.firstName} {patient.lastName}
                      </Typography>
                      <Chip
                        label={`MRN: ${patient.medicalRecordNumber}`}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {patient.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minWidth: 0 }}>
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {patient.phone}
                      </Typography>
                    </Box>
                    {patient.dateOfBirth && (
                      <Typography variant="caption" color="text.secondary">
                        DOB: {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(ROUTES.PROVIDER.PATIENT_DETAIL(patient.id));
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default ProviderPatients;
