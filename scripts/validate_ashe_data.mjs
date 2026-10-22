import assert from "node:assert/strict";

import { AGE_DATA } from "../src/data/asheAge.js";
import { AGE_COMPOSITION } from "../src/data/asheAgeComposition.js";
import {
  AGE_GAP_DATA,
  GAP_BENCHMARKS,
} from "../src/data/asheGenderGap.js";
import { INDUSTRY_DATA, INDUSTRY_OPTIONS } from "../src/data/asheIndustry.js";
import { OCCUPATION_DATA, OCCUPATION_OPTIONS } from "../src/data/asheOccupation.js";
import {
  AGE_OCCUPATION_DATA,
  OCCUPATION_AGE_BANDS,
} from "../src/data/asheOccupationByAge.js";
import { OCCUPATION_REGION_DATA } from "../src/data/asheOccupationByRegion.js";
import { OCCUPATION_DETAIL_DATA } from "../src/data/asheOccupationDetail.js";
import { REGION_DATA, REGION_OPTIONS } from "../src/data/asheRegion.js";
import { SECTOR_DATA, SECTOR_OPTIONS } from "../src/data/asheSector.js";

const periods = ["annual", "weekly", "hourly", "hours"];
const workPatterns = ["all", "male", "female", "ft", "male_ft", "female_ft"];
const numericFields = ["median", "mean", "p10", "p20", "p25", "p30", "p40", "p60", "p70", "p75", "p80", "p90"];
const percentileFields = ["p10", "p20", "p25", "p30", "p40", "p60", "p70", "p75", "p80", "p90"];

function visitRows(value, callback) {
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((item) => item && typeof item === "object" && "median" in item)) {
      callback(value);
      return;
    }
    value.forEach((item) => visitRows(item, callback));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => visitRows(item, callback));
  }
}

function validateEarningsDataset(name, data) {
  let rowCount = 0;
  visitRows(data, (rows) => {
    rowCount += rows.length;
    for (const row of rows) {
      for (const field of numericFields) {
        assert.ok(row[field] == null || typeof row[field] === "number", `${name}: ${field} must be numeric or null`);
      }
      const publishedPercentiles = percentileFields.map((field) => row[field]).filter((value) => value != null);
      for (let index = 1; index < publishedPercentiles.length; index += 1) {
        assert.ok(
          publishedPercentiles[index] >= publishedPercentiles[index - 1],
          `${name}: percentiles must be non-decreasing for ${row.id ?? row.label}`,
        );
      }
    }
  });
  assert.ok(rowCount > 0, `${name}: expected generated rows`);
}

for (const period of periods) {
  assert.deepEqual(Object.keys(AGE_DATA[period]), workPatterns);
  for (const pattern of workPatterns) assert.equal(AGE_DATA[period][pattern].length, 7);
}

assert.equal(AGE_DATA.annual.all[0].median, 4650.6);
assert.equal(AGE_DATA.annual.all[3].median, 37744.7);
assert.equal(AGE_DATA.annual.all[0].p10, null);
assert.equal(AGE_COMPOSITION.all[0].basic, 150.8);
assert.equal(AGE_COMPOSITION.all[0].ot, 3.8);

assert.equal(OCCUPATION_OPTIONS.length, 9);
assert.equal(OCCUPATION_DATA.annual.all[0].median, 52665.5);
assert.equal(INDUSTRY_OPTIONS.length, 21);
assert.equal(INDUSTRY_DATA.annual.all[0].median, 29576.7);
assert.equal(REGION_OPTIONS.length, 13);
assert.equal(REGION_DATA.annual.all[0].id, "K02000001");
assert.equal(REGION_DATA.annual.all[0].median, 34229.1);
assert.equal(SECTOR_OPTIONS.length, 4);
assert.equal(SECTOR_DATA.annual.all[0].median, 36833.2);
assert.equal(SECTOR_DATA.annual.all.find((row) => row.id === "not-classified").median, null);

assert.equal(OCCUPATION_AGE_BANDS.length, 6);
assert.equal(Object.keys(OCCUPATION_REGION_DATA.annual.all).length, 13);
assert.equal(OCCUPATION_REGION_DATA.annual.all.K02000001[0].median, 52665.5);
assert.equal(Object.keys(OCCUPATION_DETAIL_DATA.annual.all).length, 9);
assert.equal(
  OCCUPATION_DETAIL_DATA.annual.all["3"].find((row) => row.id === "3312").median,
  52120.9,
);

assert.equal(GAP_BENCHMARKS.all.gapPct, 12.3);
assert.equal(GAP_BENCHMARKS.ft.gapPct, 6.8);
assert.equal(AGE_GAP_DATA.all[0].gapPct, 2.3);

validateEarningsDataset("age", AGE_DATA);
validateEarningsDataset("occupation", OCCUPATION_DATA);
validateEarningsDataset("industry", INDUSTRY_DATA);
validateEarningsDataset("region", REGION_DATA);
validateEarningsDataset("sector", SECTOR_DATA);
validateEarningsDataset("occupation by age", AGE_OCCUPATION_DATA);
validateEarningsDataset("occupation by region", OCCUPATION_REGION_DATA);
validateEarningsDataset("occupation detail", OCCUPATION_DETAIL_DATA);

console.log("ASHE 2026 generated-data validation passed.");
