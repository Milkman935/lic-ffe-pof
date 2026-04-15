/* ── POF Championship & Team Configuration ── */

const CHAMP_CONFIG = {
  wec: {
    name: 'FIA World Endurance Championship',
    shortName: 'WEC',
    color: '#0067ff',
    logo: 'assets/images/WEC.png',
    years: {
      2026: {
        cutoffDate: '2026-02-17',
        eventStart: '2026-03-18',
        eventEnd:   '2026-03-29',
        teams: [
          'ASTON MARTIN THOR TEAM', 'TOYOTA GAZOO RACING', 'CADILLAC HERTZ TEAM JOTA',
          'BMW M TEAM WRT', 'GENESIS MAGMA RACING', 'ALPINE ENDURANCE TEAM',
          'FERRARI AF CORSE', 'AF CORSE', 'PEUGEOT TOTALENERGIES', 'GARAGE 59',
          'VISTA AF CORSE', 'HEART OF RACING TEAM', 'TEAM WRT', 'TF SPORT',
          'RACING TEAM TURKEY BY TF', 'PROTON COMPETITION', 'AKKODIS ASP TEAM',
          'IRON LYNX', 'MANTHEY DK ENGINEERING', 'THE BEND MANTHEY'
        ]
      },
      2025: {
        cutoffDate: '2025-02-10',
        eventStart: '2025-02-28',
        eventEnd:   '2025-03-02',
        teams: [
          'TOYOTA GAZOO RACING', 'FERRARI AF CORSE', 'PEUGEOT TOTALENERGIES',
          'CADILLAC RACING', 'BMW M MOTORSPORT', 'ALPINE ENDURANCE TEAM',
          'ISOTTA FRASCHINI VISION', 'TEAM PEUGEOT TOTALENERGIES',
          'AKKODIS ASP TEAM', 'IRON LYNX', 'PROTON COMPETITION', 'TF SPORT',
          'HEART OF RACING TEAM', 'TEAM WRT'
        ]
      }
    }
  },
  f1: {
    name: 'Formula 1',
    shortName: 'F1',
    color: '#e10600',
    logo: 'assets/images/f1.png',
    years: {
      2026: {
        cutoffDate: '2026-10-01',
        eventStart: '2026-11-27',
        eventEnd:   '2026-11-29',
        teams: [
          'RED BULL RACING', 'SCUDERIA FERRARI', 'MERCEDES-AMG PETRONAS',
          'MCLAREN F1 TEAM', 'ASTON MARTIN ARAMCO', 'ALPINE F1 TEAM',
          'WILLIAMS RACING', 'VISA CASH APP RB', 'STAKE F1 TEAM KICK SAUBER',
          'MONEYGRAM HAAS F1 TEAM'
        ]
      },
      2025: {
        cutoffDate: '2025-10-15',
        eventStart: '2025-11-21',
        eventEnd:   '2025-11-23',
        teams: [
          'RED BULL RACING', 'SCUDERIA FERRARI', 'MERCEDES-AMG PETRONAS',
          'MCLAREN F1 TEAM', 'ASTON MARTIN ARAMCO', 'ALPINE F1 TEAM',
          'WILLIAMS RACING', 'VISA CASH APP RB', 'STAKE F1 TEAM KICK SAUBER',
          'MONEYGRAM HAAS F1 TEAM'
        ]
      }
    }
  },
  motogp: {
    name: 'FIM Grand Prix World Championship',
    shortName: 'MotoGP',
    color: '#ff6900',
    logo: 'assets/images/MOTO gp .png',
    years: {
      2026: {
        cutoffDate: '2026-10-01',
        eventStart: '2026-11-13',
        eventEnd:   '2026-11-16',
        teams: [
          'DUCATI LENOVO TEAM', 'PRIMA PRAMAC RACING', 'MOONEY VR46 RACING',
          'GRESINI RACING MOTOGP', 'APRILIA RACING', 'TRACKHOUSE RACING',
          'MONSTER ENERGY YAMAHA', 'WITH U YAMAHA RTECH', 'LCR HONDA',
          'REPSOL HONDA TEAM', 'RED BULL KTM FACTORY', 'RED BULL GAS GAS TECH3',
          'PERTAMINA ENDURO VR46', 'ELF MARC VDS RACING'
        ]
      },
      2025: {
        cutoffDate: '2025-10-15',
        eventStart: '2025-11-01',
        eventEnd:   '2025-11-03',
        teams: [
          'DUCATI LENOVO TEAM', 'PRIMA PRAMAC RACING', 'MOONEY VR46 RACING',
          'GRESINI RACING MOTOGP', 'APRILIA RACING', 'TRACKHOUSE RACING',
          'MONSTER ENERGY YAMAHA', 'LCR HONDA IDEMITSU', 'LCR HONDA CASTROL',
          'REPSOL HONDA TEAM', 'RED BULL KTM FACTORY', 'RED BULL GAS GAS TECH3'
        ]
      }
    }
  }
};

