import { useMemo } from "react";

import { useCenterSelectedScroll } from "../hooks/useCenterSelectedScroll";
import { PL, PV } from "../percentiles";
import { C, dotColor } from "../theme";
import { getAxisDensity, getAxisLabelLines, getMobileChartHint } from "../utils/chartLabels";

export default function EarningsChart({
  activeIdx,
  availableKeys,
  containerWidth,
  data,
  fmt,
  fmtGrid,
  handleColumnInteract,
  isHours,
  isHourly,
  isMobile,
  isTablet,
  isWeekly,
  salary,
  selectionType,
  selectedBucketId,
  setActiveIdx,
}) {
  const left = isMobile ? 44 : 64;
  const rightPad = isMobile ? 12 : 30;
  const usableWidth = Math.max(200, containerWidth - 8 - left - rightPad);
  const { compactMobile, curatedDenseView, denseAxis, detailAxis } = getAxisDensity({ data, isMobile, selectionType });
  const minBarWidth = detailAxis ? (isMobile ? 52 : 58) : denseAxis ? (isMobile ? 58 : 62) : 28;
  const maxBarWidth = detailAxis ? (isMobile ? 64 : 90) : denseAxis ? (isMobile ? 72 : 94) : 74;
  const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, Math.floor(usableWidth / data.length) - (isMobile ? 6 : 16)));
  const minGap = denseAxis ? (isMobile ? 8 : 10) : 4;
  const gap = Math.max(minGap, Math.min(20, Math.floor((usableWidth - barWidth * data.length) / Math.max(1, data.length - 1))));
  const actualWidth = left + data.length * barWidth + (data.length - 1) * gap + rightPad;
  const height = compactMobile ? 292 : isMobile ? 320 : isTablet ? 370 : 420;
  const top = 46;
  const labelMaxChars = detailAxis ? 8 : denseAxis ? (isMobile ? 10 : 14) : 12;
  const labelLineHeight = compactMobile ? 9 : isMobile ? 10 : 12;
  const labelLineCount = detailAxis ? 1 : denseAxis ? 2 : 1;
  const bottomPad = compactMobile ? 86 : isMobile ? 74 : denseAxis ? 82 : 60;
  const chartScrollable = actualWidth > containerWidth;
  const selectedIndex = useMemo(
    () => data.findIndex((row) => (row.id ?? row.label) === selectedBucketId),
    [data, selectedBucketId],
  );
  const scrollRef = useCenterSelectedScroll({
    barWidth,
    containerWidth,
    gap,
    leftPad: left,
    scrollable: chartScrollable,
    selectedIndex,
  });

  const dataMax = Math.max(...data.flatMap((row) => availableKeys.map((key) => row[key]).filter(Boolean)));
  const scaleMax = Math.max(dataMax, Math.min(salary || 0, dataMax * 1.35));

  let chartMax;
  let gridStep;
  if (isHours || isHourly) {
    chartMax = Math.ceil(scaleMax / 5) * 5 + 5;
    gridStep = isMobile ? 10 : 5;
  } else if (isWeekly) {
    chartMax = Math.ceil(scaleMax / 200) * 200 + 100;
    gridStep = isMobile ? 400 : 200;
  } else {
    chartMax = Math.ceil(scaleMax / 10000) * 10000 + 5000;
    gridStep = isMobile ? 20000 : 10000;
  }

  const y = (value) => top + height - (value / chartMax) * height;
  const gridLines = [];
  for (let value = 0; value <= chartMax; value += gridStep) {
    gridLines.push(value);
  }

  const fontSizes = {
    axisLabel: compactMobile ? 8 : isMobile ? 9 : 11,
    gridLabel: isMobile ? 8 : 10,
    medianLabel: isMobile ? 9 : 11,
    pctLabel: isMobile ? 7 : 9,
    youLabel: isMobile ? 8 : 9,
    salaryLabel: isMobile ? 9 : 11,
  };
  const dotRadius = isMobile ? 3 : 4;
  const medianRadius = isMobile ? 4.5 : 6;
  const showDefaultMedianLabels = !(compactMobile && denseAxis);

  return (
    <>
      {(curatedDenseView || compactMobile) && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            padding: "5px 9px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: C.card,
            color: C.muted,
            fontSize: isMobile ? 10 : 11,
          }}
        >
          {compactMobile ? "Compact chart mode" : "Curated labels"}
          <span style={{ color: C.dim }}>
            {detailAxis ? "Codes stay short on the axis." : "Labels are shortened for readability."}
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          marginBottom: 8,
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          scrollBehavior: "smooth",
        }}
      >
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
                fontSize={fontSizes.gridLabel}
                fontFamily="'DM Sans', sans-serif"
              >
                {fmtGrid(value)}
              </text>
            </g>
          ))}

          {salary && (() => {
            const salaryY = Math.max(top + 4, y(salary));
            const clamped = salary > chartMax;
            return (
              <>
                <line
                  x1={left - 4}
                  x2={actualWidth - rightPad + 4}
                  y1={salaryY}
                  y2={salaryY}
                  stroke={C.red}
                  strokeWidth={1.5}
                  strokeDasharray="7,4"
                  opacity={0.7}
                />
                <text
                  x={actualWidth - rightPad + 2}
                  y={salaryY - 6}
                  textAnchor="end"
                  fill={C.red}
                  fontSize={fontSizes.salaryLabel}
                  fontWeight={600}
                  fontFamily="'DM Sans', sans-serif"
                >
                  {isMobile ? fmt(salary) : `You: ${fmt(salary)}`}
                  {clamped ? " ▲" : ""}
                </text>
              </>
            );
          })()}

          {data.map((row, index) => {
            const x = left + index * (barWidth + gap);
            const rowId = row.id ?? row.label;
            const isUser = rowId === selectedBucketId;
            const isActive = activeIdx === index;
            const accent = isUser ? C.gold : C.blue;
            const points = availableKeys
              .map((key) => ({ key, val: row[key], lbl: PL[key], p: PV[key] }))
              .filter((point) => point.val != null);

            return (
              <g
                key={row.label}
                onMouseEnter={() => !isMobile && setActiveIdx(index)}
                onMouseLeave={() => !isMobile && setActiveIdx(null)}
                onClick={() => handleColumnInteract(index)}
                style={{ cursor: "pointer" }}
              >
                <title>{row.label}</title>
                <rect x={x - gap / 2} y={top - 10} width={barWidth + gap} height={height + 30} fill="transparent" />
                {isUser && (
                  <rect
                    x={x - 3}
                    y={top - 3}
                    width={barWidth + 6}
                    height={height + 6}
                    rx={5}
                    fill={`${C.gold}08`}
                    stroke={`${C.gold}20`}
                    strokeWidth={1}
                  />
                )}

                {points.length >= 2 && (
                  <line
                    x1={x + barWidth / 2}
                    x2={x + barWidth / 2}
                    y1={y(points[points.length - 1].val)}
                    y2={y(points[0].val)}
                    stroke={accent}
                    strokeWidth={1.5}
                    opacity={0.15}
                  />
                )}

                {row.p10 != null && row.p90 != null && (
                  <rect
                    x={x + Math.max(2, barWidth * 0.12)}
                    y={y(row.p90)}
                    width={barWidth - Math.max(4, barWidth * 0.24)}
                    height={y(row.p10) - y(row.p90)}
                    rx={3}
                    fill={accent}
                    opacity={0.06}
                  />
                )}
                {row.p25 != null && row.p75 != null && (
                  <rect
                    x={x + Math.max(4, barWidth * 0.18)}
                    y={y(row.p75)}
                    width={barWidth - Math.max(8, barWidth * 0.36)}
                    height={y(row.p25) - y(row.p75)}
                    rx={2}
                    fill={accent}
                    opacity={0.12}
                  />
                )}

                {points.map((point) => {
                  const isMedian = point.key === "median";
                  const radius = isMedian ? medianRadius : dotRadius;
                  const cy = y(point.val);
                  return (
                    <g key={point.key}>
                      <circle
                        cx={x + barWidth / 2}
                        cy={cy}
                        r={radius}
                        fill={isMedian ? "#f5f0e8" : dotColor(point.key)}
                        stroke={isMedian ? accent : "none"}
                        strokeWidth={isMedian ? 2 : 0}
                        opacity={isMedian ? 0.95 : 0.75}
                      />
                      {isActive ? (
                        <text
                          x={x + barWidth / 2 + radius + 3}
                          y={cy + 3}
                          fill={isMedian ? "#f5f0e8" : C.muted}
                          fontSize={isMedian ? fontSizes.medianLabel : fontSizes.pctLabel}
                          fontWeight={isMedian ? 700 : 400}
                          fontFamily="'DM Sans', sans-serif"
                        >
                          {point.lbl}
                        </text>
                      ) : isMedian && showDefaultMedianLabels ? (
                        <text
                          x={x + barWidth / 2 + radius + 3}
                          y={cy + 3}
                          fill="#f5f0e8"
                          fontSize={fontSizes.medianLabel}
                          fontWeight={700}
                          fontFamily="'DM Sans', sans-serif"
                          opacity={0.85}
                        >
                          {isMobile
                            ? isHours
                              ? `${point.val.toFixed(0)}h`
                              : isHourly
                                ? `£${point.val.toFixed(0)}`
                                : isWeekly
                                  ? `£${Math.round(point.val)}`
                                  : `£${(point.val / 1000).toFixed(0)}k`
                            : fmt(point.val)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                {isUser && salary && (() => {
                  const dotY = Math.max(top + 4, y(salary));
                  return (
                    <>
                      <circle cx={x + barWidth / 2} cy={dotY} r={isMobile ? 6 : 8} fill={C.red} stroke={C.bg} strokeWidth={2.5} />
                      <circle cx={x + barWidth / 2} cy={dotY} r={isMobile ? 10 : 13} fill="none" stroke={C.red} strokeWidth={1.5} opacity={0.25}>
                        <animate attributeName="r" from={isMobile ? "8" : "10"} to={isMobile ? "13" : "16"} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </>
                  );
                })()}

                <text
                  x={x + barWidth / 2}
                  y={top + height + 18}
                  textAnchor="middle"
                  fill={isUser ? C.gold : C.muted}
                  fontSize={fontSizes.axisLabel}
                  fontWeight={isUser ? 700 : 400}
                  fontFamily="'DM Sans', sans-serif"
                >
                  {getAxisLabelLines(row, {
                    isMobile,
                    maxCharsPerLine: labelMaxChars,
                    maxLines: labelLineCount,
                    selectionType,
                  }).map((line, lineIndex) => (
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
                    fontSize={fontSizes.youLabel}
                    fontWeight={600}
                    fontFamily="'DM Sans', sans-serif"
                    letterSpacing="0.06em"
                  >
                    ▲ YOU
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
              background: "#f5f0e8",
              border: `2px solid ${C.blue}`,
              display: "inline-block",
            }}
          />{" "}
          Median
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.blue,
              opacity: 0.75,
              display: "inline-block",
            }}
          />{" "}
          Percentile
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 7,
              borderRadius: 2,
              background: C.blue,
              opacity: 0.12,
              display: "inline-block",
            }}
          />{" "}
          P25–P75
        </span>
        {salary && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 0, borderTop: `2px dashed ${C.red}`, display: "inline-block" }} /> {isHours ? "Your hours" : "Your pay"}
          </span>
        )}
      </div>

      {isMobile && (
        <p style={{ fontSize: 10, color: C.dim, textAlign: "center", margin: "4px 0 0" }}>
          {getMobileChartHint({ chartScrollable, compactMobile, isGapMode: false })}
        </p>
      )}
    </>
  );
}
