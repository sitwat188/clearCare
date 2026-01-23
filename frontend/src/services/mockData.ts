/**
 * Mock data service with encrypted PHI fields
 * This simulates backend data for development
 */

import { encryptPHI, decryptPHI, PHI_FIELDS } from '../utils/encryption';
import type { User } from '../types/auth.types';
import type { CareInstruction } from '../types/instruction.types';
import type { Patient } from '../types/patient.types';
import type { ComplianceRecord, ComplianceMetrics } from '../types/compliance.types';
import type { Notification } from '../types/notification.types';
import type { Role, AuditLog, SystemSettings, AdminReport } from '../types/admin.types';

// Mock users with encrypted PHI
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'patient1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'patient',
    permissions: ['read:own-instructions', 'write:own-acknowledgment', 'read:own-compliance'],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'provider1@example.com',
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    role: 'provider',
    permissions: ['read:patients', 'write:instructions', 'read:compliance'],
    organizationId: 'org-1',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user-3',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'administrator',
    permissions: ['admin:users', 'admin:roles', 'admin:audit'],
    organizationId: 'org-1',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'user-4',
    email: 'sarah.patient@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'patient',
    permissions: ['read:own-instructions', 'write:own-acknowledgment', 'read:own-compliance'],
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'user-5',
    email: 'robert.patient@example.com',
    firstName: 'Robert',
    lastName: 'Williams',
    role: 'patient',
    permissions: ['read:own-instructions', 'write:own-acknowledgment', 'read:own-compliance'],
    createdAt: '2024-01-25T10:00:00Z',
  },
];

// Mock patients with encrypted PHI
const mockPatientsRaw: Patient[] = [
  {
    id: 'patient-1',
    userId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1985-05-15',
    email: 'patient1@example.com',
    phone: '555-0101',
    medicalRecordNumber: 'MRN-001234',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '555-0102',
    },
    assignedProviderIds: ['user-2'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'patient-2',
    userId: 'user-4',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: '1990-08-22',
    email: 'sarah.johnson@example.com',
    phone: '555-0201',
    medicalRecordNumber: 'MRN-002345',
    address: {
      street: '456 Oak Avenue',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
    },
    emergencyContact: {
      name: 'Michael Johnson',
      relationship: 'Husband',
      phone: '555-0202',
    },
    assignedProviderIds: ['user-2'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'patient-3',
    userId: 'user-5',
    firstName: 'Robert',
    lastName: 'Williams',
    dateOfBirth: '1978-12-05',
    email: 'robert.williams@example.com',
    phone: '555-0301',
    medicalRecordNumber: 'MRN-003456',
    address: {
      street: '789 Elm Street',
      city: 'Peoria',
      state: 'IL',
      zipCode: '61601',
    },
    emergencyContact: {
      name: 'Mary Williams',
      relationship: 'Wife',
      phone: '555-0302',
    },
    assignedProviderIds: ['user-2'],
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
  },
];

// Encrypt PHI fields in patients
export const mockPatients: Patient[] = mockPatientsRaw.map(patient => {
  const encrypted = { ...patient };
  PHI_FIELDS.PATIENT.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptPHI(encrypted[field] as string) as any;
    }
  });
  return encrypted;
});

// Helper to decrypt patient for display
export const getDecryptedPatient = (patient: Patient): Patient => {
  const decrypted = { ...patient };
  PHI_FIELDS.PATIENT.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decryptPHI(decrypted[field] as string) as any;
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
      }
    }
  });
  return decrypted;
};

