const DOT_COLORS = {
  p10: "#3565a0",
  p20: "#3d72ae",
  p25: "#4580ba",
  p30: "#4e8cc4",
  p40: "#5a9ad0",
  median: "#f5f0e8",
  p60: "#d4a843",
  p70: "#c49538",
  p75: "#b08530",
  p80: "#9c7428",
  p90: "#886420",
};

export const C = {
  bg: "#0b0e13",
  card: "#12161d",
  border: "#1f2430",
  gold: "#d4a843",
  blue: "#5b82b5",
  red: "#e05c3a",
  green: "#4ecb71",
  text: "#e8e6e1",
  muted: "#8a8578",
  dim: "#555249",
  faint: "#2a2d33",
};

export function dotColor(key) {
  return DOT_COLORS[key] ?? C.blue;
}
