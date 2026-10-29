import React, { useState } from 'react';
import {
  DepartmentKey,
  DepartmentOfficial,
  useDepartmentOfficials,
} from '../data/departmentOfficials';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Edit3,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  UserCheck,
} from 'lucide-react';

interface DepartmentOfficialsCardProps {
  department: DepartmentKey;
  title?: string;
  isPrintVersion?: boolean;
  className?: string;
}

export function DepartmentOfficialsCard({
  department,
  title = 'Department Officials & Task Attribution (Who Did What)',
  isPrintVersion = false,
  className = '',
}: DepartmentOfficialsCardProps) {
  const { officials, updateOfficial, addOfficial, deleteOfficial, resetToDefaults, saveStatus } =
    useDepartmentOfficials(department);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // If print version, render clean official stamps and attribution block
  if (isPrintVersion) {
    return (
      <div className={`border-t border-b border-slate-300 py-3 my-4 font-sans text-slate-800 ${className}`}>
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              DEPARTMENT OFFICIALS & RESPONSIBILITY AUDIT SIGN-OFF
            </span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">
            Univision Design & Construction Ltd • ISO 9001 Compliance
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          {officials.map((off) => (
            <div
              key={off.id}
              className="bg-slate-50/80 border border-slate-200 rounded p-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-[10px] text-blue-900 leading-tight">
                    {off.role}
                  </span>
                  <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                    {off.status}
                  </span>
                </div>
                <div className="font-black text-slate-950 text-[11px] leading-tight">
                  {off.name}
                </div>
                <div className="text-[9px] text-slate-600 font-medium leading-tight mt-0.5">
                  {off.title} {off.regNumber ? `• Reg: ${off.regNumber}` : ''}
                </div>
                <div className="text-[9px] text-slate-700 italic mt-1.5 pt-1 border-t border-slate-200/80 leading-normal">
                  <strong className="not-italic text-slate-900 font-semibold">Action Performed: </strong>
                  {off.action}
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                <span>Date: {off.date}</span>
                <span className="text-emerald-700 font-bold">✓ Signed & Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Interactive on-screen card
  return (
    <div
      className={`bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-xl space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-900/60 border border-blue-500/40 rounded-lg text-blue-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-semibold border border-blue-500/30">
                {officials.length} Assigned Officials
              </span>
              <span
                role="status"
                className={`text-[10px] font-semibold ${saveStatus === 'saved' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {saveStatus === 'saved' ? 'Saved locally' : 'Save failed'}
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Clear attribution of duties, professional licenses, and certified actions for this department.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isEditing
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Staff Attribution'}</span>
          </button>

          {isEditing && (
            <>
              <button
                type="button"
                onClick={() =>
                  addOfficial(department, {
                    role: 'New Technical Role',
                    name: 'Official Full Name',
                    title: 'Title / Qualification',
                    regNumber: 'REG-2026-000',
                    action: 'Specific technical duty performed for this project.',
                    status: 'Completed',
                    date: new Date().toISOString().split('T')[0],
                  })
                }
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Add an official to this department"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Official</span>
              </button>

              <button
                type="button"
                onClick={() => resetToDefaults(department)}
                className="px-2.5 py-1.5 bg-slate-750 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                title="Reset to Univision standard personnel list"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid of Officials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {officials.map((off) => {
          const isCurrentEditing = isEditing && editingId === off.id;

          return (
            <div
              key={off.id}
              className={`rounded-xl p-3 border transition-all ${
                off.status === 'Approved & Stamped'
                  ? 'bg-gradient-to-br from-slate-900 to-blue-950/40 border-blue-500/40'
                  : 'bg-slate-900/90 border-slate-750'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                  {off.role}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                      off.status === 'Approved & Stamped'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                        : off.status === 'Verified'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {off.status === 'Approved & Stamped' ? (
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                    ) : off.status === 'Verified' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{off.status}</span>
                  </span>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => deleteOfficial(department, off.id)}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/50 rounded transition cursor-pointer"
                      title="Remove this official"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Name</label>
                    <input
                      type="text"
                      value={off.name}
                      onChange={(e) => updateOfficial(department, off.id, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Title</label>
                      <input
                        type="text"
                        value={off.title}
                        onChange={(e) => updateOfficial(department, off.id, { title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Reg / License No</label>
                      <input
                        type="text"
                        value={off.regNumber || ''}
                        onChange={(e) => updateOfficial(department, off.id, { regNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">What this official did (Action)</label>
                    <textarea
                      rows={2}
                      value={off.action}
                      onChange={(e) => updateOfficial(department, off.id, { action: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Status</label>
                      <select
                        value={off.status}
                        onChange={(e) =>
                          updateOfficial(department, off.id, {
                            status: e.target.value as any,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="Completed">Completed</option>
                        <option value="Verified">Verified</option>
                        <option value="Approved & Stamped">Approved & Stamped</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Date</label>
                      <input
                        type="date"
                        value={off.date}
                        onChange={(e) => updateOfficial(department, off.id, { date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-white text-sm leading-tight flex items-center justify-between">
                    <span>{off.name}</span>
                    {off.regNumber && (
                      <span className="text-[10px] font-mono text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/60">
                        {off.regNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {off.title}
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded p-2 text-[11px] text-slate-300 leading-relaxed mt-1">
                    <span className="text-amber-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                      Task Executed:
                    </span>
                    {off.action}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Executed: {off.date}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Award className="w-3 h-3" /> Certified
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
