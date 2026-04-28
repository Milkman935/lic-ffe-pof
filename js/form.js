/* ── POF Form Logic ── */
/* Depends on: catalog.js, config.js, storage.js */

let FORM_SUBMISSION = null;
let FORM_CHAMP = null;
let FORM_YEAR = null;
let FORM_TEAM_SLUG = null;
let FORM_YEAR_CFG = null;
let FORM_CHAMP_CFG = null;

/* ── Init ── */
function initForm() {
  initPOFTheme();

  const params = getPOFParams();
  FORM_CHAMP = params.champ;
  FORM_YEAR  = params.year;
  FORM_TEAM_SLUG = params.team;

  if (!FORM_CHAMP || !FORM_YEAR || !FORM_TEAM_SLUG) {
    showFormError('Invalid link. Missing championship, year, or team parameters.');
    return;
  }

  FORM_CHAMP_CFG = getChampConfig(FORM_CHAMP);
  FORM_YEAR_CFG  = getYearConfig(FORM_CHAMP, FORM_YEAR);

  if (!FORM_CHAMP_CFG) {
    showFormError('Championship not recognised. Please check your link.');
    return;
  }
  // Year may not be in config — use a generic fallback
  if (!FORM_YEAR_CFG) {
    FORM_YEAR_CFG = { cutoffDate: null, eventStart: null, eventEnd: null, teams: [] };
  }

  // Resolve team name: check config list first, fall back to un-slugging the URL param
  const teamName = slugToTeamName(FORM_TEAM_SLUG, FORM_CHAMP, FORM_YEAR)
    || FORM_TEAM_SLUG.replace(/-/g, ' ').toUpperCase();

  if (!teamName) {
    showFormError('Team not found. Please check your link.');
    return;
  }

  // Set champ color
  document.body.setAttribute('data-champ', FORM_CHAMP);
  document.title = `POF — ${teamName} — ${FORM_CHAMP_CFG.shortName} ${FORM_YEAR}`;

  // Load existing draft or build blank
  FORM_SUBMISSION = loadSubmission(FORM_CHAMP, FORM_YEAR, FORM_TEAM_SLUG)
    || buildBlankSubmission(FORM_CHAMP, FORM_YEAR, teamName, FORM_TEAM_SLUG, FORM_YEAR_CFG.cutoffDate);

  // Check if already submitted
  if (FORM_SUBMISSION.status === 'submitted' || FORM_SUBMISSION.status === 'imported') {
    showAlreadySubmitted();
    return;
  }

  renderForm();
}

/* ── Error states ── */
function showFormError(msg) {
  document.getElementById('pof-form-root').innerHTML = `
    <div style="text-align:center;padding:80px 20px;color:var(--text-muted)">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.4;margin-bottom:16px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <p style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">Invalid Form Link</p>
      <p style="font-size:13px">${msg}</p>
    </div>`;
}

function showAlreadySubmitted() {
  const sub = FORM_SUBMISSION;
  document.getElementById('pof-form-root').innerHTML = `
    <div class="pof-success" style="margin-top:60px">
      <div class="pof-success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="pof-success-title">Form Already Submitted</div>
      <div class="pof-success-sub">
        This form was submitted on ${sub.submittedAt ? fmtDate(sub.submittedAt.split('T')[0]) : '—'}.<br>
        Please contact LIC if you need to make changes.
      </div>
      ${renderBankDetails()}
    </div>`;
}

