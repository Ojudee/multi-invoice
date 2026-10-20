import React, { useState } from 'react';
import {
  DepartmentKey,
  useDepartmentOfficials,
} from '../data/departmentOfficials';
import { DepartmentOfficialsCard } from './DepartmentOfficialsCard';
import {
  X,
  Users,
  Compass,
  Building2,
  FileSpreadsheet,
  HardHat,
  Receipt,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DepartmentOfficialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDepartment?: DepartmentKey;
}

const DEPT_TABS: { key: DepartmentKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'architectural', label: '01 Architectural', icon: Compass },
  { key: 'structural', label: '02 Structural', icon: Building2 },
  { key: 'boq', label: '03 BOQ & Cost', icon: FileSpreadsheet },
  { key: 'inspection', label: '04 Site Inspection', icon: HardHat },
  { key: 'commercial', label: '05 Commercial & Invoicing', icon: Receipt },
];

export function DepartmentOfficialsModal({
  isOpen,
  onClose,
  initialDepartment = 'architectural',
}: DepartmentOfficialsModalProps) {
  const [selectedDept, setSelectedDept] = useState<DepartmentKey>(initialDepartment);
  const { allOfficials, resetToDefaults } = useDepartmentOfficials();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0b2341] px-6 py-4 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>UNIVISION OFFICIAL PERSONNEL & TASK MATRIX</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30 uppercase tracking-widest">
                  WHO DID WHAT
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Official staff assignment, licensing credentials, and certified execution log across all 5 departments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Department Switcher Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {DEPT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedDept === tab.key;
            const count = allOfficials[tab.key]?.length || 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedDept(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <DepartmentOfficialsCard
            department={selectedDept}
            title={`${DEPT_TABS.find((t) => t.key === selectedDept)?.label} — Official Roster & Actions`}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All entries are permanently included in official export packages and permit sheets.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => resetToDefaults(selectedDept)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Department</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
