/**
 * Admin Audit Logs Page
 * View and filter system audit logs
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import PageHeader from '../../components/common/PageHeader';
import { exportAuditLogs } from '../../utils/exportUtils';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const AdminAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { data: auditLogsResult, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', actionFilter, statusFilter, dateRange, page, rowsPerPage],
    queryFn: () =>
      adminService.getAuditLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const auditLogs = auditLogsResult?.data ?? [];
  const totalCount = auditLogsResult?.total ?? 0;

  // Filter logs by search term and status (client-side on current page)
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)));

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    try {
      if (!filteredLogs || filteredLogs.length === 0) {
        toast.warning('No audit logs to export');
        return;
      }
      exportAuditLogs(filteredLogs, 'csv');
      toast.success(`Exported ${filteredLogs.length} audit logs`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export audit logs');
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Audit Logs" subtitle="System activity and security logs" showBack={false} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="System activity and security logs"
        showBack={false}
        action={
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export Logs
          </Button>
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Action</InputLabel>
              <Select value={actionFilter} label="Action" onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}>
                <MenuItem value="all">All Actions</MenuItem>
                {uniqueActions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failure">Failure</MenuItem>
                <MenuItem value="denied">Denied</MenuItem>
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {log.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{log.resourceName || log.resourceId || log.resourceType}</Typography>
                          {log.details?.path != null && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                              {String(log.details.method ?? 'GET')} {String(log.details.path)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={log.status === 'success' ? 'success' : log.status === 'denied' ? 'warning' : 'error'}
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="info">No audit logs found</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            showFirstButton
            showLastButton
          />
        </CardContent>
      </Card>
    </>
  );
};

export default AdminAuditLogs;