// Mock instructions
export const mockInstructions: CareInstruction[] = [
  {
    id: 'inst-1',
    providerId: 'user-2',
    providerName: 'Dr. Jane Smith',
    patientId: 'patient-1',
    patientName: 'John Doe',
    title: 'Post-Surgery Medication Instructions',
    type: 'medication',
    status: 'active',
    priority: 'high',
    content: 'Please take the prescribed medications as directed. This is important for your recovery.',
    medicationDetails: {
      name: 'Amoxicillin',
      dosage: '500',
      unit: 'mg',
      frequency: 'Every 8 hours',
      duration: '7 days',
      specialInstructions: 'Take with food to reduce stomach upset',
      refillInformation: 'No refills needed',
      sideEffects: 'May cause nausea or diarrhea. Contact your doctor if severe.',
    },
    assignedDate: '2024-01-20T10:00:00Z',
    acknowledgmentDeadline: '2024-01-22T10:00:00Z',
    complianceTrackingEnabled: true,
    lifestyleTrackingEnabled: false,
    version: 1,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'inst-2',
    providerId: 'user-2',
    providerName: 'Dr. Jane Smith',
    patientId: 'patient-1',
    patientName: 'John Doe',
    title: 'Dietary Restrictions',
    type: 'lifestyle',
    status: 'acknowledged',
    priority: 'medium',
    content: 'Follow a low-sodium diet to help manage your blood pressure.',
    lifestyleDetails: {
      category: 'diet',
      instructions: 'Limit sodium intake to less than 2000mg per day. Avoid processed foods.',
      goals: 'Maintain blood pressure below 140/90',
      milestones: ['Week 1: Track all meals', 'Week 2: Reduce processed foods by 50%'],
      trackingRequirements: 'Daily meal logging',
    },
    assignedDate: '2024-01-18T10:00:00Z',
    acknowledgedDate: '2024-01-19T14:30:00Z',
    acknowledgments: [
      {
        id: 'ack-1',
        instructionId: 'inst-2',
        patientId: 'patient-1',
        acknowledgmentType: 'receipt',
        timestamp: '2024-01-19T14:30:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
      {
        id: 'ack-2',
        instructionId: 'inst-2',
        patientId: 'patient-1',
        acknowledgmentType: 'understanding',
        timestamp: '2024-01-19T14:31:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
    ],
    complianceTrackingEnabled: true,
    lifestyleTrackingEnabled: true,
    version: 1,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-19T14:31:00Z',
  },
  {
    id: 'inst-3',
    providerId: 'user-2',
    providerName: 'Dr. Jane Smith',
    patientId: 'patient-1',
    patientName: 'John Doe',
    title: 'Follow-Up Appointment Required',
    type: 'follow-up',
    status: 'completed',
    priority: 'medium',
    content: 'Please schedule a follow-up appointment within 2 weeks to review your progress.',
    followUpDetails: {
      appointmentType: 'Follow-up Consultation',
      timeframe: 'Within 2 weeks',
      preparationInstructions: 'Bring your medication list and any questions',
      contactInformation: 'Call (555) 123-4567 to schedule',
    },
    assignedDate: '2024-01-10T10:00:00Z',
    acknowledgedDate: '2024-01-11T09:00:00Z',
    acknowledgments: [
      {
        id: 'ack-3',
        instructionId: 'inst-3',
        patientId: 'patient-1',
        acknowledgmentType: 'receipt',
        timestamp: '2024-01-11T09:00:00Z',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
    ],
    complianceTrackingEnabled: false,
    lifestyleTrackingEnabled: false,
    version: 1,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-11T09:00:00Z',
  },
  {
    id: 'inst-4',
    providerId: 'user-2',
    providerName: 'Dr. Jane Smith',
    patientId: 'patient-2',
    patientName: 'Sarah Johnson',
    title: 'Hypertension Medication',
    type: 'medication',
    status: 'active',
    priority: 'high',
    content: 'Take your blood pressure medication daily as prescribed.',
    medicationDetails: {
      name: 'Lisinopril',
      dosage: '10',
      unit: 'mg',
      frequency: 'Once daily',
      duration: 'Ongoing',
      specialInstructions: 'Take in the morning with or without food',
      refillInformation: 'Refills available',
      sideEffects: 'May cause dizziness. Contact your doctor if severe.',
    },
    assignedDate: '2024-01-22T10:00:00Z',
    acknowledgmentDeadline: '2024-01-24T10:00:00Z',
    complianceTrackingEnabled: true,
    lifestyleTrackingEnabled: false,
    version: 1,
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
  },
  {
    id: 'inst-5',
    providerId: 'user-2',
    providerName: 'Dr. Jane Smith',
    patientId: 'patient-3',
    patientName: 'Robert Williams',
    title: 'Exercise Regimen',
    type: 'lifestyle',
    status: 'active',
    priority: 'medium',
    content: 'Follow the prescribed exercise routine to improve cardiovascular health.',
    lifestyleDetails: {
      category: 'exercise',
      instructions: 'Walk 30 minutes daily, 5 days per week. Gradually increase intensity.',
      goals: 'Improve cardiovascular fitness and reduce risk factors',
      milestones: ['Week 1: Establish routine', 'Week 4: Increase duration to 45 minutes'],
      trackingRequirements: 'Daily exercise logging',
    },
    assignedDate: '2024-01-26T10:00:00Z',
    acknowledgmentDeadline: '2024-01-28T10:00:00Z',
    complianceTrackingEnabled: true,
    lifestyleTrackingEnabled: true,
    version: 1,
    createdAt: '2024-01-26T10:00:00Z',
    updatedAt: '2024-01-26T10:00:00Z',
  },
];

// Mock compliance records
export const mockComplianceRecords: ComplianceRecord[] = [
  {
    id: 'comp-1',
    instructionId: 'inst-1',
    patientId: 'patient-1',
    type: 'medication',
    status: 'compliant',
    overallPercentage: 95,
    medicationAdherence: {
      instructionId: 'inst-1',
      medicationName: 'Amoxicillin',
      schedule: [
        { date: '2024-01-20', time: '08:00', status: 'taken' },
        { date: '2024-01-20', time: '16:00', status: 'taken' },
        { date: '2024-01-20', time: '00:00', status: 'taken' },
        { date: '2024-01-21', time: '08:00', status: 'taken' },
        { date: '2024-01-21', time: '16:00', status: 'missed', reason: 'Forgot' },
        { date: '2024-01-21', time: '00:00', status: 'taken' },
      ],
      adherencePercentage: 95,
      totalDoses: 20,
      takenDoses: 19,
      missedDoses: 1,
    },
    updatedAt: '2024-01-21T10:00:00Z',
    lastUpdatedBy: 'patient-1',
  },
  {
    id: 'comp-2',
    instructionId: 'inst-2',
    patientId: 'patient-1',
    type: 'lifestyle',
    status: 'compliant',
    overallPercentage: 88,
    lifestyleCompliance: {
      instructionId: 'inst-2',
      category: 'diet',
      progress: 88,
      milestones: [
        { id: 'm1', name: 'Week 1: Track all meals', achieved: true, achievedDate: '2024-01-20' },
        { id: 'm2', name: 'Week 2: Reduce processed foods by 50%', achieved: true, achievedDate: '2024-01-27' },
        { id: 'm3', name: 'Week 3: Maintain low-sodium diet', achieved: false },
      ],
      checkIns: [
        { date: '2024-01-20', completed: true, notes: 'Tracking meals daily' },
        { date: '2024-01-21', completed: true, notes: 'Feeling good' },
        { date: '2024-01-22', completed: true },
      ],
    },
    updatedAt: '2024-01-22T10:00:00Z',
    lastUpdatedBy: 'patient-1',
  },
];

// Mock compliance metrics
export const mockComplianceMetrics: ComplianceMetrics = {
  patientId: 'patient-1',
  overallScore: 92,
  medicationAdherence: 95,
  lifestyleCompliance: 88,
  appointmentCompliance: 100,
  activeInstructions: 2,
  compliantInstructions: 2,
  trends: [
    { date: '2024-01-15', score: 85 },
    { date: '2024-01-16', score: 87 },
    { date: '2024-01-17', score: 89 },
    { date: '2024-01-18', score: 90 },
    { date: '2024-01-19', score: 91 },
    { date: '2024-01-20', score: 92 },
    { date: '2024-01-21', score: 92 },
  ],
};

// Mock roles
const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Patient',
    description: 'Standard patient role with access to own instructions and compliance data',
    permissions: ['read:own-instructions', 'write:own-acknowledgment', 'read:own-compliance', 'write:own-compliance', 'read:own-profile', 'write:own-profile'],
    isSystemRole: true,
    userCount: 3,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'role-2',
    name: 'Healthcare Provider',
    description: 'Medical professionals who can create instructions and view patient data',
    permissions: ['read:patients', 'read:instructions', 'write:instructions', 'read:compliance', 'read:reports', 'write:templates', 'read:own-audit'],
    isSystemRole: true,
    userCount: 1,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'role-3',
    name: 'Administrator',
    description: 'Full system access for user management, roles, and system configuration',
    permissions: ['admin:users', 'admin:roles', 'admin:system', 'admin:audit', 'admin:reports', 'admin:organizations'],
    isSystemRole: true,
    userCount: 1,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'role-4',
    name: 'Nurse Practitioner',
    description: 'Extended provider role with additional patient management capabilities',
    permissions: ['read:patients', 'read:instructions', 'write:instructions', 'read:compliance', 'read:reports'],
    isSystemRole: false,
    userCount: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userEmail: 'patient1@example.com',
    userName: 'John Doe',
    action: 'login',
    resourceType: 'auth',
    resourceId: 'session-1',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: 'audit-2',
    userId: 'user-1',
    userEmail: 'patient1@example.com',
    userName: 'John Doe',
    action: 'acknowledge_instruction',
    resourceType: 'instruction',
    resourceId: 'inst-1',
    resourceName: 'Post-Surgery Medication Instructions',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    details: { acknowledgmentType: 'receipt' },
  },
  {
    id: 'audit-3',
    userId: 'user-2',
    userEmail: 'provider1@example.com',
    userName: 'Dr. Jane Smith',
    action: 'create_instruction',
    resourceType: 'instruction',
    resourceId: 'inst-2',
    resourceName: 'Dietary Restrictions',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    details: { patientId: 'patient-1', instructionType: 'lifestyle' },
  },
  {
    id: 'audit-4',
    userId: 'user-3',
    userEmail: 'admin@example.com',
    userName: 'Admin User',
    action: 'update_user',
    resourceType: 'user',
    resourceId: 'user-1',
    resourceName: 'John Doe',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    details: { changes: ['email', 'permissions'] },
  },
  {
    id: 'audit-5',
    userId: 'unknown',
    userEmail: 'unknown@example.com',
    userName: 'Unknown User',
    action: 'login',
    resourceType: 'auth',
    resourceId: 'failed-session-1',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'failure',
    details: { reason: 'Invalid credentials' },
  },
  {
    id: 'audit-6',
    userId: 'user-2',
    userEmail: 'provider1@example.com',
    userName: 'Dr. Jane Smith',
    action: 'view_patient',
    resourceType: 'patient',
    resourceId: 'patient-1',
    resourceName: 'John Doe',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: 'audit-7',
    userId: 'user-3',
    userEmail: 'admin@example.com',
    userName: 'Admin User',
    action: 'export_report',
    resourceType: 'report',
    resourceId: 'report-1',
    resourceName: 'Compliance Report - January 2024',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    details: { format: 'pdf', recordCount: 150 },
  },
  {
    id: 'audit-8',
    userId: 'user-1',
    userEmail: 'patient1@example.com',
    userName: 'John Doe',
    action: 'update_compliance',
    resourceType: 'compliance',
    resourceId: 'comp-1',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'success',
    details: { medicationAdherence: 95 },
  },
];

// Mock system settings
const mockSystemSettings: SystemSettings = {
  sessionTimeout: 30, // minutes
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expirationDays: 90,
  },
  notificationSettings: {
    emailEnabled: true,
    smsEnabled: false,
    defaultNotificationTypes: ['instruction_assigned', 'acknowledgment_required', 'compliance_alert'],
  },
  dataRetention: {
    auditLogsDays: 365,
    complianceRecordsDays: 730,
    archivedInstructionsDays: 1095,
  },
  featureFlags: {
    smsNotifications: false,
    advancedAnalytics: true,
    templateSharing: true,
    bulkOperations: true,
  },
};

