import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import EarningsChart from "./components/EarningsChart";
import GenderGapCard from "./components/GenderGapCard";
import GenderGapChart from "./components/GenderGapChart";
import HouseholdCard from "./components/HouseholdCard";
import InsightCard from "./components/InsightCard";
import Pill from "./components/Pill";
import { AGE_COMPOSITION } from "./data/asheAgeComposition";
import { AGE_DATA } from "./data/asheAge";
import { INDUSTRY_DATA, INDUSTRY_OPTIONS } from "./data/asheIndustry";
import { AGE_OCCUPATION_DATA, OCCUPATION_AGE_BANDS } from "./data/asheOccupationByAge";
import { OCCUPATION_DATA, OCCUPATION_OPTIONS } from "./data/asheOccupation";
import { OCCUPATION_REGION_DATA } from "./data/asheOccupationByRegion";
import { OCCUPATION_REGION_GAP_DATA } from "./data/asheOccupationByRegionGap";
import {
  AGE_GAP_DATA,
  AGE_OCCUPATION_GAP_DATA,
  GAP_BENCHMARKS,
  INDUSTRY_GAP_DATA,
  OCCUPATION_GAP_DATA,
  REGION_GAP_DATA,
  SECTOR_GAP_DATA,
} from "./data/asheGenderGap";
import { REGION_DATA, REGION_OPTIONS } from "./data/asheRegion";
import { SECTOR_DATA, SECTOR_OPTIONS } from "./data/asheSector";
import { useContainerWidth } from "./hooks/useContainerWidth";
import { PK } from "./percentiles";
import { dark, light, ThemeContext } from "./theme";
import { estimatePercentile, findGroup } from "./utils/earnings";

// ─── ASHE 2026 Data ───
// Structure: DATA[period][genderWork] = array of age groups
// period: "annual" | "weekly" | "hourly" | "hours"
// genderWork: "all" | "male" | "female" | "ft" | "pt" | "male_ft" | "female_ft"

const DATA = AGE_DATA;

// Pay composition (mean weekly GBP): basic, overtime, other pay, annual incentive
const COMP = AGE_COMPOSITION;

