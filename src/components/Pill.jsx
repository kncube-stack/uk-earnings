import { useTheme } from "../theme";

export default function Pill({ active, disabled = false, onClick, children, isMobile }) {
  const { colors } = useTheme();
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: isMobile ? "8px 12px" : "7px 14px",
        borderRadius: 6,
        border: `1px solid ${active ? colors.gold : colors.faint}`,
        background: active ? `${colors.gold}18` : "transparent",
        color: active ? colors.gold : disabled ? `${colors.dim}99` : colors.dim,
        fontSize: isMobile ? 12 : 13,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}
