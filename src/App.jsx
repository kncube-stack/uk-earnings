import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const PERCENTILE_KEYS = ["p10","p20","p25","p30","p40","median","p60","p70","p75","p80","p90"];
const PERCENTILE_LABELS = {p10:"10th",p20:"20th",p25:"25th",p30:"30th",p40:"40th",median:"50th",p60:"60th",p70:"70th",p75:"75th",p80:"80th",p90:"90th"};
const PERCENTILE_VALUES = {p10:10,p20:20,p25:25,p30:30,p40:40,median:50,p60:60,p70:70,p75:75,p80:80,p90:90};

const ASHE_ALL = [
  { label:"16–17", p10:null,p20:1814,p25:2192,p30:2436,p40:3259,median:3985,p60:4871,p70:6285,p75:null,p80:null,p90:null,mean:5471 },
  { label:"18–21", p10:3197,p20:5774,p25:6923,p30:8002,p40:10484,median:13069,p60:16665,p70:20549,p75:22293,p80:24000,p90:27885,mean:15254 },
  { label:"22–29", p10:12284,p20:20251,p25:22993,p30:24500,p40:27000,median:29855,p60:32802,p70:36276,p75:38391,p80:41108,p90:49651,mean:31719 },
  { label:"30–39", p10:13824,p20:22605,p25:25310,p30:27400,p40:31500,median:36000,p60:41003,p70:46695,p75:50148,p80:54728,p90:69828,mean:42122 },
  { label:"40–49", p10:13767,p20:22249,p25:25147,p30:27472,p40:32361,median:37734,p60:44028,p70:50892,p75:55117,p80:60686,p90:80316,mean:46636 },
  { label:"50–59", p10:12576,p20:20128,p25:23385,p30:25630,p40:29832,median:34835,p60:40774,p70:48018,p75:51979,p80:57236,p90:76335,mean:44463 },
  { label:"60+",   p10:8287,p20:12676,p25:15206,p30:17801,p40:22706,median:26750,p60:31061,p70:36787,p75:40130,p80:44920,p90:59928,mean:33569 },
];

const ASHE_FT = [
  { label:"16–17", p10:null,p20:null,p25:null,p30:null,p40:null,median:14429,p60:null,p70:null,p75:null,p80:null,p90:null,mean:14392 },
  { label:"18–21", p10:14617,p20:null,p25:19105,p30:null,p40:null,median:23596,p60:null,p70:null,p75:27571,p80:null,p90:32939,mean:24394 },
  { label:"22–29", p10:22758,p20:null,p25:26429,p30:null,p40:null,median:32347,p60:null,p70:null,p75:40850,p80:null,p90:52197,mean:35760 },
  { label:"30–39", p10:25041,p20:null,p25:30717,p30:null,p40:null,median:40668,p60:null,p70:null,p75:54620,p80:null,p90:75041,mean:48421 },
  { label:"40–49", p10:25338,p20:null,p25:31858,p30:null,p40:null,median:44244,p60:null,p70:null,p75:60919,p80:null,p90:88658,mean:54591 },
  { label:"50–59", p10:24757,p20:null,p25:30283,p30:null,p40:null,median:41866,p60:null,p70:null,p75:58409,p80:null,p90:85226,mean:53349 },
  { label:"60+",   p10:23318,p20:null,p25:27944,p30:null,p40:null,median:36467,p60:null,p70:null,p75:50572,p80:null,p90:74677,mean:46794 },
];

function findGroup(age) {
  if (age <= 17) return "16–17";
  if (age <= 21) return "18–21";
  if (age <= 29) return "22–29";
  if (age <= 39) return "30–39";
  if (age <= 49) return "40–49";
  if (age <= 59) return "50–59";
  return "60+";
}

function estimatePercentile(group, salary) {
  if (!group) return null;
  const pts = PERCENTILE_KEYS
    .map(k => ({ p: PERCENTILE_VALUES[k], v: group[k] }))
    .filter(pt => pt.v != null);
  if (pts.length < 2) return null;
  if (salary <= pts[0].v) return { value: pts[0].p, below: true };
  if (salary >= pts[pts.length-1].v) return { value: pts[pts.length-1].p, above: true };
  for (let i = 0; i < pts.length - 1; i++) {
    if (salary >= pts[i].v && salary <= pts[i+1].v) {
      const frac = (salary - pts[i].v) / (pts[i+1].v - pts[i].v);
      return { value: Math.round(pts[i].p + frac * (pts[i+1].p - pts[i].p)) };
    }
  }
  return null;
}