/* ── Main form renderer ── */
function renderForm() {
  const root = document.getElementById('pof-form-root');
  const sub  = FORM_SUBMISSION;
  const yc   = FORM_YEAR_CFG;
  const cc   = FORM_CHAMP_CFG;
  const daysLeft = daysUntilCutoff(yc.cutoffDate);
  const pastCutoff = daysLeft < 0;

  let html = `<div class="pof-page">`;

  /* Header */
  html += `
    <div class="pof-header">
      <div class="pof-header-top">
        <div class="pof-header-left">
          <div class="pof-lic-name">LUSAIL INTERNATIONAL CIRCUIT</div>
          <div class="pof-title">PADDOCK ORDER FORM <span>${FORM_YEAR}</span></div>
        </div>
        <img src="${cc.logo}" alt="${cc.shortName}" class="pof-header-logo" onerror="this.style.display='none'">
      </div>
      <div class="pof-header-meta">
        <div class="pof-meta-item">
          <span class="pof-meta-label">Team Name</span>
          <span class="pof-meta-value team-name">${sub.teamName}</span>
        </div>
        <div class="pof-meta-item">
          <span class="pof-meta-label">Championship</span>
          <span class="pof-meta-value">${cc.shortName} ${FORM_YEAR}</span>
        </div>
        <div class="pof-meta-item">
          <span class="pof-meta-label">Cut-off Date</span>
          <span class="pof-meta-value">${fmtDate(yc.cutoffDate)}</span>
        </div>
        <div class="pof-meta-item">
          <span class="pof-meta-label">Days Until Cut-off</span>
          <div class="pof-countdown">
            <span class="pof-countdown-days ${pastCutoff ? 'urgent' : daysLeft <= 7 ? 'urgent' : 'ok'}">
              ${pastCutoff ? 'PAST CUT-OFF' : daysLeft + ' days'}
            </span>
          </div>
        </div>
        <div class="pof-meta-item">
          <span class="pof-meta-label">Event Dates</span>
          <span class="pof-meta-value">${fmtDate(yc.eventStart)} – ${fmtDate(yc.eventEnd)}</span>
        </div>
      </div>
      ${pastCutoff ? `<div class="pof-surcharge-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        ⚠ Past cut-off date — A <strong>10% SURCHARGE</strong> applies to all items ordered.
      </div>` : ''}
    </div>`;

  /* Info panel */
  html += `
    <div class="pof-info-panel">
      <button class="pof-info-toggle" onclick="toggleInfoPanel(this)">
        <span>ℹ Important Information &amp; Ordering Rules</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="pof-info-body">
        <ul>
          <li><strong>ALL ITEMS ORDERED ARE NON-REFUNDABLE.</strong> Payment to be received prior to event.</li>
          <li>Items ordered after the cut-off date will be subject to a <strong>10% PRICE INCREASE</strong>.</li>
          <li>Any items ordered at the venue will be subject to <strong>20% PRICE INCREASE</strong> (except drinks).</li>
          <li>Only fill in the quantity fields (green cells).</li>
          <li><strong>HEAVY MACHINERY &amp; VEHICLES:</strong> Complete all required fields — Quantity, Mast Type, Date From and To.</li>
          <li>Any items left at LIC or requiring disposal will be calculated and invoiced post-event.</li>
          <li>Pit – Team Villa – Heavy Equipment keys available from <strong>Team Services Villa 007</strong>.</li>
          <li>The Team Villa maximum weight limit is <strong>400 KG</strong>.</li>
          <li>Forklifts are to only be operated by <strong>qualified personnel</strong>.</li>
          <li>All fork lifts will be handed over with <strong>full fuel tanks</strong>.</li>
        </ul>
      </div>
    </div>`;

  /* Villa included items */
  html += renderVillaSection();

  /* Catalog sections */
  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      html += renderGridSection(section);
    } else if (section.layout === 'heavy') {
      html += renderHeavySection(section);
    }
  });

  /* Additional items */
  html += `
    <div class="pof-additional-section">
      <div class="pof-additional-label">Additional Items Request</div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
        Please let us know if there is an item you need that is not listed above and we will do our best to accommodate.
      </p>
      <textarea class="pof-additional-textarea" id="additional-request" placeholder="Describe any additional items or special requirements…"
        oninput="FORM_SUBMISSION.additionalRequest=this.value">${escHtml(sub.additionalRequest || '')}</textarea>
    </div>`;

  /* Financial summary */
  html += renderFinancialSummary(pastCutoff);

  /* Contact details */
  html += renderContactSection();

  /* Submit area */
  html += `
    <div class="pof-submit-area">
      <div class="pof-submit-note">
        By submitting this form, you confirm all quantities are correct and accept the ordering terms above.
      </div>
      <button class="btn btn-lg btn-primary" onclick="handleSubmit()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Submit Order
      </button>
    </div>`;

  html += `</div>`; // .pof-page

  root.innerHTML = html;

  // Restore any saved draft values
  restoreDraftValues();
  recalcAll();
}

/* ── Villa section ── */
function renderVillaSection() {
  let h = `<div class="pof-villa-section">
    <div class="pof-villa-title">Items Included in Every Team Villa (Read-Only — No Order Required)</div>
    <div class="pof-villa-grid">`;
  VILLA_INCLUDED.forEach(v => {
    h += `<div class="pof-villa-item"><strong>${escHtml(v.name)}</strong><span>${escHtml(v.qty)}</span></div>`;
  });
  h += `</div></div>`;
  return h;
}

