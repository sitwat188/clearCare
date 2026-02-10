/**
 * Minimal FHIR R4 types for Medplum Patient display
 */

export interface FhirHumanName {
  use?: string;
  family?: string;
  given?: string[];
  text?: string;
}

export interface FhirIdentifier {
  system?: string;
  value?: string;
  type?: { text?: string };
}

export interface FhirContactPoint {
  system?: 'phone' | 'email' | 'fax' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string };
  name?: FhirHumanName[];
  birthDate?: string;
  gender?: string;
  identifier?: FhirIdentifier[];
  telecom?: FhirContactPoint[];
  address?: FhirAddress[];
  [key: string]: unknown;
}

/** FHIR Practitioner (provider) */
export interface FhirPractitioner {
  resourceType: 'Practitioner';
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string };
  name?: FhirHumanName[];
  identifier?: FhirIdentifier[];
  telecom?: FhirContactPoint[];
  address?: FhirAddress[];
  qualification?: Array<{ code?: { text?: string }; issuer?: { display?: string } }>;
  [key: string]: unknown;
}

/** FHIR reference (e.g. Patient/123, Practitioner/456) */
export interface FhirReference {
  reference?: string;
  display?: string;
}

/** FHIR Task (instruction / order) */
export interface FhirTask {
  resourceType: 'Task';
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string };
  status?: 'draft' | 'requested' | 'received' | 'accepted' | 'rejected' | 'ready' | 'cancelled' | 'in-progress' | 'on-hold' | 'failed' | 'completed' | 'entered-in-error';
  intent?: 'unknown' | 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  description?: string;
  for?: FhirReference;
  owner?: FhirReference;
  executionPeriod?: { start?: string; end?: string };
  code?: { text?: string };
  focus?: FhirReference;
  authoredOn?: string;
  lastModified?: string;
  [key: string]: unknown;
}

/** FHIR Bundle (search result) */
export interface FhirBundle {
  resourceType: 'Bundle';
  type?: string;
  total?: number;
  entry?: Array<{ resource?: FhirPatient }>;
}
