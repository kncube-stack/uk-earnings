import { BHC_PERCENTILES } from "../data/hbaiPercentiles";
import { calcNetPay } from "./earnings";

// Child Benefit 2025/26
const CB_FIRST = 1354.60;
const CB_ADDITIONAL = 897.0;
const HICBC_THRESHOLD = 60000;
const HICBC_FULL = 80000;

export function calcChildBenefit(numChildren, higherEarnerAdjustedIncome) {
  if (!Number.isInteger(numChildren) || numChildren < 0 || !Number.isFinite(higherEarnerAdjustedIncome) || higherEarnerAdjustedIncome < 0) return null;
  if (numChildren <= 0) return { gross: 0, net: 0, clawback: 0 };
  const gross = CB_FIRST + Math.max(0, numChildren - 1) * CB_ADDITIONAL;
  if (higherEarnerAdjustedIncome <= HICBC_THRESHOLD) return { gross, net: gross, clawback: 0 };
  if (higherEarnerAdjustedIncome >= HICBC_FULL) return { gross, net: 0, clawback: gross };
  // GOV.UK: repay 1% for each complete £200 of adjusted net income over £60k.
  const pct = Math.min(1, Math.floor((higherEarnerAdjustedIncome - HICBC_THRESHOLD) / 200) / 100);
  const clawback = Math.round(gross * pct * 100) / 100;
  return { gross, net: gross - clawback, clawback };
}

// Modified OECD equivalisation scale (BHC)
// First adult = 0.67, partner = 0.33, child under 14 = 0.20, person 14+ = 0.33
export function equivalisationFactor(hasPartner, numChildrenUnder14, numPersons14Plus) {
  let factor = 0.67;
  if (hasPartner) factor += 0.33;
  factor += numChildrenUnder14 * 0.2;
  factor += numPersons14Plus * 0.33;
  return factor;
}

export function lookupPercentile(equivalisedWeekly) {
  if (equivalisedWeekly <= 0) return 0;
  const pts = BHC_PERCENTILES;
  if (equivalisedWeekly <= pts[0][1]) return pts[0][0];
  if (equivalisedWeekly >= pts[pts.length - 1][1]) return pts[pts.length - 1][0];
  for (let i = 1; i < pts.length; i++) {
    if (equivalisedWeekly <= pts[i][1]) {
      const [pLow, vLow] = pts[i - 1];
      const [pHigh, vHigh] = pts[i];
      const t = (equivalisedWeekly - vLow) / (vHigh - vLow);
      return Math.round((pLow + t * (pHigh - pLow)) * 10) / 10;
    }
  }
  return 97;
}

export function calcHousehold(p1Gross, p2Gross, p1Options, p2Options, numChildrenUnder14, numPersons14Plus, { hasPartner = true, eligibleChildren = 0 } = {}) {
  if (![p1Gross, p2Gross].every(value => Number.isFinite(value) && value >= 0)) return null;
  if (![numChildrenUnder14, numPersons14Plus, eligibleChildren].every(value => Number.isInteger(value) && value >= 0)) return null;
  if (eligibleChildren > numChildrenUnder14 + numPersons14Plus) return null;
  if (!hasPartner) p2Gross = 0;
  const ZERO = { net: 0, tax: 0, ni: 0, pension: 0, studentLoan: 0, postgraduateLoan: 0, effectiveRate: 0, taxableGross: 0 };
  const p1 = p1Gross > 0 ? calcNetPay(p1Gross, p1Options) : ZERO;
  const p2 = p2Gross > 0 ? calcNetPay(p2Gross, p2Options) : ZERO;
  if (!p1 || !p2) return null;
  const adjustedIncome = (gross, options) => gross === 0 ? 0 : gross * (1 - Number(options?.pensionPct || 0) / 100);
  const higherAdjustedIncome = Math.max(adjustedIncome(p1Gross, p1Options), adjustedIncome(p2Gross, p2Options));
  const cb = calcChildBenefit(eligibleChildren, higherAdjustedIncome);
  if (!cb) return null;

  const combinedGross = (p1Gross || 0) + (p2Gross || 0);
  const combinedNet = p1.net + p2.net;
  const combinedTax = p1.tax + p2.tax;
  const combinedNi = p1.ni + p2.ni;
  const combinedPension = p1.pension + p2.pension;
  const disposableAnnual = combinedNet + cb.net;
  const disposableWeekly = disposableAnnual / 52;

  const eqFactor = equivalisationFactor(
    hasPartner,
    numChildrenUnder14,
    numPersons14Plus,
  );
  const equivalisedWeekly = disposableWeekly / eqFactor;
  const percentile = lookupPercentile(equivalisedWeekly);

  return {
    partner1: p1,
    partner2: p2,
    childBenefit: cb,
    combinedGross,
    combinedNet,
    combinedTax,
    combinedNi,
    combinedPension,
    disposableAnnual,
    disposableWeekly,
    eqFactor,
    equivalisedWeekly,
    percentile,
  };
}