/* ── Grid section renderer ── */
function renderGridSection(section) {
  const locCols = LOCATIONS.map(l => `<th class="col-qty">${LOCATION_LABELS[l]}</th>`).join('');

  let h = `
    <div class="pof-section open" id="section-${section.id}">
      <div class="pof-section-header" onclick="toggleSection('${section.id}')">
        <span class="pof-section-title">${section.name}</span>
        <div class="pof-section-meta">
          <span class="pof-section-subtotal" id="subtotal-${section.id}">QAR 0</span>
          <svg class="pof-section-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      <div class="pof-section-body">
        <div style="overflow-x:auto">
        <table class="pof-grid-table">
          <thead>
            <tr>
              <th class="col-item">Item</th>
              <th class="col-desc">Description</th>
              ${locCols}
              <th class="col-total">TOTAL</th>
              <th class="col-price">USD</th>
              <th class="col-price">QAR</th>
              <th class="col-linetotal">LINE TOTAL</th>
            </tr>
          </thead>
          <tbody>`;

  section.subcategories.forEach(sub => {
    h += `<tr class="subcat-header"><td colspan="${LOCATIONS.length + 5}">${sub.name}</td></tr>`;
    sub.items.forEach(item => {
      const locInputs = LOCATIONS.map(loc =>
        `<td class="col-qty">
          <input type="number" min="0" step="1" class="pof-qty-input"
            id="qty-${item.id}-${loc}"
            data-item="${item.id}" data-loc="${loc}"
            value="0"
            oninput="onQtyInput(this)"
            onfocus="this.select()">
        </td>`
      ).join('');

      const usd = (item.qar / USD_RATE).toFixed(2);

      h += `
        <tr id="row-${item.id}">
          <td class="col-item">${escHtml(item.name)}</td>
          <td class="col-desc">${escHtml(item.desc || '—')}</td>
          ${locInputs}
          <td class="col-total" id="total-${item.id}">0</td>
          <td class="col-price">${usd}</td>
          <td class="col-price">${item.qar.toLocaleString()}</td>
          <td class="col-linetotal" id="linetotal-${item.id}">—</td>
        </tr>`;
    });
  });

  // Subtotal row
  h += `
    <tr class="subtotal-row">
      <td colspan="${LOCATIONS.length + 3}" style="text-align:right;padding-right:12px">SECTION TOTAL</td>
      <td colspan="2" style="text-align:right" id="section-total-${section.id}">QAR 0</td>
    </tr>
  </tbody></table></div></div></div>`;

  return h;
}

/* ── Heavy machinery section renderer ── */
function renderHeavySection(section) {
  let h = `
    <div class="pof-section open" id="section-${section.id}">
      <div class="pof-section-header" onclick="toggleSection('${section.id}')">
        <span class="pof-section-title">${section.name}</span>
        <div class="pof-section-meta">
          <span class="pof-section-subtotal" id="subtotal-${section.id}">QAR 0</span>
          <svg class="pof-section-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      <div class="pof-section-body">
        <div style="overflow-x:auto">
        <table class="pof-heavy-table">
          <thead>
            <tr>
              <th class="col-item">Item</th>
              <th>QTY</th>
              <th>MAST</th>
              <th>START DATE</th>
              <th>END DATE</th>
              <th>DAYS</th>
              <th>TRANSPORT (QAR)</th>
              <th>QAR/DAY</th>
              <th class="col-total">TOTAL (QAR)</th>
            </tr>
          </thead>
          <tbody>`;

  section.groups.forEach(grp => {
    h += `<tr class="group-header"><td colspan="9">${grp.name}</td></tr>`;
    grp.items.forEach(item => {
      const mastCell = item.hasMast
        ? `<select class="pof-mast-select" id="mast-${item.id}" data-item="${item.id}" onchange="onHeavyInput('${item.id}')">
            <option value="LOW">LOW</option>
            <option value="HIGH">HIGH</option>
           </select>`
        : `<td>—</td>`;

      if (item.type === 'flat') {
        h += `
          <tr id="hrow-${item.id}">
            <td class="col-item">${escHtml(item.name)}</td>
            <td><input type="number" min="0" step="1" class="pof-qty-input" id="hqty-${item.id}"
              data-item="${item.id}" value="0" oninput="onHeavyInput('${item.id}')" onfocus="this.select()"></td>
            <td>—</td><td>—</td><td>—</td><td>—</td>
            <td>—</td>
            <td>${item.qar.toLocaleString()}</td>
            <td class="col-total" id="htotal-${item.id}">—</td>
          </tr>`;
      } else {
        const transportDisplay = item.transport > 0 ? item.transport.toLocaleString() : '—';
        h += `
          <tr id="hrow-${item.id}">
            <td class="col-item">${escHtml(item.name)}</td>
            <td><input type="number" min="0" step="1" class="pof-qty-input" id="hqty-${item.id}"
              data-item="${item.id}" value="0" oninput="onHeavyInput('${item.id}')" onfocus="this.select()"></td>
            <td>${mastCell}</td>
            <td>
              <input type="date" class="pof-date-input" id="hstart-${item.id}" data-item="${item.id}"
                onchange="onHeavyInput('${item.id}')">
              <span class="pof-date-error hidden" id="hdate-err-${item.id}">Start must be ≤ End</span>
            </td>
            <td><input type="date" class="pof-date-input" id="hend-${item.id}" data-item="${item.id}"
              onchange="onHeavyInput('${item.id}')"></td>
            <td id="hdays-${item.id}" style="font-weight:700">—</td>
            <td>${transportDisplay}</td>
            <td>${item.qarPerDay.toLocaleString()}</td>
            <td class="col-total" id="htotal-${item.id}">—</td>
          </tr>`;
      }
    });
  });

  h += `
    <tr class="subtotal-row">
      <td colspan="7" style="text-align:right;padding-right:12px">SECTION TOTAL</td>
      <td colspan="2" style="text-align:right" id="section-total-${section.id}">QAR 0</td>
    </tr>
  </tbody></table></div></div></div>`;

  return h;
}

