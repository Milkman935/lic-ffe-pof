/* ── POF Admin Dashboard Logic ── */
/* Depends on: catalog.js, config.js, storage.js */

function initAdmin() {
  initPOFTheme();
  renderAdminStats();
  renderGenerateForm();
  syncYearOptions();
  renderSubmissionsTable();
}

/* ── Stats ── */
function renderAdminStats() {
  const subs = listAllSubmissions();
  const submitted = subs.filter(s => s.status === 'submitted').length;
  const imported  = subs.filter(s => s.status === 'imported').length;
  const draft     = subs.filter(s => s.status === 'draft').length;

  document.getElementById('stat-total').textContent    = subs.length;
  document.getElementById('stat-submitted').textContent = submitted;
  document.getElementById('stat-imported').textContent  = imported;
  document.getElementById('stat-draft').textContent     = draft;
}

/* ── Generate form ── */
function renderGenerateForm() {
  const champSel = document.getElementById('gen-champ');
  const yearSel  = document.getElementById('gen-year');
  const teamSel  = document.getElementById('gen-team');

  // Populate champs
  champSel.innerHTML = '<option value="">— Select Championship —</option>';
  Object.entries(CHAMP_CONFIG).forEach(([key, cfg]) => {
    champSel.innerHTML += `<option value="${key}">${cfg.shortName} — ${cfg.name}</option>`;
  });

  champSel.onchange = () => {
    const champKey = champSel.value;
    yearSel.innerHTML = '<option value="">— Select Year —</option>';
    teamSel.innerHTML = '<option value="">— Select Team —</option>';
    updateGeneratedLink();

    if (!champKey) return;
    const currentYear = new Date().getFullYear();
    yearSel.innerHTML = '<option value="">— Select Year —</option>';
    for (let y = currentYear + 2; y >= 2023; y--) {
      yearSel.innerHTML += `<option value="${y}"${y === currentYear ? ' selected' : ''}>${y}</option>`;
    }
    // Trigger team list for auto-selected year
    yearSel.dispatchEvent(new Event('change'));
  };

  yearSel.onchange = () => {
    const champKey = champSel.value;
    const year     = yearSel.value;
    teamSel.innerHTML = '<option value="">— Select Team —</option>';
    updateGeneratedLink();

    if (!champKey || !year) return;
    // Use configured team list for this year, or fall back to nearest configured year
    const teams = getTeamListWithFallback(champKey, year);
    teams.sort().forEach(t => {
      teamSel.innerHTML += `<option value="${teamNameToSlug(t)}">${t}</option>`;
    });
  };

  teamSel.onchange = updateGeneratedLink;
}

function updateGeneratedLink() {
  const champSel = document.getElementById('gen-champ');
  const yearSel  = document.getElementById('gen-year');
  const teamSel  = document.getElementById('gen-team');
  const linkRow  = document.getElementById('gen-link-row');
  const linkText = document.getElementById('gen-link-text');

  const champ = champSel.value;
  const year  = yearSel.value;
  const team  = teamSel.value;

  if (!champ || !year || !team) {
    if (linkRow) linkRow.classList.add('hidden');
    return;
  }

  const base = window.location.href.replace('index.html', '').replace(/\?.*$/, '');
  const url  = `${base}form.html?champ=${champ}&year=${year}&team=${team}`;

  if (linkText) linkText.textContent = url;
  if (linkRow) linkRow.classList.remove('hidden');
}

function copyGeneratedLink() {
  const linkText = document.getElementById('gen-link-text');
  if (!linkText) return;
  navigator.clipboard.writeText(linkText.textContent).then(() => {
    showPOFToast('Link copied to clipboard!', 'success');
  }).catch(() => {
    showPOFToast('Could not copy — please select and copy manually.', 'error');
  });
}

function openGeneratedLink() {
  const linkText = document.getElementById('gen-link-text');
  if (linkText && linkText.textContent) {
    window.open(linkText.textContent, '_blank');
  }
}

