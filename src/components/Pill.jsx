import { C } from "../theme";

export default function Pill({ active, onClick, children, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: isMobile ? "8px 12px" : "7px 14px",
        borderRadius: 6,
        border: `1px solid ${active ? C.gold : C.faint}`,
        background: active ? `${C.gold}18` : "transparent",
        color: active ? C.gold : C.dim,
        fontSize: isMobile ? 12 : 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