/* ── Financial summary renderer ── */
function renderFinancialSummary(pastCutoff) {
  const sectionLabels = {
    kitchen: 'Kitchen Equipment and Items',
    furniture: 'Furniture, Fixtures & Equipment',
    beverages: 'Beverages',
    stationery: 'Stationery',
    av: 'Audio Visual & Electrical',
    gases: 'Gases – Fuel – Chemicals',
    pit: 'Pit Equipment',
    heavy: 'Heavy Machinery and Vehicles',
    misc: 'Miscellaneous',
  };

  let rows = '';
  Object.entries(sectionLabels).forEach(([key, label]) => {
    rows += `
      <div class="pof-summary-row">
        <span class="label">${label}</span>
        <span class="amount zero" id="summary-${key}">QAR 0</span>
      </div>`;
  });

  const surchargeRow = pastCutoff
    ? `<div class="pof-surcharge-row">
        <span>+ 10% Late Surcharge</span>
        <span id="summary-surcharge">QAR 0</span>
      </div>`
    : '';

  return `
    <div class="pof-summary">
      <div class="pof-summary-header">Financial Summary</div>
      <div class="pof-summary-body">
        ${rows}
        <hr class="pof-summary-divider">
        ${surchargeRow}
        <div class="pof-summary-total">
          <span class="label">GRAND TOTAL</span>
          <span class="amount" id="summary-grand-qar">QAR 0</span>
        </div>
        <div class="pof-summary-usd" id="summary-grand-usd">USD 0.00</div>
      </div>
    </div>`;
}

/* ── Contact section renderer ── */
function renderContactSection() {
  const cd = FORM_SUBMISSION.contactDetails;

  function colHTML(key, title) {
    const d = cd[key];
    return `
      <div>
        <div class="pof-contact-col-title">${title}</div>
        <div class="pof-field">
          <label>Name *</label>
          <input class="pof-input" type="text" id="contact-${key}-name"
            placeholder="Full name" value="${escAttr(d.name)}"
            oninput="FORM_SUBMISSION.contactDetails.${key}.name=this.value">
        </div>
        <div class="pof-field">
          <label>Email *</label>
          <input class="pof-input" type="email" id="contact-${key}-email"
            placeholder="email@team.com" value="${escAttr(d.email)}"
            oninput="FORM_SUBMISSION.contactDetails.${key}.email=this.value">
        </div>
        <div class="pof-field">
          <label>Mobile</label>
          <input class="pof-input" type="tel" id="contact-${key}-mobile"
            placeholder="+974 XXXX XXXX" value="${escAttr(d.mobile)}"
            oninput="FORM_SUBMISSION.contactDetails.${key}.mobile=this.value">
        </div>
        <div class="pof-field">
          <label>Office</label>
          <input class="pof-input" type="text" id="contact-${key}-office"
            placeholder="Office number" value="${escAttr(d.office)}"
            oninput="FORM_SUBMISSION.contactDetails.${key}.office=this.value">
        </div>
      </div>`;
  }

  const licContacts = LIC_CONTACTS.map(c => `
    <div class="pof-lic-contact-item">
      <strong>${escHtml(c.name)}</strong>
      <div>${escHtml(c.email)} · ${escHtml(c.mobile)}</div>
    </div>`).join('');

  return `
    <div class="pof-contact-section">
      <div class="pof-contact-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Team Contact Details
      </div>
      <div class="pof-contact-grid">
        ${colHTML('preEvent', 'Pre-Event Contact')}
        ${colHTML('atVenue',  'At-Venue Contact')}
      </div>
      <div class="pof-lic-contacts">
        <div class="pof-lic-contacts-title">LIC Team Services Contacts</div>
        ${licContacts}
        <div class="pof-lic-contact-item" style="margin-top:6px">
          <strong>Office</strong>
          <div>+974 444 59 555</div>
        </div>
      </div>
    </div>`;
}

