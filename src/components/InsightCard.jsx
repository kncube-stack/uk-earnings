import { PL, PV } from "../percentiles";
import { C } from "../theme";
import { calcNetPay } from "../utils/earnings";
import CompBar from "./CompBar";

export default function InsightCard({
  age,
  availableKeys,
  cohortDesc,
  compData,
  hoursPay,
  isHours,
  isHourly,
  isMobile,
  isTablet,
  isWeekly,
  periodLabel,
  periodUnit,
  pctResult,
  salary,
  userGroup,
  userGroupLabel,
  fmt,
}) {
  if (!(age && salary && userGroup)) {
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
        Enter your age and {isHours ? "weekly hours" : isHourly ? "hourly rate" : isWeekly ? "weekly pay" : "annual salary"} above to see where you fall.
      </div>
    );
  }

  const median = userGroup.median;
  const diff = salary - median;
  const pctDiff = Math.round((Math.abs(diff) / median) * 100);
  const annualGross = isHourly ? salary * (parseFloat(hoursPay) || 37.5) * 52 : isWeekly ? salary * 52 : salary;
  const taxProfile = !isHours && salary ? calcNetPay(annualGross) : null;

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
        Where you stand
      </div>
      <div style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.8, color: "#c5c0b6" }}>
        <>
          At <strong style={{ color: C.red }}>{fmt(salary)}{periodUnit}</strong> aged <strong style={{ color: C.gold }}>{age}</strong>, you fall in the{" "}
          <strong style={{ color: C.text }}>{userGroupLabel}</strong> age group. The median {periodLabel}
          {isHours ? "" : " gross pay"} for {cohortDesc} in this group is <strong style={{ color: C.text }}>{fmt(median)}</strong>.
          {diff > 0 ? (
            <>
              {" "}
              You're {isHours ? "working" : "earning"}{" "}
              <strong style={{ color: isHours ? C.red : C.green }}>
                {fmt(Math.abs(diff))} ({pctDiff}%) {isHours ? "more than" : "above"}
              </strong>{" "}
              the median.
              {isHours && pctDiff > 15 ? " That’s significantly more hours than most." : ""}
            </>
          ) : diff < 0 ? (
            <>
              {" "}
              You're {isHours ? "working" : "earning"}{" "}
              <strong style={{ color: isHours ? C.green : C.red }}>
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
                That places you <strong style={{ color: C.gold }}>below the {pctResult.value}th percentile</strong> {isHours ? "working fewer hours than roughly" : "earning less than roughly"}{" "}
                {100 - pctResult.value}% of {cohortDesc} in your age bracket.
              </>
            ) : pctResult.above ? (
              <>
                {" "}
                That places you <strong style={{ color: C.gold }}>above the {pctResult.value}th percentile</strong> {isHours ? "working more hours than at least" : "earning more than at least"}{" "}
                {pctResult.value}% of {cohortDesc} in your age bracket.
              </>
            ) : (
              <>
                {" "}
                That puts you at roughly the <strong style={{ color: C.gold }}>{pctResult.value}th percentile</strong> {isHours ? "working more hours than about" : "earning more than about"}{" "}
                {pctResult.value}% of {cohortDesc} in your age bracket.
              </>
            ))}
        </>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: isMobile ? "10px 10px" : "14px 16px",
          background: C.bg,
          borderRadius: 8,
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(110px, 1fr))",
          gap: isMobile ? "4px 10px" : "5px 14px",
          fontSize: isMobile ? 11 : 12,
        }}
      >
        {availableKeys.map((key) => {
          const value = userGroup[key];
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
                background: isNearest ? `${C.gold}15` : "transparent",
              }}
            >
              <span style={{ color: C.muted }}>{PL[key]}</span>
              <span
                style={{
                  color: isNearest ? C.gold : isAbove ? `${C.green}bb` : C.muted,
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
              color: C.muted,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            Average weekly pay breakdown · {userGroupLabel} age group
          </div>
          <CompBar data={compData} isMobile={isMobile} colors={C} />
        </div>
      )}

      {taxProfile && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: isMobile ? 12 : 13,
              color: C.muted,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            Estimated take-home pay · 2025/26 rates
          </div>
          <div
            style={{
              display: "flex",
              height: isMobile ? 20 : 24,
              borderRadius: 6,
              overflow: "hidden",
              background: C.faint,
              marginBottom: 8,
            }}
          >
            {[
              { label: "Take-home", value: taxProfile.net, color: "#4ecb71" },
              { label: "Income tax", value: taxProfile.tax, color: "#e05c3a" },
              { label: "National Insurance", value: taxProfile.ni, color: "#d4a843" },
            ].map((part, index, parts) => (
              <div
                key={part.label}
                style={{
                  width: `${((part.value / (taxProfile.net + taxProfile.tax + taxProfile.ni)) * 100).toFixed(1)}%`,
                  background: part.color,
                  opacity: 0.75,
                  borderRight: index < parts.length - 1 ? `1px solid ${C.bg}` : "none",
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
              color: C.muted,
            }}
          >
            {[
              { label: "Take-home", value: taxProfile.net, color: "#4ecb71" },
              { label: "Income tax", value: taxProfile.tax, color: "#e05c3a" },
              { label: "National Insurance", value: taxProfile.ni, color: "#d4a843" },
            ].map((part) => (
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
                {part.label}: <strong style={{ color: C.text }}>£{part.value.toLocaleString("en-GB")}</strong>
                <span style={{ color: C.dim }}>
                  ({Math.round((part.value / (taxProfile.net + taxProfile.tax + taxProfile.ni)) * 100)}%)
                </span>
              </span>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${C.faint}`,
              display: "flex",
              gap: isMobile ? 10 : 20,
              flexWrap: "wrap",
              fontSize: isMobile ? 11 : 12,
              color: C.muted,
            }}
          >
            <span>
              Monthly: <strong style={{ color: "#4ecb71" }}>£{Math.round(taxProfile.net / 12).toLocaleString("en-GB")}</strong>
            </span>
            <span>
              Weekly: <strong style={{ color: "#4ecb71" }}>£{Math.round(taxProfile.net / 52).toLocaleString("en-GB")}</strong>
            </span>
            <span>
              Effective rate: <strong style={{ color: C.text }}>{taxProfile.effectiveRate}%</strong>
            </span>
          </div>
          {(isHourly || isWeekly) && (
            <div
              style={{
                marginTop: 6,
                fontSize: isMobile ? 10 : 11,
                color: C.dim,
                fontStyle: "italic",
              }}
            >
              {isHourly
                ? `Based on ${parseFloat(hoursPay) || 37.5}hrs/wk × 52 weeks = £${annualGross.toLocaleString("en-GB")} annual gross`
                : `Based on £${salary.toLocaleString("en-GB")}/wk × 52 = £${annualGross.toLocaleString("en-GB")} annual gross`}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: isMobile ? 9 : 10, color: C.dim }}>
            Estimate only. Assumes standard tax code (1257L), no pension, no student loan.
          </div>
        </div>
      )}
    </div>
  );
}