/* ── Helpers ── */

function getChampConfig(champKey) {
  return CHAMP_CONFIG[champKey] || null;
}

function getYearConfig(champKey, year) {
  const c = getChampConfig(champKey);
  if (!c) return null;
  return c.years[parseInt(year, 10)] || null;
}

function getTeamList(champKey, year) {
  const y = getYearConfig(champKey, year);
  return y ? y.teams : [];
}

/* Get team list for a year, falling back to the nearest configured year if not found */
function getTeamListWithFallback(champKey, year) {
  const exact = getTeamList(champKey, year);
  if (exact.length) return exact;

  // Find nearest configured year
  const cc = getChampConfig(champKey);
  if (!cc) return [];
  const configuredYears = Object.keys(cc.years).map(Number).sort((a, b) => b - a);
  if (!configuredYears.length) return [];

  const target = parseInt(year, 10);
  const nearest = configuredYears.reduce((prev, cur) =>
    Math.abs(cur - target) < Math.abs(prev - target) ? cur : prev
  );
  return cc.years[nearest]?.teams || [];
}

/* Convert team name to URL-safe slug */
function teamNameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Convert slug back to team name (from a list) */
function slugToTeamName(slug, champKey, year) {
  const teams = getTeamList(champKey, year);
  return teams.find(t => teamNameToSlug(t) === slug) || null;
}

/* Get URL params */
function getPOFParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    champ: (p.get('champ') || '').toLowerCase(),
    year:  parseInt(p.get('year') || 0, 10),
    team:  p.get('team') || '',
  };
}

/* Calculate days until cutoff */
function daysUntilCutoff(cutoffDate) {
  const now = new Date(); now.setHours(0,0,0,0);
  const cut = new Date(cutoffDate); cut.setHours(0,0,0,0);
  return Math.floor((cut - now) / (1000 * 60 * 60 * 24));
}

function isPastCutoff(cutoffDate) {
  return daysUntilCutoff(cutoffDate) < 0;
}

/* Format date nicely */
function fmtDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

/* LIC contact details */
const LIC_CONTACTS = [
  { name:'Wendel Malenab',     email:'wendel.malenab@circuitlosail.com', mobile:'+974 5062 2068', office:'+974 444 59 555' },
  { name:'Yousef Abdelmoaty',  email:'yoseef.abdelmoaty@lcsc.qa',        mobile:'+974 3317 5732', office:'+974 444 59 555' },
];

/* Bank details */
const BANK_DETAILS = {
  accountName: 'LOSAIL CIRCUIT SPORTS CLUB',
  bank:        'QATAR NATIONAL BANK (Q.P.S.C)',
  account:     '0013-046162-002',
  iban:        'QA71 QNBA 0000 0000 0013 0461 6200 2',
  swift:       'QNBAQAQA',
};