/* ── Recalculation ── */
function onQtyInput(input) {
  const itemId = input.dataset.item;
  const loc    = input.dataset.loc;
  const val    = Math.max(0, parseInt(input.value, 10) || 0);
  input.value  = val;

  // Toggle green highlight
  input.classList.toggle('has-value', val > 0);

  // Update state
  if (!FORM_SUBMISSION.gridItems[itemId]) FORM_SUBMISSION.gridItems[itemId] = {};
  FORM_SUBMISSION.gridItems[itemId][loc] = val;

  recalcRow(itemId);
  recalcSectionSubtotals();
  recalcGrandTotal();
  autosaveDraft();
}

function onHeavyInput(itemId) {
  const qtyEl   = document.getElementById(`hqty-${itemId}`);
  const startEl = document.getElementById(`hstart-${itemId}`);
  const endEl   = document.getElementById(`hend-${itemId}`);
  const mastEl  = document.getElementById(`mast-${itemId}`);
  const errEl   = document.getElementById(`hdate-err-${itemId}`);
  const daysEl  = document.getElementById(`hdays-${itemId}`);
  const totalEl = document.getElementById(`htotal-${itemId}`);

  if (!qtyEl) return;

  const qty = Math.max(0, parseInt(qtyEl.value, 10) || 0);
  qtyEl.value = qty;
  qtyEl.classList.toggle('has-value', qty > 0);

  const state = FORM_SUBMISSION.heavyItems[itemId] || {};
  state.qty   = qty;
  if (mastEl) state.mast = mastEl.value;

  const catalogItem = getItemById(itemId);
  if (!catalogItem) return;

  let total = 0;

  if (catalogItem.type === 'flat') {
    total = catalogItem.qar * qty;
    state.total = total;
    if (totalEl) totalEl.textContent = qty > 0 ? formatQAR(total) : '—';
  } else {
    // Rental
    const start = startEl ? startEl.value : '';
    const end   = endEl   ? endEl.value   : '';
    state.startDate = start;
    state.endDate   = end;

    let days = 0;
    let dateError = false;

    if (start && end) {
      const s = new Date(start), e = new Date(end);
      if (s > e) {
        dateError = true;
      } else {
        days = Math.max(1, Math.floor((e - s) / (1000*60*60*24)) + 1);
      }
    }

    if (errEl) errEl.classList.toggle('hidden', !dateError);
    if (daysEl) daysEl.textContent = days > 0 ? days : '—';

    state.days = days;
    total = (catalogItem.qarPerDay * days * qty) + (catalogItem.transport * qty);
    state.total = total;

    if (totalEl) {
      if (qty > 0 && days > 0) {
        totalEl.textContent = formatQAR(total);
      } else {
        totalEl.textContent = qty > 0 ? 'Set dates' : '—';
      }
    }
  }

  FORM_SUBMISSION.heavyItems[itemId] = state;
  recalcSectionSubtotals();
  recalcGrandTotal();
  autosaveDraft();
}

