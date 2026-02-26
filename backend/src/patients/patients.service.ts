import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

/** Shape passed to toPatientResponse (Prisma patient with include: { user, patientProviders }). */
interface PatientWithRelations {
  user?: { firstName?: string; lastName?: string; email?: string } | null;
  patientProviders?: Array<{ providerId: string }> | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  dateOfBirth?: string | null;
  medicalRecordNumber?: string | null;
  phone?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Create a patient record
   * HIPAA: Only admins can create patient records
   */
  async createPatient(
    createDto: CreatePatientDto,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // HIPAA: Only administrators can create patient records
    if (requestingUserRole !== 'administrator') {
      throw new ForbiddenException('Only administrators can create patient records');
    }

    // Check if user exists
    const user = await this.prisma.user.findFirst({
      where: { id: createDto.userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if patient already exists for this user
    const existingPatient = await this.prisma.patient.findFirst({
      where: { userId: createDto.userId, deletedAt: null },
    });

    if (existingPatient) {
      throw new BadRequestException('Patient record already exists for this user');
    }

    // Create patient record (encrypt PHI at rest)
    const providerIds = createDto.assignedProviderIds ?? [];
    const enc = this.encryption.encryptFields(
      {
        dateOfBirth: createDto.dateOfBirth ?? '',
        medicalRecordNumber: createDto.medicalRecordNumber ?? '',
        phone: createDto.phone ?? undefined,
        addressStreet: createDto.addressStreet ?? undefined,
        addressCity: createDto.addressCity ?? undefined,
        addressState: createDto.addressState ?? undefined,
        addressZipCode: createDto.addressZipCode ?? undefined,
        emergencyContactName: createDto.emergencyContactName ?? createDto.emergencyContact ?? undefined,
        emergencyContactRelationship: createDto.emergencyContactRelationship ?? undefined,
        emergencyContactPhone: createDto.emergencyContactPhone ?? undefined,
      },
      [
        'dateOfBirth',
        'medicalRecordNumber',
        'phone',
        'addressStreet',
        'addressCity',
        'addressState',
        'addressZipCode',
        'emergencyContactName',
        'emergencyContactRelationship',
        'emergencyContactPhone',
      ],
    );
    const patient = await this.prisma.$transaction(async (tx) => {
      const created = await tx.patient.create({
        data: {
          userId: createDto.userId,
          dateOfBirth: enc.dateOfBirth ?? '',
          medicalRecordNumber: enc.medicalRecordNumber ?? '',
          phone: enc.phone ?? null,
          addressStreet: enc.addressStreet ?? null,
          addressCity: enc.addressCity ?? null,
          addressState: enc.addressState ?? null,
          addressZipCode: enc.addressZipCode ?? null,
          emergencyContactName: enc.emergencyContactName ?? null,
          emergencyContactRelationship: enc.emergencyContactRelationship ?? null,
          emergencyContactPhone: enc.emergencyContactPhone ?? null,
          patientProviders:
            providerIds.length > 0
              ? {
                  create: providerIds.map((providerId) => ({ providerId })),
                }
              : undefined,
        },
      });
      await tx.patientHistory.create({
        data: {
          patientId: created.id,
          action: 'create',
          changedBy: requestingUserId,
          newValues: {
            userId: created.userId,
            dateOfBirth: created.dateOfBirth,
            medicalRecordNumber: created.medicalRecordNumber,
          },
          ipAddress,
          userAgent,
        },
      });
      return created;
    });

    const withUser = await this.prisma.patient.findFirst({
      where: { id: patient.id },
      include: { user: true },
    });
    return withUser ? this.toPatientResponse(withUser) : patient;
  }

  /**
   * Get patient by ID
   * HIPAA: Row-level access - patients can only see their own data, providers can see assigned patients
   */
  async getPatient(patientId: string, requestingUserId: string, requestingUserRole: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      include: {
        user: true,
        patientProviders: { select: { providerId: true } },
        instructions: {
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      if (patient.userId !== requestingUserId) {
        throw new ForbiddenException('You can only access your own patient data');
      }
    } else if (requestingUserRole === 'provider') {
      const assignedProviderIds = patient.patientProviders?.map((pp) => pp.providerId) ?? [];
      if (!assignedProviderIds.includes(requestingUserId)) {
        throw new ForbiddenException('You can only access patients assigned to you');
      }
    }

    return this.toPatientResponse(patient);
  }

  private static PATIENT_ENCRYPTED_KEYS = [
    'dateOfBirth',
    'medicalRecordNumber',
    'phone',
    'addressStreet',
    'addressCity',
    'addressState',
    'addressZipCode',
    'emergencyContactName',
    'emergencyContactRelationship',
    'emergencyContactPhone',
  ] as const;

  /** Map DB patient (with user) to frontend-friendly shape; decrypt PHI for API response */
  private toPatientResponse(patient: PatientWithRelations): Record<string, unknown> {
    const { user: u, patientProviders, ...rest } = patient;
    const assignedProviderIds = patientProviders?.map((pp: { providerId: string }) => pp.providerId) ?? [];
    const pView = this.encryption.decryptedView(patient as Record<string, unknown>, [
      ...PatientsService.PATIENT_ENCRYPTED_KEYS,
    ]);
    const street = pView.addressStreet;
    const city = pView.addressCity;
    const state = pView.addressState;
    const zipCode = pView.addressZipCode;
    const emergencyName = pView.emergencyContactName;
    const emergencyRel = pView.emergencyContactRelationship;
    const emergencyPhone = pView.emergencyContactPhone;
    const userView =
      u != null
        ? this.encryption.decryptedView(u as Record<string, unknown>, ['firstName', 'lastName', 'email'])
        : null;
    return {
      ...rest,
      assignedProviderIds,
      dateOfBirth: pView.dateOfBirth,
      medicalRecordNumber: pView.medicalRecordNumber,
      phone: pView.phone || undefined,
      addressStreet: street || undefined,
      addressCity: city || undefined,
      addressState: state || undefined,
      addressZipCode: zipCode || undefined,
      emergencyContactName: emergencyName || undefined,
      emergencyContactRelationship: emergencyRel || undefined,
      emergencyContactPhone: emergencyPhone || undefined,
      firstName: userView?.firstName ?? '',
      lastName: userView?.lastName ?? '',
      email: userView?.email ?? '',
      address:
        street || city
          ? {
              street: street ?? '',
              city: city ?? '',
              state: state ?? '',
              zipCode: zipCode ?? '',
            }
          : undefined,
      emergencyContact:
        emergencyName || emergencyPhone
          ? {
              name: emergencyName ?? '',
              relationship: emergencyRel ?? '',
              phone: emergencyPhone ?? '',
            }
          : undefined,
      createdAt: patient.createdAt instanceof Date ? patient.createdAt.toISOString() : patient.createdAt,
      updatedAt: patient.updatedAt instanceof Date ? patient.updatedAt.toISOString() : patient.updatedAt,
    } as Record<string, unknown>;
  }

  /**
   * Get patient by user ID (admin only).
   * Used by admin UI to load patient record for assignment.
   */
  async getPatientByUserId(userId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'administrator') {
      throw new ForbiddenException('Only administrators can look up patient by user ID');
    }
    const patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
      include: { user: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found for this user');
    }
    const withProviders = await this.prisma.patient.findFirst({
      where: { id: patient.id },
      include: {
        user: true,
        patientProviders: { select: { providerId: true } },
      },
    });
    return withProviders ? this.toPatientResponse(withProviders) : this.toPatientResponse(patient);
  }

  /**
   * Get all patients (with access control)
   * HIPAA: Providers see only assigned patients, admins see all
   */
  async getPatients(requestingUserId: string, requestingUserRole: string) {
    if (requestingUserRole === 'patient') {
      // Patients can only see their own record
      const user = await this.prisma.user.findFirst({
        where: { id: requestingUserId, deletedAt: null },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const patient = await this.prisma.patient.findFirst({
        where: { userId: requestingUserId, deletedAt: null },
        include: { user: true },
      });

      return patient ? [this.toPatientResponse(patient)] : [];
    } else if (requestingUserRole === 'provider') {
      const list = await this.prisma.patient.findMany({
        where: {
          patientProviders: { some: { providerId: requestingUserId } },
          deletedAt: null,
        },
        include: {
          user: true,
          patientProviders: { select: { providerId: true } },
          instructions: {
            where: { deletedAt: null },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return list.map((p) => this.toPatientResponse(p));
    } else if (requestingUserRole === 'administrator') {
      const list = await this.prisma.patient.findMany({
        where: { deletedAt: null },
        include: {
          user: true,
          patientProviders: { select: { providerId: true } },
          instructions: {
            where: { deletedAt: null },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return list.map((p) => this.toPatientResponse(p));
    }

    return [];
  }

  /**
   * Update patient record
   * HIPAA: Row-level access control
   */
  async updatePatient(
    patientId: string,
    updateDto: UpdatePatientDto,
    requestingUserId: string,
    requestingUserRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      include: { patientProviders: { select: { providerId: true } } },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const assignedProviderIds = patient.patientProviders?.map((pp) => pp.providerId) ?? [];

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      const user = await this.prisma.user.findFirst({
        where: { id: requestingUserId, deletedAt: null },
      });
      if (user && patient.userId !== requestingUserId) {
        throw new ForbiddenException('You can only update your own patient data');
      }
    } else if (requestingUserRole === 'provider') {
      if (!assignedProviderIds.includes(requestingUserId)) {
        throw new ForbiddenException('You can only update patients assigned to you');
      }
    }

    // Get old values for history (stored as-is from DB, may be encrypted)
    const oldValues = {
      dateOfBirth: patient.dateOfBirth,
      medicalRecordNumber: patient.medicalRecordNumber,
      emergencyContactName: patient.emergencyContactName,
    };

    const data: Record<string, unknown> = {
      ...this.encryption.encryptFields(
        {
          dateOfBirth: updateDto.dateOfBirth ?? undefined,
          medicalRecordNumber: updateDto.medicalRecordNumber ?? undefined,
          phone: updateDto.phone ?? undefined,
          addressStreet: updateDto.addressStreet ?? undefined,
          addressCity: updateDto.addressCity ?? undefined,
          addressState: updateDto.addressState ?? undefined,
          addressZipCode: updateDto.addressZipCode ?? undefined,
          emergencyContactName: updateDto.emergencyContactName ?? updateDto.emergencyContact ?? undefined,
          emergencyContactRelationship: updateDto.emergencyContactRelationship ?? undefined,
          emergencyContactPhone: updateDto.emergencyContactPhone ?? undefined,
        },
        [
          'dateOfBirth',
          'medicalRecordNumber',
          'phone',
          'addressStreet',
          'addressCity',
          'addressState',
          'addressZipCode',
          'emergencyContactName',
          'emergencyContactRelationship',
          'emergencyContactPhone',
        ],
      ),
    };

    await this.prisma.patient.update({
      where: { id: patientId },
      data,
    });

    // Sync provider assignments via junction table
    if (updateDto.assignedProviderIds != null) {
      await this.prisma.patientProvider.deleteMany({
        where: { patientId },
      });
      if (updateDto.assignedProviderIds.length > 0) {
        await this.prisma.patientProvider.createMany({
          data: updateDto.assignedProviderIds.map((providerId) => ({
            patientId,
            providerId,
          })),
        });
      }
    }

    const previousProviderIds = assignedProviderIds;

    // Create history entry
    const updatedPatient = await this.prisma.patient.findFirst({
      where: { id: patientId },
      include: {
        user: true,
        patientProviders: { select: { providerId: true } },
      },
    });
    await this.prisma.patientHistory.create({
      data: {
        patientId: patient.id,
        action: 'update',
        changedBy: requestingUserId,
        oldValues,
        newValues: updatedPatient
          ? {
              dateOfBirth: updatedPatient.dateOfBirth,
              medicalRecordNumber: updatedPatient.medicalRecordNumber,
              emergencyContactName: updatedPatient.emergencyContactName,
            }
          : {},
        ipAddress,
        userAgent,
      },
    });

    // When admin assigns providers, notify the patient and each newly assigned provider
    if (requestingUserRole === 'administrator' && updateDto.assignedProviderIds != null && updatedPatient?.user) {
      const newProviderIds = updateDto.assignedProviderIds.filter((id: string) => !previousProviderIds.includes(id));
      const userView = this.encryption.decryptedView(updatedPatient.user, ['firstName', 'lastName', 'email']);
      const patientName = `${userView.firstName ?? ''} ${userView.lastName ?? ''}`.trim() || (userView.email ?? '');

      if (newProviderIds.length > 0) {
        try {
          await this.notifications.createNotification({
            userId: updatedPatient.userId,
            type: 'provider_assigned',
            title: 'Provider assigned',
            message: 'A care provider has been assigned to your care.',
            priority: 'medium',
            actionUrl: '/patient/instructions',
            actionLabel: 'View instructions',
          });
        } catch {
          // Do not fail the update if notification fails
        }
        const providers = await this.prisma.user.findMany({
          where: { id: { in: newProviderIds }, deletedAt: null },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        for (const prov of providers) {
          try {
            await this.notifications.createNotification({
              userId: prov.id,
              type: 'provider_assigned',
              title: 'Patient assignment',
              message: `You have been assigned to patient ${patientName}.`,
              priority: 'medium',
              actionUrl: '/provider/patients',
              actionLabel: 'View patients',
            });
          } catch {
            // Do not fail the update if notification fails
          }
        }
      }
    }

    return updatedPatient ? this.toPatientResponse(updatedPatient) : null;
  }
}
