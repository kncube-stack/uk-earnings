const REGION_LABELS = {
  K02000001: { desktop: ["United", "Kingdom"], mobile: ["UK"] },
  E12000001: { desktop: ["North", "East"], mobile: ["N East"] },
  E12000002: { desktop: ["North", "West"], mobile: ["N West"] },
  E12000003: { desktop: ["Yorks &", "Humber"], mobile: ["Yorks &", "Humber"] },
  E12000004: { desktop: ["East", "Midlands"], mobile: ["E Mids"] },
  E12000005: { desktop: ["West", "Midlands"], mobile: ["W Mids"] },
  E12000006: { desktop: ["East of", "England"], mobile: ["East"] },
  E12000007: { desktop: ["London"], mobile: ["London"] },
  E12000008: { desktop: ["South", "East"], mobile: ["S East"] },
  E12000009: { desktop: ["South", "West"], mobile: ["S West"] },
  W92000004: { desktop: ["Wales"], mobile: ["Wales"] },
  S92000003: { desktop: ["Scotland"], mobile: ["Scot."] },
  N92000002: { desktop: ["Northern", "Ireland"], mobile: ["N. Ire."] },
};

const INDUSTRY_LABELS = {
  A: { desktop: ["Agriculture"], mobile: ["Agri."] },
  B: { desktop: ["Mining"], mobile: ["Mining"] },
  C: { desktop: ["Manufacturing"], mobile: ["Mfg."] },
  D: { desktop: ["Utilities"], mobile: ["Utilities"] },
  E: { desktop: ["Water &", "waste"], mobile: ["Water &", "waste"] },
  F: { desktop: ["Construction"], mobile: ["Constr."] },
  G: { desktop: ["Retail &", "vehicle repair"], mobile: ["Retail"] },
  H: { desktop: ["Transport &", "storage"], mobile: ["Transport"] },
  I: { desktop: ["Hospitality"], mobile: ["Hospitality"] },
  J: { desktop: ["Info &", "comms"], mobile: ["Info &", "comms"] },
  K: { desktop: ["Finance &", "insurance"], mobile: ["Finance"] },
  L: { desktop: ["Property"], mobile: ["Property"] },
  M: { desktop: ["Professional", "services"], mobile: ["Prof. svc"] },
  N: { desktop: ["Admin &", "support"], mobile: ["Admin"] },
  O: { desktop: ["Public", "admin"], mobile: ["Public", "admin"] },
  P: { desktop: ["Education"], mobile: ["Education"] },
  Q: { desktop: ["Health &", "social care"], mobile: ["Health"] },
  R: { desktop: ["Arts &", "recreation"], mobile: ["Arts & rec"] },
  S: { desktop: ["Other", "services"], mobile: ["Other svc"] },
  T: { desktop: ["Households"], mobile: ["Households"] },
  U: { desktop: ["Exterritorial"], mobile: ["Exterrit."] },
};

const SECTOR_LABELS = {
  "public-sector": { desktop: ["Public"], mobile: ["Public"] },
  "private-sector": { desktop: ["Private"], mobile: ["Private"] },
  "non-profit-body-or-mutual-association": { desktop: ["Non-profit"], mobile: ["Non-profit"] },
  "not-classified": { desktop: ["Unclassified"], mobile: ["Unclass."] },
};

const DETAIL_OVERRIDES = [
  [/^large goods vehicle drivers$/i, "LGV drivers"],
  [/^bus and coach drivers$/i, "Bus/coach"],
  [/^taxi and cab drivers and chauffeurs$/i, "Taxi/cab"],
  [/^delivery drivers and couriers$/i, "Delivery"],
  [/^driving instructors$/i, "Driving instr."],
  [/^road transport drivers n\.e\.c\.$/i, "Road transport"],
  [/^crane drivers$/i, "Crane drivers"],
  [/^fork-lift truck drivers$/i, "Fork-lift"],
  [/^mobile machine drivers and operatives n\.e\.c\.$/i, "Mobile machine"],
  [/^train and tram drivers$/i, "Train/tram"],
  [/^marine and waterways transport operatives$/i, "Marine transport"],
  [/^air transport operatives$/i, "Air transport"],
  [/^rail transport operatives$/i, "Rail transport"],
  [/^other drivers and transport operatives n\.e\.c\.$/i, "Other transport"],
];

const DETAIL_ABBREVIATIONS = new Map([
  ["administrative", "admin"],
  ["administration", "admin"],
  ["advisers", "advisers"],
  ["analysts", "analysts"],
  ["and", "&"],
  ["assistants", "assts"],
  ["assistant", "asst"],
  ["associates", "assoc."],
  ["associate", "assoc."],
  ["chauffeurs", "chauffeurs"],
  ["communications", "comms"],
  ["communication", "comms"],
  ["coordinators", "coords"],
  ["coordinator", "coord."],
  ["customer", "customer"],
  ["development", "dev."],
  ["directors", "dirs"],
  ["director", "dir."],
  ["distribution", "distribution"],
  ["engineers", "engineers"],
  ["engineering", "engineering"],
  ["executives", "execs"],
  ["executive", "exec"],
  ["information", "info"],
  ["instructors", "instr."],
  ["instructor", "instr."],
  ["laboratory", "lab"],
  ["logistics", "logistics"],
  ["maintenance", "maint."],
  ["management", "mgmt"],
  ["manager", "mgr"],
  ["managers", "mgrs"],
  ["manufacturing", "mfg"],
  ["marketing", "marketing"],
  ["motor", "motor"],
  ["occupations", "roles"],
  ["occupation", "role"],
  ["officials", "officials"],
  ["operative", "operative"],
  ["operatives", "operatives"],
  ["operators", "operators"],
  ["operator", "operator"],
  ["production", "production"],
  ["professional", "prof."],
  ["professionals", "profs"],
  ["programme", "programme"],
  ["programmers", "programmers"],
  ["project", "project"],
  ["quality", "quality"],
  ["representatives", "reps"],
  ["representative", "rep"],
  ["scientific", "scientific"],
  ["secretarial", "secretarial"],
  ["senior", "senior"],
  ["services", "services"],
  ["service", "service"],
  ["specialists", "specialists"],
  ["specialist", "specialist"],
  ["support", "support"],
  ["supervisors", "supervisors"],
  ["supervisor", "supervisor"],
  ["technical", "technical"],
  ["technicians", "techs"],
  ["technician", "tech"],
  ["transport", "transport"],
  ["vehicle", "vehicle"],
  ["warehousing", "warehousing"],
]);

