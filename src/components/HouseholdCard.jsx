import { useCallback, useEffect, useMemo, useState } from "react";

import { BHC_MEDIAN } from "../data/hbaiPercentiles";
import { useTheme } from "../theme";
import { TAKE_HOME_DEFAULTS } from "../utils/earnings";
import { calcHousehold } from "../utils/household";

const STORAGE_KEY = "household_v1";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function Stepper({ label, value, onChange, min = 0, max = 10, colors, isMobile }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: isMobile ? 12 : 13, color: colors.muted, minWidth: isMobile ? 120 : 150 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          border: `1px solid ${colors.faint}`,
          background: colors.bg,
          color: value <= min ? colors.dim : colors.text,
          fontSize: 16,
          fontWeight: 600,
          cursor: value <= min ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        -
      </button>
      <span
        style={{
          minWidth: 24,
          textAlign: "center",
          fontSize: 15,
          fontWeight: 600,
          color: colors.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          border: `1px solid ${colors.faint}`,
          background: colors.bg,
          color: value >= max ? colors.dim : colors.text,
          fontSize: 16,
          fontWeight: 600,
          cursor: value >= max ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        +
      </button>
    </div>
  );
}

function PartnerSection({ index, gross, setGross, options, setOptions, colors, isMobile, expanded, setExpanded }) {
  const label = index === 0 ? "Partner 1" : "Partner 2";
  return (
    <div
      style={{
        padding: isMobile ? "12px 12px" : "14px 16px",
        background: colors.bg,
        borderRadius: 8,
        border: `1px solid ${colors.faint}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: index === 0 ? colors.blue : colors.gold,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>Annual gross salary (£)</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 35000"
          value={gross}
          onChange={(e) => setGross(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 6,
            border: `1px solid ${colors.faint}`,
            background: colors.card,
            color: colors.text,
            fontSize: 15,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          color: colors.dim,
          fontSize: 11,
          cursor: "pointer",
          padding: "2px 0",
          fontFamily: "inherit",
        }}
      >
        {expanded ? "▼" : "▶"} Tax settings
      </button>
      {expanded && (
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Tax region</label>
            <select
              value={options.taxRegion}
              onChange={(e) => setOptions({ ...options, taxRegion: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 6,
                border: `1px solid ${colors.faint}`,
                background: colors.card,
                color: colors.text,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                appearance: "none",
              }}
            >
              <option value="ruk">England/Wales/NI</option>
              <option value="scotland">Scotland</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Pension %</label>
            <input
              type="text"
              inputMode="decimal"
              value={options.pensionPct}
              onChange={(e) =>
                setOptions({
                  ...options,
                  pensionPct: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 6,
                border: `1px solid ${colors.faint}`,
                background: colors.card,
                color: colors.text,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Student loan</label>
            <select
              value={options.studentLoanPlan}
              onChange={(e) => setOptions({ ...options, studentLoanPlan: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 6,
                border: `1px solid ${colors.faint}`,
                background: colors.card,
                color: colors.text,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                appearance: "none",
              }}
            >
              <option value="none">None</option>
              <option value="plan1">Plan 1</option>
              <option value="plan2">Plan 2</option>
              <option value="plan4">Plan 4</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Postgrad loan</label>
            <button
              type="button"
              onClick={() => setOptions({ ...options, hasPostgraduateLoan: !options.hasPostgraduateLoan })}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 6,
                border: `1px solid ${options.hasPostgraduateLoan ? colors.gold : colors.faint}`,
                background: options.hasPostgraduateLoan ? `${colors.gold}15` : colors.card,
                color: options.hasPostgraduateLoan ? colors.gold : colors.muted,
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              {options.hasPostgraduateLoan ? "Included" : "Off"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PercentileBar({ percentile, colors, isMobile }) {
  const pct = Math.max(0, Math.min(100, percentile));
  const markerLeft = `${pct}%`;
  return (
    <div style={{ position: "relative", marginTop: 8, marginBottom: 4 }}>
      <div
        style={{
          height: isMobile ? 18 : 22,
          borderRadius: 11,
          background: colors.faint,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: markerLeft,
            borderRadius: 11,
            background: `linear-gradient(90deg, ${colors.blue}40, ${colors.gold}90)`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: markerLeft,
          top: -4,
          transform: "translateX(-50%)",
          width: isMobile ? 26 : 30,
          height: isMobile ? 26 : 30,
          borderRadius: "50%",
          background: colors.gold,
          border: `2.5px solid ${colors.card}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? 8 : 9,
          fontWeight: 700,
          color: "#0b0e13",
          boxShadow: `0 1px 4px ${colors.gold}40`,
          transition: "left 0.4s ease",
        }}
      >
        {Math.round(pct)}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: colors.dim,
          marginTop: 4,
        }}
      >
        <span>0th</span>
        <span>50th</span>
        <span>100th</span>
      </div>
    </div>
  );
}

