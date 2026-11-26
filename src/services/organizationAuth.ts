import { CompanyInfo } from '../types';
import { requireSupabase } from './supabaseClient';

export interface Organization {
  id: string;
  name: string;
  company: CompanyInfo;
  createdAt: string;
}

export type OrganizationRole = 'admin' | 'member';

export interface Membership {
  organizationId: string;
  role: OrganizationRole;
}

export interface OrganizationAccount {
  id: string;
  name: string;
  email: string;
  memberships: Membership[];
}

export interface AuthData {
  version: 1;
  organizations: Organization[];
  accounts: OrganizationAccount[];
}

export interface WorkspaceData {
  account: OrganizationAccount;
  organizations: Organization[];
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function relationRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function mapOrganization(value: unknown): Organization {
  if (typeof value !== 'object' || value === null) {
    throw new Error('The server returned an invalid organization record.');
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.company !== 'object' ||
    row.company === null
  ) {
    throw new Error('The server returned an invalid organization record.');
  }
  return {
    id: row.id,
    name: row.name,
    company: row.company as CompanyInfo,
    createdAt: row.created_at,
  };
}

export async function registerFirstAdmin(
  name: string,
  email: string,
  password: string
): Promise<{ workspace: WorkspaceData | null; confirmationRequired: boolean }> {
  if (!name.trim()) throw new Error('Enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email address.');
  if (password.length < 10) throw new Error('Use a password with at least 10 characters.');

  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: name.trim() } },
  });
  throwIfError(error);

  if (!data.session) {
    return { workspace: null, confirmationRequired: true };
  }

  return { workspace: await loadCurrentWorkspace(), confirmationRequired: false };
}

export async function authenticate(email: string, password: string): Promise<WorkspaceData> {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  throwIfError(error);
  const workspace = await loadCurrentWorkspace();
  if (!workspace) throw new Error('Your session has expired. Sign in again.');
  return workspace;
}

export async function loadCurrentWorkspace(): Promise<WorkspaceData | null> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  throwIfError(sessionError);
  if (!sessionData.session) return null;

  const { data: userData, error: userError } = await client.auth.getUser();
  throwIfError(userError);
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }] = await Promise.all([
    client.from('profiles').select('full_name,email').eq('id', user.id).maybeSingle(),
    client
      .from('memberships')
      .select('organization_id,role,organizations(id,name,company,created_at)')
      .eq('user_id', user.id),
  ]);
  throwIfError(profileError);
  throwIfError(membershipError);

  const organizations = (memberships || [])
    .flatMap((row) => relationRows(row.organizations))
    .map((row) => mapOrganization(row));
  const account: OrganizationAccount = {
    id: user.id,
    name: profile?.full_name || String(user.user_metadata?.full_name || user.email || 'Account'),
    email: profile?.email || user.email || '',
    memberships: (memberships || []).map((row) => ({
      organizationId: row.organization_id,
      role: row.role as OrganizationRole,
    })),
  };

  return { account, organizations };
}

export async function loadOrganizationAdminData(organizationId: string): Promise<AuthData> {
  const client = requireSupabase();
  const [{ data: organizationRows, error: organizationError }, { data: memberRows, error: memberError }] =
    await Promise.all([
      client
        .from('organizations')
        .select('id,name,company,created_at')
        .eq('id', organizationId),
      client
        .from('memberships')
        .select('user_id,role,profiles(id,full_name,email)')
        .eq('organization_id', organizationId),
    ]);
  throwIfError(organizationError);
  throwIfError(memberError);

  const organizations = (organizationRows || []).map(mapOrganization);
  const accounts = (memberRows || [])
    .map((row) => {
      const profileValue = relationRows(row.profiles)[0];
      if (typeof profileValue !== 'object' || profileValue === null) return null;
      const profile = profileValue as Record<string, unknown>;
      if (
        typeof profile.id !== 'string' ||
        typeof profile.full_name !== 'string' ||
        typeof profile.email !== 'string'
      ) return null;
      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        memberships: [{ organizationId, role: row.role as OrganizationRole }],
      };
    })
    .filter((account): account is OrganizationAccount => account !== null);

  return { version: 1, organizations, accounts };
}

export async function addOrganization(
  _accountId: string,
  sourceOrganizationId: string,
  name: string,
  company: CompanyInfo
): Promise<Organization> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('create_organization', {
    source_organization_id: sourceOrganizationId,
    organization_name: name.trim(),
    company_profile: company,
  });
  throwIfError(error);
  if (!data) throw new Error('The server did not return the new organization.');
  return mapOrganization(data);
}

export async function addOrganizationMember(
  _actorAccountId: string,
  organizationId: string,
  _name: string,
  email: string,
  _password: string
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.rpc('add_organization_member', {
    p_organization_id: organizationId,
    p_email: email.trim().toLowerCase(),
  });
  throwIfError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  throwIfError(error);
}
