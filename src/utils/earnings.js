import { PK, PV } from "../percentiles";

export const TAKE_HOME_DEFAULTS = {
  taxRegion: "ruk",
  pensionPct: 0,
  studentLoanPlan: "none",
  hasPostgraduateLoan: false,
};

const PERSONAL_ALLOWANCE = 12570;
const PERSONAL_ALLOWANCE_TAPER_START = 100000;
const ADDITIONAL_RATE_THRESHOLD = 125140;
const NI_PRIMARY_THRESHOLD = 12570;
const NI_UPPER_EARNINGS_LIMIT = 50270;

const RUK_BANDS = [
  { upper: 50270, rate: 0.2 },
  { upper: ADDITIONAL_RATE_THRESHOLD, rate: 0.4 },
  { upper: Infinity, rate: 0.45 },
];

const SCOTLAND_BANDS = [
  { upper: 15397, rate: 0.19 },
  { upper: 27491, rate: 0.2 },
  { upper: 43662, rate: 0.21 },
  { upper: 75000, rate: 0.42 },
  { upper: ADDITIONAL_RATE_THRESHOLD, rate: 0.45 },
  { upper: Infinity, rate: 0.48 },
];

const STUDENT_LOAN_THRESHOLDS = {
  none: null,
  plan1: 26065,
  plan2: 28470,
  plan4: 32745,
};

export function findGroup(age) {
  if (age <= 17) return "16–17";
  if (age <= 21) return "18–21";
  if (age <= 29) return "22–29";
  if (age <= 39) return "30–39";
  if (age <= 49) return "40–49";
  if (age <= 59) return "50–59";
  return "60+";
}

export function estimatePercentile(group, salary) {
  if (!group) return null;

  const points = PK.map((key) => ({ p: PV[key], v: group[key] })).filter((point) => point.v != null);

  if (points.length < 2) return null;
  if (salary <= points[0].v) return { value: points[0].p, below: true };
  if (salary >= points[points.length - 1].v) {
    return { value: points[points.length - 1].p, above: true };
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    if (salary >= points[index].v && salary <= points[index + 1].v) {
      const fraction = (salary - points[index].v) / (points[index + 1].v - points[index].v);
      return {
        value: Math.round(points[index].p + fraction * (points[index + 1].p - points[index].p)),
      };
    }
  }

  return null;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

function calculatePersonalAllowance(adjustedNetIncome) {
  if (adjustedNetIncome <= PERSONAL_ALLOWANCE_TAPER_START) return PERSONAL_ALLOWANCE;
  if (adjustedNetIncome >= ADDITIONAL_RATE_THRESHOLD) return 0;
  return Math.max(0, PERSONAL_ALLOWANCE - Math.floor((adjustedNetIncome - PERSONAL_ALLOWANCE_TAPER_START) / 2));
}

function calculateIncomeTax(taxableGross, allowance, taxRegion) {
  const bands = taxRegion === "scotland" ? SCOTLAND_BANDS : RUK_BANDS;
  let tax = 0;
  let lower = allowance;

  for (const band of bands) {
    if (taxableGross <= lower) break;
    const taxableSlice = Math.max(0, Math.min(taxableGross, band.upper) - lower);
    tax += taxableSlice * band.rate;
    lower = band.upper;
  }

  return tax;
}

function calculateNationalInsurance(gross) {
  let ni = 0;
  if (gross > NI_PRIMARY_THRESHOLD) ni += Math.min(gross - NI_PRIMARY_THRESHOLD, NI_UPPER_EARNINGS_LIMIT - NI_PRIMARY_THRESHOLD) * 0.08;
  if (gross > NI_UPPER_EARNINGS_LIMIT) ni += (gross - NI_UPPER_EARNINGS_LIMIT) * 0.02;
  return ni;
}

function calculateStudentLoan(gross, plan) {
  const threshold = STUDENT_LOAN_THRESHOLDS[plan];
  if (!threshold || gross <= threshold) return 0;
  return (gross - threshold) * 0.09;
}

function calculatePostgraduateLoan(gross, enabled) {
  if (!enabled || gross <= 21000) return 0;
  return (gross - 21000) * 0.06;
}

export function calcNetPay(gross, options = TAKE_HOME_DEFAULTS) {
  if (!gross || gross <= 0) return null;

  const taxRegion = options.taxRegion === "scotland" ? "scotland" : "ruk";
  const pensionPct = clampPercent(Number(options.pensionPct) || 0);
  const pension = gross * (pensionPct / 100);
  const taxableGross = Math.max(0, gross - pension);
  const personalAllowance = calculatePersonalAllowance(taxableGross);
  const tax = calculateIncomeTax(taxableGross, personalAllowance, taxRegion);
  const ni = calculateNationalInsurance(gross);
  const studentLoan = calculateStudentLoan(gross, options.studentLoanPlan || "none");
  const postgraduateLoan = calculatePostgraduateLoan(gross, Boolean(options.hasPostgraduateLoan));
  const totalDeductions = tax + ni + pension + studentLoan + postgraduateLoan;
  const net = gross - totalDeductions;

  return {
    net: Math.round(net),
    tax: Math.round(tax),
    ni: Math.round(ni),
    pension: Math.round(pension),
    studentLoan: Math.round(studentLoan),
    postgraduateLoan: Math.round(postgraduateLoan),
    effectiveRate: Math.round((totalDeductions / gross) * 100),
    personalAllowance: Math.round(personalAllowance),
    taxableGross: Math.round(taxableGross),
  };
}
