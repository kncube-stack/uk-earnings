import { C } from "../theme";

export default function Pill({ active, disabled = false, onClick, children, isMobile }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: isMobile ? "8px 12px" : "7px 14px",
        borderRadius: 6,
        border: `1px solid ${active ? C.gold : C.faint}`,
        background: active ? `${C.gold}18` : "transparent",
        color: active ? C.gold : disabled ? `${C.dim}99` : C.dim,
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
