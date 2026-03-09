export function wrapAxisLabel(label, maxCharsPerLine, maxLines = 2) {
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
