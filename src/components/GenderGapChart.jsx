import { C } from "../theme";
import { wrapAxisLabel } from "../utils/chartLabels";

export default function GenderGapChart({
  activeIdx,
  containerWidth,
  data,
  fmtRate,
  handleColumnInteract,
  isMobile,
  isTablet,
  selectedBucketId,
  setActiveIdx,
}) {
  const left = isMobile ? 46 : 68;
  const rightPad = isMobile ? 14 : 32;
  const usableWidth = Math.max(220, containerWidth - 8 - left - rightPad);
  const longestAxisLabel = Math.max(...data.map((row) => String(row.shortLabel ?? row.label ?? "").length), 0);
  const denseAxis = data.length >= 8 || longestAxisLabel >= 12;
  const minBarWidth = denseAxis ? (isMobile ? 52 : 60) : 42;
  const maxBarWidth = denseAxis ? (isMobile ? 72 : 96) : 84;
  const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, Math.floor(usableWidth / Math.max(1, data.length)) - (isMobile ? 6 : 12)));
  const gap = Math.max(denseAxis ? (isMobile ? 10 : 12) : 6, Math.min(24, Math.floor((usableWidth - barWidth * data.length) / Math.max(1, data.length - 1))));
  const actualWidth = left + data.length * barWidth + (data.length - 1) * gap + rightPad;
  const height = isMobile ? 320 : isTablet ? 370 : 420;
  const top = 40;
  const labelMaxChars = denseAxis ? (isMobile ? 9 : 12) : 12;
  const labelLineHeight = isMobile ? 10 : 12;
  const labelLineCount = denseAxis ? 2 : 1;
  const bottomPad = isMobile ? 82 : denseAxis ? 90 : 68;
  const chartScrollable = actualWidth > containerWidth;

  const valueMax = Math.max(
    ...data.flatMap((row) => [row.maleMedian, row.femaleMedian]).filter((value) => value != null),
    0,
  );
  const chartMax = Math.ceil((valueMax + 1) / 5) * 5;
  const gridStep = chartMax <= 25 ? 2.5 : 5;
  const y = (value) => top + height - (value / chartMax) * height;
  const gridLines = [];

  for (let value = 0; value <= chartMax; value += gridStep) {
    gridLines.push(Number(value.toFixed(2)));
  }

  return (
    <>
      <div style={{ marginBottom: 8, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
        <svg
          width={Math.max(actualWidth, containerWidth - 8)}
          height={top + height + bottomPad}
          viewBox={`0 0 ${actualWidth} ${top + height + bottomPad}`}
          preserveAspectRatio="xMinYMid meet"
          style={{ display: "block", touchAction: "pan-y", minWidth: "100%" }}
        >
          {gridLines.map((value) => (
            <g key={value}>
              <line
                x1={left - 4}
                x2={actualWidth - rightPad + 4}
                y1={y(value)}
                y2={y(value)}
                stroke={C.faint}
                strokeWidth={0.7}
              />
              <text
                x={left - 8}
                y={y(value) + 4}
                textAnchor="end"
                fill={C.dim}
                fontSize={isMobile ? 8 : 10}
                fontFamily="'DM Sans', sans-serif"
              >
                {fmtRate(value)}
              </text>
            </g>
          ))}

          {data.map((row, index) => {
            const x = left + index * (barWidth + gap);
            const rowId = row.id ?? row.label;
            const isUser = rowId === selectedBucketId;
            const isActive = activeIdx === index;
            const maleY = row.maleMedian != null ? y(row.maleMedian) : null;
            const femaleY = row.femaleMedian != null ? y(row.femaleMedian) : null;

            return (
              <g
                key={rowId}
                onMouseEnter={() => !isMobile && setActiveIdx(index)}
                onMouseLeave={() => !isMobile && setActiveIdx(null)}
                onClick={() => handleColumnInteract(index)}
                style={{ cursor: "pointer" }}
              >
                <title>{row.label}</title>
                <rect x={x - gap / 2} y={top - 8} width={barWidth + gap} height={height + 36} fill="transparent" />
                {isUser && (
                  <rect
                    x={x - 4}
                    y={top - 3}
                    width={barWidth + 8}
                    height={height + 6}
                    rx={5}
                    fill={`${C.gold}08`}
                    stroke={`${C.gold}20`}
                    strokeWidth={1}
                  />
                )}

                {maleY != null && femaleY != null && (
                  <line
                    x1={x + barWidth / 2}
                    x2={x + barWidth / 2}
                    y1={maleY}
                    y2={femaleY}
                    stroke={C.muted}
                    strokeWidth={2}
                    opacity={0.45}
                  />
                )}

                {maleY != null && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={maleY}
                    r={isUser ? (isMobile ? 6 : 7) : isMobile ? 4.5 : 5.5}
                    fill={C.blue}
                    stroke={isUser ? C.text : "none"}
                    strokeWidth={isUser ? 1.5 : 0}
                  />
                )}

                {femaleY != null && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={femaleY}
                    r={isUser ? (isMobile ? 6 : 7) : isMobile ? 4.5 : 5.5}
                    fill={C.gold}
                    stroke={isUser ? C.text : "none"}
                    strokeWidth={isUser ? 1.5 : 0}
                  />
                )}

                {(isActive || isUser) && maleY != null && (
                  <text
                    x={x + barWidth / 2 + 8}
                    y={maleY + 3}
                    fill={C.blue}
                    fontSize={isMobile ? 9 : 10}
                    fontWeight={600}
                    fontFamily="'DM Sans', sans-serif"
                  >
                    M {fmtRate(row.maleMedian)}
                  </text>
                )}

                {(isActive || isUser) && femaleY != null && (
                  <text
                    x={x + barWidth / 2 + 8}
                    y={femaleY + 3}
                    fill={C.gold}
                    fontSize={isMobile ? 9 : 10}
                    fontWeight={600}
                    fontFamily="'DM Sans', sans-serif"
                  >
                    F {fmtRate(row.femaleMedian)}
                  </text>
                )}

                {isUser && row.gapPct != null && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.min(maleY ?? femaleY ?? top, femaleY ?? maleY ?? top) - 10}
                    textAnchor="middle"
                    fill={row.gapPct < 0 ? C.green : C.red}
                    fontSize={isMobile ? 9 : 10}
                    fontWeight={700}
                    fontFamily="'DM Sans', sans-serif"
                  >
                    {row.gapPct > 0 ? `${row.gapPct}%` : row.gapPct < 0 ? `${Math.abs(row.gapPct)}%` : "0%"}
                  </text>
                )}

                <text
                  x={x + barWidth / 2}
                  y={top + height + 18}
                  textAnchor="middle"
                  fill={isUser ? C.gold : C.muted}
                  fontSize={isMobile ? 9 : 11}
                  fontWeight={isUser ? 700 : 400}
                  fontFamily="'DM Sans', sans-serif"
                >
                  {wrapAxisLabel(row.shortLabel ?? row.label, labelMaxChars, labelLineCount).map((line, lineIndex) => (
                    <tspan
                      key={`${rowId}-line-${lineIndex}`}
                      x={x + barWidth / 2}
                      dy={lineIndex === 0 ? 0 : labelLineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
                {isUser && (
                  <text
                    x={x + barWidth / 2}
                    y={top + height + 22 + labelLineCount * labelLineHeight}
                    textAnchor="middle"
                    fill={C.gold}
                    fontSize={isMobile ? 8 : 9}
                    fontWeight={600}
                    fontFamily="'DM Sans', sans-serif"
                    letterSpacing="0.06em"
                  >
                    ▲ SELECTED
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          gap: isMobile ? 10 : 16,
          flexWrap: "wrap",
          fontSize: isMobile ? 10 : 11,
          color: C.muted,
          marginBottom: 6,
          paddingLeft: 4,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.blue,
              display: "inline-block",
            }}
          />
          Men median
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.gold,
              display: "inline-block",
            }}
          />
          Women median
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 0,
              borderTop: `2px solid ${C.muted}`,
              opacity: 0.45,
              display: "inline-block",
            }}
          />
          Gap between medians
        </span>
      </div>

      {isMobile && (
        <p style={{ fontSize: 10, color: C.dim, textAlign: "center", margin: "4px 0 0" }}>
          {chartScrollable ? "Swipe sideways if labels need more room. Tap a category for exact values." : "Tap a category for exact values."}
        </p>
      )}
    </>
  );
}
