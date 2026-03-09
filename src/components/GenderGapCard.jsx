import { C } from "../theme";

function describeGap(gapPct) {
  if (gapPct == null) return "The published data are too limited here to calculate a stable gap.";
  if (gapPct > 0) return `Men's median hourly pay excluding overtime is ${gapPct}% higher here.`;
  if (gapPct < 0) return `Women's median hourly pay excluding overtime is ${Math.abs(gapPct)}% higher here.`;
  return "Men and women are on the same published median here.";
}

export default function GenderGapCard({
  benchmark,
  emptyPrompt,
  isMobile,
  selectedBucket,
  selectedLabel,
  workLabel,
}) {
  if (!selectedBucket) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: "18px 20px",
          background: C.card,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          color: C.muted,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {emptyPrompt}
      </div>
    );
  }

  const { maleMedian, femaleMedian, gapPct } = selectedBucket;
  const benchmarkGap = benchmark?.gapPct ?? null;
  const comparison =
    gapPct != null && benchmarkGap != null
      ? Math.abs(gapPct - benchmarkGap) < 0.1
        ? "This is broadly in line with the overall UK benchmark."
        : gapPct > benchmarkGap
          ? `That is ${Math.abs(gapPct - benchmarkGap).toFixed(1)} percentage points wider than the overall UK benchmark.`
          : `That is ${Math.abs(gapPct - benchmarkGap).toFixed(1)} percentage points narrower than the overall UK benchmark.`
      : "This view uses the official ONS formula: (men's median hourly pay excluding overtime minus women's) divided by men's.";

  return (
    <div
      style={{
        marginTop: 20,
        padding: isMobile ? "16px 16px" : "22px 26px",
        background: C.card,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 16 : 18,
          color: C.gold,
          marginBottom: 10,
        }}
      >
        Official Gender Pay Gap
      </div>

      <div style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.8, color: "#c5c0b6" }}>
        In <strong style={{ color: C.text }}>{selectedLabel}</strong>, the published ONS median hourly pay excluding overtime for
        {" "}
        <strong style={{ color: C.blue }}>men</strong> is <strong style={{ color: C.text }}>£{maleMedian?.toFixed(2) ?? "—"}</strong>
        {" "}
        and for <strong style={{ color: C.gold }}>women</strong> is <strong style={{ color: C.text }}>£{femaleMedian?.toFixed(2) ?? "—"}</strong>
        {" "}
        among {workLabel}. {describeGap(gapPct)} {comparison}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: isMobile ? "10px 10px" : "14px 16px",
          background: C.bg,
          borderRadius: 8,
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, minmax(0, 1fr))",
          gap: isMobile ? "8px 10px" : "8px 14px",
          fontSize: isMobile ? 11 : 12,
        }}
      >
        {[
          { label: "Men median", value: maleMedian != null ? `£${maleMedian.toFixed(2)}` : "—", color: C.blue },
          { label: "Women median", value: femaleMedian != null ? `£${femaleMedian.toFixed(2)}` : "—", color: C.gold },
          {
            label: "Gap here",
            value: gapPct != null ? `${gapPct > 0 ? gapPct : Math.abs(gapPct)}%${gapPct < 0 ? " women lead" : gapPct > 0 ? " men lead" : ""}` : "—",
            color: gapPct == null ? C.muted : gapPct < 0 ? C.green : C.red,
          },
          {
            label: "UK benchmark",
            value: benchmarkGap != null ? `${benchmarkGap}%` : "—",
            color: C.text,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: `${item.color}10`,
              border: `1px solid ${item.color}20`,
            }}
          >
            <div style={{ color: C.muted, marginBottom: 4 }}>{item.label}</div>
            <div style={{ color: item.color, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
