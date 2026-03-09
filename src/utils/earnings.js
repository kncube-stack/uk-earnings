import { PK, PV } from "../percentiles";

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

export function calcNetPay(gross) {
  if (!gross || gross <= 0) return null;

  let personalAllowance = 12570;
  if (gross > 100000) {
    personalAllowance = Math.max(0, personalAllowance - Math.floor((gross - 100000) / 2));
  }

  const taxable = Math.max(0, gross - personalAllowance);
  let tax = 0;
  if (taxable > 0) tax += Math.min(taxable, 37700) * 0.2;
  if (taxable > 37700) tax += Math.min(taxable - 37700, 74870) * 0.4;
  if (taxable > 112570) tax += (taxable - 112570) * 0.45;

  let ni = 0;
  if (gross > 12570) ni += Math.min(gross - 12570, 37700) * 0.08;
  if (gross > 50270) ni += (gross - 50270) * 0.02;

  const net = gross - tax - ni;
  return {
    net: Math.round(net),
    tax: Math.round(tax),
    ni: Math.round(ni),
    effectiveRate: Math.round(((tax + ni) / gross) * 100),
  };
}
