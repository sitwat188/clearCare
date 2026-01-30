import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const SEED_PASSWORD = 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  // ---------------------------------------------------------------------------
  // Users: match frontend mock (admin@example.com, provider1@example.com, etc.)
  // ---------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'administrator',
    },
  });

  const provider = await prisma.user.upsert({
    where: { email: 'provider1@example.com' },
    update: {},
    create: {
      email: 'provider1@example.com',
      passwordHash,
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      role: 'provider',
    },
  });

  const patient1User = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
    },
  });

  const patient2User = await prisma.user.upsert({
    where: { email: 'sarah.patient@example.com' },
    update: {},
    create: {
      email: 'sarah.patient@example.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'patient',
    },
  });

  const patient3User = await prisma.user.upsert({
    where: { email: 'robert.patient@example.com' },
    update: {},
    create: {
      email: 'robert.patient@example.com',
      passwordHash,
      firstName: 'Robert',
      lastName: 'Williams',
      role: 'patient',
    },
  });

  console.log('Seeded users (mock emails):', {
    admin: admin.email,
    provider: provider.email,
    patient1: patient1User.email,
    patient2: patient2User.email,
    patient3: patient3User.email,
  });

  // ---------------------------------------------------------------------------
  // Patients: match mock (John Doe, Sarah Johnson, Robert Williams)
  // ---------------------------------------------------------------------------
  const patient1 = await prisma.patient.upsert({
    where: { userId: patient1User.id },
    update: { assignedProviderIds: [provider.id] },
    create: {
      userId: patient1User.id,
      dateOfBirth: '1985-05-15',
      medicalRecordNumber: 'MRN-001234',
      phone: '555-0101',
      addressStreet: '123 Main St',
      addressCity: 'Springfield',
      addressState: 'IL',
      addressZipCode: '62701',
      emergencyContactName: 'Jane Doe',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '555-0102',
      assignedProviderIds: [provider.id],
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { userId: patient2User.id },
    update: { assignedProviderIds: [provider.id] },
    create: {
      userId: patient2User.id,
      dateOfBirth: '1990-08-22',
      medicalRecordNumber: 'MRN-002345',
      phone: '555-0201',
      addressStreet: '456 Oak Avenue',
      addressCity: 'Chicago',
      addressState: 'IL',
      addressZipCode: '60601',
      emergencyContactName: 'Michael Johnson',
      emergencyContactRelationship: 'Husband',
      emergencyContactPhone: '555-0202',
      assignedProviderIds: [provider.id],
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { userId: patient3User.id },
    update: { assignedProviderIds: [provider.id] },
    create: {
      userId: patient3User.id,
      dateOfBirth: '1978-12-05',
      medicalRecordNumber: 'MRN-003456',
      phone: '555-0301',
      addressStreet: '789 Elm Street',
      addressCity: 'Peoria',
      addressState: 'IL',
      addressZipCode: '61601',
      emergencyContactName: 'Mary Williams',
      emergencyContactRelationship: 'Wife',
      emergencyContactPhone: '555-0302',
      assignedProviderIds: [provider.id],
    },
  });

  console.log('Seeded patients:', patient1.id, patient2.id, patient3.id);

  const providerName = `${provider.firstName} ${provider.lastName}`;
  const patient1Name = `${patient1User.firstName} ${patient1User.lastName}`;
  const patient2Name = `${patient2User.firstName} ${patient2User.lastName}`;
  const patient3Name = `${patient3User.firstName} ${patient3User.lastName}`;

  const baseDate = new Date('2024-01-20T10:00:00Z');
  const nextWeek = new Date(baseDate);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // ---------------------------------------------------------------------------
  // Instructions: match mock (inst-1 to inst-5)
  // ---------------------------------------------------------------------------
  await prisma.careInstruction.upsert({
    where: { id: 'inst-1' },
    update: {},
    create: {
      id: 'inst-1',
      providerId: provider.id,
      providerName,
      patientId: patient1.id,
      patientName: patient1Name,
      title: 'Post-Surgery Medication Instructions',
      type: 'medication',
      status: 'active',
      priority: 'high',
      content:
        'Please take the prescribed medications as directed. This is important for your recovery.',
      medicationDetails: {
        name: 'Amoxicillin',
        dosage: '500',
        unit: 'mg',
        frequency: 'Every 8 hours',
        duration: '7 days',
        instructions: 'Take with food to reduce stomach upset',
        refillInformation: 'No refills needed',
        sideEffects:
          'May cause nausea or diarrhea. Contact your doctor if severe.',
      },
      assignedDate: baseDate,
      acknowledgmentDeadline: nextWeek,
      complianceTrackingEnabled: true,
      lifestyleTrackingEnabled: false,
    },
  });

  await prisma.careInstruction.upsert({
    where: { id: 'inst-2' },
    update: {},
    create: {
      id: 'inst-2',
      providerId: provider.id,
      providerName,
      patientId: patient1.id,
      patientName: patient1Name,
      title: 'Dietary Restrictions',
      type: 'lifestyle',
      status: 'acknowledged',
      priority: 'medium',
      content:
        'Follow a low-sodium diet to help manage your blood pressure.',
      lifestyleDetails: {
        category: 'diet',
        instructions:
          'Limit sodium intake to less than 2000mg per day. Avoid processed foods.',
        goals: 'Maintain blood pressure below 140/90',
        milestones: [
          'Week 1: Track all meals',
          'Week 2: Reduce processed foods by 50%',
        ],
        trackingRequirements: 'Daily meal logging',
      },
      assignedDate: new Date('2024-01-18T10:00:00Z'),
      acknowledgedDate: new Date('2024-01-19T14:30:00Z'),
      complianceTrackingEnabled: true,
      lifestyleTrackingEnabled: true,
    },
  });

  await prisma.careInstruction.upsert({
    where: { id: 'inst-3' },
    update: {},
    create: {
      id: 'inst-3',
      providerId: provider.id,
      providerName,
      patientId: patient1.id,
      patientName: patient1Name,
      title: 'Follow-Up Appointment Required',
      type: 'follow-up',
      status: 'completed',
      priority: 'medium',
      content:
        'Please schedule a follow-up appointment within 2 weeks to review your progress.',
      followUpDetails: {
        appointmentType: 'Follow-up Consultation',
        timeframe: 'Within 2 weeks',
        preparationInstructions: 'Bring your medication list and any questions',
        contactInformation: 'Call (555) 123-4567 to schedule',
      },
      assignedDate: new Date('2024-01-10T10:00:00Z'),
      acknowledgedDate: new Date('2024-01-11T09:00:00Z'),
      complianceTrackingEnabled: false,
      lifestyleTrackingEnabled: false,
    },
  });

  await prisma.careInstruction.upsert({
    where: { id: 'inst-4' },
    update: {},
    create: {
      id: 'inst-4',
      providerId: provider.id,
      providerName,
      patientId: patient2.id,
      patientName: patient2Name,
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
        sideEffects:
          'May cause dizziness. Contact your doctor if severe.',
      },
      assignedDate: new Date('2024-01-22T10:00:00Z'),
      acknowledgmentDeadline: nextWeek,
      complianceTrackingEnabled: true,
      lifestyleTrackingEnabled: false,
    },
  });

  await prisma.careInstruction.upsert({
    where: { id: 'inst-5' },
    update: {},
    create: {
      id: 'inst-5',
      providerId: provider.id,
      providerName,
      patientId: patient3.id,
      patientName: patient3Name,
      title: 'Exercise Regimen',
      type: 'lifestyle',
      status: 'active',
      priority: 'medium',
      content:
        'Follow the prescribed exercise routine to improve cardiovascular health.',
      lifestyleDetails: {
        category: 'exercise',
        instructions:
          'Walk 30 minutes daily, 5 days per week. Gradually increase intensity.',
        goals: 'Improve cardiovascular fitness and reduce risk factors',
        milestones: [
          'Week 1: Establish routine',
          'Week 4: Increase duration to 45 minutes',
        ],
        trackingRequirements: 'Daily exercise logging',
      },
      assignedDate: new Date('2024-01-26T10:00:00Z'),
      acknowledgmentDeadline: nextWeek,
      complianceTrackingEnabled: true,
      lifestyleTrackingEnabled: true,
    },
  });

  console.log('Seeded care instructions (5)');

  // ---------------------------------------------------------------------------
  // Acknowledgments: match mock (inst-2, inst-3) - optional, don't fail seed
  // ---------------------------------------------------------------------------
  try {
  await prisma.acknowledgment.upsert({
    where: { id: 'ack-1' },
    update: {},
    create: {
      id: 'ack-1',
      instructionId: 'inst-2',
      patientId: patient1.id,
      acknowledgmentType: 'receipt',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2024-01-19T14:30:00Z'),
    },
  });
  await prisma.acknowledgment.upsert({
    where: { id: 'ack-2' },
    update: {},
    create: {
      id: 'ack-2',
      instructionId: 'inst-2',
      patientId: patient1.id,
      acknowledgmentType: 'understanding',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2024-01-19T14:31:00Z'),
    },
  });
  await prisma.acknowledgment.upsert({
    where: { id: 'ack-3' },
    update: {},
    create: {
      id: 'ack-3',
      instructionId: 'inst-3',
      patientId: patient1.id,
      acknowledgmentType: 'receipt',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2024-01-11T09:00:00Z'),
    },
  });
  console.log('Seeded acknowledgments (3)');
  } catch (e) {
    console.warn('Acknowledgments seed skipped or partial:', (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // Compliance records: match mock (comp-1, comp-2 for patient1)
  // ---------------------------------------------------------------------------
  try {
  await prisma.complianceRecord.upsert({
    where: { id: 'comp-1' },
    update: {},
    create: {
      id: 'comp-1',
      instructionId: 'inst-1',
      patientId: patient1.id,
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
      lastUpdatedBy: patient1User.id,
    },
  });

  await prisma.complianceRecord.upsert({
    where: { id: 'comp-2' },
    update: {},
    create: {
      id: 'comp-2',
      instructionId: 'inst-2',
      patientId: patient1.id,
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
      lastUpdatedBy: patient1User.id,
    },
  });

  console.log('Seeded compliance records (2)');
  } catch (e) {
    console.warn('Compliance seed skipped or partial:', (e as Error).message);
  }

  // ---------------------------------------------------------------------------
  // Notifications - optional
  // ---------------------------------------------------------------------------
  try {
  await prisma.notification.createMany({
    data: [
      {
        userId: patient1User.id,
        type: 'instruction_assigned',
        title: 'New care instruction',
        message: 'You have a new medication instruction from your provider.',
        priority: 'high',
        actionUrl: '/patient/instructions',
        actionLabel: 'View instructions',
      },
      {
        userId: provider.id,
        type: 'instruction_assigned',
        title: 'Instruction acknowledged',
        message: 'John Doe acknowledged the Dietary Restrictions instruction.',
        priority: 'medium',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded notifications');
  } catch (e) {
    console.warn('Notifications seed skipped:', (e as Error).message);
  }

  console.log('\n--- Seed completed (mock data) ---');
  console.log('Login with password: ' + SEED_PASSWORD);
  console.log('  Admin:    admin@example.com');
  console.log('  Provider: provider1@example.com');
  console.log('  Patient1: patient1@example.com (John Doe)');
  console.log('  Patient2: sarah.patient@example.com (Sarah Johnson)');
  console.log('  Patient3: robert.patient@example.com (Robert Williams)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