/* ── Submissions table ── */
function renderSubmissionsTable() {
  const tbody    = document.getElementById('sub-tbody');
  const countEl  = document.getElementById('sub-count');
  if (!tbody) return;

  let subs = listAllSubmissions();

  // Apply filter
  const filterChamp  = document.getElementById('filter-champ')?.value || '';
  const filterStatus = document.getElementById('filter-status')?.value || '';
  const filterSearch = (document.getElementById('filter-search')?.value || '').toLowerCase();

  const filterYear   = document.getElementById('filter-year')?.value || '';

  if (filterChamp)  subs = subs.filter(s => s.championship.toLowerCase() === filterChamp.toLowerCase());
  if (filterYear)   subs = subs.filter(s => String(s.year) === filterYear);
  if (filterStatus) subs = subs.filter(s => s.status === filterStatus);
  if (filterSearch) subs = subs.filter(s =>
    s.teamName.toLowerCase().includes(filterSearch) ||
    s.id.toLowerCase().includes(filterSearch)
  );

  if (countEl) countEl.textContent = `${subs.length} submission${subs.length !== 1 ? 's' : ''}`;

  if (!subs.length) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="sub-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="display:block;margin:0 auto 12px;opacity:.3"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        No submissions found
      </td></tr>`;
    return;
  }

  tbody.innerHTML = subs.map(sub => {
    const champ = sub.championship.toLowerCase();
    const grand = (sub.grandTotalQAR||0) + (sub.surchargeQAR||0);
    const dateStr = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    const statusClass = sub.status === 'submitted' ? 'submitted' : sub.status === 'imported' ? 'imported' : 'pending';

    return `
      <tr>
        <td><span class="champ-chip ${champ}">${sub.championship}</span></td>
        <td>${sub.year}</td>
        <td style="font-weight:600">${escAdm(sub.teamName)}</td>
        <td style="font-size:12px;color:var(--text-muted)">${dateStr}</td>
        <td style="font-weight:700">${grand > 0 ? formatQAR(grand) : '—'}</td>
        <td><span class="sub-badge ${statusClass}">${sub.status}</span></td>
        <td class="sub-actions">
          <button class="btn btn-sm btn-ghost" onclick="viewSubmission('${sub.championship.toLowerCase()}','${sub.year}','${sub.teamSlug}')">View</button>
          <button class="btn btn-sm btn-primary" onclick="downloadPDF('${sub.championship.toLowerCase()}','${sub.year}','${sub.teamSlug}')" title="Download Proforma PDF"
            style="background:rgba(0,103,255,0.15);color:#64b5f6;border:1px solid rgba(0,103,255,0.3)">
            PDF
          </button>
          ${sub.status === 'submitted' ? `<button class="btn btn-sm btn-primary" onclick="importToMatrix('${sub.championship.toLowerCase()}','${sub.year}','${sub.teamSlug}')">Import</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="downloadSub('${sub.championship.toLowerCase()}','${sub.year}','${sub.teamSlug}')" title="Download raw JSON">JSON</button>
          <button class="btn btn-sm" style="background:rgba(255,23,68,0.1);color:var(--danger);border:1px solid rgba(255,23,68,0.3)" onclick="deleteSub('${sub.championship.toLowerCase()}','${sub.year}','${sub.teamSlug}')">✕</button>
        </td>
      </tr>`;
  }).join('');
}