function defaultWrap(label, maxCharsPerLine, maxLines = 2) {
  if (!label) return [""];

  const words = String(label)
    .replace(/\s*&\s*/g, " & ")
    .trim()
    .split(/\s+/);
  const lines = [];
  let current = "";
  let index = 0;

  while (index < words.length) {
    const word = words[index];
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxCharsPerLine || !current) {
      current = next;
      index += 1;
      continue;
    }

    lines.push(current);
    current = word;
    index += 1;

    if (lines.length === maxLines - 1) {
      current = [current, ...words.slice(index)].join(" ").trim();
      break;
    }
  }

  if (current) lines.push(current);

  const trimmed = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    trimmed[maxLines - 1] = `${trimmed[maxLines - 1].slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd()}…`;
  } else if (trimmed[maxLines - 1]?.length > maxCharsPerLine + 2) {
    trimmed[maxLines - 1] = `${trimmed[maxLines - 1].slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd()}…`;
  }

  return trimmed;
}

function curatedLines(row, selectionType, isMobile) {
  const labelMap = selectionType === "region"
    ? REGION_LABELS
    : selectionType === "industry"
      ? INDUSTRY_LABELS
      : selectionType === "sector"
        ? SECTOR_LABELS
        : null;

  if (!labelMap) return null;

  const preset = labelMap[row.id];
  if (!preset) return null;
  return isMobile ? preset.mobile : preset.desktop;
}

function isOccupationDetailRow(row, selectionType) {
  return selectionType === "occupation" && /^\d{4}$/.test(String(row.id ?? row.shortLabel ?? ""));
}

function shortenOccupationDetailLabel(label, isMobile) {
  if (!label) return "";

  for (const [pattern, replacement] of DETAIL_OVERRIDES) {
    if (pattern.test(label)) return replacement;
  }

  const cleaned = String(label)
    .replace(/\bn\.e\.c\.\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(" ")
    .map((word) => {
      const normalized = word.toLowerCase();
      return DETAIL_ABBREVIATIONS.get(normalized) ?? word;
    })
    .filter((word) => word && word !== "&");

  if (words.length <= 2) return words.join(" ");
  if (isMobile) return words.slice(0, 2).join(" ");
  return words.slice(0, 3).join(" ");
}

export function getAxisDensity({ data, isMobile, selectionType }) {
  const longestAxisLabel = Math.max(...data.map((row) => String(row.shortLabel ?? row.label ?? "").length), 0);
  const detailAxis = data.length >= 16 || data.every((row) => /^\d{4}$/.test(String(row.shortLabel ?? row.id ?? "")));
  const curatedDenseView = selectionType === "region" || selectionType === "industry" || selectionType === "sector";
  const denseAxis = curatedDenseView || detailAxis || data.length >= 10 || longestAxisLabel >= 12;
  const compactMobile = isMobile && (denseAxis || data.length >= 8);

  return { compactMobile, curatedDenseView, denseAxis, detailAxis, longestAxisLabel };
}

export function getAxisLabelLines(row, { isMobile, maxCharsPerLine, maxLines, selectionType }) {
  const curated = curatedLines(row, selectionType, isMobile);
  if (curated) return curated.slice(0, maxLines);
  if (isOccupationDetailRow(row, selectionType)) {
    return defaultWrap(shortenOccupationDetailLabel(row.label, isMobile), maxCharsPerLine, maxLines);
  }
  return defaultWrap(row.shortLabel ?? row.label, maxCharsPerLine, maxLines);
}

export function getSelectedDisplayLabel(row, selectionType) {
  if (!row) return "";
  if (isOccupationDetailRow(row, selectionType)) {
    return `${row.id} · ${row.label}`;
  }
  return row.label;
}

export function getMobileChartHint({ chartScrollable, compactMobile, isGapMode }) {
  if (compactMobile && chartScrollable) {
    return `Compact mobile view: swipe sideways and tap a ${isGapMode ? "category" : "column"} for full detail.`;
  }
  if (compactMobile) {
    return `Compact mobile view: tap a ${isGapMode ? "category" : "column"} for full detail.`;
  }
  if (chartScrollable) {
    return `Swipe sideways if labels need more room. Tap a ${isGapMode ? "category" : "column"} for exact values.`;
  }
  return `Tap a ${isGapMode ? "category" : "column"} for exact values.`;
}

export function wrapAxisLabel(label, maxCharsPerLine, maxLines = 2) {
  return defaultWrap(label, maxCharsPerLine, maxLines);
}
