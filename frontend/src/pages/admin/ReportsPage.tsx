/**
 * Admin Reports Page
 * Generate and view system reports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
  Code as JsonIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import PageHeader from '../../components/common/PageHeader';
import { exportReport } from '../../utils/exportUtils';

const AdminReports = () => {
  const [reportType, setReportType] = useState<string>('compliance');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminService.getAdminReports(),
  });

  // These queries are only used inside handleGenerateReport, so we don't need to declare them here

  const handleGenerateReport = async () => {
    try {
      if (!dateRange.start || !dateRange.end) {
        toast.warning('Please select both start and end dates');
        return;
      }

      let reportData: any[] = [];
      let reportTitle = '';
      const startDateFormatted = format(new Date(dateRange.start), 'MMM dd, yyyy');
      const endDateFormatted = format(new Date(dateRange.end), 'MMM dd, yyyy');

      // Fetch data based on report type
      if (reportType === 'audit') {
        const logs = await adminService.getAuditLogs({
          startDate: new Date(dateRange.start).toISOString(),
          endDate: new Date(dateRange.end + 'T23:59:59').toISOString(),
        });
        reportData = logs.map((log) => ({
          'Timestamp': format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          'User': log.userName,
          'Email': log.userEmail,
          'Action': log.action,
          'Resource Type': log.resourceType,
          'Resource Name': log.resourceName || '-',
          'IP Address': log.ipAddress,
          'Status': log.status,
          'Details': log.details ? JSON.stringify(log.details) : '-',
        }));
        reportTitle = `Audit Report - ${startDateFormatted} to ${endDateFormatted}`;
      } else if (reportType === 'users') {
        const allUsers = await adminService.getAllUsers();
        reportData = allUsers.map((user) => ({
          'User ID': user.id,
          'Name': `${user.firstName} ${user.lastName}`,
          'Email': user.email,
          'Role': user.role,
          'Created At': format(new Date(user.createdAt), 'yyyy-MM-dd'),
          'Permissions': user.permissions.join(', '),
        }));
        reportTitle = `User Activity Report - ${startDateFormatted} to ${endDateFormatted}`;
      } else if (reportType === 'compliance') {
        // For compliance, we'll create a summary report
        const logs = await adminService.getAuditLogs({
          startDate: new Date(dateRange.start).toISOString(),
          endDate: new Date(dateRange.end + 'T23:59:59').toISOString(),
        });
        const complianceActions = logs.filter((log) => log.action.includes('compliance') || log.action.includes('acknowledge'));
        reportData = complianceActions.map((log) => ({
          'Timestamp': format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          'User': log.userName,
          'Action': log.action,
          'Resource': log.resourceName || '-',
          'Status': log.status,
        }));
        reportTitle = `Compliance Report - ${startDateFormatted} to ${endDateFormatted}`;
      } else if (reportType === 'system') {
        // System report - combine multiple data sources
        const logs = await adminService.getAuditLogs({
          startDate: new Date(dateRange.start).toISOString(),
          endDate: new Date(dateRange.end + 'T23:59:59').toISOString(),
        });
        const allUsers = await adminService.getAllUsers();
        
        reportData = [
          {
            'Metric': 'Total Users',
            'Value': allUsers.length,
          },
          {
            'Metric': 'Total Audit Logs',
            'Value': logs.length,
          },
          {
            'Metric': 'Successful Actions',
            'Value': logs.filter((l) => l.status === 'success').length,
          },
          {
            'Metric': 'Failed Actions',
            'Value': logs.filter((l) => l.status === 'failure').length,
          },
          {
            'Metric': 'Date Range',
            'Value': `${startDateFormatted} to ${endDateFormatted}`,
          },
        ];
        reportTitle = `System Report - ${startDateFormatted} to ${endDateFormatted}`;
      }

      if (reportData.length === 0) {
        toast.warning('No data found for the selected criteria');
        return;
      }

      // Create report object
      const generatedReport = {
        id: `report-${Date.now()}`,
        type: reportType as 'compliance' | 'audit' | 'users' | 'system',
        title: reportTitle,
        description: `Generated ${reportType} report for the selected date range`,
        generatedAt: new Date().toISOString(),
        generatedBy: 'current-user',
        dateRange: {
          start: new Date(dateRange.start).toISOString(),
          end: new Date(dateRange.end + 'T23:59:59').toISOString(),
        },
        data: reportData,
        format: 'pdf' as 'pdf' | 'csv' | 'json',
      };

      // Export as PDF (default)
      exportReport(generatedReport, 'pdf');
      toast.success(`Generated and downloaded ${reportType} report`);
      
      // Refresh reports list
      setTimeout(() => refetch(), 500);
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    }
  };

  const handleDownloadReport = (reportId: string, format: 'pdf' | 'csv' | 'json') => {
    try {
      const report = reports?.find(r => r.id === reportId);
      if (!report) {
        toast.error('Report not found');
        return;
      }
      exportReport(report, format);
      toast.success(`Downloaded report as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const getReportIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <PdfIcon />;
      case 'csv':
        return <CsvIcon />;
      case 'json':
        return <JsonIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'compliance':
        return '#10b981';
      case 'audit':
        return '#f59e0b';
      case 'users':
        return '#2563eb';
      case 'system':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Reports" subtitle="Generate and view system reports" showBack={false} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate and view system reports"
        showBack={false}
        action={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* Generate Report Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ReportsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Generate Report
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select value={reportType} label="Report Type" onChange={(e) => setReportType(e.target.value)}>
                    <MenuItem value="compliance">Compliance Report</MenuItem>
                    <MenuItem value="audit">Audit Report</MenuItem>
                    <MenuItem value="users">User Activity Report</MenuItem>
                    <MenuItem value="system">System Report</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  type="date"
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  type="date"
                  label="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ReportsIcon />}
                  onClick={handleGenerateReport}
                  disabled={!dateRange.start || !dateRange.end}
                >
                  Generate Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reports List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ReportsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Generated Reports
                </Typography>
              </Box>

              {reports && reports.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Report</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date Range</TableCell>
                        <TableCell>Generated</TableCell>
                        <TableCell>Format</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {report.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {report.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.type}
                              size="small"
                              sx={{
                                bgcolor: alpha(getReportTypeColor(report.type), 0.1),
                                color: getReportTypeColor(report.type),
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(report.dateRange.start), 'MMM dd')} -{' '}
                              {format(new Date(report.dateRange.end), 'MMM dd, yyyy')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(report.generatedAt), 'MMM dd, yyyy')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getReportIcon(report.format)}
                              label={report.format.toUpperCase()}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadReport(report.id, report.format)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No reports generated yet</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default AdminReports;