function recalcRow(itemId) {
  const item = getItemById(itemId);
  if (!item) return;
  const locs = FORM_SUBMISSION.gridItems[itemId] || {};
  const total = LOCATIONS.reduce((s, l) => s + (parseInt(locs[l], 10) || 0), 0);
  const lineTotal = total * item.qar;

  const totalEl = document.getElementById(`total-${itemId}`);
  const lineTotalEl = document.getElementById(`linetotal-${itemId}`);
  if (totalEl) totalEl.textContent = total || '0';
  if (lineTotalEl) lineTotalEl.textContent = total > 0 ? formatQAR(lineTotal) : '—';
}

function recalcSectionSubtotals() {
  CATALOG.forEach(section => {
    let sectionTotal = 0;

    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          const locs = FORM_SUBMISSION.gridItems[item.id] || {};
          const qty  = LOCATIONS.reduce((s,l) => s + (parseInt(locs[l],10)||0), 0);
          sectionTotal += qty * item.qar;
        });
      });
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => {
        grp.items.forEach(item => {
          const state = FORM_SUBMISSION.heavyItems[item.id] || {};
          sectionTotal += state.total || 0;
        });
      });
    }

    FORM_SUBMISSION.subtotals[section.id] = sectionTotal;

    const subtotalEl = document.getElementById(`subtotal-${section.id}`);
    const sectionTotalEl = document.getElementById(`section-total-${section.id}`);
    const summaryEl = document.getElementById(`summary-${section.id}`);

    if (subtotalEl) subtotalEl.textContent = formatQAR(sectionTotal);
    if (sectionTotalEl) sectionTotalEl.textContent = formatQAR(sectionTotal);
    if (summaryEl) {
      summaryEl.textContent = formatQAR(sectionTotal);
      summaryEl.classList.toggle('zero', sectionTotal === 0);
    }
  });
}

function recalcGrandTotal() {
  const grand = Object.values(FORM_SUBMISSION.subtotals).reduce((s,v) => s+(v||0), 0);
  const pastCutoff = isPastCutoff(FORM_YEAR_CFG.cutoffDate);
  const surcharge  = pastCutoff ? Math.round(grand * 0.10) : 0;
  const grandAdj   = grand + surcharge;

  FORM_SUBMISSION.grandTotalQAR = grand;
  FORM_SUBMISSION.surchargeQAR  = surcharge;
  FORM_SUBMISSION.grandTotalUSD = grand / USD_RATE;

  const grandQAREl  = document.getElementById('summary-grand-qar');
  const grandUSDEl  = document.getElementById('summary-grand-usd');
  const surchargeEl = document.getElementById('summary-surcharge');

  if (grandQAREl) grandQAREl.textContent = formatQAR(grandAdj);
  if (grandUSDEl) grandUSDEl.textContent = formatUSD(grandAdj);
  if (surchargeEl) surchargeEl.textContent = formatQAR(surcharge);
}

function recalcAll() {
  // Grid rows
  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => sub.items.forEach(item => recalcRow(item.id)));
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => grp.items.forEach(item => onHeavyInput(item.id)));
    }
  });
  recalcSectionSubtotals();
  recalcGrandTotal();
}

/* ── Restore draft values into DOM ── */
function restoreDraftValues() {
  const sub = FORM_SUBMISSION;

  // Grid items
  Object.entries(sub.gridItems || {}).forEach(([itemId, locs]) => {
    Object.entries(locs).forEach(([loc, qty]) => {
      const el = document.getElementById(`qty-${itemId}-${loc}`);
      if (el && qty > 0) {
        el.value = qty;
        el.classList.add('has-value');
      }
    });
  });

  // Heavy items
  Object.entries(sub.heavyItems || {}).forEach(([itemId, state]) => {
    const qtyEl   = document.getElementById(`hqty-${itemId}`);
    const mastEl  = document.getElementById(`mast-${itemId}`);
    const startEl = document.getElementById(`hstart-${itemId}`);
    const endEl   = document.getElementById(`hend-${itemId}`);

    if (qtyEl && state.qty) { qtyEl.value = state.qty; qtyEl.classList.toggle('has-value', state.qty > 0); }
    if (mastEl && state.mast) mastEl.value = state.mast;
    if (startEl && state.startDate) startEl.value = state.startDate;
    if (endEl && state.endDate) endEl.value = state.endDate;
  });
}

/* ── Autosave draft ── */
let _autosaveTimer = null;
function autosaveDraft() {
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(() => {
    saveSubmission(FORM_CHAMP, FORM_YEAR, FORM_TEAM_SLUG, FORM_SUBMISSION);
  }, 500);
}

