import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../logo.jpeg';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Safe number – returns 0 when the value is not a finite number */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Format a date value to DD/MM/YYYY – returns '' for anything unparseable */
const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/** Safe string – returns fallback when the value is null / undefined / empty */
const safeStr = (v, fallback = '—') => {
  if (
    v === null ||
    v === undefined ||
    String(v).trim() === '' ||
    v === 'undefined' ||
    v === 'null'
  ) {
    return fallback;
  }
  return String(v);
};

const isPlaceholder = (v) => {
  const value = String(v ?? '').trim().toLowerCase();
  return !value || ['customer', 'n/a', 'na', 'null', 'undefined', '—', '-'].includes(value);
};

const pickBestText = (...values) => {
  for (const value of values) {
    if (!isPlaceholder(value)) return String(value).trim();
  }
  return '';
};

/** Draw fallback AUTOX icon when image logo cannot be embedded */
const drawFallbackLogoIcon = (doc, x, y, size) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  // Outer circle
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.6);
  doc.circle(cx, cy, r, 'S');

  // Inner circle
  doc.circle(cx, cy, r * 0.38, 'S');

  // Spokes (3)
  const spoke = (angle) => {
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + r * 0.38 * Math.cos(rad);
    const y1 = cy + r * 0.38 * Math.sin(rad);
    const x2 = cx + r * Math.cos(rad);
    const y2 = cy + r * Math.sin(rad);
    doc.line(x1, y1, x2, y2);
  };
  spoke(90);
  spoke(210);
  spoke(330);
};

/** Try drawing actual project logo, fallback to vector icon if not available */
const drawBrandLogo = (doc, x, y, width, height) => {
  try {
    if (typeof doc.addImage === 'function' && logoImage) {
      doc.addImage(logoImage, 'JPEG', x, y, width, height);
      return;
    }
  } catch (_err) {
    // Fallback icon below
  }

  const fallbackSize = Math.min(width, height);
  drawFallbackLogoIcon(doc, x + (width - fallbackSize) / 2, y + (height - fallbackSize) / 2, fallbackSize);
};

const signatureImageSources = [
  `${process.env.PUBLIC_URL || ''}/sign.png`,
  `${process.env.PUBLIC_URL || ''}/img/web-images/logo/ayush-sign.png`,
  `${process.env.PUBLIC_URL || ''}/img/web-images/logo/sign.png`,
].map((src) => encodeURI(src));

const signatureImageEls =
  typeof Image !== 'undefined'
    ? signatureImageSources.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    })
    : [];

/** Draw signature image from public path, fallback to text when unavailable */
const drawSignatureImage = (doc, x, y, width, height) => {
  try {
    if (typeof doc.addImage === 'function') {
      for (const img of signatureImageEls) {
        if (img && img.complete && img.naturalWidth > 0) {
          doc.addImage(img, 'PNG', x, y, width, height);
          return true;
        }
      }
    }
  } catch (_err) {
    // Fallback handled below
  }

  return false;
};

// ──────────────────────────────────────────────
// Colour palette
// ──────────────────────────────────────────────
const COLORS = {
  primary: [183, 28, 28],
  accent: [198, 40, 40],
  dark: [33, 33, 33], // Near black
  gray: [97, 97, 97], // Mid gray
  lightGray: [238, 238, 238], // Light gray bg
  white: [255, 255, 255],
  green: [46, 125, 50],
  red: [198, 40, 40],
  orange: [239, 108, 0],
};

// ──────────────────────────────────────────────
// generateInvoicePDF
// ──────────────────────────────────────────────

/**
 * Generate a professional AUTOX invoice PDF.
 * All dynamic values are safely accessed so missing / undefined data
 * never causes a runtime error.
 *
 * @param {Object} billingData  - Billing record data
 * @param {Object} customerData - Customer information
 * @returns {jsPDF} document
 */
