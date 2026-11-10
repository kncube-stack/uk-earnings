import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

// Bundle the same browser modules used by Vite without adding a test framework.
const bundle = await build({ stdin: { contents: 'export * from "./src/utils/earnings.js"; export * from "./src/utils/household.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { calcNetPay, calcHousehold, calcChildBenefit, lookupPercentile, TAKE_HOME_DEFAULTS: defaults } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

// Official 2025/26 income AFTER allowances, not gross-income thresholds:
// https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past
for (const [gross, tax] of [[12570,0],[50000,7486],[100000,27432],[110000,33432],[125140,42516],[150000,53703]]) {
  test(`2025/26 rUK income tax at £${gross}`, () => assert.equal(calcNetPay(gross).tax, tax));
}
for (const [gross,tax] of [[15397,537],[27491,2956],[43662,6352],[75000,19514],[100000,30764],[110000,37514],[125140,47733]]) {
  test(`2025/26 Scottish income tax at £${gross}`, () => assert.equal(calcNetPay(gross, {...defaults,taxRegion:'scotland'}).tax,tax));
}
test('net-pay pension restores personal allowance without reducing NI', () => {
  const r=calcNetPay(110000,{...defaults,pensionPct:10});
  assert.equal(r.tax,27032); assert.equal(r.personalAllowance,12570); assert.equal(r.pension,11000); assert.equal(r.ni,calcNetPay(110000).ni);
});
test('invalid gross and pension inputs do not produce NaN or negative net results', () => {
  for (const gross of [0,-1,NaN,Infinity]) assert.equal(calcNetPay(gross),null);
  for (const pensionPct of [-1,101,NaN,Infinity,100]) assert.equal(calcNetPay(50000,{...defaults,pensionPct}),null);
});
test('student and postgraduate loans retain explicitly historical thresholds', () => {
  assert.equal(calcNetPay(30000,{...defaults,studentLoanPlan:'plan2',hasPostgraduateLoan:true}).studentLoan,138);
  assert.equal(calcNetPay(30000,{...defaults,hasPostgraduateLoan:true}).postgraduateLoan,540);
});
// https://www.gov.uk/child-benefit-tax-charge : complete £200 increments on adjusted net income.
for(const [income,percentage] of [[60000,0],[60199,0],[60200,1],[60399,1],[60400,2],[79999,99],[80000,100]]) {
  test(`HICBC at £${income} is ${percentage}%`,()=>assert.equal(calcChildBenefit(1,income).clawback,Math.round(1354.6*percentage)/100));
}
test('one-income couple remains a two-adult household',()=>{
  const couple=calcHousehold(50000,0,defaults,defaults,0,0);
  const single=calcHousehold(50000,0,defaults,defaults,0,0,{hasPartner:false});
  assert.equal(couple.eqFactor,1);assert.equal(single.eqFactor,0.67);assert.ok(couple.percentile<single.percentile);
});
test('single-adult mode ignores hidden partner earnings',()=>{
  assert.equal(calcHousehold(50000,70000,defaults,defaults,0,0,{hasPartner:false}).combinedGross,50000);
});
test('adult dependants do not automatically generate Child Benefit',()=>{
  const r=calcHousehold(30000,0,defaults,defaults,0,1);
  assert.equal(r.childBenefit.gross,0);assert.equal(r.eqFactor,1.33);
});
test('eligible child count is independent of equivalisation age bands',()=>{
  const r=calcHousehold(30000,0,defaults,defaults,1,1,{hasPartner:false,eligibleChildren:1});
  assert.equal(r.childBenefit.gross,1354.6);assert.ok(Math.abs(r.eqFactor-1.2)<1e-12);
  assert.equal(calcHousehold(30000,0,defaults,defaults,0,0,{eligibleChildren:1}),null);
});
test('HICBC uses higher adjusted income after net-pay pensions, not higher gross',()=>{
  const r=calcHousehold(70000,62000,{...defaults,pensionPct:20},defaults,1,0,{eligibleChildren:1});
  assert.equal(r.childBenefit.clawback,135.46);
});
test('zero salary can still show eligible Child Benefit without invalid outputs',()=>{
  const r=calcHousehold(0,0,defaults,defaults,1,0,{hasPartner:false,eligibleChildren:1});
  assert.equal(r.disposableAnnual,1354.6); assert.ok(Number.isFinite(r.percentile));
});
test('invalid household financial inputs do not masquerade as zero pay',()=>{
  assert.equal(calcHousehold(Infinity,0,defaults,defaults,0,0),null);
  assert.equal(calcHousehold(50000,0,{...defaults,pensionPct:100},defaults,0,0),null);
});
test('published HBAI range stays capped without inventing percentiles',()=>{
 assert.equal(lookupPercentile(100),4); assert.equal(lookupPercentile(999999),97);
});
