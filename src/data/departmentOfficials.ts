import { useState, useEffect } from 'react';

export type DepartmentKey = 'architectural' | 'structural' | 'boq' | 'inspection' | 'commercial';

export interface DepartmentOfficial {
  id: string;
  role: string;
  name: string;
  title: string;
  regNumber?: string;
  action: string; // What this official did
  department: DepartmentKey;
  status: 'Completed' | 'Verified' | 'Approved & Stamped' | 'Pending';
  date: string;
}

export const DEFAULT_DEPARTMENT_OFFICIALS: Record<DepartmentKey, DepartmentOfficial[]> = {
  architectural: [
    {
      id: 'arch-off-1',
      department: 'architectural',
      role: 'Principal Concept & Space Planning',
      name: 'Arch. Alieu M. Sanyang',
      title: 'Lead Project Architect',
      regNumber: 'GIA-ARC-0142',
      action: 'Developed spatial layouts, client brief planning, room dimensions, facade architectural treatments, and municipal building zoning compliance.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'arch-off-2',
      department: 'architectural',
      role: 'Working Drawings & Architectural Drafter',
      name: 'Binta Badjie',
      title: 'Senior Architectural Technologist',
      regNumber: 'GIA-TECH-0089',
      action: 'Produced 1:100 architectural layout sheets, exterior front & rear elevations, longitudinal cross-sections X-X & Y-Y, and roof rainwater drainage layouts.',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'arch-off-3',
      department: 'architectural',
      role: 'Fenestration & Openings Register',
      name: 'Lamin Conteh',
      title: 'Architectural Joinery Specialist',
      regNumber: 'GIA-DRF-0210',
      action: 'Measured, specified, and scheduled all security doors, glazed sliding aluminum windows, ironmongery profiles, and daylight/ventilation ratios.',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'arch-off-4',
      department: 'architectural',
      role: 'Technical Review & Building Code Compliance',
      name: 'Arch. Ousman Touray',
      title: 'Senior Compliance Architect',
      regNumber: 'GIA-ARC-0098',
      action: 'Audited room clearances, staircase headroom, emergency exits, daylight cross-ventilation, and plot boundary municipal setback lines.',
      status: 'Verified',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'arch-off-5',
      department: 'architectural',
      role: 'Executive Sign-off & Permit Release',
      name: 'Alh. Musa Ceesay',
      title: 'Managing Director (Univision)',
      regNumber: 'GAM-DIR-001',
      action: 'Authorized official design release, corporate seal stamp, client presentation sign-off, and municipal building permit application endorsement.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
  ],

  structural: [
    {
      id: 'str-off-1',
      department: 'structural',
      role: 'Structural Analysis & Load Modeling',
      name: 'Engr. Modou Lamin Ceesay',
      title: 'Lead Structural & Civil Engineer',
      regNumber: 'GAM-COREN-STR-0412',
      action: 'Computed 3D load combinations (BS 8110:1997), column load take-downs, shear forces, bending moments, and foundation pad dimensions for 160 kN/m² soil.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'str-off-2',
      department: 'structural',
      role: 'Bar Bending (BBS) & Rebar Detailing',
      name: 'Mustapha Faye',
      title: 'Senior Structural Detailer',
      regNumber: 'GAM-ENG-DET-0315',
      action: 'Calculated bar cutting lengths, stirrup bends, bending schedules, and total reinforcement weight (16mm, 12mm, 10mm, 8mm high yield B500B steel).',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'str-off-3',
      department: 'structural',
      role: 'Geotechnical & Foundation Assessment',
      name: 'Engr. Ebrima Jobe',
      title: 'Geotechnical Specialist',
      regNumber: 'GAM-COREN-GEO-0199',
      action: 'Evaluated subsoil strata, coastal ground moisture resistance, foundation concrete cover requirements (50mm pad / 30mm beams), and plinth beams.',
      status: 'Verified',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'str-off-4',
      department: 'structural',
      role: 'Independent Peer Review & Safety Factor Audit',
      name: 'Engr. Pa Malick Sowe',
      title: 'Senior Engineering Consultant',
      regNumber: 'GAM-COREN-STR-0077',
      action: 'Audited deflection limits, crack width controls (w_max ≤ 0.3mm), lap lengths, and lateral wind load resistance (28 m/s basic coastal velocity).',
      status: 'Verified',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'str-off-5',
      department: 'structural',
      role: 'Professional Engineer Seal & Permit Stamp',
      name: 'Engr. Modou Lamin Ceesay',
      title: 'Lead Structural Engineer (Univision)',
      regNumber: 'GAM-COREN-STR-0412',
      action: 'Affixed official licensed engineering seal, certified calculations safety factors, and authorized municipal structural permit submission.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
  ],

  boq: [
    {
      id: 'boq-off-1',
      department: 'boq',
      role: 'Cost Estimation Head & BOQ Certification',
      name: 'Q.S. Sulayman Sonko',
      title: 'Chief Quantity Surveyor',
      regNumber: 'GIA-QS-2026-009',
      action: 'Directed project cost controls, audited preliminary overheads, vetted contingency allowances (5%), and certified measured bill pricing.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'boq-off-2',
      department: 'boq',
      role: 'Quantity Take-Off & Measured Works',
      name: 'Fatoumatta Darboe',
      title: 'Quantity Surveyor (Take-off Lead)',
      regNumber: 'GIA-QS-0155',
      action: 'Extracted exact physical measurements for Substructure excavation, Reinforced Concrete, Sandcrete blockwork, Roofing trusses, and Finishes.',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'boq-off-3',
      department: 'boq',
      role: 'Material Pricing & Market Rates Analyst',
      name: 'Momodou Bah',
      title: 'Cost Estimator & Procurement Analyst',
      regNumber: 'GAM-EST-0402',
      action: 'Costed cement bags, basalt aggregates, washed river sand, B500B high-yield rebar, timber profiles, and skilled Gambian masonry daily rates.',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'boq-off-4',
      department: 'boq',
      role: 'Commercial Risk & Margins Auditor',
      name: 'Q.S. Mariama Jarju',
      title: 'Commercial Contracts Manager',
      regNumber: 'GIA-QS-0081',
      action: 'Audited contractor margin percentages (10%), tender preliminaries, insurance allocations, and client stage payment cash-flow distributions.',
      status: 'Verified',
      date: new Date().toISOString().split('T')[0],
    },
  ],

  inspection: [
    {
      id: 'ins-off-1',
      department: 'inspection',
      role: 'Lead Field Auditor & Physical Walkthrough',
      name: 'Engr. L. Bojang',
      title: 'Senior Structural & Site Inspection Engineer',
      regNumber: 'GAM-COREN-CIV-0891',
      action: 'Conducted rigorous on-site audit of foundation excavations, reinforcement cage alignment, rebar spacing, and formwork verticality.',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'ins-off-2',
      department: 'inspection',
      role: 'Quality Control & Materials Inspector',
      name: 'Bakary Sanyang',
      title: 'Materials Testing & Quality Inspector',
      regNumber: 'GAM-QC-0234',
      action: 'Inspected 50mm spacer cover blocks, checked rebar rust/cleanliness, verified blockwork mortar bed thickness, and monitored concrete batch slump.',
      status: 'Verified',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'ins-off-3',
      department: 'inspection',
      role: 'Health, Safety & Municipal Setbacks Officer',
      name: 'Sainey Manneh',
      title: 'HSE & Compliance Specialist',
      regNumber: 'NEBOSH-GAM-0518',
      action: 'Audited mandatory worker PPE, excavation trench safety, perimeter boundary setback dimensions, and environmental waste containment.',
      status: 'Verified',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'ins-off-4',
      department: 'inspection',
      role: 'Director of Field Engineering / Final Signatory',
      name: 'Engr. Modou Lamin Ceesay',
      title: 'Director of Engineering & Technical Signatory',
      regNumber: 'GAM-COREN-STR-0412',
      action: 'Reviewed overall inspection score, checked resolution of punch list items, stamped the official certificate, and approved concrete pour clearance.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
  ],

  commercial: [
    {
      id: 'com-off-1',
      department: 'commercial',
      role: 'Commercial Billing & Invoicing Specialist',
      name: 'Isatou Jobe',
      title: 'Finance & Contracts Officer',
      regNumber: 'GAM-ACC-0388',
      action: 'Formulated commercial invoices, milestone breakdown schedules, Gambian Dalasi currency accounting, and official banking remittance references.',
      status: 'Completed',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'com-off-2',
      department: 'commercial',
      role: 'Executive Director & Corporate Signatory',
      name: 'Alh. Musa Ceesay',
      title: 'Managing Director (Univision)',
      regNumber: 'GAM-DIR-001',
      action: 'Authorized contractual terms, issued contractor warranty commitments, and executed official corporate signature on client agreements.',
      status: 'Approved & Stamped',
      date: new Date().toISOString().split('T')[0],
    },
  ],
};

const STORAGE_KEY = 'univision_department_officials_v1';

export function getStoredOfficials(): Record<DepartmentKey, DepartmentOfficial[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          architectural: parsed.architectural || DEFAULT_DEPARTMENT_OFFICIALS.architectural,
          structural: parsed.structural || DEFAULT_DEPARTMENT_OFFICIALS.structural,
          boq: parsed.boq || DEFAULT_DEPARTMENT_OFFICIALS.boq,
          inspection: parsed.inspection || DEFAULT_DEPARTMENT_OFFICIALS.inspection,
          commercial: parsed.commercial || DEFAULT_DEPARTMENT_OFFICIALS.commercial,
        };
      }
    }
  } catch {}
  return DEFAULT_DEPARTMENT_OFFICIALS;
}