/* ── Toggle helpers ── */
function toggleSection(sectionId) {
  const el = document.getElementById(`section-${sectionId}`);
  if (el) el.classList.toggle('open');
}

function toggleInfoPanel(btn) {
  btn.classList.toggle('open');
  const body = btn.nextElementSibling;
  if (body) body.classList.toggle('open');
}

/* ── Validation ── */
function validateForm() {
  const errors = [];
  const sub = FORM_SUBMISSION;

  // At least one item must be ordered
  const hasGridItem = Object.values(sub.gridItems).some(locs =>
    Object.values(locs).some(q => q > 0)
  );
  const hasHeavyItem = Object.values(sub.heavyItems).some(s => (s.qty||0) > 0);
  if (!hasGridItem && !hasHeavyItem) {
    errors.push('Please order at least one item before submitting.');
  }

  // Date validation for rental heavy items
  let dateError = false;
  CATALOG.forEach(section => {
    if (section.layout !== 'heavy') return;
    section.groups.forEach(grp => {
      grp.items.forEach(item => {
        if (item.type !== 'rental') return;
        const state = sub.heavyItems[item.id] || {};
        if ((state.qty||0) > 0) {
          if (!state.startDate || !state.endDate) {
            dateError = true;
          } else if (new Date(state.startDate) > new Date(state.endDate)) {
            dateError = true;
          }
        }
      });
    });
  });
  if (dateError) errors.push('All rented heavy machinery must have valid start and end dates.');

  // Contact details
  const pre = sub.contactDetails.preEvent;
  if (!pre.name || !pre.email) errors.push('Pre-event contact name and email are required.');

  return errors;
}

/* ── Submit handler ── */
function handleSubmit() {
  const errors = validateForm();
  if (errors.length) {
    showConfirmModal(false, errors);
    return;
  }
  showConfirmModal(true, []);
}

function showConfirmModal(valid, errors) {
  const overlay = document.getElementById('pof-confirm-modal');
  const body    = document.getElementById('pof-confirm-body');
  if (!overlay || !body) return;

  if (!valid) {
    body.innerHTML = `
      <div class="modal-title">Cannot Submit</div>
      <div class="modal-sub">Please fix the following before submitting:</div>
      <ul style="padding-left:18px;margin-bottom:24px">
        ${errors.map(e => `<li style="font-size:13px;color:var(--danger);margin-bottom:6px">${escHtml(e)}</li>`).join('')}
      </ul>
      <button class="btn btn-ghost" onclick="document.getElementById('pof-confirm-modal').classList.add('hidden')">Back to Form</button>`;
    overlay.classList.remove('hidden');
    return;
  }

  const sub = FORM_SUBMISSION;
  const pastCutoff = isPastCutoff(FORM_YEAR_CFG.cutoffDate);
  const surcharge  = sub.surchargeQAR || 0;
  const grand      = sub.grandTotalQAR || 0;
  const grandAdj   = grand + surcharge;

  body.innerHTML = `
    <div class="modal-title">Confirm Order Submission</div>
    <div class="modal-sub">${sub.teamName} · ${FORM_CHAMP_CFG.shortName} ${FORM_YEAR}</div>

    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px">
      ${['kitchen','furniture','beverages','stationery','av','gases','pit','heavy','misc'].map(key => {
        const amt = sub.subtotals[key] || 0;
        if (!amt) return '';
        const labels = { kitchen:'Kitchen Equipment', furniture:'Furniture & Fixtures', beverages:'Beverages', stationery:'Stationery', av:'Audio Visual', gases:'Gases & Chemicals', pit:'Pit Equipment', heavy:'Heavy Machinery', misc:'Miscellaneous' };
        return `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
          <span style="color:var(--text-muted)">${labels[key]}</span>
          <span style="font-weight:700">${formatQAR(amt)}</span>
        </div>`;
      }).join('')}
      ${pastCutoff ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:var(--danger)">
        <span>10% Late Surcharge</span><span style="font-weight:700">+ ${formatQAR(surcharge)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:8px;border-top:1px solid var(--border);font-size:15px;font-weight:800">
        <span>Grand Total</span>
        <span style="color:var(--champ-color)">${formatQAR(grandAdj)}</span>
      </div>
      <div style="text-align:right;font-size:12px;color:var(--text-muted)">${formatUSD(grandAdj)}</div>
    </div>

    <p style="font-size:12px;color:var(--text-muted);margin-bottom:20px">
      By confirming, you agree that all quantities are correct and accept the ordering terms.
    </p>

    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('pof-confirm-modal').classList.add('hidden')">Back</button>
      <button class="btn btn-primary" style="flex:2" onclick="confirmSubmit()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Confirm &amp; Submit
      </button>
    </div>`;

  overlay.classList.remove('hidden');
}

