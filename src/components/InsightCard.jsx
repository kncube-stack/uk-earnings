import { useState } from "react";

import { PL, PV } from "../percentiles";
import { useTheme } from "../theme";
import { calcNetPay, TAKE_HOME_DEFAULTS } from "../utils/earnings";
import CompBar from "./CompBar";

export default function InsightCard({
  age,
  availableKeys,
  cohortDesc,
  compData,
  emptyPrompt,
  hoursPay,
  isHours,
  isHourly,
  isMobile,
  isTablet,
  isWeekly,
  periodLabel,
  periodUnit,
  pctResult,
  percentileContext,
  salary,
  selectedBucket,
  selectionContext,
  selectedLabel,
  selectionType,
  fmt,
}) {
  const { colors } = useTheme();
  const [taxRegion, setTaxRegion] = useState(TAKE_HOME_DEFAULTS.taxRegion);
  const [pensionPct, setPensionPct] = useState(String(TAKE_HOME_DEFAULTS.pensionPct));
  const [studentLoanPlan, setStudentLoanPlan] = useState(TAKE_HOME_DEFAULTS.studentLoanPlan);
  const [hasPostgraduateLoan, setHasPostgraduateLoan] = useState(TAKE_HOME_DEFAULTS.hasPostgraduateLoan);

  if (!(selectedBucket && salary)) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: "18px 20px",
          background: colors.card,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          color: colors.muted,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {emptyPrompt}
      </div>
    );
  }

  const median = selectedBucket.median;
  const diff = salary - median;
  const pctDiff = Math.round((Math.abs(diff) / median) * 100);
  const annualGross = isHourly ? salary * (parseFloat(hoursPay) || 37.5) * 52 : isWeekly ? salary * 52 : salary;
  const taxProfile = !isHours && salary
    ? calcNetPay(annualGross, {
        taxRegion,
        pensionPct: parseFloat(pensionPct) || 0,
        studentLoanPlan,
        hasPostgraduateLoan,
      })
    : null;
  const isAgeView = selectionType === "age";
  const takeHomeParts = taxProfile
    ? [
        { label: "Take-home", value: taxProfile.net, color: "#4ecb71" },
        { label: "Income tax", value: taxProfile.tax, color: "#e05c3a" },
        { label: "National Insurance", value: taxProfile.ni, color: "#d4a843" },
        { label: "Pension", value: taxProfile.pension, color: "#6fa9ff" },
        { label: "Student loan", value: taxProfile.studentLoan, color: "#8c77f4" },
        { label: "Postgrad loan", value: taxProfile.postgraduateLoan, color: "#d980fa" },
      ].filter((part) => part.value > 0 || part.label === "Take-home")
    : [];
  const totalTakeHome = takeHomeParts.reduce((sum, part) => sum + part.value, 0);

  return (
    <div
      style={{
        marginTop: 20,
        padding: isMobile ? "16px 16px" : "22px 26px",
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
          marginBottom: 10,
        }}
      >
        Where you stand
      </div>
      <div style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.8, color: colors.body }}>
        <>
          {isAgeView ? (
            <>
              At <strong style={{ color: colors.red }}>{fmt(salary)}{periodUnit}</strong> aged <strong style={{ color: colors.gold }}>{age}</strong>, you fall in the{" "}
              <strong style={{ color: colors.text }}>{selectedLabel}</strong> age group. The median {periodLabel}
              {isHours ? "" : " gross pay"} for {cohortDesc} in this group is <strong style={{ color: colors.text }}>{fmt(median)}</strong>.
            </>
          ) : (
            <>
              At <strong style={{ color: colors.red }}>{fmt(salary)}{periodUnit}</strong> in <strong style={{ color: colors.text }}>{selectedLabel}</strong>, the median {periodLabel}
              {isHours ? "" : " gross pay"} for {cohortDesc}{selectionContext ? ` ${selectionContext}` : ""} is <strong style={{ color: colors.text }}>{fmt(median)}</strong>.
            </>
          )}
          {diff > 0 ? (
            <>
              {" "}
              You're {isHours ? "working" : "earning"}{" "}
              <strong style={{ color: isHours ? colors.red : colors.green }}>
                {fmt(Math.abs(diff))} ({pctDiff}%) {isHours ? "more than" : "above"}
              </strong>{" "}
              the median.
              {isHours && pctDiff > 15 ? " That's significantly more hours than most." : ""}
            </>
          ) : diff < 0 ? (
            <>
              {" "}
              You're {isHours ? "working" : "earning"}{" "}
              <strong style={{ color: isHours ? colors.green : colors.red }}>
                {fmt(Math.abs(diff))} ({pctDiff}%) {isHours ? "fewer than" : "below"}
              </strong>{" "}
              the median.
            </>
          ) : (
            <>
              {" "}
              You're <strong>right on</strong> the median.
            </>
          )}
          {pctResult &&
            (pctResult.below ? (
              <>
                {" "}
                That places you <strong style={{ color: colors.gold }}>below the {pctResult.value}th percentile</strong> {isHours ? "working fewer hours than roughly" : "earning less than roughly"}{" "}
                {100 - pctResult.value}% of {cohortDesc} {percentileContext}
              </>
            ) : pctResult.above ? (
              <>
                {" "}
                That places you <strong style={{ color: colors.gold }}>above the {pctResult.value}th percentile</strong> {isHours ? "working more hours than at least" : "earning more than at least"}{" "}
                {pctResult.value}% of {cohortDesc} {percentileContext}
              </>
            ) : (
              <>
                {" "}
                That puts you at roughly the <strong style={{ color: colors.gold }}>{pctResult.value}th percentile</strong> {isHours ? "working more hours than about" : "earning more than about"}{" "}
                {pctResult.value}% of {cohortDesc} {percentileContext}
              </>
            ))}
        </>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: isMobile ? "10px 10px" : "14px 16px",
          background: colors.bg,
          borderRadius: 8,
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(110px, 1fr))",
          gap: isMobile ? "4px 10px" : "5px 14px",
          fontSize: isMobile ? 11 : 12,
        }}
      >
        {availableKeys.map((key) => {
          const value = selectedBucket[key];
          if (value == null) return null;

          const isAbove = salary >= value;
          const isNearest = pctResult && !pctResult.below && !pctResult.above && Math.abs(PV[key] - pctResult.value) <= 5;

          return (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 6px",
                borderRadius: 4,
                background: isNearest ? `${colors.gold}15` : "transparent",
              }}
            >
              <span style={{ color: colors.muted }}>{PL[key]}</span>
              <span
                style={{
                  color: isNearest ? colors.gold : isAbove ? `${colors.green}bb` : colors.muted,
                  fontWeight: isNearest ? 600 : 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(value)}
              </span>
            </div>
          );
        })}
      </div>

      {compData && !isHours && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: isMobile ? 12 : 13,
              color: colors.muted,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            Average weekly pay breakdown · {selectedLabel} age group
          </div>
          <CompBar data={compData} isMobile={isMobile} />
        </div>
      )}

      {taxProfile && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: isMobile ? 12 : 13,
              color: colors.muted,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            Estimated take-home pay · 2025/26 rates
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Tax region</label>
              <select
                value={taxRegion}
                onChange={(event) => setTaxRegion(event.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="ruk">England, Wales, NI</option>
                <option value="scotland">Scotland</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Pension %</label>
              <input
                type="text"
                inputMode="decimal"
                value={pensionPct}
                onChange={(event) => setPensionPct(event.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4 }}>Student loan</label>
              <select
                value={studentLoanPlan}
                onChange={(event) => setStudentLoanPlan(event.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 13,
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
                onClick={() => setHasPostgraduateLoan((current) => !current)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 6,
                  border: `1px solid ${hasPostgraduateLoan ? colors.gold : colors.faint}`,
                  background: hasPostgraduateLoan ? `${colors.gold}15` : colors.bg,
                  color: hasPostgraduateLoan ? colors.gold : colors.muted,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                {hasPostgraduateLoan ? "Included" : "Off"}
              </button>
            </div>
          </div>
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
            {takeHomeParts.map((part, index, parts) => (
              <div
                key={part.label}
                style={{
                  width: `${((part.value / totalTakeHome) * 100).toFixed(1)}%`,
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
              gap: isMobile ? 6 : 14,
              flexWrap: "wrap",
              fontSize: isMobile ? 11 : 12,
              color: colors.muted,
            }}
          >
            {takeHomeParts.map((part) => (
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
                {part.label}: <strong style={{ color: colors.text }}>£{part.value.toLocaleString("en-GB")}</strong>
                <span style={{ color: colors.dim }}>
                  ({Math.round((part.value / totalTakeHome) * 100)}%)
                </span>
              </span>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${colors.faint}`,
              display: "flex",
              gap: isMobile ? 10 : 20,
              flexWrap: "wrap",
              fontSize: isMobile ? 11 : 12,
              color: colors.muted,
            }}
          >
            <span>
              Monthly: <strong style={{ color: "#4ecb71" }}>£{Math.round(taxProfile.net / 12).toLocaleString("en-GB")}</strong>
            </span>
            <span>
              Weekly: <strong style={{ color: "#4ecb71" }}>£{Math.round(taxProfile.net / 52).toLocaleString("en-GB")}</strong>
            </span>
            <span>
              Effective rate: <strong style={{ color: colors.text }}>{taxProfile.effectiveRate}%</strong>
            </span>
          </div>
          {(isHourly || isWeekly) && (
            <div
              style={{
                marginTop: 6,
                fontSize: isMobile ? 10 : 11,
                color: colors.dim,
                fontStyle: "italic",
              }}
            >
              {isHourly
                ? `Based on ${parseFloat(hoursPay) || 37.5}hrs/wk \u00D7 52 weeks = \u00A3${annualGross.toLocaleString("en-GB")} annual gross`
                : `Based on \u00A3${salary.toLocaleString("en-GB")}/wk \u00D7 52 = \u00A3${annualGross.toLocaleString("en-GB")} annual gross`}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: isMobile ? 9 : 10, color: colors.dim }}>
            Estimate only. Uses 2025/26 payroll-style bands, standard tax code 1257L, net-pay pension treatment, and annual student-loan thresholds.
          </div>
        </div>
      )}
    </div>
  );
}