export default function EarningsDashboard() {
  const [analysisMode, setAnalysisMode] = useState("earnings");
  const [view, setView] = useState("age");
  const [period, setPeriod] = useState("annual");
  const [gender, setGender] = useState("all");
  const [work, setWork] = useState("all");
  const [userAge, setUserAge] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState("");
  const [selectedOccupationRegion, setSelectedOccupationRegion] = useState("");
  const [selectedOccupationAgeBand, setSelectedOccupationAgeBand] = useState("");
  const [selectedOccupationDetail, setSelectedOccupationDetail] = useState("");
  const [occupationDetailData, setOccupationDetailData] = useState(null);
  const [occupationDetailStatus, setOccupationDetailStatus] = useState("idle");
  const [gapOccupationDetailData, setGapOccupationDetailData] = useState(null);
  const [gapOccupationDetailStatus, setGapOccupationDetailStatus] = useState("idle");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [annualPay, setAnnualPay] = useState("");
  const [weeklyPay, setWeeklyPay] = useState("");
  const [hourlyPay, setHourlyPay] = useState("");
  const [hoursPay, setHoursPay] = useState("");
  const [activeIdx, setActiveIdx] = useState(null);
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem("theme") || "dark"; } catch { return "dark"; }
  });
  const colors = themeMode === "light" ? light : dark;
  const containerRef = useRef(null);
  const cw = useContainerWidth(containerRef);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch {}
      return next;
    });
  }, []);

  const isMobile = cw < 520;
  const isTablet = cw >= 520 && cw < 768;
  const isDesktop = cw >= 768;
  const isGapMode = analysisMode === "gap";
  const isHouseholdMode = analysisMode === "household";
  const isAgeView = view === "age";
  const isOccupationView = view === "occupation";
  const isIndustryView = view === "industry";
  const isRegionView = view === "region";
  const isSectorView = view === "sector";
  const effectivePeriod = isGapMode ? "hourly" : period;
  const effectiveGender = isGapMode ? "all" : gender;

  const earningsDataKey = useMemo(() => {
    if (effectiveGender === "all" && work === "all") return "all";
    if (effectiveGender === "all" && work === "ft") return "ft";
    if (effectiveGender === "male" && work === "all") return "male";
    if (effectiveGender === "female" && work === "all") return "female";
    if (effectiveGender === "male" && work === "ft") return "male_ft";
    if (effectiveGender === "female" && work === "ft") return "female_ft";
    return "all";
  }, [effectiveGender, work]);
  const gapDataKey = work === "ft" ? "ft" : "all";

  const usesOccupationRegion = isOccupationView && selectedOccupationRegion;
  const usesOccupationAgeBand = isOccupationView && selectedOccupationAgeBand;

  useEffect(() => {
    let cancelled = false;

    if (
      isGapMode ||
      !isOccupationView ||
      usesOccupationRegion ||
      usesOccupationAgeBand ||
      occupationDetailData ||
      occupationDetailStatus === "loading"
    ) {
      return undefined;
    }

    setOccupationDetailStatus("loading");

    import("./data/asheOccupationDetail")
      .then((module) => {
        if (cancelled) return;
        setOccupationDetailData(module.OCCUPATION_DETAIL_DATA);
        setOccupationDetailStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setOccupationDetailStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [
    isGapMode,
    isOccupationView,
    occupationDetailData,
    usesOccupationRegion,
    usesOccupationAgeBand,
  ]);

  const occupationDetailSeries = useMemo(() => {
    if (isGapMode || !(isOccupationView && selectedOccupation) || usesOccupationAgeBand || usesOccupationRegion || !occupationDetailData) return [];

    const periodData = occupationDetailData[effectivePeriod];
    if (!periodData) return [];
    const detailByCohort = periodData[earningsDataKey] || periodData.all;
    return detailByCohort?.[selectedOccupation] || [];
  }, [earningsDataKey, effectivePeriod, isGapMode, isOccupationView, occupationDetailData, selectedOccupation, usesOccupationAgeBand, usesOccupationRegion]);

  const occupationDetailOptions = useMemo(
    () => occupationDetailSeries.map(({ id, label }) => ({ id, label, shortLabel: id })),
    [occupationDetailSeries],
  );

  const usesOccupationDetail =
    !isGapMode &&
    isOccupationView &&
    !usesOccupationAgeBand &&
    !!selectedOccupation &&
    !!selectedOccupationDetail &&
    occupationDetailSeries.length > 0;

  useEffect(() => {
    let cancelled = false;

    if (
      !isGapMode ||
      !isOccupationView ||
      usesOccupationRegion ||
      usesOccupationAgeBand ||
      gapOccupationDetailData ||
      gapOccupationDetailStatus === "loading"
    ) {
      return undefined;
    }

    setGapOccupationDetailStatus("loading");

    import("./data/asheGenderGapDetail")
      .then((module) => {
        if (cancelled) return;
        setGapOccupationDetailData(module.OCCUPATION_DETAIL_GAP_DATA);
        setGapOccupationDetailStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setGapOccupationDetailStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [
    gapOccupationDetailData,
    isGapMode,
    isOccupationView,
    usesOccupationRegion,
    usesOccupationAgeBand,
  ]);

  const gapOccupationDetailSeries = useMemo(() => {
    if (!isGapMode || !(isOccupationView && selectedOccupation) || usesOccupationAgeBand || usesOccupationRegion || !gapOccupationDetailData) return [];
    return gapOccupationDetailData[gapDataKey]?.[selectedOccupation] || [];
  }, [gapDataKey, gapOccupationDetailData, isGapMode, isOccupationView, selectedOccupation, usesOccupationAgeBand, usesOccupationRegion]);

  const gapOccupationDetailOptions = useMemo(
    () => gapOccupationDetailSeries.map(({ id, label }) => ({ id, label, shortLabel: id })),
    [gapOccupationDetailSeries],
  );

  const usesGapOccupationDetail =
    isGapMode &&
    isOccupationView &&
    !usesOccupationAgeBand &&
    !!selectedOccupation &&
    !!selectedOccupationDetail &&
    gapOccupationDetailSeries.length > 0;

  useEffect(() => {
    if (!isOccupationView || usesOccupationAgeBand || usesOccupationRegion || !selectedOccupation) {
      setSelectedOccupationDetail("");
      return;
    }

    const currentSeries = isGapMode ? gapOccupationDetailSeries : occupationDetailSeries;
    if (selectedOccupationDetail && !currentSeries.some(({ id }) => id === selectedOccupationDetail)) {
      setSelectedOccupationDetail("");
    }
  }, [
    gapOccupationDetailSeries,
    isGapMode,
    isOccupationView,
    occupationDetailSeries,
    selectedOccupation,
    selectedOccupationDetail,
    usesOccupationAgeBand,
    usesOccupationRegion,
  ]);

  const viewConfig = isOccupationView
    ? {
        selectorLabel: "Occupation group",
        selectorKind: "occupation group",
        selectorOptions: OCCUPATION_OPTIONS,
        selectorValue: selectedOccupation,
        setSelectorValue: setSelectedOccupation,
        selectorNote: isGapMode
          ? gapOccupationDetailStatus === "loading"
            ? "Loading detailed four-digit SOC job codes from ONS Table 14."
            : selectedOccupationDetail
              ? "Showing official four-digit SOC detail from ONS ASHE Table 14."
              : selectedOccupationRegion
                ? "Region refine uses official ONS ASHE Table 3 and stays at the major occupation-group level."
              : selectedOccupationAgeBand
                ? "Age bands come from ONS ASHE Table 20 and stay at the major occupation-group level."
                : "Occupation groups use official ONS ASHE Table 2 and can drill into Table 14 job detail."
          : occupationDetailStatus === "loading"
            ? "Loading detailed four-digit SOC job codes from ONS Table 14."
            : selectedOccupationDetail
              ? "Showing official four-digit SOC detail from ONS ASHE Table 14."
              : selectedOccupationRegion
                ? "Region refine uses official ONS ASHE Table 3 and stays at the major occupation-group level."
              : selectedOccupationAgeBand
                ? "Age bands come from ONS ASHE Table 20 and stay at the major occupation-group level."
                : "Occupation groups use official ONS ASHE Table 2 and can drill into Table 14 job detail.",
      }
    : isIndustryView
      ? {
          selectorLabel: "Industry section",
          selectorKind: "industry section",
          selectorOptions: INDUSTRY_OPTIONS,
          selectorValue: selectedIndustry,
          setSelectorValue: setSelectedIndustry,
          selectorNote: isGapMode
            ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 4."
            : "Industry view uses official ONS SIC2007 section groupings from ASHE Table 4.",
        }
      : isRegionView
        ? {
            selectorLabel: "Region",
            selectorKind: "region",
            selectorOptions: REGION_OPTIONS,
            selectorValue: selectedRegion,
            setSelectorValue: setSelectedRegion,
            selectorNote: isGapMode
              ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE UK region-by-age dataset (Table 34)."
              : "Region view uses official ONS UK workplace regions from ASHE UK region-by-age dataset (Table 34).",
          }
        : isSectorView
          ? {
              selectorLabel: "Sector",
              selectorKind: "sector",
              selectorOptions: SECTOR_OPTIONS,
              selectorValue: selectedSector,
              setSelectorValue: setSelectedSector,
              selectorNote: isGapMode
                ? "Gender pay gap mode uses official ONS hourly pay excluding overtime from ASHE Table 13."
                : "Sector view uses official ONS public, private, non-profit, and unclassified groups from ASHE Table 13.",
            }
          : null;

  const sourceData = !isGapMode
    ? usesOccupationAgeBand
      ? AGE_OCCUPATION_DATA
      : usesOccupationRegion
        ? OCCUPATION_REGION_DATA
      : isOccupationView
        ? OCCUPATION_DATA
        : isIndustryView
          ? INDUSTRY_DATA
          : isRegionView
            ? REGION_DATA
            : isSectorView
              ? SECTOR_DATA
              : DATA
    : null;

  const gapData = isGapMode
    ? usesOccupationAgeBand
      ? AGE_OCCUPATION_GAP_DATA[gapDataKey]?.[selectedOccupationAgeBand] || []
      : usesOccupationRegion
        ? OCCUPATION_REGION_GAP_DATA[gapDataKey]?.[selectedOccupationRegion] || []
      : usesGapOccupationDetail
        ? gapOccupationDetailSeries
        : isOccupationView
          ? OCCUPATION_GAP_DATA[gapDataKey] || []
          : isIndustryView
            ? INDUSTRY_GAP_DATA[gapDataKey] || []
            : isRegionView
              ? REGION_GAP_DATA[gapDataKey] || []
              : isSectorView
                ? SECTOR_GAP_DATA[gapDataKey] || []
                : AGE_GAP_DATA[gapDataKey] || []
    : [];

  const data = isGapMode
    ? gapData
    : usesOccupationAgeBand
      ? sourceData[effectivePeriod][earningsDataKey]?.[selectedOccupationAgeBand] || []
      : usesOccupationRegion
        ? sourceData[effectivePeriod][earningsDataKey]?.[selectedOccupationRegion] ||
          sourceData[effectivePeriod].all?.[selectedOccupationRegion] ||
          []
      : usesOccupationDetail
        ? occupationDetailSeries
        : sourceData[effectivePeriod][earningsDataKey] || sourceData[effectivePeriod].all;

  const isWeekly = effectivePeriod === "weekly";
  const isHourly = effectivePeriod === "hourly";
  const isHours = effectivePeriod === "hours";

  const rawAge = parseInt(userAge, 10);
  const age = !isNaN(rawAge) && rawAge >= 16 ? rawAge : null;
  const userSalary = isHours ? hoursPay : isHourly ? hourlyPay : isWeekly ? weeklyPay : annualPay;
  const setUserSalary = isHours ? setHoursPay : isHourly ? setHourlyPay : isWeekly ? setWeeklyPay : setAnnualPay;
  const salary = parseFloat(String(userSalary).replace(/[\u00a3,\s]/g, "")) || null;
  const ageGroupLabel = age ? findGroup(age) : null;
  const selectedBucketId = isOccupationView
    ? usesOccupationDetail || usesGapOccupationDetail
      ? selectedOccupationDetail || null
      : selectedOccupation || null
    : isIndustryView
      ? selectedIndustry || null
      : isRegionView
        ? selectedRegion || null
        : isSectorView
          ? selectedSector || null
          : ageGroupLabel;
  const selectedBucket = data.find((row) => (row.id ?? row.label) === selectedBucketId);
  const selectedLabel = selectedBucket?.label ?? null;
  const selectedOccupationRegionLabel =
    REGION_OPTIONS.find((option) => option.id === selectedOccupationRegion)?.label ?? null;
  const pctResult = !isGapMode && selectedBucket && salary ? estimatePercentile(selectedBucket, salary) : null;
  const ageGroupIdx = data.findIndex((row) => row.label === ageGroupLabel);
  const compData = !isGapMode && isAgeView && COMP[earningsDataKey] && ageGroupIdx >= 0 ? COMP[earningsDataKey][ageGroupIdx] : null;
  const availableKeys = useMemo(() => PK.filter((key) => data.some((row) => row[key] != null)), [data]);

  const handleColumnInteract = useCallback((i) => {
    setActiveIdx((prev) => (prev === i ? null : i));
  }, []);

  const fmtGrid = (v) => {
    if (v === 0) return isHours ? "0h" : "£0";
    if (isHours) return `${v}h`;
    if (isHourly) return `£${v}`;
    if (isWeekly) return isMobile && v >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${v}`;
    return `£${(v / 1000).toFixed(0)}k`;
  };

  const fmt = (v) => {
    if (v == null) return "\u2014";
    if (isHours) return `${Number.isInteger(v) ? v : v.toFixed(1)}h`;
    if (isHourly) return `£${v.toFixed(2)}`;
    return `£${v.toLocaleString("en-GB")}`;
  };

  const fmtRate = (value) => (value == null ? "—" : `£${Number(value).toFixed(1)}`);

  const genderLabel = { all: "all employees", male: "male employees", female: "female employees" }[effectiveGender] || "employees";
  const workLabel = { all: "", ft: " (full-time)", pt: " (part-time)" }[work] || "";
  const cohortDesc = `${genderLabel}${workLabel}`;
  const gapWorkLabel = work === "ft" ? "full-time employees" : "all employees";
  const occupationAgeBandLabel = selectedOccupationAgeBand || null;
  const selectionContext = usesOccupationRegion && selectedOccupationRegionLabel
    ? `in ${selectedOccupationRegionLabel}`
    : null;
  const periodLabel = isGapMode ? "hourly pay excluding overtime" : isHours ? "weekly hours" : isHourly ? "hourly" : isWeekly ? "weekly" : "annual";
  const periodUnit = isHours ? "/wk" : isHourly ? "/hr" : isWeekly ? "/week" : "/year";
  const payPromptLabel = isGapMode ? "official gender pay gap" : isHours ? "weekly hours" : isHourly ? "hourly rate" : isWeekly ? "weekly pay" : "annual salary";
  const emptyPrompt = isGapMode
    ? isAgeView
      ? "Enter your age to highlight the official gender pay gap for your age group."
      : `Choose a ${viewConfig.selectorKind} to explore the official gender pay gap.`
    : isAgeView
      ? `Enter your age and ${payPromptLabel} above to see where you fall.`
      : `Choose a ${viewConfig.selectorKind} and enter your ${payPromptLabel} above to see where you fall.`;
  const percentileContext = isAgeView
    ? "in your age bracket."
    : isIndustryView
      ? "in this industry."
      : isRegionView
        ? "in this region."
      : isSectorView
        ? "in this sector."
        : usesOccupationDetail
          ? "in this job detail."
          : usesOccupationRegion
            ? "in this region and occupation group."
            : usesOccupationAgeBand
              ? "in this age band and occupation group."
              : "in this occupation group.";
  const insightCohortDesc = usesOccupationAgeBand ? `${cohortDesc} aged ${occupationAgeBandLabel}` : cohortDesc;
  const gapBenchmark = GAP_BENCHMARKS[gapDataKey];
  const currentOccupationDetailOptions = isGapMode ? gapOccupationDetailOptions : occupationDetailOptions;
  const currentOccupationDetailStatus = isGapMode ? gapOccupationDetailStatus : occupationDetailStatus;

  const comboAvailable = isGapMode
    ? data.length > 0
    : usesOccupationAgeBand
      ? !!sourceData[effectivePeriod][earningsDataKey]?.[selectedOccupationAgeBand]
      : usesOccupationRegion
        ? !!(sourceData[effectivePeriod][earningsDataKey]?.[selectedOccupationRegion] || sourceData[effectivePeriod].all?.[selectedOccupationRegion])
      : !!sourceData[effectivePeriod][earningsDataKey];

  return (
    <ThemeContext.Provider value={{ colors, mode: themeMode }}>
    <div
      style={{
        background: colors.bg,
        minHeight: "100vh",
        padding: isMobile ? "20px 10px" : "32px 20px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: colors.text,
      }}
    >
      <div ref={containerRef} style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? 20 : 26,
                fontWeight: 600,
                color: colors.text,
                margin: "0 0 4px",
              }}
            >
              UK Earnings Explorer
            </h1>
            <p style={{ color: colors.muted, fontSize: isMobile ? 11 : 13, margin: "0 0 20px" }}>
              ASHE 2026 Provisional · Office for National Statistics
            </p>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark mode"
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${colors.faint}`,
              background: colors.card,
              color: colors.muted,
              fontSize: 16,
              cursor: "pointer",
              fontFamily: "inherit",
              lineHeight: 1,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {themeMode === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 10 : 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pay period</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <Pill active={!isGapMode && period === "annual"} disabled={isGapMode} onClick={() => setPeriod("annual")} isMobile={isMobile}>Annual</Pill>
              <Pill active={!isGapMode && period === "weekly"} disabled={isGapMode} onClick={() => setPeriod("weekly")} isMobile={isMobile}>Weekly</Pill>
              <Pill active={effectivePeriod === "hourly"} disabled={isGapMode} onClick={() => setPeriod("hourly")} isMobile={isMobile}>Hourly</Pill>
              <Pill active={!isGapMode && period === "hours"} disabled={isGapMode} onClick={() => setPeriod("hours")} isMobile={isMobile}>Hours</Pill>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gender</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={effectiveGender === "all"} disabled={isGapMode} onClick={() => setGender("all")} isMobile={isMobile}>All</Pill>
              <Pill active={!isGapMode && gender === "male"} disabled={isGapMode} onClick={() => setGender("male")} isMobile={isMobile}>Male</Pill>
              <Pill active={!isGapMode && gender === "female"} disabled={isGapMode} onClick={() => setGender("female")} isMobile={isMobile}>Female</Pill>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Work pattern</label>
            <div style={{ display: "flex", gap: 4 }}>
              <Pill active={work === "all"} onClick={() => setWork("all")} isMobile={isMobile}>All</Pill>
              <Pill active={work === "ft"} onClick={() => setWork("ft")} isMobile={isMobile}>Full-Time</Pill>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Analysis</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Pill active={analysisMode === "earnings"} onClick={() => setAnalysisMode("earnings")} isMobile={isMobile}>Earnings</Pill>
            <Pill active={analysisMode === "gap"} onClick={() => setAnalysisMode("gap")} isMobile={isMobile}>Gender pay gap</Pill>
            <Pill active={analysisMode === "household"} onClick={() => setAnalysisMode("household")} isMobile={isMobile}>Household</Pill>
          </div>
        </div>

        {!isHouseholdMode && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: colors.dim, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>View</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Pill active={view === "age"} onClick={() => setView("age")} isMobile={isMobile}>Age</Pill>
            <Pill active={view === "occupation"} onClick={() => setView("occupation")} isMobile={isMobile}>Occupation</Pill>
            <Pill active={view === "industry"} onClick={() => setView("industry")} isMobile={isMobile}>Industry</Pill>
            <Pill active={view === "region"} onClick={() => setView("region")} isMobile={isMobile}>Region</Pill>
            <Pill active={view === "sector"} onClick={() => setView("sector")} isMobile={isMobile}>Sector</Pill>
          </div>
        </div>
        )}

        {!isHouseholdMode && <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: !isAgeView || isGapMode ? 8 : 20,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {isAgeView ? (
            <div style={{ width: isMobile ? "35%" : 60, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>Your age</label>
              <input
                type="number"
                min="16"
                max="80"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
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
          ) : (
            <div style={{ width: isMobile ? "100%" : isOccupationView ? 320 : 260, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>{viewConfig.selectorLabel}</label>
              <select
                value={viewConfig.selectorValue}
                onChange={(e) => viewConfig.setSelectorValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.card,
                  color: viewConfig.selectorValue ? colors.text : colors.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">Select one</option>
                {viewConfig.selectorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isOccupationView && (
            <div style={{ width: isMobile ? "calc(58% - 5px)" : 170, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>Region</label>
              <select
                value={selectedOccupationRegion}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSelectedOccupationRegion(nextValue);
                  if (nextValue) {
                    setSelectedOccupationAgeBand("");
                    setSelectedOccupationDetail("");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.card,
                  color: selectedOccupationRegion ? colors.text : colors.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">All regions</option>
                {REGION_OPTIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isOccupationView && (
            <div style={{ width: isMobile ? "calc(42% - 5px)" : 126, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>Age band</label>
              <select
                value={selectedOccupationAgeBand}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSelectedOccupationAgeBand(nextValue);
                  if (nextValue) {
                    setSelectedOccupationRegion("");
                    setSelectedOccupationDetail("");
                  }
                }}
                disabled={Boolean(selectedOccupationRegion)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.card,
                  color: selectedOccupationAgeBand ? colors.text : colors.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  opacity: selectedOccupationRegion ? 0.65 : 1,
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">{selectedOccupationRegion ? "Unavailable with region" : "All ages"}</option>
                {OCCUPATION_AGE_BANDS.map((ageBand) => (
                  <option key={ageBand} value={ageBand}>
                    {ageBand}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isOccupationView && selectedOccupation && (
            <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>Job detail</label>
              <select
                value={selectedOccupationDetail}
                onChange={(e) => setSelectedOccupationDetail(e.target.value)}
                disabled={selectedOccupationAgeBand || selectedOccupationRegion || currentOccupationDetailStatus === "loading" || currentOccupationDetailStatus === "error"}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.faint}`,
                  background: colors.card,
                  color: selectedOccupationDetail ? colors.text : colors.muted,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  opacity: selectedOccupationAgeBand || selectedOccupationRegion || currentOccupationDetailStatus === "loading" || currentOccupationDetailStatus === "error" ? 0.65 : 1,
                  boxSizing: "border-box",
                  appearance: "none",
                }}
              >
                <option value="">
                  {selectedOccupationRegion
                    ? "Unavailable with region"
                    : selectedOccupationAgeBand
                    ? "Unavailable with age band"
                    : currentOccupationDetailStatus === "loading"
                    ? "Loading job details..."
                    : currentOccupationDetailStatus === "error"
                      ? "Job detail unavailable"
                      : "All job details"}
                </option>
                {currentOccupationDetailOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isGapMode && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>
                {isHours ? "Hours per week" : isHourly ? "Hourly rate (£)" : isWeekly ? "Weekly gross pay (£)" : "Annual salary (£)"}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={userSalary}
                onChange={(e) => setUserSalary(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
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
          )}
        </div>}

        {!isHouseholdMode && !comboAvailable && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: 12,
              borderRadius: 8,
              background: `${colors.red}15`,
              border: `1px solid ${colors.red}30`,
              color: colors.muted,
              fontSize: 12,
            }}
          >
            This exact split is not published in ASHE. The chart is showing the nearest official series available for this view.
          </div>
        )}

        {isHouseholdMode ? (
          <HouseholdCard isMobile={isMobile} isTablet={isTablet} />
        ) : isGapMode ? (
          <>
            <GenderGapChart
              activeIdx={activeIdx}
              containerWidth={cw}
              data={data}
              fmtRate={fmtRate}
              handleColumnInteract={handleColumnInteract}
              isMobile={isMobile}
              isTablet={isTablet}
              selectionType={view}
              selectedBucketId={selectedBucketId}
              setActiveIdx={setActiveIdx}
            />
            <GenderGapCard
              benchmark={gapBenchmark}
              emptyPrompt={emptyPrompt}
              isMobile={isMobile}
              selectedBucket={selectedBucket}
              selectionContext={selectionContext}
              selectedLabel={selectedLabel}
              workLabel={gapWorkLabel}
            />
          </>
        ) : (
          <>
            <EarningsChart
              activeIdx={activeIdx}
              availableKeys={availableKeys}
              containerWidth={cw}
              data={data}
              fmt={fmt}
              fmtGrid={fmtGrid}
              handleColumnInteract={handleColumnInteract}
              isHours={isHours}
              isHourly={isHourly}
              isMobile={isMobile}
              isTablet={isTablet}
              isWeekly={isWeekly}
              salary={salary}
              selectionType={view}
              selectedBucketId={selectedBucketId}
              setActiveIdx={setActiveIdx}
            />
            <InsightCard
              age={age}
              availableKeys={availableKeys}
              cohortDesc={insightCohortDesc}
              compData={compData}
              emptyPrompt={emptyPrompt}
              fmt={fmt}
              hoursPay={hoursPay}
              isHours={isHours}
              isHourly={isHourly}
              isMobile={isMobile}
              isTablet={isTablet}
              isWeekly={isWeekly}
              periodLabel={periodLabel}
              periodUnit={periodUnit}
              pctResult={pctResult}
              percentileContext={percentileContext}
              salary={salary}
              selectedBucket={selectedBucket}
              selectionContext={selectionContext}
              selectedLabel={selectedLabel}
              selectionType={view}
            />
          </>
        )}

        {isHouseholdMode ? (
          <p style={{ fontSize: isMobile ? 9 : 10, color: colors.source, marginTop: 16, lineHeight: 1.5 }}>
            Sources: DWP Households Below Average Income (HBAI) FYE 2024 for income distribution. HMRC 2025/26 tax bands and thresholds. Child Benefit rates from GOV.UK. Modified OECD equivalisation scale for household size adjustment.
          </p>
        ) : (
          <p style={{ fontSize: isMobile ? 9 : 10, color: colors.source, marginTop: 16, lineHeight: 1.5 }}>
            Source: ONS Annual Survey of Hours and Earnings (ASHE) 2026 Provisional. Employees on adult rates in same job for &gt;1 year.
            {isGapMode
              ? ` Gender pay gap mode uses the official ONS formula based on hourly pay excluding overtime.${gapBenchmark?.gapPct != null ? ` The current UK ${work === "ft" ? "full-time" : "all-employee"} benchmark is ${gapBenchmark.gapPct}%.` : ""}`
              : `${isOccupationView ? ` Occupation view uses SOC20 major groups${usesOccupationRegion ? " with Table 3 region refinement" : usesOccupationAgeBand ? " with Table 20 age-band refinement" : usesOccupationDetail ? " with Table 14 four-digit job detail" : ""}.` : ""}${isIndustryView ? " Industry view uses SIC2007 section groupings." : ""}${isRegionView ? " Region view uses workplace regions." : ""}${isSectorView ? " Sector view uses public, private, and non-profit groupings." : ""}`}
            {!isGapMode && usesOccupationDetail && " The x-axis uses 4-digit SOC codes to keep detailed charts readable."}
            {isDesktop && ` Hover ${isGapMode ? "categories" : "columns"} for detail.`}
          </p>
        )}
      </div>
    </div>
    </ThemeContext.Provider>
  );
}