export function saveStoredOfficials(officials: Record<DepartmentKey, DepartmentOfficial[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(officials));
    window.dispatchEvent(new Event('univision_officials_updated'));
  } catch (e) {
    console.warn('Failed to save officials to storage', e);
  }
}

export function useDepartmentOfficials(department?: DepartmentKey) {
  const [allOfficials, setAllOfficials] = useState<Record<DepartmentKey, DepartmentOfficial[]>>(getStoredOfficials);

  useEffect(() => {
    const handleUpdate = () => {
      setAllOfficials(getStoredOfficials());
    };
    window.addEventListener('univision_officials_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('univision_officials_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateOfficial = (
    dept: DepartmentKey,
    id: string,
    updates: Partial<DepartmentOfficial>
  ) => {
    setAllOfficials((prev) => {
      const updatedList = (prev[dept] || []).map((off) => (off.id === id ? { ...off, ...updates } : off));
      const next = { ...prev, [dept]: updatedList };
      saveStoredOfficials(next);
      return next;
    });
  };

  const addOfficial = (dept: DepartmentKey, newOfficial: Omit<DepartmentOfficial, 'id' | 'department'>) => {
    setAllOfficials((prev) => {
      const created: DepartmentOfficial = {
        ...newOfficial,
        id: `${dept}-off-${Date.now()}`,
        department: dept,
      };
      const next = { ...prev, [dept]: [...(prev[dept] || []), created] };
      saveStoredOfficials(next);
      return next;
    });
  };

  const deleteOfficial = (dept: DepartmentKey, id: string) => {
    setAllOfficials((prev) => {
      const next = { ...prev, [dept]: (prev[dept] || []).filter((off) => off.id !== id) };
      saveStoredOfficials(next);
      return next;
    });
  };

  const resetToDefaults = (dept?: DepartmentKey) => {
    if (dept) {
      setAllOfficials((prev) => {
        const next = { ...prev, [dept]: DEFAULT_DEPARTMENT_OFFICIALS[dept] };
        saveStoredOfficials(next);
        return next;
      });
    } else {
      setAllOfficials(DEFAULT_DEPARTMENT_OFFICIALS);
      saveStoredOfficials(DEFAULT_DEPARTMENT_OFFICIALS);
    }
  };

  return {
    allOfficials,
    officials: department ? allOfficials[department] || [] : [],
    updateOfficial,
    addOfficial,
    deleteOfficial,
    resetToDefaults,
  };
}
