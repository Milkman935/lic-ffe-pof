/* ── POF Proforma Excel Generator ── */
/* Strategy: xlsx is a zip. JSZip opens it, DOMParser edits only sheet1.xml,  */
/* drawing/media files (logo) are never touched → logo preserved automatically.*/
/* Depends on: jszip.min.js (CDN), catalog.js, config.js                       */

async function generateProformaExcel(submission) {
  if (typeof JSZip === 'undefined') {
    showPOFToast('JSZip not loaded — check internet connection and refresh.', 'error');
    throw new Error('JSZip not loaded');
  }

  const cc  = getChampConfig(submission.championship.toLowerCase());
  const yc  = getYearConfig(submission.championship.toLowerCase(), submission.year);
  const pre = submission.contactDetails?.preEvent || {};

  // ── 1. Fetch the template ──
  const resp = await fetch('assets/data/Proforma_template.xlsx');
  if (!resp.ok) throw new Error(`Template fetch failed (HTTP ${resp.status})`);
  const buffer = await resp.arrayBuffer();

  // ── 2. Open as zip (xlsx IS a zip) ──
  const zip = await JSZip.loadAsync(buffer);

  // ── 3. Parse sheet1.xml with browser DOMParser ──
  const rawXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const parser = new DOMParser();
  const xdoc   = parser.parseFromString(rawXml, 'application/xml');
  const NS     = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

  // Find a <c r="ADDR"> element regardless of namespace prefix
  function findCell(addr) {
    const all = xdoc.getElementsByTagNameNS(NS, 'c');
    for (const c of all) {
      if (c.getAttribute('r') === addr) return c;
    }
    return null;
  }

  // XML-escape text for inline string values
  function escXml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Set a cell to an inline string value (preserves style index)
  function setStr(addr, value) {
    const cell = findCell(addr);
    if (!cell) return;
    while (cell.firstChild) cell.removeChild(cell.firstChild);
    cell.setAttribute('t', 'inlineStr');
    const is = xdoc.createElementNS(NS, 'is');
    const t  = xdoc.createElementNS(NS, 't');
    t.textContent = value;
    is.appendChild(t);
    cell.appendChild(is);
  }

  // Set a cell to a number value (removes formula and type)
  function setNum(addr, value) {
    const cell = findCell(addr);
    if (!cell) return;
    while (cell.firstChild) cell.removeChild(cell.firstChild);
    cell.removeAttribute('t');
    const v = xdoc.createElementNS(NS, 'v');
    v.textContent = String(value);
    cell.appendChild(v);
  }

  // ── 4. Fill in dynamic values ──

  // I8: submission date → Excel serial number (the cell already has a date format)
  const subDate    = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const dateSerial = Math.round((subDate - excelEpoch) / 86400000);
  setNum('I8', dateSerial);

  // F13: "For: [COMPANY NAME]" → actual team
  setStr('F13', 'For: ' + submission.teamName);

  // F14: championship + year
  const champLabel = (cc ? cc.shortName : submission.championship.toUpperCase()) + ' ' + submission.year;
  setStr('F14', champLabel);

  // F15: event date range
  if (yc && yc.eventStart && yc.eventEnd) {
    const fmt = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    setStr('F15', fmt(yc.eventStart) + ' - ' + fmt(yc.eventEnd));
  }

  // C14–C16: Bill To contact details
  if (pre.name)   setStr('C14', pre.name);
  if (pre.email)  setStr('C15', pre.email);
  if (pre.mobile) setStr('C16', pre.mobile);

  // C18: Attn.
  if (pre.name) setStr('C18', 'Attn. ' + pre.name);

  // ── 5. Build ordered item rows ──
  const itemRows = [];

  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          const locs = submission.gridItems?.[item.id] || {};
          const qty  = LOCATIONS.reduce((s, l) => s + (parseInt(locs[l], 10) || 0), 0);
          if (!qty) return;
          itemRows.push({
            id:        item.id,
            desc:      item.name + (item.desc && item.desc !== '—' ? ' – ' + item.desc : ''),
            unitPrice: item.qar,
            qty,
            days:      null,
            transport: null,
            lineTotal: qty * item.qar,
          });
        });
      });
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => {
        grp.items.forEach(item => {
          const st  = submission.heavyItems?.[item.id] || {};
          const qty = st.qty || 0;
          if (!qty) return;
          if (item.type === 'flat') {
            itemRows.push({
              id:        item.id,
              desc:      item.name,
              unitPrice: item.qar,
              qty,
              days:      null,
              transport: null,
              lineTotal: item.qar * qty,
            });
          } else {
            const days      = st.days || 0;
            const transport = item.transport || 0;
            const lineTotal = (item.qarPerDay * days * qty) + (transport * qty);
            const mast      = (item.hasMast && st.mast) ? ' [' + st.mast + ']' : '';
            const dates     = (st.startDate && st.endDate)
              ? ' (' + st.startDate + ' → ' + st.endDate + ')' : '';
            itemRows.push({
              id:        item.id,
              desc:      item.name + mast + dates,
              unitPrice: item.qarPerDay,
              qty,
              days,
              transport: transport > 0 ? transport : null,
              lineTotal,
            });
          }
        });
      });
    }
  });

  // ── 6. Fill data rows 21–40 (20-row template limit) ──
  const MAX_ROWS = 20;
  if (itemRows.length > MAX_ROWS) {
    showPOFToast(
      `Note: ${itemRows.length - MAX_ROWS} item(s) exceed the 20-row limit and were omitted.`,
      'error'
    );
  }

  for (let i = 0; i < Math.min(itemRows.length, MAX_ROWS); i++) {
    const r   = itemRows[i];
    const row = 21 + i;
    setStr(`B${row}`, r.id);
    setStr(`D${row}`, r.desc);
    setNum(`E${row}`, r.unitPrice);
    setNum(`F${row}`, r.qty);
    if (r.days      !== null) setNum(`G${row}`, r.days);
    if (r.transport !== null) setNum(`H${row}`, r.transport);
    setNum(`I${row}`, r.lineTotal);
  }

  // I42: grand total (also keep the SUM formula — Excel recalculates on open)
  const grand = (submission.grandTotalQAR || 0) + (submission.surchargeQAR || 0);
  setNum('I42', grand);

  // ── 7. Serialize updated sheet XML back into the zip ──
  const serializer  = new XMLSerializer();
  const updatedXml  = serializer.serializeToString(xdoc);
  zip.file('xl/worksheets/sheet1.xml', updatedXml);
  // All other files (drawing1.xml, image1.png, styles, etc.) are untouched → logo preserved

  // ── 8. Generate blob and trigger download ──
  const filename = [
    'Proforma',
    submission.championship.toUpperCase(),
    submission.year,
    submission.teamName.replace(/[^a-zA-Z0-9]/g, '_'),
  ].join('_') + '.xlsx';

  const blob = await zip.generateAsync({
    type:        'blob',
    mimeType:    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showPOFToast('Downloaded: ' + filename, 'success');
}