const fmt = (v) => v != null ? `£${v.toLocaleString("en-GB")}` : "—";

const C = {
  bg: "#0b0e13", card: "#12161d", border: "#1f2430",
  gold: "#d4a843", blue: "#5b82b5", red: "#e05c3a",
  green: "#4ecb71", text: "#e8e6e1", muted: "#8a8578",
  dim: "#555249", faint: "#2a2d33",
};

const dotColor = (k) => {
  const m = {
    p10:"#3565a0",p20:"#3d72ae",p25:"#4580ba",p30:"#4e8cc4",
    p40:"#5a9ad0",median:"#f5f0e8",p60:"#d4a843",p70:"#c49538",
    p75:"#b08530",p80:"#9c7428",p90:"#886420",
  };
  return m[k] || C.blue;
};

function useContainerWidth(ref) {
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    obs.observe(ref.current);
    setWidth(ref.current.offsetWidth);
    return () => obs.disconnect();
  }, [ref]);
  return width;
}

export default function EarningsDashboard() {
  const [mode, setMode] = useState("all");
  const [userAge, setUserAge] = useState("34");
  const [userSalary, setUserSalary] = useState("51200");
  const [activeIdx, setActiveIdx] = useState(null);
  const containerRef = useRef(null);
  const cw = useContainerWidth(containerRef);

  const isMobile = cw < 520;
  const isTablet = cw >= 520 && cw < 768;
  const isDesktop = cw >= 768;

  const data = mode === "all" ? ASHE_ALL : ASHE_FT;
  const age = parseInt(userAge) || null;
  const salary = parseInt(userSalary.replace(/[£,\s]/g, "")) || null;
  const userGroupLabel = age ? findGroup(age) : null;
  const userGroup = data.find(d => d.label === userGroupLabel);
  const pctResult = userGroup && salary ? estimatePercentile(userGroup, salary) : null;

  const availableKeys = useMemo(() =>
    PERCENTILE_KEYS.filter(k => data.some(d => d[k] != null)), [data]);

  const maxVal = Math.max(
    ...data.flatMap(d => PERCENTILE_KEYS.map(k => d[k]).filter(Boolean)),
    salary || 0
  );
  const chartMax = Math.ceil(maxVal / 10000) * 10000 + 5000;

  const LEFT = isMobile ? 44 : 64;
  const RIGHT_PAD = isMobile ? 12 : 30;
  const usableW = Math.max(200, cw - 8 - LEFT - RIGHT_PAD);
  const BW = Math.max(28, Math.min(74, Math.floor(usableW / data.length) - (isMobile ? 6 : 16)));
  const GAP = Math.max(4, Math.min(20, Math.floor((usableW - BW * data.length) / Math.max(1, data.length - 1))));
  const actualW = LEFT + data.length * BW + (data.length - 1) * GAP + RIGHT_PAD;
  const H = isMobile ? 320 : isTablet ? 370 : 420;
  const TOP = 46;

  const y = (v) => TOP + H - (v / chartMax) * H;

  const gridLines = [];
  const gridStep = isMobile ? 20000 : 10000;
  for (let v = 0; v <= chartMax; v += gridStep) gridLines.push(v);

  const handleColumnInteract = useCallback((i) => {
    setActiveIdx(prev => prev === i ? null : i);
  }, []);

  const fs = {
    axisLabel: isMobile ? 9 : 11,
    gridLabel: isMobile ? 8 : 10,
    medianLabel: isMobile ? 9 : 11,
    pctLabel: isMobile ? 7 : 9,
    youLabel: isMobile ? 8 : 9,
    salaryLabel: isMobile ? 9 : 11,
  };
  const dotR = isMobile ? 3 : 4;
  const medR = isMobile ? 4.5 : 6;

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      padding: isMobile ? "20px 10px" : "32px 20px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
      <div ref={containerRef} style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 20 : 26, fontWeight: 600, color: "#f5f0e8",
          margin: "0 0 4px", letterSpacing: "-0.01em",
        }}>UK Annual Earnings by Age</h1>
        <p style={{ color: C.muted, fontSize: isMobile ? 11 : 13, margin: "0 0 18px" }}>
          ASHE 2025 Provisional · ONS
        </p>

        {/* Controls */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 14 : 12,
          marginBottom: isMobile ? 18 : 22,
          alignItems: isMobile ? "stretch" : "flex-end",
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[{ k: "all", l: "All Employees" }, { k: "ft", l: "Full-Time" }].map(o => (
              <button key={o.k} onClick={() => setMode(o.k)} style={{
                padding: isMobile ? "10px 14px" : "8px 16px",
                borderRadius: 6, flex: isMobile ? 1 : "none",
                border: `1px solid ${mode === o.k ? C.gold : C.faint}`,
                background: mode === o.k ? C.gold + "18" : "transparent",
                color: mode === o.k ? C.gold : C.dim,
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>{o.l}</button>
            ))}
          </div>
          {!isMobile && <div style={{ flex: 1 }} />}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: isMobile ? 1 : "none" }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Your age</label>
              <input type="number" min="16" max="80" value={userAge}
                onChange={e => setUserAge(e.target.value)}
                style={{
                  width: isMobile ? "100%" : 60, padding: "10px 10px", borderRadius: 6,
                  border: `1px solid ${C.faint}`, background: C.card,
                  color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box",
                }} />
            </div>
            <div style={{ flex: isMobile ? 2 : "none" }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Annual salary (£)</label>
              <input type="text" inputMode="numeric" value={userSalary}
                onChange={e => setUserSalary(e.target.value.replace(/[^0-9]/g, ""))}
                style={{
                  width: isMobile ? "100%" : 120, padding: "10px 10px", borderRadius: 6,
                  border: `1px solid ${C.faint}`, background: C.card,
                  color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box",
                }} />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ marginBottom: 8 }}>
          <svg
            width="100%"
            height={TOP + H + 60}
            viewBox={`0 0 ${actualW} ${TOP + H + 60}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", touchAction: "pan-y" }}>

            {gridLines.map(v => (
              <g key={v}>
                <line x1={LEFT - 4} x2={actualW - RIGHT_PAD + 4} y1={y(v)} y2={y(v)} stroke={C.faint} strokeWidth={0.7} />
                <text x={LEFT - 8} y={y(v) + 4} textAnchor="end" fill={C.dim}
                  fontSize={fs.gridLabel} fontFamily="'DM Sans', sans-serif">
                  {v === 0 ? "£0" : `£${(v/1000).toFixed(0)}k`}
                </text>
              </g>
            ))}

            {salary && (
              <>
                <line x1={LEFT - 4} x2={actualW - RIGHT_PAD + 4}
                  y1={y(salary)} y2={y(salary)}
                  stroke={C.red} strokeWidth={1.5} strokeDasharray="7,4" opacity={0.7} />
                <text x={actualW - RIGHT_PAD + 2} y={y(salary) - 6} textAnchor="end"
                  fill={C.red} fontSize={fs.salaryLabel} fontWeight={600}
                  fontFamily="'DM Sans', sans-serif">
                  {isMobile ? fmt(salary) : `You: ${fmt(salary)}`}
                </text>
              </>
            )}

            {data.map((d, i) => {
              const x = LEFT + i * (BW + GAP);
              const isUser = d.label === userGroupLabel;
              const isActive = activeIdx === i;
              const acc = isUser ? C.gold : C.blue;

              const pts = availableKeys
                .map(k => ({ key: k, val: d[k], lbl: PERCENTILE_LABELS[k], p: PERCENTILE_VALUES[k] }))
                .filter(p => p.val != null);

              const showDetail = isActive;

              return (
                <g key={d.label}
                  onMouseEnter={() => !isMobile && setActiveIdx(i)}
                  onMouseLeave={() => !isMobile && setActiveIdx(null)}
                  onClick={() => handleColumnInteract(i)}
                  style={{ cursor: "pointer" }}>

                  <rect x={x - GAP/2} y={TOP - 10} width={BW + GAP} height={H + 30}
                    fill="transparent" />

                  {isUser && <rect x={x - 3} y={TOP - 3} width={BW + 6} height={H + 6}
                    rx={5} fill={C.gold + "08"} stroke={C.gold + "20"} strokeWidth={1} />}

                  {pts.length >= 2 && (
                    <line x1={x + BW/2} x2={x + BW/2}
                      y1={y(pts[pts.length-1].val)} y2={y(pts[0].val)}
                      stroke={acc} strokeWidth={1.5} opacity={0.15} />
                  )}

                  {d.p10 != null && d.p90 != null && (
                    <rect x={x + Math.max(2, BW*0.12)} y={y(d.p90)}
                      width={BW - Math.max(4, BW*0.24)}
                      height={y(d.p10) - y(d.p90)} rx={3} fill={acc} opacity={0.06} />
                  )}
                  {d.p25 != null && d.p75 != null && (
                    <rect x={x + Math.max(4, BW*0.18)} y={y(d.p75)}
                      width={BW - Math.max(8, BW*0.36)}
                      height={y(d.p25) - y(d.p75)} rx={2} fill={acc} opacity={0.12} />
                  )}

                  {pts.map(p => {
                    const isMed = p.key === "median";
                    const r = isMed ? medR : dotR;
                    const cy = y(p.val);
                    return (
                      <g key={p.key}>
                        <circle cx={x + BW/2} cy={cy} r={r}
                          fill={isMed ? "#f5f0e8" : dotColor(p.key)}
                          stroke={isMed ? acc : "none"} strokeWidth={isMed ? 2 : 0}
                          opacity={isMed ? 0.95 : 0.75} />
                        {showDetail ? (
                          <text x={x + BW/2 + r + 3} y={cy + 3}
                            fill={isMed ? "#f5f0e8" : C.muted}
                            fontSize={isMed ? fs.medianLabel : fs.pctLabel}
                            fontWeight={isMed ? 700 : 400}
                            fontFamily="'DM Sans', sans-serif">
                            {p.lbl}
                          </text>
                        ) : isMed ? (
                          <text x={x + BW/2 + r + 3} y={cy + 3}
                            fill="#f5f0e8" fontSize={fs.medianLabel} fontWeight={700}
                            fontFamily="'DM Sans', sans-serif" opacity={0.85}>
                            {isMobile ? `£${(p.val/1000).toFixed(0)}k` : fmt(p.val)}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}

                  {isUser && salary && (
                    <>
                      <circle cx={x + BW/2} cy={y(salary)} r={isMobile ? 6 : 8}
                        fill={C.red} stroke={C.bg} strokeWidth={2.5} />
                      <circle cx={x + BW/2} cy={y(salary)} r={isMobile ? 10 : 13}
                        fill="none" stroke={C.red} strokeWidth={1.5} opacity={0.25}>
                        <animate attributeName="r" from={isMobile?"8":"10"} to={isMobile?"13":"16"} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  <text x={x + BW/2} y={TOP + H + 18} textAnchor="middle"
                    fill={isUser ? C.gold : C.muted}
                    fontSize={fs.axisLabel} fontWeight={isUser ? 700 : 400}
                    fontFamily="'DM Sans', sans-serif">
                    {d.label}
                  </text>
                  {isUser && (
                    <text x={x + BW/2} y={TOP + H + (isMobile ? 30 : 32)} textAnchor="middle"
                      fill={C.gold} fontSize={fs.youLabel} fontWeight={600}
                      fontFamily="'DM Sans', sans-serif" letterSpacing="0.06em">
                      ▲ YOU
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{
          display: "flex", gap: isMobile ? 10 : 16, flexWrap: "wrap",
          fontSize: isMobile ? 10 : 11, color: C.muted, marginBottom: 6, paddingLeft: 4,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#f5f0e8", border: `2px solid ${C.blue}`, display: "inline-block" }} /> Median
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, opacity: 0.75, display: "inline-block" }} /> Percentile
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 7, borderRadius: 2, background: C.blue, opacity: 0.12, display: "inline-block" }} /> P25–P75
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 7, borderRadius: 2, background: C.blue, opacity: 0.06, display: "inline-block" }} /> P10–P90
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 0, borderTop: `2px dashed ${C.red}`, display: "inline-block" }} /> Your salary
          </span>
        </div>

        {isMobile && (
          <p style={{ fontSize: 10, color: C.dim, textAlign: "center", margin: "4px 0 0" }}>
            Tap a column to see percentile values
          </p>
        )}

        {/* Results card */}
        {age && salary && userGroup ? (
          <div style={{
            marginTop: 20,
            padding: isMobile ? "16px 16px" : "22px 26px",
            background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 16 : 18, color: C.gold, marginBottom: 10,
            }}>Where you stand</div>
            <div style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.8, color: "#c5c0b6" }}>
              {(() => {
                const med = userGroup.median;
                const diff = salary - med;
                const pctDiff = Math.round(Math.abs(diff) / med * 100);
                const ml = mode === "all" ? "all employees" : "full-time employees";
                return (
                  <>
                    At <strong style={{ color: C.red }}>{fmt(salary)}</strong> aged{" "}
                    <strong style={{ color: C.gold }}>{age}</strong>, you fall in the{" "}
                    <strong style={{ color: C.text }}>{userGroupLabel}</strong> age group.
                    {" "}The median for {ml} in this group is{" "}
                    <strong style={{ color: C.text }}>{fmt(med)}</strong>.
                    {diff > 0
                      ? <>{" "}You're earning <strong style={{ color: C.green }}>{fmt(diff)} ({pctDiff}%) above</strong> the median.</>
                      : diff < 0
                      ? <>{" "}You're earning <strong style={{ color: C.red }}>{fmt(Math.abs(diff))} ({pctDiff}%) below</strong> the median.</>
                      : <>{" "}You're <strong>right on</strong> the median.</>
                    }
                    {pctResult && (
                      pctResult.below
                        ? <>{" "}That places you <strong style={{ color: C.gold }}>below the {pctResult.value}th percentile</strong> — earning less than roughly {100 - pctResult.value}% of {ml} in your age bracket.</>
                        : pctResult.above
                        ? <>{" "}That places you <strong style={{ color: C.gold }}>above the {pctResult.value}th percentile</strong> — earning more than at least {pctResult.value}% of {ml} in your age bracket.</>
                        : <>{" "}That puts you at roughly the <strong style={{ color: C.gold }}>{pctResult.value}th percentile</strong> — earning more than about {pctResult.value}% of {ml} in your age bracket.</>
                    )}
                  </>
                );
              })()}
            </div>

            <div style={{
              marginTop: 14, padding: isMobile ? "10px 10px" : "14px 16px",
              background: C.bg, borderRadius: 8,
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(110px, 1fr))",
              gap: isMobile ? "4px 10px" : "5px 14px",
              fontSize: isMobile ? 11 : 12,
            }}>
              {availableKeys.map(k => {
                const val = userGroup[k];
                if (val == null) return null;
                const isAbove = salary >= val;
                const isNearest = pctResult && !pctResult.below && !pctResult.above &&
                  Math.abs(PERCENTILE_VALUES[k] - pctResult.value) <= 5;
                return (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "4px 6px", borderRadius: 4,
                    background: isNearest ? C.gold + "15" : "transparent",
                  }}>
                    <span style={{ color: C.muted }}>{PERCENTILE_LABELS[k]}</span>
                    <span style={{
                      color: isNearest ? C.gold : (isAbove ? C.green + "bb" : C.muted),
                      fontWeight: isNearest ? 600 : 400,
                      fontVariantNumeric: "tabular-nums",
                    }}>{fmt(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: 20, padding: "18px 20px",
            background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            color: C.muted, fontSize: 14, textAlign: "center",
          }}>
            Enter your age and annual salary above to see where you fall.
          </div>
        )}

        <p style={{
          fontSize: isMobile ? 9 : 10, color: "#3a3830",
          marginTop: 16, lineHeight: 1.5,
        }}>
          Source: ONS Annual Survey of Hours and Earnings (ASHE) 2025 Provisional.
          Employees on adult rates in same job for &gt;1 year.
          Age bins are ASHE's native groupings.
          {mode === "ft" && " Full-time split has fewer published percentile breakpoints."}
          {isDesktop && " Hover columns for detail."}
        </p>
      </div>
    </div>
  );
}
