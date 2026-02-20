/**
 * Patient Compliance Page
 * Track medication adherence and lifestyle compliance.
 *
 * Data mapping:
 * - Instructions (from API) = care tasks (e.g. "Take Amoxicillin 3x daily").
 * - Compliance records (from API) = one per instruction, hold logged doses/check-ins.
 * - Match: record = complianceRecords.find(r => r.instructionId === instruction.id).
 * - Medication: record.medicationAdherence has schedule (list of { date, time, status, reason }).
 * - Lifestyle: record.lifestyleCompliance has checkIns (list of { date, completed, notes }).
 * How to mark: Medication = "Log dose" (new) or Edit icon (existing row). Lifestyle = "Update Progress".
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  TextField,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  LocalPharmacy as MedicationIcon,
  FitnessCenter as LifestyleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RootState } from '../../store/store';
import type { ComplianceRecord, ComplianceMetrics } from '../../types/compliance.types';
import { complianceService } from '../../services/complianceService';
import { instructionService } from '../../services/instructionService';
import PageHeader from '../../components/common/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

/** Raw medicationAdherence from API/seed: backend has schedule + overallProgress; seed may have adherencePercentage/totalDoses. */
type MedicationAdherenceInput = {
  schedule?: Array<{ date?: string; time?: string; status?: string; reason?: string }>;
  overallProgress?: number;
  adherencePercentage?: number;
  totalDoses?: number;
};

/** Backend returns medicationAdherence as { schedule, overallProgress }; seed may have adherencePercentage/totalDoses. Normalize for display. */
function normalizeMedicationAdherence(record: { medicationAdherence?: MedicationAdherenceInput } | null | undefined) {
  const ma = record?.medicationAdherence;
  if (!ma) return { schedule: [], adherencePercentage: 0, totalDoses: 0, takenDoses: 0, missedDoses: 0 };
  const schedule = Array.isArray(ma.schedule) ? ma.schedule : [];
  const takenDoses = schedule.filter((s) => s?.status === 'taken').length;
  const missedDoses = schedule.filter((s) => s?.status === 'missed').length;
  const totalDoses = schedule.length;
  const adherencePercentage =
    totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : (ma.overallProgress ?? ma.adherencePercentage ?? 0);
  return {
    schedule,
    adherencePercentage: typeof adherencePercentage === 'number' ? adherencePercentage : ma.overallProgress ?? ma.adherencePercentage ?? 0,
    totalDoses,
    takenDoses,
    missedDoses,
  };
}

