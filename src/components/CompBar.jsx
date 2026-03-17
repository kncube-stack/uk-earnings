import { useTheme } from "../theme";

export default function CompBar({ data, isMobile }) {
  const { colors } = useTheme();
  if (!data) return null;

  const total = (data.basic || 0) + (data.ot || 0) + (data.other || 0);
  if (total === 0) return null;

  const parts = [
    { label: "Basic", value: data.basic || 0, color: "#5b82b5" },
    { label: "Overtime", value: data.ot || 0, color: "#d4a843" },
    { label: "Other", value: data.other || 0, color: "#7c6daa" },
  ].filter((part) => part.value > 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: isMobile ? 20 : 24,
          borderRadius: 6,
          overflow: "hidden",
          background: colors.faint,
          marginBottom: 8,
        }}
      >
        {parts.map((part, index) => (
          <div
            key={part.label}
            style={{
              width: `${((part.value / total) * 100).toFixed(1)}%`,
              background: part.color,
              opacity: 0.75,
              borderRight: index < parts.length - 1 ? `1px solid ${colors.bg}` : "none",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: isMobile ? 8 : 16,
          flexWrap: "wrap",
          fontSize: isMobile ? 11 : 12,
          color: colors.muted,
        }}
      >
        {parts.map((part) => (
          <span key={part.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: part.color,
                opacity: 0.75,
                display: "inline-block",
              }}
            />
            {part.label}: <strong style={{ color: colors.text }}>{`\u00A3${Math.round(part.value)}`}/wk</strong>
            <span style={{ color: colors.dim }}>({Math.round((part.value / total) * 100)}%)</span>
          </span>
        ))}
      </div>
      {data.inc && (
        <div
          style={{
            marginTop: 8,
            fontSize: isMobile ? 11 : 12,
            color: colors.muted,
            paddingTop: 6,
            borderTop: `1px solid ${colors.faint}`,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: "#4ecb71",
                opacity: 0.75,
                display: "inline-block",
              }}
            />
            Annual incentive/bonus: <strong style={{ color: colors.text }}>{`\u00A3${data.inc.toLocaleString("en-GB")}`}</strong>
            <span style={{ color: colors.dim }}>({`\u00A3${Math.round(data.inc / 52)}`}/wk equiv.)</span>
          </span>
        </div>
      )}
    </div>
  );
}