export const generateInvoicePDF = (billingData = {}, customerData = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ── Resolve all values once (safe) ────────────
  const invoiceNo = safeStr(billingData.invoiceNumber, 'N/A');
  const invoiceLineItems = Array.isArray(billingData.lineItems) && billingData.lineItems.length
    ? billingData.lineItems
    : [{
      name: safeStr(billingData.serviceName || billingData.bookingId, 'Service'),
      quantity: 1,
      price: safeNum(billingData.amount),
      total: safeNum(billingData.totalAmount || billingData.finalTotal || billingData.amount),
    }];
  const paymentDate =
    formatDate(billingData.paymentDate || billingData.createdAt) ||
    formatDate(new Date());
  const status = safeStr(
    billingData.paymentStatus || billingData.status,
    'pending'
  );

  const itemsTotal = invoiceLineItems.reduce((sum, item) => sum + safeNum(item.total || safeNum(item.quantity) * safeNum(item.price)), 0);
  const serviceCharge = safeNum(billingData.serviceCharge);
  const discount = safeNum(billingData.discount);
  const subtotal = safeNum(billingData.subtotal) || Math.max(0, itemsTotal + serviceCharge - discount);
  const tax = safeNum(billingData.gst || billingData.tax);
  const total = safeNum(billingData.finalTotal || billingData.totalAmount) || subtotal + tax;

  const paymentMethod = safeStr(
    billingData.paymentMethod || billingData.method,
    '—'
  );
  const transactionId = safeStr(billingData.transactionId, '—');
  const currency = safeStr(billingData.currency, 'INR');

  const custName = safeStr(
    pickBestText(
      customerData.name,
      billingData?.customerDetails?.name,
      customerData.fullName,
      customerData.username,
      customerData.email ? String(customerData.email).split('@')[0] : ''
    ),
    'Name Not Updated'
  );
  const custEmail = safeStr(pickBestText(customerData.email, billingData?.customerDetails?.email), '');
  const custPhone = safeStr(pickBestText(customerData.phone, billingData?.customerDetails?.phone), '');
  const custAddress = safeStr(
    pickBestText(
      customerData.address,
      billingData?.customerDetails?.address,
      customerData.city
    ),
    ''
  );
  const vehicleNumber = safeStr(
    pickBestText(
      customerData.vehicleNumber,
      billingData?.vehicleDetails?.number,
      billingData?.vehicleNumber,
      billingData?.registration
    ),
    ''
  );
  const vehicleModel = safeStr(
    pickBestText(
      customerData.vehicleModel,
      billingData?.vehicleDetails?.model,
      billingData?.vehicleModel,
      billingData?.vehicle
    ),
    ''
  );
  const vehicleCompany = safeStr(
    pickBestText(
      customerData.vehicleCompany,
      billingData?.vehicleDetails?.company,
      billingData?.vehicleCompany,
      billingData?.make
    ),
    ''
  );

  // ── 1. HEADER BAR ────────────────────────────
  const headerH = 38;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  // Keep content section explicitly white for consistent rendering in viewers
  doc.setFillColor(...COLORS.white);
  doc.rect(0, headerH, pageWidth, pageHeight - headerH, 'F');

  // Brand logo (uses project logo image)
  drawBrandLogo(doc, margin, 5, 18, 18);

  // Brand name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('AUTOX', margin + 23, 16);

  // Tagline
  doc.setFontSize(7.5);
  doc.setFont(undefined, 'normal');
  doc.text('Smart Garage, Breakdown & Modification', margin + 23, 22);

  // Right side: INVOICE title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', pageWidth - margin, 15, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.text(`# ${invoiceNo}`, pageWidth - margin, 22, { align: 'right' });
  doc.text(`Date: ${paymentDate}`, pageWidth - margin, 29, { align: 'right' });

  // ── 2. STATUS PILL ────────────────────────────
  let statusColor = COLORS.green;
  const statusUpper = status.toUpperCase();
  if (['PENDING', 'INITIATED'].includes(statusUpper))
    statusColor = COLORS.orange;
  else if (['FAILED', 'OVERDUE', 'VOID'].includes(statusUpper))
    statusColor = COLORS.red;

  const pillY = headerH + 8;
  doc.setFillColor(...statusColor);
  const pillW = doc.getTextWidth(statusUpper) + 10;
  doc.roundedRect(
    pageWidth - margin - pillW,
    pillY - 4,
    pillW,
    7,
    1.5,
    1.5,
    'F'
  );
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text(statusUpper, pageWidth - margin - pillW + 5, pillY + 1);

  // ── 3. CUSTOMER DETAILS BOX ──────────────────
  const custStartY = pillY + 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('BILLED TO', margin, custStartY);

  // Light background box for customer info
  const custBoxY = custStartY + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, custBoxY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, custBoxY, contentWidth, 34, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.dark);

  const col1 = margin + 5;
  const col2 = pageWidth / 2 + 5;
  const row1 = custBoxY + 8;
  const row2 = custBoxY + 15;
  const row3 = custBoxY + 22;

  doc.setFont(undefined, 'bold');
  doc.text('Name:', col1, row1);
  doc.text('Email:', col1, row2);
  doc.text('Phone:', col2, row1);
  doc.text('Address:', col2, row2);
  doc.text('Vehicle No.:', col1, row3);
  doc.text('Vehicle Model:', col2, row3);

  doc.setFont(undefined, 'normal');
  doc.text(custName, col1 + 20, row1);
  doc.text(custEmail, col1 + 20, row2);
  doc.text(custPhone, col2 + 22, row1);
  doc.text(custAddress || ' ', col2 + 22, row2);
  doc.text(vehicleNumber, col1 + 20, row3);
  const vehicleDisplayText = pickBestText(vehicleModel, `${vehicleCompany} ${vehicleModel}`.trim(), vehicleCompany);
  doc.text(vehicleDisplayText || ' ', col2 + 22, row3);

  // ── 4. SERVICE TABLE ─────────────────────────
  const tableStartY = custBoxY + 42;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('SERVICE DETAILS', margin, tableStartY);

  autoTable(doc, {
    startY: tableStartY + 4,
    head: [
      [
        '#',
        'Service / Part',
        'Qty',
        `Price (${currency})`,
        `Total (${currency})`,
      ],
    ],
    body: invoiceLineItems.map((item, index) => [
      String(index + 1),
      safeStr(item.name, 'Item'),
      safeNum(item.quantity || 1).toFixed(0),
      safeNum(item.price).toFixed(2),
      safeNum(item.total || safeNum(item.quantity) * safeNum(item.price)).toFixed(2),
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.dark,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    theme: 'grid',
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    margin: { left: margin, right: margin },
  });

  const afterTableY = doc.lastAutoTable.finalY + 8;

  // Move lower sections to a fresh page when table is long, preventing overlap.
  const minBottomSectionHeight = 120;
  let baseY = afterTableY;
  if (baseY + minBottomSectionHeight > pageHeight - 10) {
    doc.addPage();
    baseY = margin + 8;
  }

  // ── 5. PAYMENT SUMMARY BOX ───────────────────
  const summBoxW = 75;
  const summBoxX = pageWidth - margin - summBoxW;
  const summBoxY = baseY;
  const summRowH = 9;

  // Box border
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(summBoxX, summBoxY, summBoxW, summRowH * 6 + 4, 2, 2, 'S');

  // Row helper
  const drawSummaryRow = (label, value, yOffset, bold, bg) => {
    const ry = summBoxY + yOffset;
    if (bg) {
      doc.setFillColor(...bg);
      doc.rect(summBoxX + 0.5, ry - 3, summBoxW - 1, summRowH, 'F');
    }
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(bold ? COLORS.primary : COLORS.dark));
    doc.text(label, summBoxX + 5, ry + 2);
    doc.text(value, summBoxX + summBoxW - 5, ry + 2, { align: 'right' });
  };

  drawSummaryRow('Line Items', `${currency} ${itemsTotal.toFixed(2)}`, 5, false, null);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(summBoxX + 3, summBoxY + 12, summBoxX + summBoxW - 3, summBoxY + 12);

  drawSummaryRow('Service Charge', `${currency} ${serviceCharge.toFixed(2)}`, 14, false, null);
  doc.line(summBoxX + 3, summBoxY + 21, summBoxX + summBoxW - 3, summBoxY + 21);

  drawSummaryRow('Discount', `- ${currency} ${discount.toFixed(2)}`, 23, false, null);
  doc.line(summBoxX + 3, summBoxY + 30, summBoxX + summBoxW - 3, summBoxY + 30);

  drawSummaryRow('Subtotal', `${currency} ${subtotal.toFixed(2)}`, 32, false, null);
  doc.line(summBoxX + 3, summBoxY + 39, summBoxX + summBoxW - 3, summBoxY + 39);

  drawSummaryRow(
    `GST`,
    `${currency} ${tax.toFixed(2)}`,
    41,
    false,
    null
  );

  doc.line(summBoxX + 3, summBoxY + 48, summBoxX + summBoxW - 3, summBoxY + 48);

  drawSummaryRow(
    'FINAL TOTAL',
    `${currency} ${total.toFixed(2)}`,
    50,
    true,
    COLORS.lightGray
  );

  // ── 6. PAYMENT INFO ──────────────────────────
  const payInfoY = baseY + 6;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('PAYMENT INFORMATION', margin, payInfoY);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.dark);

  doc.text('Payment Method:', margin, payInfoY + 9);
  doc.text(paymentMethod, margin + 38, payInfoY + 9);

  doc.text('Transaction ID:', margin, payInfoY + 17);
  doc.text(transactionId, margin + 38, payInfoY + 17);

  doc.text('Status:', margin, payInfoY + 25);
  doc.setTextColor(...statusColor);
  doc.setFont(undefined, 'bold');
  doc.text(statusUpper, margin + 38, payInfoY + 25);

  // ── 7. REFUND INFO (if applicable) ───────────
  const refundStatus = safeStr(billingData.refundStatus, 'none');
  const refundAmount = safeNum(billingData.refundAmount);

  let paymentContentBottomY = payInfoY + 26;

  if (refundStatus !== 'none' && refundAmount > 0) {
    const refundY = payInfoY + 36;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.red);
    doc.setFontSize(10);
    doc.text('REFUND INFORMATION', margin, refundY);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Status: ${refundStatus}`, margin, refundY + 8);
    doc.text(
      `Refund Amount: ${currency} ${refundAmount.toFixed(2)}`,
      margin,
      refundY + 15
    );

    paymentContentBottomY = refundY + 15;
  }

  // ── 8. MANAGER SIGNATURE BLOCK ──────────────
  const managerName = safeStr(
    billingData.managerName || billingData.approvedBy,
    'Ayush Bhavsar'
  );
  const managerRole = safeStr(billingData.managerRole, 'Founder');
  const signatureText = safeStr(billingData.managerSignature, 'Authorized Signature');
  const signDate = formatDate(billingData.approvalDate || billingData.updatedAt || new Date()) || formatDate(new Date());

  const signatureBoxX = margin;
  const signatureBoxW = 96;
  const signatureBoxH = 35;

  const summaryBottomY = summBoxY + (summRowH * 4 + 4);
  const contentBottomY = Math.max(summaryBottomY, paymentContentBottomY);

  // Keep signature below content and above footer with safe gap.
  let footerDivY = pageHeight - 22;
  let signatureBoxY = contentBottomY + 10;
  if (signatureBoxY + signatureBoxH + 10 > footerDivY) {
    doc.addPage();
    signatureBoxY = margin + 8;
    footerDivY = pageHeight - 22;
  }

  // Minimal official sign area (no hard red border)
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.25);
  doc.roundedRect(signatureBoxX, signatureBoxY, signatureBoxW, signatureBoxH, 1.8, 1.8, 'FD');

  doc.setFont(undefined, 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLORS.primary);
  doc.text('FOR AUTOX', signatureBoxX + 5, signatureBoxY + 7);

  const signatureDrawn = drawSignatureImage(doc, signatureBoxX + 7, signatureBoxY + 9, 40, 12);
  if (!signatureDrawn) {
    doc.setTextColor(...COLORS.dark);
    doc.setFont(undefined, 'italic');
    doc.setFontSize(9.5);
    doc.text('Signed', signatureBoxX + 8, signatureBoxY + 16.5);
  }

  doc.setDrawColor(168, 168, 168);
  doc.setLineWidth(0.2);
  doc.line(signatureBoxX + 6, signatureBoxY + 22.2, signatureBoxX + signatureBoxW - 6, signatureBoxY + 22.2);

  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7.4);
  doc.text(signatureText, signatureBoxX + 6, signatureBoxY + 26.2);

  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8.8);
  doc.text(managerName, signatureBoxX + 6, signatureBoxY + 31);

  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7.3);
  doc.text(managerRole, signatureBoxX + 6, signatureBoxY + 34);
  doc.text(`Approved: ${signDate}`, signatureBoxX + 50, signatureBoxY + 34);

  // ── 9. FOOTER ────────────────────────────────
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.6);
  doc.line(margin, footerDivY, pageWidth - margin, footerDivY);

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Thank you for choosing AUTOX!', pageWidth / 2, footerDivY + 6, {
    align: 'center',
  });

  doc.setFontSize(7.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(
    'Support: autoxgarageservice@gmail.com  |  www.autox.in',
    pageWidth / 2,
    footerDivY + 11,
    { align: 'center' }
  );
  doc.text(
    'This is a computer-generated invoice and does not require a signature.',
    pageWidth / 2,
    footerDivY + 16,
    { align: 'center' }
  );

  return doc;
};

/**
 * Download invoice as PDF
 * @param {Object} billingData  - Billing record data
 * @param {Object} customerData - Customer information
 */
export const downloadInvoicePDF = (billingData = {}, customerData = {}) => {
  const doc = generateInvoicePDF(billingData, customerData);
  const fileName = safeStr(billingData.invoiceNumber, 'invoice');
  doc.save(`${fileName}.pdf`);
};

/**
 * Create invoice PDF as a File object for native share sheets (WhatsApp on supported devices)
 * @param {Object} billingData  - Billing record data
 * @param {Object} customerData - Customer information
 * @returns {File|null}
 */
export const createInvoicePdfFile = (billingData = {}, customerData = {}) => {
  try {
    const doc = generateInvoicePDF(billingData, customerData);
    const fileName = `${safeStr(billingData.invoiceNumber, 'invoice')}.pdf`;
    const blob = doc.output('blob');

    if (typeof File !== 'undefined') {
      return new File([blob], fileName, { type: 'application/pdf' });
    }

    return null;
  } catch (_error) {
    return null;
  }
};

/**
 * Generate billing report PDF
 * @param {Array} records - Array of billing records
 * @param {Object} summary - Report summary data
 * @returns {jsPDF} - PDF document
 */
export const generateBillingReportPDF = (records, summary = {}) => {
  const doc = new jsPDF('l'); // Landscape
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const primaryColor = [41, 128, 185];
  const grayColor = [52, 73, 94];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('BILLING REPORT', margin, 15);

  // Summary
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - margin - 50,
    15
  );

  // Summary statistics
  const summaryY = 35;
  doc.setFillColor(236, 240, 241);
  doc.rect(margin, summaryY, pageWidth - 2 * margin, 20, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Amount: ₹${summary.totalAmount || 0}`, margin + 5, summaryY + 7);
  doc.text(
    `Total Transactions: ${summary.totalTransactions || 0}`,
    pageWidth / 2 - 20,
    summaryY + 7
  );
  doc.text(
    `Completed: ${summary.completedPayments || 0}`,
    pageWidth - margin - 60,
    summaryY + 7
  );
  doc.text(
    `Total Refunds: ₹${summary.totalRefunds || 0}`,
    margin + 5,
    summaryY + 14
  );

  // Records table
  const tableY = summaryY + 25;
  const tableData = records.map((record) => [
    record.invoiceNumber,
    record.userId || 'N/A',
    record.serviceName,
    `₹${record.amount}`,
    record.paymentMethod,
    record.paymentStatus,
    new Date(record.paymentDate).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [
      [
        'Invoice #',
        'Customer ID',
        'Service',
        'Amount',
        'Method',
        'Status',
        'Date',
      ],
    ],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: margin,
    columnStyles: {
      3: { halign: 'right' },
    },
  });

  return doc;
};

/**
 * Download billing report PDF
 * @param {Array} records - Array of billing records
 * @param {Object} summary - Report summary data
 */
export const downloadBillingReportPDF = (records, summary = {}) => {
  const doc = generateBillingReportPDF(records, summary);
  doc.save(`billing-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};
