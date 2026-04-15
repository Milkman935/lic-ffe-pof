/* ── POF Service Catalog Data ── */
/* All prices in QAR. Exchange rate: 1 USD = 3.64 QAR */

const USD_RATE = 3.64;

/* Location keys used across the grid */
const LOCATIONS = ['kitchen','office1','office2','office3','office4','office5','office6','office7','office8','pit'];
const LOCATION_LABELS = { kitchen:'KITCHEN', office1:'OFF 1', office2:'OFF 2', office3:'OFF 3', office4:'OFF 4', office5:'OFF 5', office6:'OFF 6', office7:'OFF 7', office8:'OFF 8', pit:'PIT' };
const LOCATION_MATRIX_NAMES = { kitchen:'Kitchen', office1:'Office 1', office2:'Office 2', office3:'Office 3', office4:'Office 4', office5:'Office 5', office6:'Office 6', office7:'Office 7', office8:'Office 8', pit:'Pit' };

/* ── Catalog sections ── */
const CATALOG = [
  {
    id: 'kitchen',
    name: 'KITCHEN EQUIPMENT AND ITEMS',
    layout: 'grid',
    subcategories: [
      {
        name: 'KITCHEN ITEMS',
        items: [
          { id:'K01', name:'SINGLE DOOR REFRIGERATOR',   desc:'220 L WITH SMALL FREEZER',           qar:390  },
          { id:'K02', name:'2 DOOR REFRIGERATOR',        desc:'220 L WITH SMALL FREEZER',           qar:403  },
          { id:'K03', name:'2 DOOR REFRIGERATOR',        desc:'450 L WITH FREEZER ON TOP',          qar:815  },
          { id:'K04', name:'REFRIGERATED MERCHANDISER',  desc:'DOUBLE-DOOR',                        qar:5850 },
          { id:'K05', name:'CHEST FREEZER',              desc:'150-200 L (LIMITED NUMBERS)',        qar:1127 },
          { id:'K06', name:'WASHING UP LIQUID',          desc:'900 ml',                             qar:13   },
          { id:'K07', name:'KITCHEN ANTI-SLIP MATS',     desc:'1500 mm x 900 mm',                   qar:123  },
          { id:'K08', name:'KITCHEN ANTI-SLIP MATS',     desc:'900 mm x 700 mm',                    qar:120  },
          { id:'K09', name:'DISHWASHER FLUID',           desc:'5 L',                                qar:113  },
          { id:'K10', name:'RINSE AID',                  desc:'400 ML',                             qar:39   },
          { id:'K11', name:'ICE CUBES',                  desc:'3 KG',                               qar:13   },
          { id:'K12', name:'DISHWASHER SALT',            desc:'2 KG',                               qar:39   },
        ]
      }
    ]
  },
  {
    id: 'furniture',
    name: 'FURNITURE, FIXTURES & EQUIPMENT',
    layout: 'grid',
    subcategories: [
      {
        name: 'TABLES',
        items: [
          { id:'F01', name:'DESK',            desc:'320 cm L x 144 cm W 72cm H',   qar:1014 },
          { id:'F02', name:'DESK',            desc:'160cm (l) x 80cm (w) 74cm (h)',qar:798  },
          { id:'F03', name:'FOLDABLE TABLE',  desc:'180 cm L x 80 cm W 72 cm H',  qar:286  },
          { id:'F04', name:'PATIO TABLE',     desc:'—',                             qar:455  },
          { id:'F05', name:'SERVER TABLE',    desc:'180 cm x 50 cm',               qar:438  },
          { id:'F06', name:'BISTRO TABLE',    desc:'795 mm',                        qar:377  },
          { id:'F07', name:'COFFEE TABLE',    desc:'45 cm x 49 cm',                qar:221  },
        ]
      },
      {
        name: 'CHAIRS',
        items: [
          { id:'F08', name:'PLASTIC CHAIR',          desc:'LIMITED NUMBERS',          qar:104 },
          { id:'F09', name:'UPHOLSTERED CHAIR',      desc:'—',                         qar:139 },
          { id:'F10', name:'OFFICE CHAIR ON WHEELS', desc:'—',                         qar:243 },
          { id:'F11', name:'BAR STOOL',              desc:'111 cm H',                  qar:152 },
          { id:'F12', name:'CHAIR',                  desc:'—',                         qar:136 },
          { id:'F13', name:'VISITOR CHAIR',          desc:'—',                         qar:148 },
          { id:'F14', name:'PATIO CHAIR',            desc:'—',                         qar:182 },
        ]
      },
      {
        name: 'SOFA',
        items: [
          { id:'F15', name:'SOFA SET',        desc:'5 x SINGLE SOFAS IN GREY WITH SIDE TABLE', qar:3497 },
          { id:'F16', name:'TWO SEATER SOFA', desc:'155 cm W x 74 cm D 86 cm H',              qar:1820 },
        ]
      },
      {
        name: 'OTHER',
        items: [
          { id:'F17', name:'INTERNAL WALL',    desc:'WHITE PARTITION WALL 2.44m H — PER RUNNING m', qar:438  },
          { id:'F18', name:'INTERNAL DOOR',    desc:'Lockable door, white. 2.44m high (per door)',  qar:1105 },
          { id:'F19', name:'WASTE BIN',        desc:'15 L',                                          qar:78   },
          { id:'F20', name:'OSCILLATING FAN',  desc:'FREE STANDING',                                 qar:377  },
          { id:'F21', name:'WATER DISPENSER',  desc:'FOR 20 L BOTTLES',                              qar:252  },
          { id:'F22', name:'WHEELY BIN',       desc:'240 L',                                          qar:234  },
          { id:'F23', name:'GREY CARPET',      desc:'PER M2',                                         qar:70   },
        ]
      }
    ]
  },
  {
    id: 'beverages',
    name: 'BEVERAGES',
    layout: 'grid',
    subcategories: [
      {
        name: 'WATER',
        items: [
          { id:'B01', name:'STILL WATER - GLASS BOTTLES',     desc:'500 ml x 16', qar:120 },
          { id:'B02', name:'STILL WATER - GLASS BOTTLES',     desc:'250 ml x 24', qar:84  },
          { id:'B03', name:'SPARKLING WATER - GLASS BOTTLES', desc:'250 ml x 24', qar:108 },
          { id:'B04', name:'DISPENSER WATER',                 desc:'20 L',        qar:70  },
        ]
      },
      {
        name: 'BEVERAGES',
        items: [
          { id:'B05', name:'COKE - CANS',         desc:'150 ml x 30', qar:90  },
          { id:'B06', name:'COKE LIGHT - CANS',   desc:'150 ml x 30', qar:90  },
          { id:'B07', name:'SPRITE - CANS',        desc:'150 ml x 30', qar:90  },
          { id:'B08', name:'FANTA - CANS',         desc:'150 ml x 30', qar:90  },
          { id:'B09', name:'GINGER ALE - CANS',    desc:'150 ml x 30', qar:210 },
          { id:'B10', name:'POCARI SWEAT - CANS',  desc:'330 ml x 24', qar:236 },
          { id:'B11', name:'RED BULL ORIGINAL',    desc:'250 ml x 24', qar:350 },
          { id:'B12', name:'ICE TEA LEMON - CANS', desc:'210 ml x 24', qar:100 },
          { id:'B13', name:'ICE TEA PEACH - CANS', desc:'210 ml x 24', qar:100 },
        ]
      },
      {
        name: 'OTHER',
        items: [
          { id:'B14', name:'PAPER CUPS', desc:'200 ml x 50', qar:5 },
        ]
      }
    ]
  },
  {
    id: 'stationery',
    name: 'STATIONERY',
    layout: 'grid',
    subcategories: [
      {
        name: 'PRINTING PAPER',
        items: [
          { id:'S01', name:'A4', desc:'1 REAM - 500 SHEETS', qar:18 },
          { id:'S02', name:'A3', desc:'1 REAM - 500 SHEETS', qar:39 },
        ]
      }
    ]
  },
  {
    id: 'av',
    name: 'AUDIO VISUAL & ELECTRICAL',
    layout: 'grid',
    subcategories: [
      {
        name: 'AUDIO VISUAL',
        items: [
          { id:'A01', name:'LED SCREEN',           desc:'40" WITH STAND',  qar:637 },
          { id:'A02', name:'ELECTRICAL EXTENSION', desc:'5 M',             qar:100 },
          { id:'A03', name:'TV STAND',             desc:'ON WHEELS',       qar:130 },
        ]
      }
    ]
  },
  {
    id: 'gases',
    name: 'GASES – FUEL – CHEMICALS',
    layout: 'grid',
    subcategories: [
      {
        name: 'GASES',
        items: [
          { id:'G01', name:'NITROGEN',      desc:'INDUSTRIAL GRADE 40 L 150 BAR 6 M3',    qar:278 },
          { id:'G02', name:'NITROGEN',      desc:'HIGH GRADE 99.998% 50 L - 200 BAR - 10 M3', qar:369 },
          { id:'G03', name:'SYNTHETIC AIR', desc:'ZERO GRADE - 50 L / 9M3',                qar:598 },
          { id:'G04', name:'HYDROGEN',      desc:'40 L 200 BAR 9 M3',                      qar:550 },
          { id:'G05', name:'CARBON DIOXIDE',desc:'99.9% 50 L',                             qar:278 },
          { id:'G06', name:'ARGON',         desc:'50 L',                                   qar:304 },
        ]
      },
      {
        name: 'REGULATOR',
        items: [
          { id:'G07', name:'REGULATOR (PURCHASE ONLY)', desc:'TYPE R 504 1-7 BAR. BS3 OUTLET', qar:369 },
          { id:'G08', name:'REGULATOR (PURCHASE ONLY)', desc:'TYPE R 504 1-7 BAR. BS4 OUTLET', qar:369 },
        ]
      }
    ]
  },
  {
    id: 'pit',
    name: 'PIT EQUIPMENT',
    layout: 'grid',
    subcategories: [
      {
        name: 'FIRE EXTINGUISHERS',
        items: [
          { id:'P01', name:'CO2',                  desc:'5 KG',   qar:415 },
          { id:'P02', name:'DRY CHEMICAL POWDER',  desc:'9 KG',   qar:210 },
          { id:'P03', name:'AFFF',                 desc:'9 LTR',  qar:210 },
          { id:'P04', name:'WATER',                desc:'9 LTR',  qar:210 },
        ]
      },
      {
        name: 'OTHER',
        items: [
          { id:'P05', name:'BRAKE CLEANER - CANS', desc:'500 ML', qar:45   },
          { id:'P06', name:'BRAKE CLEANER',        desc:'20 LTR', qar:1050 },
          { id:'P07', name:'ACETONE',              desc:'20 L',   qar:1050 },
          { id:'P08', name:'DISTILLED WATER',      desc:'20 LTR', qar:50   },
        ]
      }
    ]
  },
  {
    id: 'heavy',
    name: 'HEAVY MACHINERY AND VEHICLES',
    layout: 'heavy',
    groups: [
      {
        name: '3T FORKLIFTS',
        items: [
          { id:'H01', name:'3 T FORKLIFT — CONTINUOUS RENTAL', type:'rental', qarPerDay:954,  transport:2080, hasMast:true  },
          { id:'H02', name:'3 T FORKLIFT — PRE-EVENT',         type:'rental', qarPerDay:954,  transport:2080, hasMast:true  },
          { id:'H03', name:'3 T FORKLIFT — LIVE-EVENT',        type:'rental', qarPerDay:954,  transport:2080, hasMast:true  },
          { id:'H04', name:'3 T FORKLIFT — POST-EVENT',        type:'rental', qarPerDay:954,  transport:2080, hasMast:true  },
          { id:'H05', name:'3 T FORK EXTENSIONS 1.8 M',        type:'flat',   qar:84,         transport:0,    hasMast:false },
          { id:'H06', name:'3 T FORK EXTENSIONS 2.1 M',        type:'flat',   qar:84,         transport:0,    hasMast:false },
          { id:'H07', name:'3 T FORK EXTENSIONS 2.4 M',        type:'flat',   qar:87,         transport:0,    hasMast:false },
        ]
      },
      {
        name: '5T FORKLIFTS',
        items: [
          { id:'H08', name:'5 T FORKLIFT — CONTINUOUS RENTAL', type:'rental', qarPerDay:1387, transport:2080, hasMast:true  },
          { id:'H09', name:'5 T FORKLIFT — PRE-EVENT',         type:'rental', qarPerDay:1387, transport:2080, hasMast:true  },
          { id:'H10', name:'5 T FORKLIFT — LIVE EVENT',        type:'rental', qarPerDay:1387, transport:2080, hasMast:true  },
          { id:'H11', name:'5 T FORKLIFT — POST-EVENT',        type:'rental', qarPerDay:1387, transport:2080, hasMast:true  },
          { id:'H12', name:'5 T FORK EXTENSIONS 1.8 M',        type:'flat',   qar:161,        transport:0,    hasMast:false },
          { id:'H13', name:'5 T FORK EXTENSIONS 2.1 M',        type:'flat',   qar:161,        transport:0,    hasMast:false },
          { id:'H14', name:'5 T FORK EXTENSIONS 2.4 M',        type:'flat',   qar:161,        transport:0,    hasMast:false },
        ]
      },
      {
        name: '7T FORKLIFTS',
        items: [
          { id:'H15', name:'7 T FORKLIFT — CONTINUOUS RENTAL', type:'rental', qarPerDay:1898, transport:2080, hasMast:true  },
          { id:'H16', name:'7 T FORKLIFT — PRE-EVENT',         type:'rental', qarPerDay:1898, transport:2080, hasMast:true  },
          { id:'H17', name:'7 T FORKLIFT — LIVE-EVENT',        type:'rental', qarPerDay:1898, transport:2080, hasMast:true  },
          { id:'H18', name:'7 T FORKLIFT — POST-EVENT',        type:'rental', qarPerDay:1898, transport:2080, hasMast:true  },
          { id:'H19', name:'7 T FORK EXTENSIONS 1.8 M',        type:'flat',   qar:174,        transport:0,    hasMast:false },
          { id:'H20', name:'7 T FORK EXTENSIONS 2.1 M',        type:'flat',   qar:174,        transport:0,    hasMast:false },
          { id:'H21', name:'7 T FORK EXTENSIONS 2.4 M',        type:'flat',   qar:174,        transport:0,    hasMast:false },
        ]
      },
      {
        name: '10T FORKLIFTS',
        items: [
          { id:'H22', name:'10 T FORKLIFT — CONTINUOUS RENTAL',type:'rental', qarPerDay:2254, transport:2080, hasMast:true  },
          { id:'H23', name:'10 T FORKLIFT — PRE-EVENT',        type:'rental', qarPerDay:2254, transport:2080, hasMast:true  },
          { id:'H24', name:'10 T FORKLIFT — LIVE EVENT',       type:'rental', qarPerDay:2254, transport:2080, hasMast:true  },
          { id:'H25', name:'10 T FORKLIFT — POST-EVENT',       type:'rental', qarPerDay:2254, transport:2080, hasMast:true  },
          { id:'H26', name:'10 T FORK EXTENSIONS 1.8 M',       type:'flat',   qar:208,        transport:0,    hasMast:false },
          { id:'H27', name:'10 T FORK EXTENSIONS 2.1 M',       type:'flat',   qar:208,        transport:0,    hasMast:false },
          { id:'H28', name:'10 T FORK EXTENSIONS 2.4 M',       type:'flat',   qar:208,        transport:0,    hasMast:false },
        ]
      },
      {
        name: 'OTHER MACHINERY',
        items: [
          { id:'H29', name:'PALLET TROLLEY 2 T',         type:'flat',   qar:1170, transport:0,    hasMast:false },
          { id:'H30', name:'4-SEATER ELECTRIC CLUB CAR', type:'rental', qarPerDay:455,  transport:2080, hasMast:false },
          { id:'H31', name:'6-SEATER ELECTRIC CLUB CAR', type:'rental', qarPerDay:780,  transport:2080, hasMast:false },
        ]
      }
    ]
  },
  {
    id: 'misc',
    name: 'MISCELLANEOUS',
    layout: 'grid',
    subcategories: [
      {
        name: 'MISCELLANEOUS',
        items: [
          { id:'M01', name:'WINDOW FROSTING', desc:'PER M2', qar:87 },
        ]
      }
    ]
  }
];