function confirmSubmit() {
  FORM_SUBMISSION.submittedAt = new Date().toISOString();
  FORM_SUBMISSION.status      = 'submitted';
  FORM_SUBMISSION.isPastCutoff = isPastCutoff(FORM_YEAR_CFG.cutoffDate);

  const ok = saveSubmission(FORM_CHAMP, FORM_YEAR, FORM_TEAM_SLUG, FORM_SUBMISSION);

  document.getElementById('pof-confirm-modal').classList.add('hidden');

  if (ok) {
    showSuccessScreen();
  } else {
    showPOFToast('Submission saved locally. Please download your copy.', 'info');
    downloadSubmissionJSON(FORM_SUBMISSION);
  }
}

/* ── Success screen ── */
function showSuccessScreen() {
  const sub = FORM_SUBMISSION;
  const grand = (sub.grandTotalQAR || 0) + (sub.surchargeQAR || 0);

  document.getElementById('pof-form-root').innerHTML = `
    <div class="pof-success">
      <div class="pof-success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="pof-success-title">Order Submitted Successfully</div>
      <div class="pof-success-sub">
        Thank you, <strong>${escHtml(sub.teamName)}</strong>.<br>
        Your order has been received. Reference: <strong style="color:var(--champ-color)">${sub.id}</strong>
      </div>

      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:left;margin-bottom:20px">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:10px">Order Summary</div>
        ${['kitchen','furniture','beverages','stationery','av','gases','pit','heavy','misc'].map(key => {
          const amt = sub.subtotals[key]||0; if (!amt) return '';
          const labels={kitchen:'Kitchen',furniture:'Furniture & Fixtures',beverages:'Beverages',stationery:'Stationery',av:'Audio Visual',gases:'Gases',pit:'Pit Equipment',heavy:'Heavy Machinery',misc:'Miscellaneous'};
          return `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px"><span style="color:var(--text-muted)">${labels[key]}</span><span>${formatQAR(amt)}</span></div>`;
        }).join('')}
        <div style="display:flex;justify-content:space-between;padding:8px 0 0;border-top:1px solid var(--border);margin-top:8px;font-size:14px;font-weight:800">
          <span>Grand Total</span><span style="color:var(--champ-color)">${formatQAR(grand)}</span>
        </div>
      </div>

      ${renderBankDetails()}

      <ul class="pof-payment-notes">
        <li>⚠ Payment must be made in <strong>Qatari Riyals (QAR)</strong></li>
        <li>⚠ All bank handling fees must be covered by the client</li>
        <li>⚠ 100% payment must be received before any keys are handed over</li>
      </ul>

      <div style="display:flex;gap:10px;flex-direction:column">
        <button id="pof-excel-btn" class="btn btn-primary" style="width:100%" onclick="handleExcelDownload(this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Download Proforma Invoice (Excel)
        </button>
        <button class="btn btn-ghost" style="width:100%" onclick="downloadSubmissionJSON(FORM_SUBMISSION)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Raw Data (JSON)
        </button>
      </div>
    </div>`;
}

function renderBankDetails() {
  const b = BANK_DETAILS;
  return `
    <div class="pof-bank-details">
      <div class="bd-title">Payment Bank Details</div>
      <div class="bd-row"><span class="bd-label">Account Name</span><span class="bd-value">${b.accountName}</span></div>
      <div class="bd-row"><span class="bd-label">Bank</span><span class="bd-value">${b.bank}</span></div>
      <div class="bd-row"><span class="bd-label">Account No.</span><span class="bd-value">${b.account}</span></div>
      <div class="bd-row"><span class="bd-label">IBAN</span><span class="bd-value" style="font-family:monospace;font-size:11px">${b.iban}</span></div>
      <div class="bd-row"><span class="bd-label">SWIFT</span><span class="bd-value">${b.swift}</span></div>
    </div>`;
}

/* ── Excel download with loading state ── */
async function handleExcelDownload(btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Generating Excel…';
  try {
    await generateProformaExcel(FORM_SUBMISSION);
  } catch (e) {
    showPOFToast('Excel generation failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

/* ── HTML escape helpers ── */
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s||'').replace(/"/g,'&quot;');
}