const defaultOptions = () => ({
  taxRegion: TAKE_HOME_DEFAULTS.taxRegion,
  pensionPct: String(TAKE_HOME_DEFAULTS.pensionPct),
  studentLoanPlan: TAKE_HOME_DEFAULTS.studentLoanPlan,
  hasPostgraduateLoan: TAKE_HOME_DEFAULTS.hasPostgraduateLoan,
});

export default function HouseholdCard({ isMobile, isTablet }) {
  const { colors } = useTheme();
  const saved = useMemo(loadSaved, []);

  const [p1Gross, setP1Gross] = useState(saved?.p1Gross ?? "");
  const [p2Gross, setP2Gross] = useState(saved?.p2Gross ?? "");
  const [p1Options, setP1Options] = useState(saved?.p1Options ?? defaultOptions());
  const [p2Options, setP2Options] = useState(saved?.p2Options ?? defaultOptions());
  const [childrenUnder14, setChildrenUnder14] = useState(saved?.childrenUnder14 ?? 0);
  const [persons14Plus, setPersons14Plus] = useState(saved?.persons14Plus ?? 0);
  const [p1Expanded, setP1Expanded] = useState(false);
  const [p2Expanded, setP2Expanded] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ p1Gross, p2Gross, p1Options, p2Options, childrenUnder14, persons14Plus }),
      );
    } catch {}
  }, [p1Gross, p2Gross, p1Options, p2Options, childrenUnder14, persons14Plus]);

  const g1 = parseFloat(p1Gross) || 0;
  const g2 = parseFloat(p2Gross) || 0;
  const hasInput = g1 > 0 || g2 > 0;

  const result = useMemo(() => {
    if (!hasInput) return null;
    return calcHousehold(
      g1,
      g2,
      {
        taxRegion: p1Options.taxRegion,
        pensionPct: parseFloat(p1Options.pensionPct) || 0,
        studentLoanPlan: p1Options.studentLoanPlan,
        hasPostgraduateLoan: p1Options.hasPostgraduateLoan,
      },
      {
        taxRegion: p2Options.taxRegion,
        pensionPct: parseFloat(p2Options.pensionPct) || 0,
        studentLoanPlan: p2Options.studentLoanPlan,
        hasPostgraduateLoan: p2Options.hasPostgraduateLoan,
      },
      childrenUnder14,
      persons14Plus,
    );
  }, [g1, g2, p1Options, p2Options, childrenUnder14, persons14Plus, hasInput]);

  const fmtGbp = useCallback((v) => `\u00A3${Math.round(v).toLocaleString("en-GB")}`, []);

  return (
    <div
      style={{
        padding: isMobile ? "16px 14px" : "22px 26px",
        background: colors.card,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 16 : 18,
          color: colors.gold,
          marginBottom: 4,
        }}
      >
        Household Income
      </div>
      <div style={{ fontSize: isMobile ? 11 : 12, color: colors.dim, marginBottom: 16 }}>
        Enter gross salaries and household size to see your combined take-home pay and where you sit on the UK income distribution.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <PartnerSection
          index={0}
          gross={p1Gross}
          setGross={setP1Gross}
          options={p1Options}
          setOptions={setP1Options}
          colors={colors}
          isMobile={isMobile}
          expanded={p1Expanded}
          setExpanded={setP1Expanded}
        />
        <PartnerSection
          index={1}
          gross={p2Gross}
          setGross={setP2Gross}
          options={p2Options}
          setOptions={setP2Options}
          colors={colors}
          isMobile={isMobile}
          expanded={p2Expanded}
          setExpanded={setP2Expanded}
        />
      </div>

      <div
        style={{
          padding: isMobile ? "12px 12px" : "14px 16px",
          background: colors.bg,
          borderRadius: 8,
          border: `1px solid ${colors.faint}`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Household
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Stepper
            label="Children under 14"
            value={childrenUnder14}
            onChange={setChildrenUnder14}
            colors={colors}
            isMobile={isMobile}
          />
          <Stepper
            label="Dependants 14+"
            value={persons14Plus}
            onChange={setPersons14Plus}
            colors={colors}
            isMobile={isMobile}
          />
        </div>
      </div>

      {!hasInput && (
        <div style={{ textAlign: "center", color: colors.dim, fontSize: 13, padding: "20px 0" }}>
          Enter at least one salary above to see results.
        </div>
      )}

      {result && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
              gap: isMobile ? 8 : 10,
              marginBottom: 14,
            }}
          >
            {[
              { label: "Combined gross", value: fmtGbp(result.combinedGross), color: colors.text },
              { label: "Income tax", value: fmtGbp(result.combinedTax), color: colors.red },
              { label: "National Insurance", value: fmtGbp(result.combinedNi), color: colors.gold },
              { label: "Pension", value: fmtGbp(result.combinedPension), color: colors.blue },
              { label: "Combined take-home", value: fmtGbp(result.combinedNet), color: "#4ecb71" },
              ...(result.childBenefit.gross > 0
                ? [
                    {
                      label: result.childBenefit.clawback > 0 ? "Child Benefit (net)" : "Child Benefit",
                      value: fmtGbp(result.childBenefit.net),
                      color: "#4ecb71",
                    },
                  ]
                : []),
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: isMobile ? "8px 8px" : "10px 12px",
                  borderRadius: 6,
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}20`,
                }}
              >
                <div style={{ fontSize: isMobile ? 10 : 11, color: colors.muted, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: isMobile ? 13 : 14, color: item.color, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {result.childBenefit.clawback > 0 && (
            <div
              style={{
                fontSize: isMobile ? 10 : 11,
                color: colors.dim,
                marginBottom: 12,
                fontStyle: "italic",
              }}
            >
              Child Benefit is {fmtGbp(result.childBenefit.gross)}/yr but {fmtGbp(result.childBenefit.clawback)} is clawed back via the High Income Child Benefit Charge (higher earner above £60k).
            </div>
          )}

          <div
            style={{
              padding: isMobile ? "12px 12px" : "16px 18px",
              background: colors.bg,
              borderRadius: 8,
              border: `1px solid ${colors.faint}`,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: isMobile ? 12 : 13, color: colors.muted }}>Total household disposable</span>
              <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#4ecb71" }}>
                {fmtGbp(result.disposableAnnual)}<span style={{ fontSize: 11, fontWeight: 400, color: colors.dim }}>/yr</span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: isMobile ? 11 : 12, color: colors.muted }}>
              <span>Monthly: <strong style={{ color: colors.text }}>{fmtGbp(result.disposableAnnual / 12)}</strong></span>
              <span>Weekly: <strong style={{ color: colors.text }}>{fmtGbp(result.disposableWeekly)}</strong></span>
            </div>
          </div>

          <div
            style={{
              padding: isMobile ? "12px 12px" : "16px 18px",
              background: colors.bg,
              borderRadius: 8,
              border: `1px solid ${colors.faint}`,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? 14 : 15,
                color: colors.gold,
                marginBottom: 4,
              }}
            >
              Where you sit in the UK
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: colors.body, lineHeight: 1.6, marginBottom: 8 }}>
              After equivalising for household size (factor {result.eqFactor.toFixed(2)}), your household income is{" "}
              <strong style={{ color: colors.text }}>{fmtGbp(result.equivalisedWeekly)}/wk</strong> compared to the UK median of{" "}
              <strong style={{ color: colors.text }}>£{BHC_MEDIAN}/wk</strong>. That places you around the{" "}
              <strong style={{ color: colors.gold }}>{Math.round(result.percentile)}{ordinalSuffix(Math.round(result.percentile))} percentile</strong>.
            </div>
            <PercentileBar percentile={result.percentile} colors={colors} isMobile={isMobile} />
            <div style={{ fontSize: isMobile ? 9 : 10, color: colors.dim, marginTop: 8 }}>
              Equivalisation adjusts income for household size using the Modified OECD scale so different households can be fairly compared. Percentiles use DWP HBAI FYE 2024 data (before housing costs).
            </div>
          </div>

          <div style={{ fontSize: isMobile ? 9 : 10, color: colors.dim, lineHeight: 1.5 }}>
            Estimate only. Uses 2025/26 payroll-style tax bands, standard tax code 1257L, net-pay pension treatment, and annual student-loan thresholds. Child Benefit uses 2025/26 rates with HICBC clawback above £60k.
          </div>
        </>
      )}
    </div>
  );
}

function ordinalSuffix(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "st";
  if (mod10 === 2 && mod100 !== 12) return "nd";
  if (mod10 === 3 && mod100 !== 13) return "rd";
  return "th";
}
