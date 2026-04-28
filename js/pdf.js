/* ── POF Proforma PDF Generator ── */
/* Layout matches Proforma invoice PNG exactly */
/* Depends on: jsPDF + jsPDF-AutoTable (CDN), catalog.js, config.js */

async function generateProformaPDF(submission) {
  if (typeof window.jspdf === 'undefined') {
    showPOFToast('PDF library not loaded. Check your internet connection.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 14;
  const CW = PW - ML - MR;

  // ── Colours (matched to PNG) ──
  const DARK      = [30,  30,  30 ];
  const GREY      = [100, 100, 100];
  const LGREY     = [200, 200, 200];
  const BLACK     = [0,   0,   0  ];
  const WHITE     = [255, 255, 255];
  const SALMON    = [255, 228, 210];   // Bill To & For box – same peach/salmon as PNG
  const GREEN_QTY = [226, 239, 218];  // Quantity column highlight
  // Logo colours
  const LOGO_TEAL = [0,   105, 135];
  const LOGO_ORG  = [215, 85,  30 ];

  const cc  = getChampConfig(submission.championship.toLowerCase());
  const yc  = getYearConfig(submission.championship.toLowerCase(), submission.year);
  const pre = submission.contactDetails?.preEvent || {};
  const grand = (submission.grandTotalQAR || 0) + (submission.surchargeQAR || 0);

  // ── Helpers ──
  function qar(n) {
    if (!n && n !== 0) return '';
    return 'QAR ' + Math.round(n).toLocaleString('en-US');
  }
  function num(n) {
    return (n || n === 0) ? String(Math.round(n)) : '';
  }
  function fmtShortDate(isoOrDate) {
    if (!isoOrDate) return '';
    const d = new Date(isoOrDate);
    const day = String(d.getDate()).padStart(2, '0');
    const mon = d.toLocaleDateString('en-GB', { month: 'short' });
    return day + '-' + mon;  // "15-Apr"
  }
  function fmtLongDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function pageFooter() {
    const pg = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(`Page ${pg}`, PW / 2, PH - 6, { align: 'center' });
  }

  // =========================================================
  // ROW 1 – LCSC logo (top-right) + company name (top-left)
  // =========================================================
  let y = MT;

  // LCSC logo – teal base with orange upper-right accent, "LCSC" in white
  const logoSz = 20;
  const logoX  = PW - MR - logoSz;
  doc.setFillColor(...LOGO_TEAL);
  doc.rect(logoX, y, logoSz, logoSz, 'F');
  doc.setFillColor(...LOGO_ORG);
  doc.rect(logoX + logoSz * 0.52, y, logoSz * 0.48, logoSz * 0.48, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('LCSC', logoX + logoSz / 2, y + logoSz * 0.72, { align: 'center' });

  // Company name – top left
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text('Lusail Circuit Sports Club', ML, y + 5);

  y += 7;

  // Address block
  const addrLines = [
    'Al Wusail, North Relief Road',
    'P.O. Box : 23931 Doha-Qatar',
    'Phone +974 4472 9151',
    'Fax +974 4472 9247',
  ];
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...DARK);
  addrLines.forEach(line => { doc.text(line, ML, y); y += 4.5; });

  // "Proforma Invoice" centred
  const invoiceY = MT + 11;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text('Proforma Invoice', PW / 2, invoiceY, { align: 'center' });

  // Date – top right, same baseline
  const invoiceDate = fmtShortDate(submission.submittedAt || new Date());
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(invoiceDate, PW - MR, invoiceY, { align: 'right' });

  y = MT + 34;

  // =========================================================
  // BILL TO (left) + FOR (right)
  // =========================================================
  const colMid   = ML + CW * 0.45;
  const billW    = CW * 0.42;
  const forX     = colMid + 4;
  const forW     = PW - MR - forX;
  const sectionH = 32;   // tall enough for 5 lines in the For box

  // Bill To box – peach/salmon background (matches PNG)
  doc.setFillColor(...SALMON);
  doc.rect(ML, y, billW, sectionH, 'F');
  doc.setDrawColor(...LGREY); doc.setLineWidth(0.3);
  doc.rect(ML, y, billW, sectionH, 'S');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('Bill To:', ML + 2, y + 5.5);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  if (pre.name)   doc.text(pre.name,   ML + 2, y + 11);
  if (pre.email)  doc.text(pre.email,  ML + 2, y + 16);
  if (pre.mobile) doc.text(pre.mobile, ML + 2, y + 21);

  // For box – same peach/salmon background
  doc.setFillColor(...SALMON);
  doc.rect(forX, y, forW, sectionH, 'F');
  doc.setDrawColor(...LGREY); doc.setLineWidth(0.3);
  doc.rect(forX, y, forW, sectionH, 'S');

  // "For: TeamName" header – bold
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('For: ' + submission.teamName, forX + 2, y + 5.5);

  // Championship – bold (matches PNG where "WEC" is bold)
  const champLabel = (cc ? cc.shortName : submission.championship.toUpperCase()) + ' ' + submission.year;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(champLabel, forX + 2, y + 11);

  // Remaining lines – normal
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  if (yc && yc.eventStart && yc.eventEnd) {
    const evtStr = fmtLongDate(yc.eventStart) + ' - ' + fmtLongDate(yc.eventEnd);
    doc.text(evtStr, forX + 2, y + 17);
  }
  doc.text('Lusail International Circuit', forX + 2, y + 23);
  doc.text('Doha-Qatar', forX + 2, y + 29);

  y += sectionH + 2;

  // Attn. line below boxes
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text('Attn.', ML, y + 5);
  if (pre.name) {
    doc.setFont('helvetica', 'normal');
    doc.text(pre.name, ML + 10, y + 5);
  }

  y += 10;

  // =========================================================
  // ITEMS TABLE
  // Columns: Item | Description | Unit Price | Quantity |
  //          Total Number of Days | Additional Transportation Cost | Line Total
  // =========================================================
  const tableRows = [];

  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          const locs = submission.gridItems?.[item.id] || {};
          const qty  = LOCATIONS.reduce((s, l) => s + (parseInt(locs[l], 10) || 0), 0);
          if (!qty) return;
          tableRows.push([
            item.id,
            item.name + (item.desc && item.desc !== '—' ? '\n' + item.desc : ''),
            qar(item.qar),
            qty,
            '',
            '',
            qar(qty * item.qar),
          ]);
        });
      });
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => {
        grp.items.forEach(item => {
          const st  = submission.heavyItems?.[item.id] || {};
          const qty = st.qty || 0;
          if (!qty) return;

          if (item.type === 'flat') {
            tableRows.push([
              item.id,
              item.name,
              qar(item.qar),
              qty,
              '',
              '',
              qar(item.qar * qty),
            ]);
          } else {
            const days      = st.days || 0;
            const transport = item.transport || 0;
            const lineTotal = (item.qarPerDay * days * qty) + (transport * qty);
            const mastInfo  = (item.hasMast && st.mast) ? item.name + ' [' + st.mast + ']' : item.name;
            const dateDesc  = (st.startDate && st.endDate) ? st.startDate + ' → ' + st.endDate : '';
            tableRows.push([
              item.id,
              mastInfo + (dateDesc ? '\n' + dateDesc : ''),
              qar(item.qarPerDay) + '/day',
              qty,
              num(days),
              transport > 0 ? qar(transport) : '',
              qar(lineTotal),
            ]);
          }
        });
      });
    }
  });

  if (submission.additionalRequest) {
    tableRows.push([{
      content: 'Additional Request: ' + submission.additionalRequest,
      colSpan: 7,
      styles: { fontStyle: 'italic', textColor: GREY, fontSize: 7.5, cellPadding: 3 },
    }]);
  }

  // Column widths mirroring the Excel proportions
  const colWidths = { 0: 14, 1: 56, 2: 24, 3: 16, 4: 16, 5: 26, 6: 24 };

  // Surcharge note for foot if applicable
  const surchargeNote = (submission.isPastCutoff && (submission.surchargeQAR || 0) > 0)
    ? '  incl. 10% late surcharge (QAR ' + Math.round(submission.surchargeQAR).toLocaleString() + ')'
    : '';

  doc.autoTable({
    startY: y,
    head: [[
      { content: 'Item',                          styles: { halign: 'center' } },
      { content: 'Description',                   styles: { halign: 'left'   } },
      { content: 'Unit Price',                    styles: { halign: 'center' } },
      { content: 'Quantity',                      styles: { halign: 'center' } },
      { content: 'Total Number\nof Days',         styles: { halign: 'center' } },
      { content: 'Additional\nTransportation\nCost', styles: { halign: 'center' } },
      { content: 'Line Total',                    styles: { halign: 'right'  } },
    ]],
    body: tableRows,
    foot: [[
      {
        content: 'Total' + surchargeNote,
        colSpan: 6,
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          fillColor: WHITE,
          textColor: DARK,
          fontSize: 9,
          lineColor: BLACK,
          lineWidth: 0.5,
          cellPadding: { top: 3, bottom: 3, left: 2, right: 4 },
        },
      },
      {
        content: qar(grand),
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          fillColor: WHITE,
          textColor: DARK,
          fontSize: 9,
          lineColor: BLACK,
          lineWidth: 0.5,
          cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        },
      },
    ]],
    showFoot: 'lastPage',
    theme: 'grid',
    margin: { left: ML, right: MR },
    tableWidth: CW,
    tableLineColor: BLACK,
    tableLineWidth: 0.5,
    headStyles: {
      fillColor: WHITE,          // white header – no blue-grey fill
      textColor: DARK,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      lineColor: LGREY,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      textColor: DARK,
      lineColor: LGREY,
      lineWidth: 0.2,
      minCellHeight: 7,
    },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1], halign: 'left'   },
      2: { cellWidth: colWidths[2], halign: 'right'  },
      3: { cellWidth: colWidths[3], halign: 'center', fillColor: GREEN_QTY },
      4: { cellWidth: colWidths[4], halign: 'center' },
      5: { cellWidth: colWidths[5], halign: 'right'  },
      6: { cellWidth: colWidths[6], halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: WHITE },
    footStyles: {
      lineColor: BLACK,
      lineWidth: 0.5,
    },
    didDrawPage: () => { pageFooter(); },
  });

  y = doc.lastAutoTable.finalY + 7;

  // =========================================================
  // CHECK PAGE – footer content
  // =========================================================
  if (y + 60 > PH - 10) {
    doc.addPage();
    y = MT;
    pageFooter();
  }

  // =========================================================
  // NON-REFUNDABLE NOTE – italic, as shown in PNG
  // =========================================================
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text('Please note that all items requested and listed above are non-refundable.', ML, y);
  y += 9;

  // =========================================================
  // BANK DETAILS
  // =========================================================
  const indent = ML + 7;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text('Bank Details:', indent, y);
  y += 5;

  const bankLines = [
    'Losail Circuit Sports Club',
    'Bank : Qatar National Bank (Q.P.S.C.)',
    'Account Number : 0013-046162-002',
    'IBAN: QA71 QNBA 0000 0000 0013 0461 6200 2',
    'Branch : Corporate Branch, P.O. Box No. 1000, Doha-Qatar',
    'Telephone : +97444447777',
    'Swift Code : QNBAQAQA',
  ];

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.setTextColor(...DARK);
  bankLines.forEach(line => { doc.text(line, indent, y); y += 4.5; });

  // =========================================================
  // FINAL PAGE NUMBERS
  // =========================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(`Page ${p} of ${totalPages}`, PW / 2, PH - 6, { align: 'center' });
  }

  // =========================================================
  // SAVE
  // =========================================================
  const filename = [
    'Proforma',
    submission.championship,
    submission.year,
    submission.teamName.replace(/[^a-zA-Z0-9]/g, '_'),
  ].join('_') + '.pdf';

  doc.save(filename);
  showPOFToast('Downloaded: ' + filename, 'success');
}

// ── Date helpers (kept for external use) ──
function fmtDatePDF(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function hexToRGB(hex) {
  hex = (hex || '#0067ff').replace('#', '');
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}