// Mock admin reports
const mockAdminReports: AdminReport[] = [
  {
    id: 'report-1',
    type: 'compliance',
    title: 'Monthly Compliance Report - January 2024',
    description: 'Overall compliance metrics for all patients',
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    generatedBy: 'user-3',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31',
    },
    data: {
      totalPatients: 3,
      averageCompliance: 87.5,
      medicationAdherence: 92.3,
      lifestyleCompliance: 85.2,
      appointmentCompliance: 88.9,
    },
    format: 'pdf',
  },
  {
    id: 'report-2',
    type: 'audit',
    title: 'Security Audit Report - January 2024',
    description: 'Security events and access patterns',
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    generatedBy: 'user-3',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31',
    },
    data: {
      totalLogins: 245,
      failedLogins: 12,
      suspiciousActivities: 2,
      dataExports: 8,
    },
    format: 'csv',
  },
  {
    id: 'report-3',
    type: 'users',
    title: 'User Activity Report - January 2024',
    description: 'User engagement and activity metrics',
    generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    generatedBy: 'user-3',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31',
    },
    data: {
      activeUsers: 5,
      newUsers: 2,
      inactiveUsers: 0,
      averageSessionDuration: 25.5,
    },
    format: 'json',
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Auth
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    await delay(500);
    const user = mockUsers.find(u => u.email === email);
    if (!user || password !== 'password123') {
      throw new Error('Invalid credentials');
    }
    return {
      user,
      token: `mock-token-${user.id}`,
    };
  },

  // Instructions
  getInstructions: async (userId: string, role: string): Promise<CareInstruction[]> => {
    await delay(300);
    if (role === 'patient') {
      // Map user ID to patient ID (for mock data, user-1 = patient-1)
      const actualPatientId = userId === 'user-1' ? 'patient-1' : userId;
      return mockInstructions.filter(i => i.patientId === actualPatientId);
    }
    if (role === 'provider') {
      return mockInstructions.filter(i => i.providerId === userId);
    }
    return mockInstructions;
  },

  getInstruction: async (id: string): Promise<CareInstruction | null> => {
    await delay(200);
    return mockInstructions.find(i => i.id === id) || null;
  },

  // Patients
  getPatients: async (providerId: string): Promise<Patient[]> => {
    await delay(300);
    return mockPatients.filter(p => p.assignedProviderIds.includes(providerId));
  },

  getPatient: async (id: string): Promise<Patient | null> => {
    await delay(200);
    return mockPatients.find(p => p.id === id) || null;
  },

  // Compliance
  getComplianceRecords: async (patientId: string): Promise<ComplianceRecord[]> => {
    await delay(300);
    // Map user ID to patient ID (for mock data, user-1 = patient-1)
    const actualPatientId = patientId === 'user-1' ? 'patient-1' : patientId;
    return mockComplianceRecords.filter(c => c.patientId === actualPatientId);
  },

  getComplianceMetrics: async (patientId: string): Promise<ComplianceMetrics> => {
    await delay(200);
    // Map user ID to patient ID (for mock data, user-1 = patient-1)
    const actualPatientId = patientId === 'user-1' ? 'patient-1' : patientId;
    if (actualPatientId === 'patient-1') {
      return mockComplianceMetrics;
    }
    // Return default metrics for other patients
    return {
      patientId: actualPatientId,
      overallScore: 0,
      medicationAdherence: 0,
      lifestyleCompliance: 0,
      appointmentCompliance: 0,
      activeInstructions: 0,
      compliantInstructions: 0,
      trends: [],
    };
  },

  // Admin - Users
  getAllUsers: async (): Promise<User[]> => {
    await delay(300);
    return mockUsers;
  },

  getUser: async (id: string): Promise<User | null> => {
    await delay(200);
    return mockUsers.find(u => u.id === id) || null;
  },

  // Admin - Roles
  getRoles: async (): Promise<Role[]> => {
    await delay(300);
    return mockRoles;
  },

  getRole: async (id: string): Promise<Role | null> => {
    await delay(200);
    return mockRoles.find(r => r.id === id) || null;
  },

  // Admin - Audit Logs
  getAuditLogs: async (filters?: { userId?: string; action?: string; startDate?: string; endDate?: string }): Promise<AuditLog[]> => {
    await delay(400);
    let logs = [...mockAuditLogs];
    
    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters?.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // Admin - System Settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    await delay(200);
    return mockSystemSettings;
  },

  // Admin - Reports
  getAdminReports: async (): Promise<AdminReport[]> => {
    await delay(300);
    return mockAdminReports;
  },
};

