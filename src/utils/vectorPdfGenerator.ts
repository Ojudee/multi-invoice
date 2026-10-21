import jsPDF from 'jspdf';
import { Invoice } from '../types';
import { calculateInvoice, formatCurrency, formatDateToSlash } from './calculations';

/**
 * Pure vector jsPDF invoice generator.
 * Does NOT rely on html2canvas or DOM rendering, making it 100% immune to
 * CSS errors, iframe sandboxing, tainted canvases, or cross-origin issues.
 */
export function generateUnivisionPDF(invoice: Invoice): boolean {
  try {
    const calculations = calculateInvoice(invoice);
    const formattedDate = formatDateToSlash(invoice.date);
    const currency = invoice.currency;
    const unit = invoice.unit;

    // Create A4 portrait document (210 x 297 mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const primaryNavy: [number, number, number] = [11, 35, 65];     // #0b2341
    const secondaryBlue: [number, number, number] = [19, 56, 99];   // #133863
    const brandGold: [number, number, number] = [194, 120, 3];      // #c27803
    const lightGray: [number, number, number] = [248, 250, 252];    // #f8fafc
    const textDark: [number, number, number] = [30, 41, 59];        // #1e293b
    const textMuted: [number, number, number] = [100, 116, 139];    // #64748b
    const borderGray: [number, number, number] = [203, 213, 225];   // #cbd5e1

    // ==========================================
    // 1. TOP HEADER SECTION (y: 10 - 28 mm)
    // ==========================================

    // Official Univision Vector Logo (x: 10, y: 9)
    const lx = 10;
    const ly = 9;

    // Twin Towers
    // Left Charcoal Tower
    doc.setFillColor(62, 62, 62);
    doc.triangle(lx + 4, ly + 1.2, lx + 5.7, ly + 0.2, lx + 5.7, ly + 4.5, 'F');
    doc.rect(lx + 4, ly + 1.2, 1.7, 3.3, 'F');

    // Right Gold Tower
    doc.setFillColor(...brandGold);
    doc.triangle(lx + 5.9, ly + 0.2, lx + 7.6, ly + 1.2, lx + 5.9, ly + 4.5, 'F');
    doc.rect(lx + 5.9, ly + 1.2, 1.7, 3.3, 'F');

    // Navy Gabled Roof
    doc.setFillColor(...primaryNavy);
    doc.triangle(lx + 5.8, ly + 2.5, lx + 8, ly + 4.5, lx + 3.6, ly + 4.5, 'F');

    // Gold Eave Trim
    doc.setFillColor(...brandGold);
    doc.triangle(lx + 5.8, ly + 3.6, lx + 7.4, ly + 4.8, lx + 4.2, ly + 4.8, 'F');

    // 4 Gold Windows
    doc.rect(lx + 5.1, ly + 5.2, 0.6, 0.6, 'F');
    doc.rect(lx + 5.9, ly + 5.2, 0.6, 0.6, 'F');
    doc.rect(lx + 5.1, ly + 6.0, 0.6, 0.6, 'F');
    doc.rect(lx + 5.9, ly + 6.0, 0.6, 0.6, 'F');

    // Navy Hexagonal "U" Frame
    doc.setDrawColor(...primaryNavy);
    doc.setLineWidth(1.6);
    doc.line(lx + 2.2, ly + 1.8, lx + 2.2, ly + 7.2);
    doc.line(lx + 2.2, ly + 7.2, lx + 5.8, ly + 9.8);
    doc.line(lx + 5.8, ly + 9.8, lx + 9.4, ly + 7.2);
    doc.line(lx + 9.4, ly + 7.2, lx + 9.4, ly + 1.8);

    // Wordmark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryNavy);
    doc.text('UNIVISION', lx + 13, ly + 6);

    // Golden Divider Line with Diamond
    doc.setDrawColor(...brandGold);
    doc.setLineWidth(0.2);
    doc.line(lx + 13, ly + 8, lx + 40, ly + 8);
    doc.setFillColor(...brandGold);
    doc.triangle(lx + 41, ly + 7.6, lx + 41.6, ly + 8, lx + 41, ly + 8.4, 'F');
    doc.triangle(lx + 41, ly + 7.6, lx + 40.4, ly + 8, lx + 41, ly + 8.4, 'F');
    doc.line(lx + 42, ly + 8, lx + 70, ly + 8);

    // Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...primaryNavy);
    doc.text('DESIGN AND CONSTRUCTION LTD.', lx + 13, ly + 11.5);

    // Center Contact Details
    const cx = 86;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text(`Phone:  ${invoice.company.phone}`, cx, ly + 3);
    doc.text(`Email:  ${invoice.company.email}`, cx, ly + 7);
    doc.text(`Address: ${invoice.company.address}`, cx, ly + 11);

    // Right Slogan
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...brandGold);
    doc.text('Build Your Vision With Us', 200, ly + 6, { align: 'right' });

    // Decorative line
    doc.setDrawColor(...primaryNavy);
    doc.setLineWidth(0.4);
    doc.line(10, 24, 200, 24);

    // ==========================================
    // 2. NAVY BANNER (y: 26 - 37 mm)
    // ==========================================
    const by = 26;
    doc.setFillColor(...primaryNavy);
    doc.rect(10, by, 190, 10, 'F');

    // Left title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(191, 219, 254); // blue-200
    doc.text('ARCHITECTURAL SERVICES PACKAGE', 14, by + 3.8);

    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11); // amber-400
    doc.text('INVOICE', 14, by + 8.2);

    // Right values
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('PROFESSIONAL   |   ACCURATE   |   RELIABLE', 196, by + 6, { align: 'right' });

    // ==========================================
    // 3. CLIENT & PROJECT BOXES (y: 39 - 65 mm)
    // ==========================================
    const boxY = 39;
    const boxH = 26;
    const boxW = 93;

    // --- Left Box: Client Info ---
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(10, boxY, boxW, boxH, 'FD');

    // Header bar
    doc.setFillColor(...primaryNavy);
    doc.rect(10, boxY, boxW, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('CLIENT INFORMATION', 14, boxY + 3.8);

    // Fields
    doc.setFontSize(7.5);
    const drawField = (label: string, val: string, x: number, y: number, lw = 15) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textMuted);
      doc.text(label, x, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      doc.text(val || '--', x + lw, y);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(x + lw, y + 1, x + boxW - 4, y + 1);
    };

    drawField('Name:', invoice.client.name, 13, boxY + 10, 16);
    drawField('Phone:', invoice.client.phone, 13, boxY + 14.5, 16);
    drawField('Email:', invoice.client.email, 13, boxY + 19, 16);
    drawField('Address:', invoice.client.address, 13, boxY + 23.5, 16);

    // --- Right Box: Project Info ---
    const px = 107;
    doc.setDrawColor(...borderGray);
    doc.setFillColor(255, 255, 255);
    doc.rect(px, boxY, boxW, boxH, 'FD');

    // Header bar
    doc.setFillColor(...primaryNavy);
    doc.rect(px, boxY, boxW, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('PROJECT INFORMATION', px + 4, boxY + 3.8);

    // Fields
    drawField('Address:', invoice.project.projectAddress, px + 3, boxY + 10, 18);
    drawField('City / Prov:', invoice.project.cityProvince, px + 3, boxY + 14.5, 18);
    drawField('Postal Code:', invoice.project.postalCode, px + 3, boxY + 19, 18);

    // Split bottom row: Date & Invoice #
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('Date:', px + 3, boxY + 23.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(formattedDate, px + 14, boxY + 23.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('Invoice #:', px + 45, boxY + 23.5);
    doc.setTextColor(...primaryNavy);
    doc.text(invoice.invoiceNumber, px + 60, boxY + 23.5);

    // ==========================================
    // 4. ARCHITECTURAL DRAWING PACKAGE TABLE (y: 68 - 110 mm)
    // ==========================================
    let tableY = 68;

    // Top gold title bar
    doc.setFillColor(...brandGold);
    doc.rect(10, tableY, 190, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const isBOQ = invoice.invoiceCategory === 'boq' || invoice.invoiceNumber.includes('BOQ');
    const isInspection = invoice.invoiceCategory === 'inspection' || invoice.invoiceNumber.includes('INS');
    const isQuantityBased = isBOQ || isInspection;

    const scheduleTitle = isBOQ
      ? 'BILLS OF QUANTITIES (BOQ) SCHEDULE'
      : isInspection
      ? 'SITE INSPECTION & REPORTS SCHEDULE'
      : invoice.invoiceCategory === 'structural' || invoice.invoiceNumber.includes('STR')
      ? 'STRUCTURAL ENGINEERING SCHEDULE'
      : 'PACKAGE SCHEDULE & SPECIFICATIONS';

    const rightBadgeText = isBOQ
      ? 'FIXED RANGE PRICE'
      : isInspection
      ? 'FIXED FEE / VISIT'
      : `(RATE PER ${unit})`;

    doc.setTextColor(255, 255, 255);
    doc.text(scheduleTitle, 14, tableY + 3.5);
    doc.text(rightBadgeText, 196, tableY + 3.5, { align: 'right' });

    tableY += 5;

    // Column Headers (Navy)
    doc.setFillColor(...primaryNavy);
    doc.rect(10, tableY, 190, 5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('ITEM / DELIVERABLE SCOPE', 14, tableY + 3.5);
    doc.text(isQuantityBased ? 'QTY' : `AREA (${unit})`, 110, tableY + 3.5, { align: 'right' });
    doc.text(
      isBOQ
        ? `FIXED RATE (${currency})`
        : isInspection
        ? `RATE / VISIT (${currency})`
        : `RATE (${currency}/${unit})`,
      150,
      tableY + 3.5,
      { align: 'right' }
    );
    doc.text(`AMOUNT (${currency})`, 196, tableY + 3.5, { align: 'right' });

    tableY += 5;

    // Floor Rows
    doc.setFontSize(7.5);
    invoice.floors.forEach((floor, idx) => {
      const multiplier = typeof floor.quantity === 'number' ? floor.quantity : (Number(floor.area) || 0);
      const rowRate = floor.customRate ?? invoice.packageRate;
      const rowAmount = typeof floor.amountOverride === 'number'
        ? floor.amountOverride
        : multiplier * rowRate;

      // Background zebra
      if (idx % 2 === 1) {
        doc.setFillColor(...lightGray);
        doc.rect(10, tableY, 190, 5.5, 'F');
      }

      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.line(10, tableY + 5.5, 200, tableY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      doc.text(floor.floorName || `Item ${idx + 1}`, 14, tableY + 3.8);

      let qtyText: string;
      if (floor.areaLabel) {
        qtyText = floor.areaLabel;
      } else if (isQuantityBased) {
        const q = typeof floor.quantity === 'number' ? floor.quantity : (floor.area > 0 ? floor.area : 1);
        qtyText = `${q} ${floor.unitLabel || (isInspection ? 'Visit' : 'Set')}`;
      } else {
        qtyText = `${Number(floor.area).toFixed(2)} ${unit}`;
      }

      const rateText = floor.rateLabel || rowRate.toLocaleString();

      doc.setFont('courier', 'normal');
      doc.text(qtyText, 110, tableY + 3.8, { align: 'right' });
      doc.text(rateText, 150, tableY + 3.8, { align: 'right' });

      doc.setFont('courier', 'bold');
      doc.text(formatCurrency(rowAmount, currency), 196, tableY + 3.8, { align: 'right' });

      tableY += 5.5;
    });

    // Subtotal Row
    doc.setFillColor(241, 245, 249);
    doc.rect(10, tableY, 190, 5.5, 'F');
    doc.setDrawColor(...primaryNavy);
    doc.setLineWidth(0.3);
    doc.line(10, tableY, 200, tableY);
    doc.line(10, tableY + 5.5, 200, tableY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryNavy);
    doc.text(isQuantityBased ? 'SCHEDULE TOTAL' : 'PACKAGE SUBTOTAL', 14, tableY + 3.8);

    const totalQty = invoice.floors.reduce(
      (sum, f) => sum + (typeof f.quantity === 'number' ? f.quantity : (Number(f.area) || 1)),
      0
    );
    const subtotalMetric = isQuantityBased
      ? `${totalQty} ${isInspection ? (totalQty === 1 ? 'Visit' : 'Visits') : (totalQty === 1 ? 'Item' : 'Items')}`
      : `${calculations.totalArea.toFixed(2)} ${unit}`;

    doc.setFont('courier', 'bold');
    doc.text(subtotalMetric, 110, tableY + 3.8, { align: 'right' });
    doc.text('--', 150, tableY + 3.8, { align: 'right' });
    doc.text(formatCurrency(calculations.drawingPackageTotal, currency), 196, tableY + 3.8, { align: 'right' });

    tableY += 5.5;

    // Additional Notes box
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.2);
    doc.setFillColor(255, 255, 255);
    doc.rect(10, tableY, 190, 9, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text('ADDITIONAL NOTES (IF ANY):', 13, tableY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textDark);
    const noteText = invoice.additionalNotes || 'Standard architectural documentation compliant with local regulations.';
    doc.text(doc.splitTextToSize(noteText, 184), 13, tableY + 6.5);

    tableY += 11;

    // ==========================================
    // 5. PACKAGES & TOTAL SUMMARY SECTION (3 COLUMNS)
    // ==========================================
    const colY = tableY;
    const colH = 46;
    const c1W = 58;
    const c2W = 58;
    const c3W = 68;
    const c1X = 10;
    const c2X = c1X + c1W + 3;
    const c3X = c2X + c2W + 3;

    const isStructural = invoice.invoiceCategory === 'structural' || invoice.invoiceNumber.includes('STR');

    if (isBOQ) {
      // --- BOQ Column 1: Regular BOQ ---
      doc.setDrawColor(...borderGray);
      doc.setFillColor(255, 255, 255);
      doc.rect(10, colY, c1W, colH, 'FD');

      doc.setFillColor(2, 132, 199); // Blue
      doc.rect(10, colY, c1W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('BOQ REGULAR PACKAGE', 10 + c1W / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(7.5);
      doc.setTextColor(245, 158, 11);
      doc.text(`${currency} 18,000 – 25,000`, 10 + c1W / 2, colY + 5.8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...textDark);
      let fy = colY + 9.5;
      const boqReg = [
        'Detailed Quantity Takeoff',
        'Material Breakdown & Quantities',
        'Direct Labor Cost Schedule',
        'Trade-by-Trade Cost Summary',
        'Standard BOQ Report (PDF)',
        'Municipal Tender Document',
      ];
      boqReg.forEach((f) => {
        doc.setTextColor(2, 132, 199);
        doc.text('✓', 12, fy);
        doc.setTextColor(...textDark);
        doc.text(f, 15, fy);
        fy += 4.5;
      });

      // --- BOQ Column 2: Premium BOQ ---
      doc.setDrawColor(5, 150, 105); // Green border
      doc.setFillColor(255, 255, 255);
      doc.rect(c2X, colY, c2W, colH, 'FD');

      doc.setFillColor(5, 150, 105); // Emerald
      doc.rect(c2X, colY, c2W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('BOQ PREMIUM PACKAGE', c2X + c2W / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${currency} 30,000 – 65,000`, c2X + c2W / 2, colY + 5.8, { align: 'center' });

      let pfy = colY + 9.5;
      const boqPrem = [
        'Everything in Regular Plus:',
        'Detailed Procurement Schedule',
        'Subcontractor & Supplier Analysis',
        'Cash Flow Disbursement Forecast',
        'Tender Evaluation Matrix',
        'Comprehensive Cost Consultancy',
      ];
      boqPrem.forEach((f, i) => {
        if (i === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 150, 105);
          doc.text(f, c2X + 2, pfy);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(5, 150, 105);
          doc.text('✓', c2X + 2, pfy);
          doc.setTextColor(...textDark);
          doc.text(f, c2X + 5, pfy);
        }
        pfy += 4.5;
      });
    } else if (isInspection) {
      // --- Site Inspection Combined Columns 1 & 2 ---
      const inspectW = c1W + 3 + c2W;
      doc.setDrawColor(...borderGray);
      doc.setFillColor(255, 255, 255);
      doc.rect(10, colY, inspectW, colH, 'FD');

      doc.setFillColor(...primaryNavy);
      doc.rect(10, colY, inspectW, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('SITE INSPECTION & TECHNICAL CONSULTATION', 10 + inspectW / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(7.5);
      doc.setTextColor(245, 158, 11);
      doc.text(`${currency} 15,000 FIXED RATE / VISIT`, 10 + inspectW / 2, colY + 5.8, { align: 'center' });

      // Left column: Included Services
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...primaryNavy);
      doc.text('INCLUDED SERVICES:', 13, colY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...textDark);
      let ify = colY + 14.5;
      const inspectServices = [
        'On-site field inspection visit',
        'Foundation & structural audit',
        'Soil conditions & drainage review',
        'Quality & compliance verification',
        'Photographic defects log',
      ];
      inspectServices.forEach((s) => {
        doc.setTextColor(5, 150, 105);
        doc.text('✓', 13, ify);
        doc.setTextColor(...textDark);
        doc.text(s, 16, ify);
        ify += 4.5;
      });

      // Right column: Official Deliverables
      const rX = 10 + inspectW / 2 + 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...primaryNavy);
      doc.text('OFFICIAL DELIVERABLES:', rX, colY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...textDark);
      let rfy = colY + 14.5;
      const inspectDeliverables = [
        'Stamped Engineering Site Report',
        'Univision Technical Certification',
        'Digital high-res photographic record',
        'Remedial recommendations memo',
        'Council inspection compliance copy',
      ];
      inspectDeliverables.forEach((d) => {
        doc.setTextColor(...brandGold);
        doc.text('•', rX, rfy);
        doc.setTextColor(...textDark);
        doc.text(d, rX + 3, rfy);
        rfy += 4.5;
      });
    } else if (isStructural) {
      // --- Structural Column 1: Regular ---
      doc.setDrawColor(...borderGray);
      doc.setFillColor(255, 255, 255);
      doc.rect(10, colY, c1W, colH, 'FD');

      doc.setFillColor(30, 58, 138); // Dark blue
      doc.rect(10, colY, c1W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('STRUCTURAL REGULAR', 10 + c1W / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(8.5);
      doc.setTextColor(245, 158, 11);
      doc.text(`${currency} 65 /${unit}`, 10 + c1W / 2, colY + 5.8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...textDark);
      let sfy = colY + 9.5;
      const structReg = [
        'Foundation Design & Layout',
        'Column Placement & Detailing',
        'Beam Schedules & Reinforcement',
        'Standard BBS Schedule',
        'Slab Design & Specifications',
        'Permit-Ready Structural Set',
      ];
      structReg.forEach((f) => {
        doc.setTextColor(2, 132, 199);
        doc.text('✓', 12, sfy);
        doc.setTextColor(...textDark);
        doc.text(f, 15, sfy);
        sfy += 4.5;
      });

      // --- Structural Column 2: Premium ---
      doc.setDrawColor(4, 120, 87);
      doc.setFillColor(255, 255, 255);
      doc.rect(c2X, colY, c2W, colH, 'FD');

      doc.setFillColor(4, 120, 87);
      doc.rect(c2X, colY, c2W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('STRUCTURAL PREMIUM', c2X + c2W / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${currency} 85 /${unit}`, c2X + c2W / 2, colY + 5.8, { align: 'center' });

      let spfy = colY + 9.5;
      const structPrem = [
        'Everything in Regular Plus:',
        'Detailed Engineering Calculations',
        'Shear Wall & Core Details',
        'Retaining Wall & Staircase BBS',
        'Wind & Seismic Verification',
        'Engineer Sign-off & Municipal Seal',
      ];
      structPrem.forEach((f, i) => {
        if (i === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(4, 120, 87);
          doc.text(f, c2X + 2, spfy);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(4, 120, 87);
          doc.text('✓', c2X + 2, spfy);
          doc.setTextColor(...textDark);
          doc.text(f, c2X + 5, spfy);
        }
        spfy += 4.5;
      });
    } else {
      // --- Architectural Column 1: Regular Package ---
      doc.setDrawColor(...borderGray);
      doc.setFillColor(255, 255, 255);
      doc.rect(10, colY, c1W, colH, 'FD');

      doc.setFillColor(...primaryNavy);
      doc.rect(10, colY, c1W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('REGULAR PACKAGE', 10 + c1W / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(8.5);
      doc.setTextColor(245, 158, 11);
      doc.text(`${currency} 75 /${unit}`, 10 + c1W / 2, colY + 5.8, { align: 'center' });

      // Features
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...textDark);
      let fy = colY + 9.5;
      const regFeatures = [
        '3D Exterior Visualization',
        'Concept Design',
        'Floor Plans',
        'Elevations & Sections',
        'Roof Plan & Site Plan',
        'Door & Window Schedule',
        'Permit-Ready Drawings',
        'PDF Drawing Set',
      ];
      regFeatures.forEach((f) => {
        doc.setTextColor(2, 132, 199);
        doc.text('✓', 12, fy);
        doc.setTextColor(...textDark);
        doc.text(f, 15, fy);
        fy += 4.2;
      });

      // --- Architectural Column 2: Premium Package ---
      doc.setDrawColor(...brandGold);
      doc.setFillColor(255, 255, 255);
      doc.rect(c2X, colY, c2W, colH, 'FD');

      doc.setFillColor(...brandGold);
      doc.rect(c2X, colY, c2W, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('PREMIUM PACKAGE', c2X + c2W / 2, colY + 3.2, { align: 'center' });
      doc.setFontSize(8.5);
      doc.text(`${currency} 100 /${unit}`, c2X + c2W / 2, colY + 5.8, { align: 'center' });

      // Features
      let pfy = colY + 9.5;
      const premFeatures = [
        'Everything in Regular Plus:',
        'Interior Layouts',
        'Ceiling & Flooring Plans',
        'Kitchen & Toilet Details',
        'Joinery Details',
        'Detailed Construction Drawings',
        'Video Walkthrough',
        'Interior Design Consultation',
      ];
      premFeatures.forEach((f, i) => {
        if (i === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...brandGold);
          doc.text(f, c2X + 2, pfy);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...brandGold);
          doc.text('✓', c2X + 2, pfy);
          doc.setTextColor(...textDark);
          doc.text(f, c2X + 5, pfy);
        }
        pfy += 4.2;
      });
    }

    // --- Column 3: Package Price & Selected Package ---
    // Box A: Package Price
    doc.setDrawColor(...brandGold);
    doc.setFillColor(255, 255, 255);
    doc.rect(c3X, colY, c3W, 19, 'FD');

    doc.setFillColor(...brandGold);
    doc.rect(c3X, colY, c3W, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('PACKAGE PRICE', c3X + c3W / 2, colY + 3.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`TOTAL (${currency})`, c3X + c3W / 2, colY + 8.5, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...primaryNavy);
    doc.text(formatCurrency(calculations.grandTotal, currency), c3X + c3W / 2, colY + 14.5, { align: 'center' });

    // Box B: Selected Package
    const spY = colY + 21;
    doc.setDrawColor(...borderGray);
    doc.setFillColor(255, 255, 255);
    doc.rect(c3X, spY, c3W, 25, 'FD');

    doc.setFillColor(...primaryNavy);
    doc.rect(c3X, spY, c3W, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('SELECTED PACKAGE', c3X + c3W / 2, spY + 3.5, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(...textDark);
    const isRegular = invoice.packageType === 'regular';
    doc.text(`${isRegular ? '(•)' : '( )'} Regular Package (${currency} 75/${unit})`, c3X + 4, spY + 9);
    doc.text(`${!isRegular ? '(•)' : '( )'} Premium Package (${currency} 100/${unit})`, c3X + 4, spY + 13.5);

    // Advance deposit breakdown
    doc.setDrawColor(241, 245, 249);
    doc.line(c3X + 3, spY + 16, c3X + c3W - 3, spY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`Advance Deposit (${invoice.depositPercent}%):`, c3X + 4, spY + 19.5);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(formatCurrency(calculations.depositRequiredAmount, currency), c3X + c3W - 4, spY + 19.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text('Balance Due on Delivery:', c3X + 4, spY + 23);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(calculations.balanceDue, currency), c3X + c3W - 4, spY + 23, { align: 'right' });

    // ==========================================
    // 6. TERMS & CONDITIONS and PAYMENT DETAILS (y: 198 mm)
    // ==========================================
    const bottomY = colY + colH + 3;
    const bH = 26;

    // --- Terms & Conditions ---
    doc.setDrawColor(...borderGray);
    doc.setFillColor(255, 255, 255);
    doc.rect(10, bottomY, boxW, bH, 'FD');

    doc.setFillColor(...primaryNavy);
    doc.rect(10, bottomY, boxW, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('TERMS & CONDITIONS', 14, bottomY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...textDark);
    let ty = bottomY + 8;
    invoice.terms.slice(0, 5).forEach((term) => {
      doc.text('•', 13, ty);
      const splitTerm = doc.splitTextToSize(term, 83);
      doc.text(splitTerm, 15.5, ty);
      ty += 3.4;
    });

    // --- Payment Details ---
    doc.setDrawColor(...borderGray);
    doc.setFillColor(255, 255, 255);
    doc.rect(px, bottomY, boxW, bH, 'FD');

    doc.setFillColor(...primaryNavy);
    doc.rect(px, bottomY, boxW, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('PAYMENT DETAILS', px + 4, bottomY + 3.5);

    drawField('Bank:', invoice.paymentDetails.bankName, px + 3, bottomY + 9, 20);
    drawField('Acc Name:', invoice.paymentDetails.accountName, px + 3, bottomY + 13, 20);
    drawField('Account #:', invoice.paymentDetails.accountNumber, px + 3, bottomY + 17, 20);
    drawField('Reference:', invoice.paymentDetails.reference || invoice.invoiceNumber, px + 3, bottomY + 21, 20);
    if (invoice.paymentDetails.mobileMoneyNumber) {
      drawField('Mobile:', `${invoice.paymentDetails.mobileMoneyProvider}: ${invoice.paymentDetails.mobileMoneyNumber}`, px + 3, bottomY + 24.5, 20);
    }

    // ==========================================
    // 7. CLIENT SIGNATURE & DATE (y: 228 mm)
    // ==========================================
    const sigY = bottomY + bH + 4;

    // Client Signature
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textDark);
    doc.text('CLIENT SIGNATURE', 10, sigY);

    doc.setDrawColor(...primaryNavy);
    doc.setLineWidth(0.4);
    doc.line(10, sigY + 10, 110, sigY + 10);

    if (invoice.clientSignature) {
      if (invoice.clientSignatureType === 'type') {
        doc.setFont('times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(...primaryNavy);
        doc.text(invoice.clientSignature, 14, sigY + 8);
      } else {
        // Drawn signature data URL
        try {
          doc.addImage(invoice.clientSignature, 'PNG', 15, sigY + 1, 40, 8);
        } catch {
          doc.setFont('times', 'italic');
          doc.setFontSize(12);
          doc.text(invoice.client.name, 14, sigY + 8);
        }
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.text('Sign here or type name', 14, sigY + 8);
    }

    // Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textDark);
    doc.text('DATE', 140, sigY);

    doc.line(140, sigY + 10, 200, sigY + 10);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(invoice.clientSignDate ? formatDateToSlash(invoice.clientSignDate) : formattedDate, 142, sigY + 8);

    // ==========================================
    // 8. BOTTOM FOOTER BAR (y: 280 mm)
    // ==========================================
    doc.setFillColor(...primaryNavy);
    doc.rect(10, 276, 190, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('UNIVISION DESIGN AND CONSTRUCTION LTD.', 14, 281);

    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11);
    doc.text(invoice.company.footerQuote || 'Your Dream | Our Design | Built Together', 196, 281, { align: 'right' });

    // Download document
    doc.save(`${invoice.invoiceNumber}_Univision_Invoice.pdf`);
    return true;
  } catch (err) {
    console.error('Vector PDF generation error:', err);
    return false;
  }
}
