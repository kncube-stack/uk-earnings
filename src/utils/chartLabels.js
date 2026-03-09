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
  return defaultWrap(row.shortLabel ?? row.label, maxCharsPerLine, maxLines);
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