/* ── Villa included items (read-only display) ── */
const VILLA_INCLUDED = [
  { name:'TV SCREENS',                  qty:'Kitchen: 2, Office 1: 2, Offices 2–8: 1 each, Pit: 2' },
  { name:'OFFICE DESK (First Floor)',   qty:'7 — 1 per office (1–7)' },
  { name:'OFFICE CHAIRS (First Floor)', qty:'7 — 1 per office' },
  { name:'UNDERDESK DRAWERS',           qty:'7 — 1 per office' },
  { name:'FIRE EXTINGUISHERS',          qty:'2 — Kitchen' },
  { name:'DRY CHEMICAL POWDER 9 KG',   qty:'1 — Pit' },
  { name:'DRY CHEMICAL POWDER 25 KG',  qty:'1 — Pit' },
  { name:'WALK IN FRIDGE',             qty:'1 — Kitchen' },
  { name:'SHELVES IN WALK IN',         qty:'6 × RACK SHELVING 20 x 30' },
  { name:'UNDER COUNTER FRIDGES',      qty:'4' },
  { name:'CONVECTION OVEN',            qty:'1' },
  { name:'DEEP FAT FRYER',             qty:'1 (20 x 90)' },
  { name:'WATER BOILER (PASTA)',        qty:'1' },
  { name:'FLAT PLATE',                 qty:'1' },
  { name:'EXTRACTION HOOD',            qty:'1' },
  { name:'INSECT ZAPPERS',             qty:'2' },
  { name:'SALAMANDER',                 qty:'1' },
  { name:'DISH WASHER',                qty:'1' },
  { name:'COOKING HOB',                qty:'1 × 4 ring' },
  { name:'PATIO FURNITURE',            qty:'Included' },
];

/* ── Helpers ── */
function getAllCatalogItems() {
  const items = [];
  CATALOG.forEach(section => {
    if (section.layout === 'grid') {
      section.subcategories.forEach(sub => sub.items.forEach(item => items.push({ ...item, sectionId: section.id, sectionName: section.name })));
    } else if (section.layout === 'heavy') {
      section.groups.forEach(grp => grp.items.forEach(item => items.push({ ...item, sectionId: section.id, sectionName: section.name })));
    }
  });
  return items;
}

function getItemById(id) {
  return getAllCatalogItems().find(i => i.id === id);
}

function formatQAR(n) {
  if (!n) return 'QAR 0';
  return 'QAR ' + Math.round(n).toLocaleString();
}

function formatUSD(n) {
  if (!n) return 'USD 0.00';
  return 'USD ' + (n / USD_RATE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
