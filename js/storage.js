/* ── POF Storage — localStorage bridge + JSON export ── */

const POF_KEY_PREFIX = 'POF_SUBMISSION_';

/* Build the localStorage key for a given submission */
function pofStorageKey(champKey, year, teamSlug) {
  return `${POF_KEY_PREFIX}${champKey.toUpperCase()}_${year}_${teamSlug}`;
}

/* Save a submission */
function saveSubmission(champKey, year, teamSlug, submissionData) {
  const key = pofStorageKey(champKey, year, teamSlug);
  try {
    localStorage.setItem(key, JSON.stringify(submissionData));
    return true;
  } catch(e) {
    console.error('POF save failed:', e);
    return false;
  }
}

/* Load a single submission */
function loadSubmission(champKey, year, teamSlug) {
  const key = pofStorageKey(champKey, year, teamSlug);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

/* List all POF submissions from localStorage */
function listAllSubmissions() {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(POF_KEY_PREFIX)) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data) results.push(data);
    } catch(e) {}
  }
  // Sort by submittedAt desc
  results.sort((a,b) => new Date(b.submittedAt||0) - new Date(a.submittedAt||0));
  return results;
}

/* Delete a submission */
function deleteSubmission(champKey, year, teamSlug) {
  localStorage.removeItem(pofStorageKey(champKey, year, teamSlug));
}

/* Mark a submission as imported */
function markAsImported(champKey, year, teamSlug) {
  const sub = loadSubmission(champKey, year, teamSlug);
  if (!sub) return;
  sub.status = 'imported';
  sub.importedAt = new Date().toISOString();
  saveSubmission(champKey, year, teamSlug, sub);
}

/* Export a single submission as JSON download */
function downloadSubmissionJSON(submission) {
  const blob = new Blob([JSON.stringify(submission, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `POF_${submission.championship}_${submission.year}_${submission.teamSlug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Import a submission from a JSON file (reads File object, calls callback with parsed data) */
function importSubmissionFromFile(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      callback(null, data);
    } catch(err) {
      callback('Invalid JSON file', null);
    }
  };
  reader.onerror = () => callback('File read error', null);
  reader.readAsText(file);
}

/* Build a blank submission object */
function buildBlankSubmission(champKey, year, teamName, teamSlug, cutoffDate) {
  const gridItems = {};
  const heavyItems = {};

  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          gridItems[item.id] = {};
          LOCATIONS.forEach(loc => { gridItems[item.id][loc] = 0; });
        });
      });
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => {
        grp.items.forEach(item => {
          heavyItems[item.id] = {
            qty: 0,
            mast: item.hasMast ? 'LOW' : null,
            startDate: '',
            endDate: '',
          };
        });
      });
    }
  });

  return {
    id: Date.now() + '_' + Math.random().toString(36).slice(2,7),
    championship: champKey.toUpperCase(),
    year: parseInt(year, 10),
    teamName: teamName,
    teamSlug: teamSlug,
    cutoffDate: cutoffDate,
    submittedAt: null,
    status: 'draft',
    isPastCutoff: isPastCutoff(cutoffDate),
    gridItems,
    heavyItems,
    additionalRequest: '',
    contactDetails: {
      preEvent: { name:'', email:'', mobile:'', office:'' },
      atVenue:  { name:'', email:'', mobile:'', office:'' },
    },
    subtotals: {
      kitchen: 0, furniture: 0, beverages: 0, stationery: 0,
      av: 0, gases: 0, pit: 0, heavy: 0, misc: 0,
    },
    grandTotalQAR: 0,
    grandTotalUSD: 0,
    surchargeQAR: 0,
  };
}

/* Toast helper (used across form.js and admin.js) */
function showPOFToast(msg, type='info') {
  const container = document.getElementById('pof-toast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `pof-toast-item ${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity 0.3s'; setTimeout(()=>el.remove(),300); }, 3000);
}

/* Toggle light/dark theme */
function togglePOFTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('pof_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function initPOFTheme() {
  const saved = localStorage.getItem('pof_theme') || localStorage.getItem('lic_ffe_theme') || 'dark';
  if (saved === 'light') document.body.classList.add('light');
}