const PatientCompliance = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [selectedDose, setSelectedDose] = useState<{ date: string; time: string } | null>(null);
  const [newDoseDate, setNewDoseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newDoseTime, setNewDoseTime] = useState('08:00');
  const [selectedMedicationRecordId, setSelectedMedicationRecordId] = useState<string | null>(null);
  const [doseStatus, setDoseStatus] = useState<'taken' | 'missed'>('taken');
  const [missedReason, setMissedReason] = useState('');
  const [lifestyleDialogOpen, setLifestyleDialogOpen] = useState(false);
  const [selectedLifestyleInstructionId, setSelectedLifestyleInstructionId] = useState<string | null>(null);
  const [selectedLifestyleRecordId, setSelectedLifestyleRecordId] = useState<string | null>(null);
  const [lifestyleProgress, setLifestyleProgress] = useState<number>(0);
  const [lifestyleCompleted, setLifestyleCompleted] = useState<boolean>(true);
  const [lifestyleNotes, setLifestyleNotes] = useState<string>('');

  const { data: instructions, isLoading: instructionsLoading } = useQuery({
    queryKey: ['patient-instructions', user?.id],
    queryFn: () => instructionService.getInstructions(user?.id || '', 'patient'),
    enabled: !!user?.id,
  });

  const { data: complianceRecords, isLoading: complianceLoading } = useQuery({
    queryKey: ['patient-compliance', user?.id],
    queryFn: () => complianceService.getComplianceRecords(user?.id || ''),
    enabled: !!user?.id,
  });

  const { data: complianceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['patient-compliance-metrics', user?.id],
    queryFn: () => complianceService.getComplianceMetrics(user?.id || ''),
    enabled: !!user?.id,
  });

  const updateMedicationMutation = useMutation({
    mutationFn: async ({ recordId, date, time, status, reason }: {
      recordId: string;
      date: string;
      time: string;
      status: 'taken' | 'missed';
      reason?: string;
    }) => {
      await complianceService.updateMedicationAdherence(recordId, date, time, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-compliance', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['patient-compliance-metrics', user?.id] });
      toast.success('Medication dose logged');
      setMedicationDialogOpen(false);
      setSelectedDose(null);
      setNewDoseDate(new Date().toISOString().slice(0, 10));
      setNewDoseTime('08:00');
      setSelectedMedicationRecordId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update adherence');
    },
  });

  const updateLifestyleMutation = useMutation({
    mutationFn: async (payload: { recordId: string; instructionId: string; progress: number; completed: boolean; notes?: string }) => {
      await complianceService.updateLifestyleCompliance(payload.recordId, {
        date: new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10),
        completed: payload.completed,
        notes: payload.notes,
        metrics: { progress: payload.progress },
      });
      return payload;
    },
    onSuccess: (payload) => {
      // Update compliance records cache immediately
      queryClient.setQueryData(['patient-compliance', user?.id], (old: ComplianceRecord[] | undefined) => {
        const prev = Array.isArray(old) ? old : [];
        return prev.map((r: ComplianceRecord) => {
          if (r?.instructionId !== payload.instructionId) return r;
          const lifestyle = r.lifestyleCompliance || { instructionId: payload.instructionId, category: 'lifestyle', progress: 0, milestones: [], checkIns: [] };
          const nextCheckIns = Array.isArray(lifestyle.checkIns)
            ? [
                ...lifestyle.checkIns,
                {
                  date: new Date().toISOString().split('T')[0],
                  completed: payload.completed,
                  notes: payload.notes,
                  metrics: { progress: payload.progress },
                },
              ]
            : [
                {
                  date: new Date().toISOString().split('T')[0],
                  completed: payload.completed,
                  notes: payload.notes,
                  metrics: { progress: payload.progress },
                },
              ];

          return {
            ...r,
            overallPercentage: payload.progress,
            lifestyleCompliance: {
              ...lifestyle,
              progress: payload.progress,
              checkIns: nextCheckIns,
            },
            updatedAt: new Date().toISOString(),
          };
        });
      });

      queryClient.setQueryData(['patient-compliance-metrics', user?.id], (old: ComplianceMetrics | undefined) => {
        if (!old || typeof old !== 'object') return old;
        const medication = typeof old.medicationAdherence === 'number' ? old.medicationAdherence : 0;
        const appointment = typeof old.appointmentCompliance === 'number' ? old.appointmentCompliance : 0;
        const lifestyle = payload.progress;
        const overall = Math.round((medication + lifestyle + appointment) / 3);
        return { ...old, lifestyleCompliance: lifestyle, overallScore: overall };
      });

      toast.success('Lifestyle progress updated');
      setLifestyleDialogOpen(false);
      setSelectedLifestyleInstructionId(null);
      setLifestyleNotes('');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update lifestyle progress');
    },
  });

  const handleUpdateDose = () => {
    if (!selectedMedicationRecordId) return;
    const isNewDose = !selectedDose;
    const date = isNewDose ? newDoseDate : selectedDose!.date;
    const time = isNewDose ? newDoseTime : selectedDose!.time;
    if (!date) return;
    updateMedicationMutation.mutate({
      recordId: selectedMedicationRecordId,
      date,
      time,
      status: doseStatus,
      reason: doseStatus === 'missed' ? missedReason : undefined,
    });
  };

  const medicationInstructions = instructions?.filter((i) => i.type === 'medication' && i.complianceTrackingEnabled) || [];
  const lifestyleInstructions = instructions?.filter((i) => i.type === 'lifestyle' && i.lifestyleTrackingEnabled) || [];

  if (instructionsLoading || complianceLoading || metricsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Compliance Tracking"
        subtitle="Track your medication adherence and lifestyle compliance"
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Each card is a <strong>care instruction</strong> (what to do). The numbers and table come from its{' '}
        <strong>compliance record</strong> (one per instruction). <strong>Medication:</strong> use &quot;Log dose&quot; to
        add a dose, or the pencil icon to edit an existing row. <strong>Lifestyle:</strong> use &quot;Update
        Progress&quot; to log a check-in.
      </Alert>

      {/* Overall Compliance Score */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Overall Compliance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {complianceMetrics?.overallScore || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={complianceMetrics?.overallScore || 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Medication Adherence
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {complianceMetrics?.medicationAdherence || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={complianceMetrics?.medicationAdherence || 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                Lifestyle Compliance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {complianceMetrics?.lifestyleCompliance || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={complianceMetrics?.lifestyleCompliance || 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Trends Chart */}
      {complianceMetrics && complianceMetrics.trends.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Compliance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceMetrics.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Compliance Score']}
                  labelFormatter={(label) => format(parseISO(label), 'MMM dd, yyyy')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={3}
                  name="Compliance Score"
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Medication and Lifestyle */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="Medication Adherence" icon={<MedicationIcon />} iconPosition="start" />
            <Tab label="Lifestyle Compliance" icon={<LifestyleIcon />} iconPosition="start" />
          </Tabs>

          {/* Medication Tab */}
          <TabPanel value={tabValue} index={0}>
            {medicationInstructions.length === 0 ? (
              <Alert severity="info">No medication instructions with compliance tracking enabled.</Alert>
            ) : (
              <Grid container spacing={3}>
                {medicationInstructions.map((instruction) => {
                  const record = complianceRecords?.find((r) => r.instructionId === instruction.id);
                  const adherence = normalizeMedicationAdherence(record);

                  return (
                    <Grid item xs={12} key={instruction.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {instruction.medicationDetails?.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {instruction.medicationDetails?.dosage} {instruction.medicationDetails?.unit} - {instruction.medicationDetails?.frequency}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {adherence.adherencePercentage}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Adherence Rate
                              </Typography>
                            </Box>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={adherence.adherencePercentage}
                            sx={{ height: 10, borderRadius: 5, mb: 2 }}
                          />

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip label={`${adherence.takenDoses} Taken`} color="success" size="small" />
                              <Chip label={`${adherence.missedDoses} Missed`} color="error" size="small" />
                              <Chip label={`${adherence.totalDoses} Total`} color="default" size="small" />
                            </Box>
                            {record?.id && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                  setSelectedMedicationRecordId(record.id);
                                  setSelectedDose(null);
                                  setNewDoseDate(new Date().toISOString().slice(0, 10));
                                  setNewDoseTime('08:00');
                                  setDoseStatus('taken');
                                  setMissedReason('');
                                  setMedicationDialogOpen(true);
                                }}
                              >
                                Log dose
                              </Button>
                            )}
                          </Box>

                          {adherence.schedule.length > 0 && (
                            <TableContainer component={Paper} variant="outlined">
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Time</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {adherence.schedule.map((dose: { date?: string; time?: string; status?: string; reason?: string }, index: number) => (
                                    <TableRow key={index}>
                                      <TableCell>{dose.date ? format(parseISO(dose.date as string), 'MMM dd, yyyy') : '-'}</TableCell>
                                      <TableCell>{dose.time}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={dose.status === 'taken' ? 'Taken' : dose.status === 'missed' ? 'Missed' : 'Pending'}
                                          color={dose.status === 'taken' ? 'success' : dose.status === 'missed' ? 'error' : 'default'}
                                          size="small"
                                          icon={dose.status === 'taken' ? <CheckCircleIcon /> : dose.status === 'missed' ? <CancelIcon /> : undefined}
                                        />
                                      </TableCell>
                                      <TableCell>{dose.reason || '-'}</TableCell>
                                      <TableCell align="right">
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            if (dose.date && dose.time && record?.id) {
                                              setSelectedMedicationRecordId(record.id);
                                              setSelectedDose({ date: dose.date, time: dose.time });
                                              setDoseStatus(dose.status === 'taken' ? 'taken' : dose.status === 'missed' ? 'missed' : 'taken');
                                              setMissedReason(dose.reason || '');
                                              setMedicationDialogOpen(true);
                                            }
                                          }}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>

          {/* Lifestyle Tab */}
          <TabPanel value={tabValue} index={1}>
            {lifestyleInstructions.length === 0 ? (
              <Alert severity="info">No lifestyle instructions with compliance tracking enabled.</Alert>
            ) : (
              <Grid container spacing={3}>
                {lifestyleInstructions.map((instruction) => {
                  const record = complianceRecords?.find((r) => r.instructionId === instruction.id);
                  const lifestyle = record?.lifestyleCompliance;

                  return (
                    <Grid item xs={12} key={instruction.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {instruction.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {instruction.lifestyleDetails?.category
                                  ? instruction.lifestyleDetails.category.charAt(0).toUpperCase() + instruction.lifestyleDetails.category.slice(1)
                                  : 'Lifestyle'}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {lifestyle?.progress || 0}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Progress
                              </Typography>
                            </Box>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={lifestyle?.progress || 0}
                            sx={{ height: 10, borderRadius: 5, mb: 2 }}
                          />

                          {lifestyle && lifestyle.milestones && lifestyle.milestones.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Milestones:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {lifestyle.milestones.map((milestone) => (
                                  <Chip
                                    key={milestone.id}
                                    label={milestone.name}
                                    color={milestone.achieved ? 'success' : 'default'}
                                    icon={milestone.achieved ? <CheckCircleIcon /> : undefined}
                                    size="small"
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}

                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              if (!record) {
                                toast.error('No compliance record found for this instruction');
                                return;
                              }
                              setSelectedLifestyleInstructionId(instruction.id);
                              setSelectedLifestyleRecordId(record.id);
                              setLifestyleProgress(lifestyle?.progress || 0);
                              setLifestyleCompleted(true);
                              setLifestyleNotes('');
                              setLifestyleDialogOpen(true);
                            }}
                          >
                            Update Progress
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Log / Update Medication Dose Dialog */}
      <Dialog
        open={medicationDialogOpen}
        onClose={() => {
          setMedicationDialogOpen(false);
          setSelectedMedicationRecordId(null);
          setSelectedDose(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedDose ? 'Update Medication Dose' : 'Log Medication Dose'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {selectedDose ? (
              <Typography variant="body2" color="text.secondary">
                Date: {format(parseISO(selectedDose.date), 'MMM dd, yyyy')} at {selectedDose.time}
              </Typography>
            ) : (
              <>
                <TextField
                  label="Date"
                  type="date"
                  value={newDoseDate}
                  onChange={(e) => setNewDoseDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Time"
                  type="time"
                  value={newDoseTime}
                  onChange={(e) => setNewDoseTime(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </>
            )}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={doseStatus}
                label="Status"
                onChange={(e) => setDoseStatus(e.target.value as 'taken' | 'missed')}
              >
                <MenuItem value="taken">Taken</MenuItem>
                <MenuItem value="missed">Missed</MenuItem>
              </Select>
            </FormControl>
            {doseStatus === 'missed' && (
              <FormControl fullWidth>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={missedReason}
                  label="Reason"
                  onChange={(e) => setMissedReason(e.target.value)}
                >
                  <MenuItem value="Forgot">Forgot</MenuItem>
                  <MenuItem value="Side effects">Side effects</MenuItem>
                  <MenuItem value="Out of medication">Out of medication</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateDose}
            variant="contained"
            disabled={
              !selectedMedicationRecordId ||
              updateMedicationMutation.isPending ||
              (!selectedDose && (!newDoseDate || !newDoseTime))
            }
          >
            {updateMedicationMutation.isPending ? <CircularProgress size={20} /> : selectedDose ? 'Update' : 'Log dose'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Lifestyle Progress Dialog */}
      <Dialog open={lifestyleDialogOpen} onClose={() => setLifestyleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Lifestyle Progress</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Progress (%)"
              type="number"
              value={lifestyleProgress}
              onChange={(e) => setLifestyleProgress(Math.max(0, Math.min(100, Number(e.target.value))))}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
            />
            <FormControlLabel
              control={<Switch checked={lifestyleCompleted} onChange={(e) => setLifestyleCompleted(e.target.checked)} />}
              label="Completed today"
            />
            <TextField
              label="Notes (optional)"
              value={lifestyleNotes}
              onChange={(e) => setLifestyleNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Alert severity="info">Saving will update your compliance record and refresh the metrics.</Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLifestyleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!selectedLifestyleRecordId || !selectedLifestyleInstructionId) return;
              updateLifestyleMutation.mutate({
                recordId: selectedLifestyleRecordId,
                instructionId: selectedLifestyleInstructionId,
                progress: lifestyleProgress,
                completed: lifestyleCompleted,
                notes: lifestyleNotes.trim() || undefined,
              });
            }}
            disabled={!selectedLifestyleRecordId || !selectedLifestyleInstructionId || updateLifestyleMutation.isPending}
          >
            {updateLifestyleMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientCompliance;