// Mock notifications
const mockNotifications: Record<string, Notification[]> = {
  'user-1': [
    {
      id: 'notif-1',
      type: 'instruction_assigned',
      title: 'New Care Instruction Assigned',
      message: 'You have a new medication instruction from Dr. Jane Smith',
      priority: 'high',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      actionUrl: '/patient/instructions/instruction-1',
      actionLabel: 'View Instruction',
      metadata: { instructionId: 'instruction-1' },
    },
    {
      id: 'notif-2',
      type: 'acknowledgment_required',
      title: 'Acknowledgment Required',
      message: 'Please acknowledge your medication instruction for Metformin',
      priority: 'urgent',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      actionUrl: '/patient/instructions/instruction-1',
      actionLabel: 'Acknowledge Now',
      metadata: { instructionId: 'instruction-1' },
    },
    {
      id: 'notif-3',
      type: 'compliance_alert',
      title: 'Compliance Reminder',
      message: 'You missed 2 medication doses this week. Please update your compliance record.',
      priority: 'medium',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      actionUrl: '/patient/compliance',
      actionLabel: 'Update Compliance',
      metadata: { instructionId: 'instruction-1' },
    },
    {
      id: 'notif-4',
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: 'You have a follow-up appointment scheduled for tomorrow at 2:00 PM',
      priority: 'medium',
      read: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      actionUrl: '/patient/instructions/instruction-3',
      actionLabel: 'View Details',
      metadata: { appointmentId: 'appt-1' },
    },
  ],
  'user-2': [
    {
      id: 'notif-5',
      type: 'acknowledgment_required',
      title: 'Patient Acknowledgment Pending',
      message: 'John Doe has not acknowledged the medication instruction assigned 2 days ago',
      priority: 'high',
      read: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      actionUrl: '/provider/instructions',
      actionLabel: 'View Patient',
      metadata: { patientId: 'patient-1', instructionId: 'instruction-1' },
    },
    {
      id: 'notif-6',
      type: 'compliance_alert',
      title: 'Low Compliance Alert',
      message: 'Patient John Doe has 45% medication adherence rate. Consider intervention.',
      priority: 'high',
      read: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      actionUrl: '/provider/compliance',
      actionLabel: 'View Compliance',
      metadata: { patientId: 'patient-1' },
    },
  ],
  'user-3': [
    {
      id: 'notif-7',
      type: 'system_update',
      title: 'System Update Available',
      message: 'A new system update is available. Please review and schedule maintenance.',
      priority: 'low',
      read: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      actionUrl: '/admin/settings',
      actionLabel: 'View Settings',
    },
    {
      id: 'notif-8',
      type: 'security_alert',
      title: 'Security Alert',
      message: 'Multiple failed login attempts detected from IP address 192.168.1.100',
      priority: 'urgent',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      actionUrl: '/admin/audit-logs',
      actionLabel: 'View Audit Logs',
    },
  ],
};

export const getNotifications = (userId: string): Notification[] => {
  return mockNotifications[userId] || [];
};

export const markNotificationAsRead = (userId: string, notificationId: string): void => {
  const notifications = mockNotifications[userId];
  if (notifications) {
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = mockNotifications[userId];
  if (notifications) {
    notifications.forEach((n) => {
      n.read = true;
    });
  }
};

export const deleteNotification = (userId: string, notificationId: string): void => {
  const notifications = mockNotifications[userId];
  if (notifications) {
    const index = notifications.findIndex((n) => n.id === notificationId);
    if (index > -1) {
      notifications.splice(index, 1);
    }
  }
};
