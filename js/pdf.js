/* ── POF Proforma PDF Generator ── */
/* Depends on: jsPDF + jsPDF-AutoTable (loaded via CDN), catalog.js, config.js */
/* Matches layout of Proforma.xlsx */

async function generateProformaPDF(submission) {
  if (typeof window.jspdf === 'undefined') {
    showPOFToast('PDF library not loaded. Check your internet connection.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W   = 210;
  const PAGE_H   = 297;
  const MARGIN_L = 14;
  const MARGIN_R = 14;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

  // ── Colours (match Excel branding) ──
  const NAVY      = [5,  43,  94];   // #052B5E
  const MINT      = [190,255,245];   // #BEFFF5
  const LIGHT_BG  = [245,247,250];
  const MID_GREY  = [200,205,215];
  const TEXT_DARK = [20,  20,  40];
  const TEXT_MID  = [90,  90, 120];
  const WHITE     = [255,255,255];
  const GREEN_FILL= [198,239,206];   // Excel green cell
  const RED_LIGHT = [255,220,220];

  const cc   = getChampConfig(submission.championship.toLowerCase());
  const yc   = getYearConfig(submission.championship.toLowerCase(), submission.year);
  const grand = (submission.grandTotalQAR || 0) + (submission.surchargeQAR || 0);
  const isPast = submission.isPastCutoff;

  let y = 0; // current Y cursor

  // ── Helper: new page check ──
  function checkPage(needed = 20) {
    if (y + needed > PAGE_H - 20) {
      doc.addPage();
      y = 14;
      drawPageFooter();
    }
  }

  // ── Helper: draw horizontal rule ──
  function hRule(yPos, color = MID_GREY, thickness = 0.3) {
    doc.setDrawColor(...color);
    doc.setLineWidth(thickness);
    doc.line(MARGIN_L, yPos, PAGE_W - MARGIN_R, yPos);
  }

  // ── Helper: right-aligned text ──
  function textR(text, x, y, opts = {}) {
    doc.text(String(text), x, y, { align: 'right', ...opts });
  }

  // ── Helper: formatted QAR ──
  function fQAR(n) {
    return 'QAR ' + Math.round(n || 0).toLocaleString('en-US');
  }
  function fUSD(n) {
    return 'USD ' + ((n || 0) / 3.64).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // =========================================================
  // ── PAGE HEADER ──
  // =========================================================
  function drawPageHeader() {
    // Navy top bar
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PAGE_W, 36, 'F');

    // LIC name (left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...MINT);
    doc.text('LUSAIL CIRCUIT SPORTS CLUB', MARGIN_L, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 220, 240);
    doc.text('Al Wusail, North Relief Road · P.O. Box 23931 Doha, Qatar', MARGIN_L, 18);
    doc.text('Phone +974 4472 9151 · Fax +974 4472 9247', MARGIN_L, 23);

    // "PROFORMA INVOICE" title (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...MINT);
    textR('PROFORMA INVOICE', PAGE_W - MARGIN_R, 16);

    // Reference number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 190, 220);
    textR('Ref: ' + (submission.id || '—'), PAGE_W - MARGIN_R, 22);
    textR('Date: ' + new Date(submission.submittedAt || Date.now()).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }), PAGE_W - MARGIN_R, 27);

    // Championship badge strip
    const champColor = hexToRGB(cc ? cc.color : '#0067ff');
    doc.setFillColor(...champColor);
    doc.rect(0, 36, PAGE_W, 5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text((cc ? cc.shortName : submission.championship) + ' ' + submission.year, MARGIN_L, 39.5);
    if (yc) {
      textR('Event: ' + fmtDatePDF(yc.eventStart) + ' – ' + fmtDatePDF(yc.eventEnd), PAGE_W - MARGIN_R, 39.5);
    }

    y = 47;
  }

  // ── Page footer ──
  function drawPageFooter() {
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    const total   = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MID);
    doc.text(`Page ${pageNum} of ${total}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
    doc.text('LUSAIL CIRCUIT SPORTS CLUB · CONFIDENTIAL', MARGIN_L, PAGE_H - 8);
    textR('All items are non-refundable · Payment in QAR only', PAGE_W - MARGIN_R, PAGE_H - 8);
  }

  // =========================================================
  // ── FIRST PAGE ──
  // =========================================================
  drawPageHeader();

  // ── BILL TO / FOR ──
  // Left column: Bill To
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(MARGIN_L, y, CONTENT_W / 2 - 4, 40, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('BILL TO', MARGIN_L + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(submission.teamName, MARGIN_L + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  const pre = submission.contactDetails?.preEvent || {};
  if (pre.name)  doc.text('Attn: ' + pre.name,  MARGIN_L + 4, y + 20);
  if (pre.email) doc.text(pre.email,              MARGIN_L + 4, y + 26);
  if (pre.mobile)doc.text(pre.mobile,             MARGIN_L + 4, y + 32);

  // Right column: For
  const colR = MARGIN_L + CONTENT_W / 2 + 4;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(colR, y, CONTENT_W / 2 - 4, 40, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('FOR', colR + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text((cc ? cc.name : submission.championship) + ' ' + submission.year, colR + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  if (yc) {
    doc.text(fmtDatePDF(yc.eventStart) + ' – ' + fmtDatePDF(yc.eventEnd), colR + 4, y + 20);
  }
  doc.text('Lusail International Circuit', colR + 4, y + 26);
  doc.text('Doha, Qatar', colR + 4, y + 32);

  y += 46;

  // Surcharge warning if past cutoff
  if (isPast) {
    doc.setFillColor(...RED_LIGHT);
    doc.roundedRect(MARGIN_L, y, CONTENT_W, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 0, 0);
    doc.text('⚠  SUBMITTED AFTER CUT-OFF DATE — 10% SURCHARGE APPLIED', MARGIN_L + 4, y + 5.5);
    y += 12;
  }

  y += 2;

  // =========================================================
  // ── ITEMS TABLE ──
  // =========================================================

  // Collect all ordered rows grouped by section
  const tableBody = [];

  CATALOG.forEach(section => {
    let sectionTotal = 0;
    const sectionRows = [];

    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          const locs = submission.gridItems?.[item.id] || {};
          const qty  = LOCATIONS.reduce((s, l) => s + (parseInt(locs[l], 10) || 0), 0);
          if (!qty) return;

          const lineTotal = qty * item.qar;
          sectionTotal += lineTotal;

          // Location breakdown string
          const locBreakdown = LOCATIONS
            .filter(l => (locs[l] || 0) > 0)
            .map(l => LOCATION_LABELS[l] + ':' + locs[l])
            .join('  ');

          sectionRows.push([
            item.id,
            item.name + (item.desc && item.desc !== '—' ? '\n' + item.desc : ''),
            fQAR(item.qar),
            qty,
            '—',
            '—',
            fQAR(lineTotal),
          ]);
        });
      });
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => {
        grp.items.forEach(item => {
          const st  = submission.heavyItems?.[item.id] || {};
          const qty = st.qty || 0;
          if (!qty) return;

          const total = st.total || 0;
          sectionTotal += total;

          let unitPrice, days, transport;
          if (item.type === 'flat') {
            unitPrice = fQAR(item.qar);
            days      = '—';
            transport = '—';
          } else {
            unitPrice = fQAR(item.qarPerDay) + '/day';
            days      = st.days || 0;
            transport = item.transport > 0 ? fQAR(item.transport) : '—';
          }

          const dateInfo = (st.startDate && st.endDate)
            ? st.startDate + ' → ' + st.endDate
            : '';
          const mastInfo = (item.hasMast && st.mast) ? ' [' + st.mast + ' MAST]' : '';

          sectionRows.push([
            item.id,
            item.name + (dateInfo ? '\n' + dateInfo : '') + mastInfo,
            unitPrice,
            qty,
            days,
            transport,
            fQAR(total),
          ]);
        });
      });
    }

    if (!sectionRows.length) return;

    // Section header row
    tableBody.push([
      { content: section.name, colSpan: 7, styles: {
        fillColor: NAVY, textColor: MINT,
        fontStyle: 'bold', fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      }}
    ]);

    sectionRows.forEach(r => tableBody.push(r));

    // Section subtotal row
    tableBody.push([
      { content: '', colSpan: 6, styles: { fillColor: LIGHT_BG, fontStyle: 'bold' } },
      { content: fQAR(sectionTotal), styles: {
          fillColor: LIGHT_BG, fontStyle: 'bold',
          textColor: TEXT_DARK, halign: 'right',
        }
      },
    ]);
  });

  // Additional request row
  if (submission.additionalRequest) {
    tableBody.push([
      { content: 'ADDITIONAL REQUEST', colSpan: 7, styles: {
          fillColor: [255,248,220], textColor: [120,80,0],
          fontStyle: 'bold', fontSize: 7.5,
        }
      }
    ]);
    tableBody.push([
      { content: submission.additionalRequest, colSpan: 7, styles: {
          textColor: TEXT_MID, fontSize: 7.5,
          cellPadding: { top: 2, bottom: 4, left: 4, right: 4 },
        }
      }
    ]);
  }

  doc.autoTable({
    startY: y,
    head: [[
      { content: 'ID',          styles: { halign: 'center', cellWidth: 12 } },
      { content: 'Description', styles: { cellWidth: 60 } },
      { content: 'Unit Price',  styles: { halign: 'right',  cellWidth: 28 } },
      { content: 'Qty',         styles: { halign: 'center', cellWidth: 10 } },
      { content: 'Days',        styles: { halign: 'center', cellWidth: 12 } },
      { content: 'Transport',   styles: { halign: 'right',  cellWidth: 26 } },
      { content: 'Line Total',  styles: { halign: 'right',  cellWidth: 30 } },
    ]],
    body: tableBody,
    theme: 'grid',
    margin: { left: MARGIN_L, right: MARGIN_R },
    headStyles: {
      fillColor: NAVY,
      textColor: MINT,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: TEXT_DARK,
      lineColor: MID_GREY,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right',  cellWidth: 28 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'right',  cellWidth: 26 },
      6: { halign: 'right',  cellWidth: 30, fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    didDrawPage: (data) => {
      drawPageFooter();
      if (data.pageNumber > 1) {
        // Continuation header on extra pages
        doc.setFillColor(...NAVY);
        doc.rect(0, 0, PAGE_W, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...MINT);
        doc.text('PROFORMA INVOICE — ' + submission.teamName + ' — ' + submission.championship + ' ' + submission.year, MARGIN_L, 7);
        textR('Ref: ' + (submission.id || '—'), PAGE_W - MARGIN_R, 7);
      }
    },
    willDrawCell: (data) => {
      // Highlight section subtotal rows
      if (data.row.index > 0 && data.section === 'body') {
        const first = data.row.cells[0];
        if (first && first.raw === '' && data.column.index === 6) {
          // last cell of subtotal row — already styled above
        }
      }
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  // =========================================================
  // ── TOTALS SUMMARY ──
  // =========================================================
  checkPage(60);

  const summaryX = PAGE_W - MARGIN_R - 80;
  const summaryW = 80;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(summaryX, y, summaryW, isPast ? 46 : 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MID);
  doc.text('SUMMARY', summaryX + 4, y + 6);

  let sy = y + 12;
  const sections = [
    ['kitchen','Kitchen Equipment'],
    ['furniture','Furniture & Fixtures'],
    ['beverages','Beverages'],
    ['stationery','Stationery'],
    ['av','Audio Visual'],
    ['gases','Gases & Chemicals'],
    ['pit','Pit Equipment'],
    ['heavy','Heavy Machinery'],
    ['misc','Miscellaneous'],
  ];

  // Only show sections with value
  const activeSections = sections.filter(([k]) => (submission.subtotals?.[k] || 0) > 0);

  // Re-draw summary box to fit content
  const summaryH = 14 + activeSections.length * 6 + (isPast ? 20 : 12);
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(summaryX, y, summaryW, summaryH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MID);
  doc.text('SUMMARY', summaryX + 4, y + 6);

  sy = y + 12;
  activeSections.forEach(([key, label]) => {
    const amt = submission.subtotals?.[key] || 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MID);
    doc.text(label, summaryX + 4, sy);
    doc.setTextColor(...TEXT_DARK);
    textR(fQAR(amt), summaryX + summaryW - 3, sy);
    sy += 6;
  });

  if (isPast) {
    sy += 2;
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.3);
    doc.line(summaryX + 4, sy - 1, summaryX + summaryW - 4, sy - 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 0, 0);
    doc.text('10% Late Surcharge', summaryX + 4, sy + 4);
    textR('+ ' + fQAR(submission.surchargeQAR || 0), summaryX + summaryW - 3, sy + 4);
    sy += 8;
  }

  sy += 2;
  hRule(sy, NAVY, 0.5);
  sy += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('TOTAL', summaryX + 4, sy);
  textR(fQAR(grand), summaryX + summaryW - 3, sy);
  sy += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MID);
  textR(fUSD(grand), summaryX + summaryW - 3, sy);

  y = sy + 10;

  // =========================================================
  // ── NON-REFUNDABLE NOTE ──
  // =========================================================
  checkPage(20);
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 10, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 80, 0);
  doc.text('Please note that all items requested and listed above are non-refundable.', MARGIN_L + 4, y + 6.5);
  y += 15;

  // =========================================================
  // ── BANK DETAILS ──
  // =========================================================
  checkPage(55);

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 52, 2, 2, 'F');
  doc.setFillColor(...NAVY);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 8, 2, 2, 'F');
  // Patch bottom of header to be square
  doc.rect(MARGIN_L, y + 4, CONTENT_W, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...MINT);
  doc.text('PAYMENT BANK DETAILS', MARGIN_L + 4, y + 6);

  const bd = [
    ['Account Name', 'Losail Circuit Sports Club'],
    ['Bank',         'Qatar National Bank (Q.P.S.C.)'],
    ['Account No.',  '0013-046162-002'],
    ['IBAN',         'QA71 QNBA 0000 0000 0013 0461 6200 2'],
    ['Branch',       'Corporate Branch, P.O. Box 1000, Doha-Qatar'],
    ['Telephone',    '+974 4444 7777'],
    ['Swift Code',   'QNBAQAQA'],
  ];

  let by = y + 14;
  bd.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MID);
    doc.text(label + ':', MARGIN_L + 5, by);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    doc.text(value, MARGIN_L + 38, by);
    by += 6;
  });

  y += 57;

  // ── Payment reminders ──
  checkPage(24);
  const reminders = [
    'Payment must be made in QATARI RIYALS (QAR)',
    'All bank handling fees must be covered by the client',
    '100% payment must be received before any keys are handed over',
  ];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 0, 0);
  reminders.forEach((r, i) => {
    doc.text('⚠  ' + r, MARGIN_L, y + i * 5.5);
  });
  y += reminders.length * 5.5 + 8;

  // =========================================================
  // ── LIC CONTACTS ──
  // =========================================================
  checkPage(30);
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('LIC TEAM SERVICES CONTACTS', MARGIN_L + 4, y + 6);

  const contacts = [
    { name: 'Wendel Malenab',    email: 'wendel.malenab@circuitlosail.com', mobile: '+974 5062 2068' },
    { name: 'Yousef Abdelmoaty', email: 'yoseef.abdelmoaty@lcsc.qa',        mobile: '+974 3317 5732' },
  ];

  contacts.forEach((c, i) => {
    const cx = MARGIN_L + 4 + i * (CONTENT_W / 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(c.name, cx, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MID);
    doc.text(c.email + '  ·  ' + c.mobile, cx, y + 18.5);
  });

  y += 28;

  // ── Stamp / signature area ──
  checkPage(24);
  doc.setDrawColor(...MID_GREY);
  doc.setLineWidth(0.3);
  // Two signature boxes
  const boxW = 70;
  [[MARGIN_L, 'Authorised by (LIC)'], [PAGE_W - MARGIN_R - boxW, 'Accepted by (Team)']].forEach(([bx, label]) => {
    doc.rect(bx, y, boxW, 20, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MID);
    doc.text(label, bx + 3, y + 18);
  });

  // =========================================================
  // ── FINAL PAGE FOOTER ──
  // =========================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter();
    // Fix page X of Y now that we know total
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MID);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
  }

  // ── Save ──
  const filename = `Proforma_${submission.championship}_${submission.year}_${submission.teamName.replace(/[^a-zA-Z0-9]/g,'_')}.pdf`;
  doc.save(filename);
  showPOFToast('Proforma downloaded: ' + filename, 'success');
}

// ── Date formatter for PDF ──
function fmtDatePDF(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Hex → [r,g,b] ──
function hexToRGB(hex) {
  hex = (hex||'#0067ff').replace('#','');
  return [
    parseInt(hex.slice(0,2),16),
    parseInt(hex.slice(2,4),16),
    parseInt(hex.slice(4,6),16),
  ];
}
