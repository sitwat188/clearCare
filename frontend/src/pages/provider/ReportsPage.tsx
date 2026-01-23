/**
 * Provider Reports Page
 * Generate and view compliance reports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import type { RootState } from '../../store/store';
import { patientService } from '../../services/patientService';
import { instructionService } from '../../services/instructionService';
import PageHeader from '../../components/common/PageHeader';

const ProviderReports = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [reportType, setReportType] = useState('compliance');
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [startDate, setStartDate] = useState<Date | null>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['provider-patients', user?.id],
    queryFn: () => patientService.getPatients(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: instructions, isLoading: instructionsLoading } = useQuery({
    queryKey: ['provider-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'provider'),
    enabled: !!user?.id,
  });

  const handleGenerateReport = (format: 'pdf' | 'csv') => {
    // Simulate report generation
    toast.success(`Generating ${format.toUpperCase()} report...`);
  };

  if (patientsLoading || instructionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate compliance and instruction reports"
      />

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Report Configuration
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <MenuItem value="compliance">Compliance Report</MenuItem>
                    <MenuItem value="instructions">Instructions Report</MenuItem>
                    <MenuItem value="acknowledgments">Acknowledgment Report</MenuItem>
                    <MenuItem value="summary">Summary Report</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    value={selectedPatient}
                    label="Patient"
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <MenuItem value="all">All Patients</MenuItem>
                    {patients?.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PdfIcon />}
                    onClick={() => handleGenerateReport('pdf')}
                  >
                    Generate PDF Report
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CsvIcon />}
                    onClick={() => handleGenerateReport('csv')}
                  >
                    Generate CSV Report
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Preview/Summary */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Report Summary
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Select report parameters and click "Generate Report" to create a detailed report.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Total Instructions
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {instructions?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Acknowledged Instructions
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {instructions?.filter((i) => i.acknowledgedDate).length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Active Instructions
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {instructions?.filter((i) => i.status === 'active').length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Total Patients
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {patients?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ProviderReports;
