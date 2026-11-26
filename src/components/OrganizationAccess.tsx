import { FormEvent, useState } from 'react';
import { Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import {
  AuthData,
  OrganizationAccount,
  Organization,
  WorkspaceData,
  addOrganization,
  addOrganizationMember,
  authenticate,
  registerFirstAdmin,
} from '../services/organizationAuth';
import { DEFAULT_COMPANY } from '../data/constants';
import { CompanyInfo } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400';
const buttonClass = 'rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50';

interface AccessProps {
  onAuthenticated: (workspace: WorkspaceData) => void;
  initialError?: string;
  authenticatedWithoutOrganization?: boolean;
  onLogout?: () => void;
}

export function OrganizationAccess({
  onAuthenticated,
  initialError = '',
  authenticatedWithoutOrganization = false,
  onLogout,
}: AccessProps) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (isRegistering) {
        const result = await registerFirstAdmin(name, email, password);
        if (result.workspace) {
          onAuthenticated(result.workspace);
        } else {
          setNotice(
            result.confirmationRequired
              ? 'Check your email to confirm your account, then sign in.'
              : 'Account created. Sign in once your account is ready.'
          );
        }
      } else {
        const workspace = await authenticate(email, password);
        onAuthenticated(workspace);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  };

  if (authenticatedWithoutOrganization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <section className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
          <Building2 className="mx-auto h-9 w-9 text-amber-300" />
          <h1 className="text-xl font-extrabold text-white">Waiting for organization access</h1>
          <p className="text-sm leading-relaxed text-slate-300">Your account is registered, but it is not a member of an organization yet. Ask an organization administrator to add this email address, then sign in again.</p>
          {initialError && <p role="alert" className="text-sm text-rose-200">{initialError}</p>}
          <button type="button" className={buttonClass} onClick={onLogout}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-amber-400/10 p-3 text-amber-300"><Building2 className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">SAQ Multi-Invoice</p>
            <h1 className="mt-1 text-xl font-extrabold text-white">{isRegistering ? 'Create account' : 'Sign in'}</h1>
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-100">
            Server authentication is not configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the deployment environment, then apply the Supabase database migration described in the README.
          </div>
        ) : (
          <>
            <form className="space-y-4" onSubmit={submit}>
              {isRegistering && (
                <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                  Your name
                  <input className={fieldClass} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
              )}
              <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                Email
                <input className={fieldClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-300">
                Password
                <span className="relative block">
                  <input
                    className={`${fieldClass} pr-12`}
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={10}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-white"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={passwordVisible}
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {isRegistering && <span className="block text-[11px] text-slate-400">At least 10 characters.</span>}
              </label>
              {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
              {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm leading-relaxed text-emerald-100">{notice}</p>}
              <button className={`${buttonClass} w-full`} disabled={busy}>
                {busy ? 'Please wait…' : isRegistering ? 'Sign up' : 'Sign in'}
              </button>
            </form>
            <button
              type="button"
              className="mt-4 w-full text-center text-sm font-semibold text-amber-300 hover:text-amber-200"
              onClick={() => { setIsRegistering((current) => !current); setError(''); setNotice(''); }}
            >
              {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
            {initialError && !error && <p role="alert" className="mt-4 text-sm text-rose-200">{initialError}</p>}
          </>
        )}
      </section>
    </main>
  );
}

interface ManagerProps {
  data: AuthData;
  account: OrganizationAccount;
  organization: Organization;
  onClose: () => void;
  onDataChanged: () => void;
  onSwitch: (organization: Organization) => void;
}

export function OrganizationManager({ data, account, organization, onClose, onDataChanged, onSwitch }: ManagerProps) {
  const [orgName, setOrgName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const company: CompanyInfo = {
    ...DEFAULT_COMPANY,
    name: companyName.trim() || orgName.trim(),
    tagline: companyTagline.trim(),
    phone: companyPhone.trim(),
    email: companyEmail.trim(),
    address: companyAddress.trim(),
  };
  const members = data.accounts.filter((candidate) =>
    candidate.memberships.some((membership) => membership.organizationId === organization.id)
  );

  const submit = async (event: FormEvent, action: 'organization' | 'member') => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (action === 'organization') {
        const created = await addOrganization(account.id, organization.id, orgName, company);
        onDataChanged();
        onSwitch(created);
        return;
      }
      await addOrganizationMember(account.id, organization.id, '', memberEmail, '');
      setMemberEmail('');
      onDataChanged();
      setNotice('Registered account added as an organization member.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to complete this action.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="organization-manager-title">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Organization admin</p>
            <h2 id="organization-manager-title" className="mt-1 text-xl font-bold text-white">{organization.name}</h2>
          </div>
          <button className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <form onSubmit={(event) => submit(event, 'organization')} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="font-bold text-white">Create organization</h3>
            <p className="text-xs text-slate-400">You become its admin. Its invoices and portal data start separately.</p>
            <input className={fieldClass} placeholder="Organization name" value={orgName} onChange={(event) => setOrgName(event.target.value)} required />
            <input className={fieldClass} placeholder="Company display name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
            <input className={fieldClass} placeholder="Company tagline" value={companyTagline} onChange={(event) => setCompanyTagline(event.target.value)} />
            <input className={fieldClass} placeholder="Company phone" value={companyPhone} onChange={(event) => setCompanyPhone(event.target.value)} />
            <input className={fieldClass} type="email" placeholder="Company email" value={companyEmail} onChange={(event) => setCompanyEmail(event.target.value)} />
            <input className={fieldClass} placeholder="Company address" value={companyAddress} onChange={(event) => setCompanyAddress(event.target.value)} />
            <button className={buttonClass} disabled={busy}>Create and switch</button>
          </form>
          <form onSubmit={(event) => submit(event, 'member')} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="font-bold text-white">Add organization member</h3>
            <p className="text-xs text-slate-400">The person must sign up first. Enter the same email address used for their account.</p>
            <input className={fieldClass} type="email" placeholder="Registered account email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} required />
            <button className={buttonClass} disabled={busy}>Add member</button>
          </form>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</p>}
        <div className="mt-5 border-t border-slate-800 pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-amber-300" />Organization accounts</h3>
          <ul className="divide-y divide-slate-800">
            {members.map((member) => {
              const role = member.memberships.find((membership) => membership.organizationId === organization.id)?.role;
              return <li key={member.id} className="flex justify-between gap-3 py-2 text-sm"><span className="text-slate-200">{member.name} <span className="text-slate-400">({member.email})</span></span><span className="text-xs font-semibold uppercase text-amber-300">{role}</span></li>;
            })}
          </ul>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">The server verifies administrator permissions for organization and member changes. Keep database policies enabled and never put a Supabase service-role key in the frontend.</p>
      </section>
    </div>
  );
}
