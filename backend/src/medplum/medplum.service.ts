/**
 * Medplum FHIR service
 * Connects to Medplum with client credentials and exposes FHIR operations.
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MedplumClient } from '@medplum/core';

@Injectable()
export class MedplumService implements OnModuleInit {
  private readonly logger = new Logger(MedplumService.name);
  private client: MedplumClient | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const baseUrl = this.config.get<string>('MEDPLUM_BASE_URL');
    const clientId = this.config.get<string>('MEDPLUM_CLIENT_ID');
    const clientSecret = this.config.get<string>('MEDPLUM_CLIENT_SECRET');

    if (!baseUrl || !clientId || !clientSecret) {
      this.logger.warn(
        'Medplum env not set (MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET). Medplum features disabled.',
      );
      return;
    }

    this.initPromise = this.connect(baseUrl, clientId, clientSecret);
    await this.initPromise;
  }

  private async connect(
    baseUrl: string,
    clientId: string,
    clientSecret: string,
  ): Promise<void> {
    try {
      this.client = new MedplumClient({
        baseUrl: baseUrl.replace(/\/+$/, ''),
      });
      await this.client.startClientLogin(clientId, clientSecret);
      this.logger.log('Medplum client connected successfully');
    } catch (err) {
      this.logger.error('Medplum client connection failed', err);
      this.client = null;
      throw err;
    }
  }

  private ensureClient(): MedplumClient {
    if (!this.client) {
      throw new Error(
        'Medplum client not initialized. Set MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET.',
      );
    }
    return this.client;
  }

  /** Wait for initial connection (if still in progress). */
  async ensureConnected(): Promise<void> {
    if (this.initPromise) await this.initPromise;
  }

  /** Check if Medplum is configured and connected. */
  isConnected(): boolean {
    return this.client != null;
  }

  /**
   * Search Patient resources in Medplum.
   * @param searchParams optional FHIR search params (e.g. { name: 'Smith' })
   */
  async searchPatients(searchParams?: Record<string, string>) {
    const client = this.ensureClient();
    return client.searchResources('Patient', searchParams ?? {});
  }

  /**
   * Read one Patient by id.
   * @param id Patient id (e.g. "xyz" for Patient/xyz)
   */
  async getPatient(id: string) {
    const client = this.ensureClient();
    return client.readResource('Patient', id);
  }

  /**
   * Create a Patient in Medplum.
   * @param patient FHIR Patient resource (resourceType will be set if missing)
   */
  async createPatient(patient: Record<string, unknown>) {
    const client = this.ensureClient();
    const resource = { ...patient, resourceType: 'Patient' as const };
    return client.createResource(resource);
  }

  /**
   * Update a Patient in Medplum.
   */
  async updatePatient(patient: Record<string, unknown>) {
    const client = this.ensureClient();
    return client.updateResource(patient as any);
  }

  /**
   * Search Task resources (e.g. for care instructions).
   */
  async searchTasks(searchParams?: Record<string, string>) {
    const client = this.ensureClient();
    return client.searchResources('Task', searchParams ?? {});
  }

  /**
   * Create a Task in Medplum.
   */
  async createTask(task: Record<string, unknown>) {
    const client = this.ensureClient();
    const resource = { ...task, resourceType: 'Task' as const };
    return client.createResource(resource);
  }

  /**
   * Generic search for any resource type.
   */
  async searchResources(
    resourceType: string,
    searchParams?: Record<string, string>,
  ) {
    const client = this.ensureClient();
    return client.searchResources(resourceType, searchParams ?? {});
  }

  /**
   * Read any resource by type and id.
   */
  async readResource(resourceType: string, id: string) {
    const client = this.ensureClient();
    return client.readResource(resourceType, id);
  }

  /**
   * Create a few sample FHIR Patients in Medplum for demo/testing.
   * Returns the created Patient resources.
   */
  async seedSamplePatients(): Promise<unknown[]> {
    const client = this.ensureClient();
    const samples = [
      {
        resourceType: 'Patient' as const,
        name: [
          { use: 'official', family: 'Smith', given: ['Alice'] },
        ],
        birthDate: '1985-03-15',
        gender: 'female',
        identifier: [
          { system: 'https://clearcare.local/sample', value: 'SAMPLE-001' },
        ],
        telecom: [
          { system: 'phone', value: '+1-555-0101', use: 'home' },
          { system: 'email', value: 'alice.smith@example.com' },
        ],
        address: [
          { use: 'home', line: ['123 Main St'], city: 'Springfield', state: 'IL', postalCode: '62701' },
        ],
      },
      {
        resourceType: 'Patient' as const,
        name: [
          { use: 'official', family: 'Johnson', given: ['Bob'] },
        ],
        birthDate: '1978-07-22',
        gender: 'male',
        identifier: [
          { system: 'https://clearcare.local/sample', value: 'SAMPLE-002' },
        ],
        telecom: [
          { system: 'phone', value: '+1-555-0102', use: 'mobile' },
          { system: 'email', value: 'bob.johnson@example.com' },
        ],
        address: [
          { use: 'home', line: ['456 Oak Ave'], city: 'Portland', state: 'OR', postalCode: '97201' },
        ],
      },
      {
        resourceType: 'Patient' as const,
        name: [
          { use: 'official', family: 'Williams', given: ['Carol'] },
        ],
        birthDate: '1992-11-08',
        gender: 'female',
        identifier: [
          { system: 'https://clearcare.local/sample', value: 'SAMPLE-003' },
        ],
        telecom: [
          { system: 'email', value: 'carol.williams@example.com' },
        ],
        address: [
          { use: 'work', line: ['789 Pine Rd'], city: 'Austin', state: 'TX', postalCode: '78701' },
        ],
      },
    ];
    const created: unknown[] = [];
    for (const patient of samples) {
      const p = await client.createResource(patient);
      created.push(p);
      this.logger.log(`Created sample Patient: ${(p as { id?: string }).id}`);
    }
    return created;
  }
}
