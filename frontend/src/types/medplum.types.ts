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

/** FHIR Bundle (search result) */
export interface FhirBundle {
  resourceType: 'Bundle';
  type?: string;
  total?: number;
  entry?: Array<{ resource?: FhirPatient }>;
}