/* ── View submission detail ── */
function viewSubmission(champ, year, teamSlug) {
  const sub = loadSubmission(champ, year, teamSlug);
  if (!sub) { showPOFToast('Submission not found', 'error'); return; }

  const overlay = document.getElementById('sub-detail-modal');
  const body    = document.getElementById('sub-detail-body');

  // Build ordered item list
  let itemRows = '';
  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      section.subcategories.forEach(sc => {
        sc.items.forEach(item => {
          const locs = sub.gridItems?.[item.id] || {};
          const totalQty = LOCATIONS.reduce((s,l) => s+(parseInt(locs[l],10)||0), 0);
          if (!totalQty) return;
          const locBreakdown = LOCATIONS.filter(l => (locs[l]||0)>0)
            .map(l => `${LOCATION_LABELS[l]}:${locs[l]}`).join(', ');
          itemRows += `<tr><td>${escAdm(item.name)}</td><td>${totalQty}</td><td style="font-size:11px;color:var(--text-muted)">${locBreakdown}</td><td>${formatQAR(totalQty * item.qar)}</td></tr>`;
        });
      });
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => {
        grp.items.forEach(item => {
          const st = sub.heavyItems?.[item.id] || {};
          if (!(st.qty > 0)) return;
          const info = item.type === 'rental'
            ? `${st.startDate||'?'} – ${st.endDate||'?'} (${st.days||0} days)${st.mast ? ' · '+st.mast : ''}`
            : 'Flat rate';
          itemRows += `<tr><td>${escAdm(item.name)}</td><td>${st.qty}</td><td style="font-size:11px;color:var(--text-muted)">${info}</td><td>${formatQAR(st.total||0)}</td></tr>`;
        });
      });
    }
  });

  const grand = (sub.grandTotalQAR||0) + (sub.surchargeQAR||0);

  body.innerHTML = `
    <div class="modal-title">${escAdm(sub.teamName)}</div>
    <div class="modal-sub">${sub.championship} ${sub.year} · Submitted: ${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Draft'}</div>

    ${itemRows ? `
    <table class="sub-detail-table" style="margin-bottom:16px">
      <thead><tr><th>Item</th><th>Qty</th><th>Locations / Info</th><th>Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>` : '<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">No items ordered.</p>'}

    ${sub.additionalRequest ? `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px"><strong>Additional Request:</strong><br>${escAdm(sub.additionalRequest)}</div>` : ''}

    <div style="display:flex;justify-content:space-between;padding:10px;background:var(--surface2);border-radius:8px;font-size:14px;font-weight:800;margin-bottom:20px">
      <span>Grand Total</span><span style="color:var(--champ-color)">${formatQAR(grand)}</span>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="document.getElementById('sub-detail-modal').classList.add('hidden')">Close</button>
      <button class="btn btn-primary" onclick="generateProformaPDF(${JSON.stringify(sub).replace(/"/g,'&quot;')})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Proforma PDF
      </button>
      <button class="btn btn-ghost" onclick="downloadSub('${champ}','${year}','${teamSlug}')">Download JSON</button>
      ${sub.status === 'submitted' ? `<button class="btn btn-primary" onclick="importToMatrix('${champ}','${year}','${teamSlug}');document.getElementById('sub-detail-modal').classList.add('hidden')">Import to Matrix</button>` : ''}
    </div>`;

  overlay.classList.remove('hidden');
}

/* ── Import to Matrix ── */
function importToMatrix(champ, year, teamSlug) {
  const sub = loadSubmission(champ, year, teamSlug);
  if (!sub) { showPOFToast('Submission not found', 'error'); return; }

  // Check if matrix data is in localStorage
  const matrixKey = `lic_ffe_${champ}_${year}`;
  const raw = localStorage.getItem(matrixKey);

  if (!raw) {
    showPOFToast(`Matrix data for ${champ.toUpperCase()} ${year} not found in localStorage. Open the main matrix project in the same browser first.`, 'error');
    return;
  }

  try {
    const matrixData = JSON.parse(raw);
    const result = applyPOFSubmissionToMatrix(matrixData, sub);

    if (result.success) {
      localStorage.setItem(matrixKey, JSON.stringify(matrixData));
      markAsImported(champ, year, teamSlug);
      renderAdminStats();
      renderSubmissionsTable();
      showPOFToast(`Imported ${result.itemsUpdated} items for ${sub.teamName} into the matrix.`, 'success');
    } else {
      showPOFToast(`Import issue: ${result.message}`, 'error');
    }
  } catch(e) {
    showPOFToast('Import failed: could not parse matrix data.', 'error');
  }
}

/* ── Core import logic (also used by pof-import.js in main project) ── */
function applyPOFSubmissionToMatrix(matrixData, sub) {
  const teamName = sub.teamName;

  // Navigate to the championship/year data structure
  // Matrix stores: matrixData.championships[champKey] for year-specific data
  // OR: matrixData directly (depends on what localStorage key was used)
  // The main project stores: { departments:{}, teams:{}, items:[], ... } per champ/year blob
  let cd = matrixData;

  // Ensure teams object exists
  if (!cd.teams) cd.teams = {};

  // Ensure this team exists
  if (!cd.teams[teamName]) {
    cd.teams[teamName] = {
      locations: {},
      images: [],
    };
  }

  const team = cd.teams[teamName];
  if (!team.locations) team.locations = {};

  // Create standard locations for team villa if they don't exist
  const locNames = Object.values(LOCATION_MATRIX_NAMES);
  locNames.forEach(locName => {
    if (!team.locations[locName]) {
      team.locations[locName] = { bump_in: '', bump_out: '', contact: '' };
    }
  });

  // Apply grid items
  let itemsUpdated = 0;
  if (!cd.items) cd.items = [];

  // Build item lookup by pof_id
  const itemByPofId = {};
  cd.items.forEach(item => { if (item.pof_id) itemByPofId[item.pof_id] = item; });

  // Also build lookup by name (fallback)
  const itemByName = {};
  cd.items.forEach(item => { if (item.name) itemByName[item.name.toUpperCase()] = item; });

  // Process grid items
  Object.entries(sub.gridItems || {}).forEach(([pofId, locs]) => {
    const hasAny = Object.values(locs).some(q => q > 0);
    if (!hasAny) return;

    const catalogItem = getItemById(pofId);
    if (!catalogItem) return;

    // Find matrix item
    let matrixItem = itemByPofId[pofId]
      || itemByName[catalogItem.name.toUpperCase()];

    if (!matrixItem) {
      // Create the item in the matrix
      matrixItem = {
        id: `pof_${pofId}_${Date.now()}`,
        pof_id: pofId,
        name: catalogItem.name,
        category: catalogItem.sectionName,
        lic_inventory: 0,
        moys_lic: 0,
        aspire: 0,
        dept_quantities: {},
        team_quantities: {},
      };
      cd.items.push(matrixItem);
      itemByPofId[pofId] = matrixItem;
    }

    // Set pof_id if missing
    if (!matrixItem.pof_id) matrixItem.pof_id = pofId;
    if (!matrixItem.team_quantities) matrixItem.team_quantities = {};
    if (!matrixItem.team_quantities[teamName]) matrixItem.team_quantities[teamName] = {};

    // Apply quantities per location
    LOCATIONS.forEach(locKey => {
      const qty = parseInt(locs[locKey], 10) || 0;
      const locName = LOCATION_MATRIX_NAMES[locKey];
      if (qty > 0) {
        matrixItem.team_quantities[teamName][locName] = qty;
        itemsUpdated++;
      }
    });
  });

  // Process heavy machinery items (write total qty to "Pit" location as a convention)
  Object.entries(sub.heavyItems || {}).forEach(([pofId, state]) => {
    if (!(state.qty > 0)) return;

    const catalogItem = getItemById(pofId);
    if (!catalogItem) return;

    let matrixItem = itemByPofId[pofId] || itemByName[catalogItem.name.toUpperCase()];

    if (!matrixItem) {
      matrixItem = {
        id: `pof_${pofId}_${Date.now()}`,
        pof_id: pofId,
        name: catalogItem.name,
        category: 'Heavy Machinery',
        lic_inventory: 0,
        moys_lic: 0,
        aspire: 0,
        dept_quantities: {},
        team_quantities: {},
      };
      cd.items.push(matrixItem);
      itemByPofId[pofId] = matrixItem;
    }

    if (!matrixItem.pof_id) matrixItem.pof_id = pofId;
    if (!matrixItem.team_quantities) matrixItem.team_quantities = {};
    if (!matrixItem.team_quantities[teamName]) matrixItem.team_quantities[teamName] = {};

    // Store in Pit location with mast/date metadata in a note
    matrixItem.team_quantities[teamName]['Pit'] = state.qty;
    if (state.startDate || state.endDate || state.mast) {
      matrixItem.team_quantities[teamName]['_pof_meta'] = {
        mast: state.mast,
        startDate: state.startDate,
        endDate: state.endDate,
        days: state.days,
      };
    }
    itemsUpdated++;
  });

  return { success: true, itemsUpdated, message: '' };
}

/* ── Download / Delete ── */
function downloadPDF(champ, year, teamSlug) {
  const sub = loadSubmission(champ, year, teamSlug);
  if (!sub) { showPOFToast('Submission not found', 'error'); return; }
  generateProformaPDF(sub);
}

function downloadSub(champ, year, teamSlug) {
  const sub = loadSubmission(champ, year, teamSlug);
  if (sub) downloadSubmissionJSON(sub);
}

function deleteSub(champ, year, teamSlug) {
  if (!confirm('Delete this submission? This cannot be undone.')) return;
  deleteSubmission(champ, year, teamSlug);
  renderAdminStats();
  renderSubmissionsTable();
  showPOFToast('Submission deleted', 'info');
}

/* ── Import from file ── */
function triggerImportFile() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    importSubmissionFromFile(file, (err, data) => {
      if (err) { showPOFToast('Error: ' + err, 'error'); return; }
      if (!data.championship || !data.year || !data.teamSlug) {
        showPOFToast('Invalid submission file.', 'error'); return;
      }
      saveSubmission(data.championship.toLowerCase(), data.year, data.teamSlug, data);
      renderAdminStats();
      renderSubmissionsTable();
      showPOFToast(`Imported: ${data.teamName} — ${data.championship} ${data.year}`, 'success');
    });
  };
  input.click();
}

/* ── Filter handling ── */
function applyFilters() {
  renderSubmissionsTable();
}

/* Rebuild year dropdown based on what's actually in localStorage (optionally scoped to selected champ) */
function syncYearOptions() {
  const yearSel = document.getElementById('filter-year');
  if (!yearSel) return;

  const current     = yearSel.value;
  const currentYear = new Date().getFullYear();

  yearSel.innerHTML = '<option value="">All Years</option>';
  for (let y = currentYear + 2; y >= 2023; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (String(y) === current) opt.selected = true;
    yearSel.appendChild(opt);
  }
}

/* ── Escape helper ── */
function escAdm(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
