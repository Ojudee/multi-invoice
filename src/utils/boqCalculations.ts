import { BOQProject, BOQCalculationSummary, BOQSectionCode } from '../types/boq';

export function calculateBOQ(project: BOQProject): BOQCalculationSummary {
  const sectionTotals: Record<BOQSectionCode, number> = {
    'SEC-01': 0,
    'SEC-02': 0,
    'SEC-03': 0,
    'SEC-04': 0,
    'SEC-05': 0,
    'SEC-06': 0,
    'SEC-07': 0,
    'SEC-08': 0,
    'SEC-09': 0,
  };

  for (const item of project.items) {
    const total = Math.round((Number(item.quantity) || 0) * (Number(item.unitRate) || 0));
    if (sectionTotals[item.sectionCode] !== undefined) {
      sectionTotals[item.sectionCode] += total;
    }
  }

  const subtotal = Object.values(sectionTotals).reduce((sum, val) => sum + val, 0);

  const contingencyPercent = Math.max(0, Math.min(100, Number(project.contingencyPercent) || 0));
  const contingencyAmount = Math.round((subtotal * contingencyPercent) / 100);

  const contractorMarginPercent = Math.max(0, Math.min(100, Number(project.contractorMarginPercent) || 0));
  const contractorMarginAmount = Math.round((subtotal * contractorMarginPercent) / 100);

  const subtotalWithOverheads = subtotal + contingencyAmount + contractorMarginAmount;

  const discountPercent = Math.max(0, Math.min(100, Number(project.discountPercent) || 0));
  const discountAmount = Math.round((subtotalWithOverheads * discountPercent) / 100);
  const afterDiscount = Math.max(0, subtotalWithOverheads - discountAmount);

  const taxPercent = Math.max(0, Math.min(100, Number(project.taxPercent) || 0));
  const taxAmount = Math.round((afterDiscount * taxPercent) / 100);

  const grandTotal = afterDiscount + taxAmount;

  const grossArea = Number(project.grossFloorArea) || 1;
  const costPerSqm = grossArea > 0 ? Math.round(grandTotal / grossArea) : 0;

  const sectionPercentages: Record<BOQSectionCode, number> = {} as any;
  for (const [code, val] of Object.entries(sectionTotals) as [BOQSectionCode, number][]) {
    sectionPercentages[code] = subtotal > 0 ? Number(((val / subtotal) * 100).toFixed(1)) : 0;
  }

  return {
    subtotal,
    contingencyAmount,
    contractorMarginAmount,
    taxAmount,
    discountAmount,
    grandTotal,
    costPerSqm,
    sectionTotals,
    sectionPercentages,
  };
}

export function exportBOQToCSV(project: BOQProject): void {
  const calculations = calculateBOQ(project);
  const rows: string[][] = [];

  // Header information
  rows.push(['UNIVISION DESIGN AND CONSTRUCTION LTD']);
  rows.push(['BILL OF QUANTITIES (BOQ) COST ESTIMATE SCHEDULE']);
  rows.push(['Project Number:', project.boqNumber]);
  rows.push(['Project Title:', `"${project.title.replace(/"/g, '""')}"`]);
  rows.push(['Client Name:', `"${project.clientName.replace(/"/g, '""')}"`]);
  rows.push(['Site Location:', `"${project.projectAddress}, ${project.cityRegion}"`]);
  rows.push(['Gross Floor Area:', `${project.grossFloorArea} m²`]);
  rows.push(['Currency:', project.currency]);
  rows.push(['Date Generated:', project.date]);
  rows.push([]);

  // Table Columns
  rows.push(['Item No.', 'Work Section', 'Description', 'Unit', 'Quantity', `Unit Rate (${project.currency})`, `Total Amount (${project.currency})`]);

  for (const item of project.items) {
    const total = Math.round((item.quantity || 0) * (item.unitRate || 0));
    rows.push([
      `"${item.itemNumber}"`,
      `"${item.sectionCode}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.unit}"`,
      `${item.quantity}`,
      `${item.unitRate}`,
      `${total}`,
    ]);
  }

  rows.push([]);
  rows.push(['', '', '', '', '', 'Subtotal (Measured Works):', `${calculations.subtotal}`]);
  rows.push(['', '', '', '', '', `Contingency Reserve (${project.contingencyPercent}%):`, `${calculations.contingencyAmount}`]);
  rows.push(['', '', '', '', '', `Contractor Margin & Profit (${project.contractorMarginPercent}%):`, `${calculations.contractorMarginAmount}`]);
  if (project.discountPercent > 0) {
    rows.push(['', '', '', '', '', `Negotiated Discount (${project.discountPercent}%):`, `-${calculations.discountAmount}`]);
  }
  if (project.taxPercent > 0) {
    rows.push(['', '', '', '', '', `VAT / Statutory Tax (${project.taxPercent}%):`, `${calculations.taxAmount}`]);
  }
  rows.push(['', '', '', '', '', 'GRAND TOTAL PROJECT ESTIMATE:', `${calculations.grandTotal}`]);
  rows.push(['', '', '', '', '', 'Estimated Cost Per Square Metre:', `${calculations.costPerSqm} ${project.currency}/m²`]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${project.boqNumber}_Univision_BOQ.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
