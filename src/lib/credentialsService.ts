import supabase from './supabase';

import type { CredentialType } from './CredentialType';

export interface Credential {
  id?: number;
  _id?: string;
  createdAt?: string;
  created_at?: string;
  name: string;
  entity: string;
  status: string;
  type: string;
  expiry_date?: string;
  issueDate?: string;
  remainingDays?: number;
  issuingInstitute?: string;
  imageUrl?: string;
  assigned?: string;
  owner?: string;
  credential_number?: string;
  date_of_issue?: string;
  state?: string;
  country?: string;
  city?: string;
  image_url?: string;
  file_url?: string;
  fileUrl?: string;
  issuing_institution?: string;
  additional_notes?: string;
  credential_expire?: string;
}

type InsertCredentialRow = Omit<CredentialRow, 'id' | 'created_at'>;

interface CredentialRow {
  id: number;
  created_at: string;
  name: string;
  entity: string;
  status: string;
  type: string;
  expiry_date?: string;
  date_of_issue?: string;
  remainingDays?: number;
  issuingInstitute?: string;
  image_url?: string;
  assigned?: string;
  owner?: string;
  credential_number?: string;
  state?: string;
  country?: string;
  city?: string;
  file_url?: string;
  issuing_institution?: string;
  additional_notes?: string;
  credential_expire?: string;
}

// Helper function to ensure valid session
async function ensureValidSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }

  if (!session) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error('No active session');
    }
    return refreshData.session;
  }

  return session;
}

// Helper to normalize row to Credential
function normalizeCredential(row: CredentialRow): Credential {
  return {
    ...row,
    createdAt: row.created_at,
  };
}

// Credentials operations
export const credentialsService = {
  // NEW: Credential Types
  async getCredentialTypes(): Promise<CredentialType[]> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('credential_types')
      .select('id,name,created_at')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createCredentialType(name: string): Promise<CredentialType> {
    await ensureValidSession();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      throw new Error('Credential type name must be at least 2 characters');
    }

    const { data, error } = await supabase
      .from('credential_types')
      .insert({ name: trimmed })
      .select('id,name,created_at')
      .single();

    if (error) throw error;
    return data;
  },

  // Existing credential operations
  async getCredentials(): Promise<Credential[]> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = (data || []) as CredentialRow[];
    return rows.map(normalizeCredential);
  },

  async getCredentialById(id: string | number): Promise<Credential | null> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return normalizeCredential(data as CredentialRow);
  },

  async createCredential(credentialData: Omit<Credential, '_id' | 'createdAt' | 'created_at'>): Promise<Credential> {
    await ensureValidSession();

    // Truncate string fields to safe length
    const safeData = { ...credentialData } as Record<string, unknown>;

    (Object.keys(safeData) as (keyof Credential)[]).forEach((key) => {
      const value = safeData[key];
      if (typeof value === 'string' && value.length > 250) {
        safeData[key] = value.slice(0, 250);
      }
    });

    const { data, error }: { data: CredentialRow | null; error: unknown } = await supabase
      .from('credentials')
.insert([safeData as InsertCredentialRow])
      .select()
      .maybeSingle();


    if (error) throw error;
    if (!data) throw new Error('Failed to create credential');
    return normalizeCredential(data);
  },

  async updateCredential(id: string | number, updates: Partial<Credential>): Promise<Credential> {
    await ensureValidSession();

    // Truncate string fields in updates
    const safeUpdates = { ...updates } as Record<string, unknown>;

    (Object.keys(safeUpdates) as (keyof Credential)[]).forEach((key) => {
      const value = safeUpdates[key];
      if (typeof value === 'string' && value.length > 250) {
        safeUpdates[key] = value.slice(0, 250);
      }
    });

    const { data, error }: { data: CredentialRow | null; error: unknown } = await supabase
      .from('credentials')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();


    if (error) throw error;
    if (!data) throw new Error('Credential not found');
    return normalizeCredential(data);
  },

  async deleteCredential(id: string | number): Promise<void> {
    await ensureValidSession();
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async migrateCredentials(localCredentials: Credential[]): Promise<void> {
    await ensureValidSession();

    const batchSize = 10;
    for (let i = 0; i < localCredentials.length; i += batchSize) {
      const batch = localCredentials.slice(i, i + batchSize).map((c) => {
const safe: Record<string, unknown> = { ...c };
        Object.keys(safe).forEach((key) => {
          if (typeof safe[key] === 'string' && safe[key].length > 250) {
            safe[key] = safe[key].slice(0, 250);
          }
        });
        return safe;
      });
      const { error } = await supabase
        .from('credentials')
        .insert(batch);

      if (error) throw error;
    }
  },

  async getEntitiesWithLatestCredentials(): Promise<{ entity: string; latestCredential: Credential }[]> {
    await ensureValidSession();
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const entityMap = new Map<string, Credential>();
    const rows = (data || []) as CredentialRow[];
    rows.map(normalizeCredential).forEach((credential) => {
      if (credential.entity && !entityMap.has(credential.entity)) {
        entityMap.set(credential.entity, credential);
      }
    });

    return Array.from(entityMap.entries()).map(([entity, latestCredential]) => ({
      entity,
      latestCredential
    }));
  },

  async getEntitiesWithLatestCredentialsByType(type?: string): Promise<{ entity: string; latestCredential: Credential }[]> {
    await ensureValidSession();
    let query = supabase.from('credentials').select('*').order('created_at', { ascending: false });
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;

    const entityMap = new Map<string, Credential>();
    const rows = (data || []) as CredentialRow[];
    rows.map(normalizeCredential).forEach((credential) => {
      if (credential.entity && !entityMap.has(credential.entity)) {
        entityMap.set(credential.entity, credential);
      }
    });

    return Array.from(entityMap.entries()).map(([entity, latestCredential]) => ({
      entity,
      latestCredential
    }));
  }
};

