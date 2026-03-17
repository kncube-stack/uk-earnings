import { createContext, useContext } from "react";

const DARK_DOT_COLORS = {
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

const LIGHT_DOT_COLORS = {
  p10: "#2a5490",
  p20: "#326daa",
  p25: "#3a78b5",
  p30: "#4283bf",
  p40: "#4d92cc",
  median: "#1a1a1a",
  p60: "#b8912e",
  p70: "#a57e28",
  p75: "#926d22",
  p80: "#7f5e1c",
  p90: "#6c4f16",
};

export const dark = {
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
  body: "#c5c0b6",
  medianDot: "#f5f0e8",
  source: "#3a3830",
};

export const light = {
  bg: "#f5f3ef",
  card: "#ffffff",
  border: "#e0ddd7",
  gold: "#b8912e",
  blue: "#3a6ea5",
  red: "#d04725",
  green: "#2d9e50",
  text: "#1a1a1a",
  muted: "#6b6560",
  dim: "#9a9490",
  faint: "#e8e5e0",
  body: "#4a4540",
  medianDot: "#1a1a1a",
  source: "#b0aaa0",
};

// Keep backward-compatible static export (defaults to dark)
export const C = dark;

export const ThemeContext = createContext({ colors: dark, mode: "dark" });

export function useTheme() {
  return useContext(ThemeContext);
}

export function dotColor(key, mode = "dark") {
  const colors = mode === "light" ? LIGHT_DOT_COLORS : DARK_DOT_COLORS;
  const palette = mode === "light" ? light : dark;
  return colors[key] ?? palette.blue;
}
