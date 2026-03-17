import { BHC_PERCENTILES } from "../data/hbaiPercentiles";
import { calcNetPay } from "./earnings";

// Child Benefit 2025/26
const CB_FIRST = 1354.60;
const CB_ADDITIONAL = 897.0;
const HICBC_THRESHOLD = 60000;
const HICBC_FULL = 80000;

export function calcChildBenefit(numChildren, higherEarnerGross) {
  if (numChildren <= 0) return { gross: 0, net: 0, clawback: 0 };
  const gross = CB_FIRST + Math.max(0, numChildren - 1) * CB_ADDITIONAL;
  if (higherEarnerGross <= HICBC_THRESHOLD) return { gross, net: gross, clawback: 0 };
  if (higherEarnerGross >= HICBC_FULL) return { gross, net: 0, clawback: gross };
  const pct = Math.min(1, (higherEarnerGross - HICBC_THRESHOLD) / (HICBC_FULL - HICBC_THRESHOLD));
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

export function calcHousehold(p1Gross, p2Gross, p1Options, p2Options, numChildrenUnder14, numPersons14Plus) {
  const ZERO = { net: 0, tax: 0, ni: 0, pension: 0, studentLoan: 0, postgraduateLoan: 0, effectiveRate: 0 };
  const p1 = (p1Gross > 0 ? calcNetPay(p1Gross, p1Options) : null) ?? ZERO;
  const p2 = (p2Gross > 0 ? calcNetPay(p2Gross, p2Options) : null) ?? ZERO;
  const totalChildren = numChildrenUnder14 + numPersons14Plus;
  const higherGross = Math.max(p1Gross || 0, p2Gross || 0);
  const cb = calcChildBenefit(totalChildren, higherGross);

  const combinedGross = (p1Gross || 0) + (p2Gross || 0);
  const combinedNet = p1.net + p2.net;
  const combinedTax = p1.tax + p2.tax;
  const combinedNi = p1.ni + p2.ni;
  const combinedPension = p1.pension + p2.pension;
  const disposableAnnual = combinedNet + cb.net;
  const disposableWeekly = disposableAnnual / 52;

  const eqFactor = equivalisationFactor(
    (p1Gross || 0) > 0 && (p2Gross || 0) > 0,
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
