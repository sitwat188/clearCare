import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EncryptionService } from '../common/encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
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
      throw new ForbiddenException(
        'Only administrators can create patient records',
      );
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
      throw new BadRequestException(
        'Patient record already exists for this user',
      );
    }

    // Create patient record (encrypt PHI at rest)
    const patient = await this.prisma.patient.create({
      data: {
        userId: createDto.userId,
        dateOfBirth: this.encryption.encrypt(createDto.dateOfBirth ?? '') || '',
        medicalRecordNumber:
          this.encryption.encrypt(createDto.medicalRecordNumber ?? '') || '',
        phone: createDto.phone
          ? this.encryption.encrypt(createDto.phone)
          : null,
        addressStreet: createDto.addressStreet
          ? this.encryption.encrypt(createDto.addressStreet)
          : null,
        addressCity: createDto.addressCity
          ? this.encryption.encrypt(createDto.addressCity)
          : null,
        addressState: createDto.addressState
          ? this.encryption.encrypt(createDto.addressState)
          : null,
        addressZipCode: createDto.addressZipCode
          ? this.encryption.encrypt(createDto.addressZipCode)
          : null,
        emergencyContactName:
          (createDto.emergencyContactName ?? createDto.emergencyContact)
            ? this.encryption.encrypt(
                createDto.emergencyContactName ??
                  createDto.emergencyContact ??
                  '',
              )
            : null,
        emergencyContactRelationship: createDto.emergencyContactRelationship
          ? this.encryption.encrypt(createDto.emergencyContactRelationship)
          : null,
        emergencyContactPhone: createDto.emergencyContactPhone
          ? this.encryption.encrypt(createDto.emergencyContactPhone)
          : null,
        assignedProviderIds: createDto.assignedProviderIds ?? [],
      },
    });

    // Create history entry
    await this.prisma.patientHistory.create({
      data: {
        patientId: patient.id,
        action: 'create',
        changedBy: requestingUserId,
        newValues: {
          userId: patient.userId,
          dateOfBirth: patient.dateOfBirth,
          medicalRecordNumber: patient.medicalRecordNumber,
        },
        ipAddress,
        userAgent,
      },
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
  async getPatient(
    patientId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      include: {
        user: true,
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
        throw new ForbiddenException(
          'You can only access your own patient data',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (!patient.assignedProviderIds.includes(requestingUserId)) {
        throw new ForbiddenException(
          'You can only access patients assigned to you',
        );
      }
    }

    return this.toPatientResponse(patient);
  }

  /** Map DB patient (with user) to frontend-friendly shape; decrypt PHI for API response */
  private toPatientResponse(patient: any) {
    const { user: u, ...rest } = patient;
    const street = this.encryption.decrypt(patient.addressStreet);
    const city = this.encryption.decrypt(patient.addressCity);
    const state = this.encryption.decrypt(patient.addressState);
    const zipCode = this.encryption.decrypt(patient.addressZipCode);
    const emergencyName = this.encryption.decrypt(patient.emergencyContactName);
    const emergencyRel = this.encryption.decrypt(
      patient.emergencyContactRelationship,
    );
    const emergencyPhone = this.encryption.decrypt(
      patient.emergencyContactPhone,
    );
    return {
      ...rest,
      dateOfBirth: this.encryption.decrypt(patient.dateOfBirth),
      medicalRecordNumber: this.encryption.decrypt(patient.medicalRecordNumber),
      phone: this.encryption.decrypt(patient.phone) || undefined,
      addressStreet: street || undefined,
      addressCity: city || undefined,
      addressState: state || undefined,
      addressZipCode: zipCode || undefined,
      emergencyContactName: emergencyName || undefined,
      emergencyContactRelationship: emergencyRel || undefined,
      emergencyContactPhone: emergencyPhone || undefined,
      firstName: u?.firstName ?? '',
      lastName: u?.lastName ?? '',
      email: u?.email ?? '',
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
      createdAt: patient.createdAt?.toISOString?.() ?? patient.createdAt,
      updatedAt: patient.updatedAt?.toISOString?.() ?? patient.updatedAt,
    };
  }

  /**
   * Get patient by user ID (admin only).
   * Used by admin UI to load patient record for assignment.
   */
  async getPatientByUserId(userId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'administrator') {
      throw new ForbiddenException(
        'Only administrators can look up patient by user ID',
      );
    }
    const patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
      include: { user: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found for this user');
    }
    return this.toPatientResponse(patient);
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
          assignedProviderIds: { has: requestingUserId },
          deletedAt: null,
        },
        include: {
          user: true,
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
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // HIPAA: Row-level access control
    if (requestingUserRole === 'patient') {
      const user = await this.prisma.user.findFirst({
        where: { id: requestingUserId, deletedAt: null },
      });
      if (user && patient.userId !== requestingUserId) {
        throw new ForbiddenException(
          'You can only update your own patient data',
        );
      }
    } else if (requestingUserRole === 'provider') {
      if (!patient.assignedProviderIds.includes(requestingUserId)) {
        throw new ForbiddenException(
          'You can only update patients assigned to you',
        );
      }
    }

    // Get old values for history (stored as-is from DB, may be encrypted)
    const oldValues = {
      dateOfBirth: patient.dateOfBirth,
      medicalRecordNumber: patient.medicalRecordNumber,
      emergencyContactName: patient.emergencyContactName,
    };

    const data: Record<string, unknown> = {};
    if (updateDto.dateOfBirth != null)
      data.dateOfBirth = this.encryption.encrypt(updateDto.dateOfBirth);
    if (updateDto.medicalRecordNumber != null)
      data.medicalRecordNumber = this.encryption.encrypt(
        updateDto.medicalRecordNumber,
      );
    if (updateDto.phone != null)
      data.phone = this.encryption.encrypt(updateDto.phone);
    if (updateDto.addressStreet != null)
      data.addressStreet = this.encryption.encrypt(updateDto.addressStreet);
    if (updateDto.addressCity != null)
      data.addressCity = this.encryption.encrypt(updateDto.addressCity);
    if (updateDto.addressState != null)
      data.addressState = this.encryption.encrypt(updateDto.addressState);
    if (updateDto.addressZipCode != null)
      data.addressZipCode = this.encryption.encrypt(updateDto.addressZipCode);
    if (updateDto.emergencyContact != null)
      data.emergencyContactName = this.encryption.encrypt(
        updateDto.emergencyContact,
      );
    if (updateDto.emergencyContactName != null)
      data.emergencyContactName = this.encryption.encrypt(
        updateDto.emergencyContactName,
      );
    if (updateDto.emergencyContactRelationship != null)
      data.emergencyContactRelationship = this.encryption.encrypt(
        updateDto.emergencyContactRelationship,
      );
    if (updateDto.emergencyContactPhone != null)
      data.emergencyContactPhone = this.encryption.encrypt(
        updateDto.emergencyContactPhone,
      );
    if (updateDto.assignedProviderIds != null)
      data.assignedProviderIds = updateDto.assignedProviderIds;

    await this.prisma.patient.update({
      where: { id: patientId },
      data,
    });

    // Create history entry
    const updatedPatient = await this.prisma.patient.findFirst({
      where: { id: patientId },
      include: { user: true },
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

    return updatedPatient
      ? this.toPatientResponse(updatedPatient)
      : (null as any);
  }
}
