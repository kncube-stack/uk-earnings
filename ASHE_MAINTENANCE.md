# ASHE release maintenance

The owner requested monthly ASHE release checks and automatic project updates on 31 August 2026. Keep the existing dashboard layout and behaviour. Limit this recurring work to ASHE data, its importers, source labels and necessary validation.

## Current verified baseline: 22 October 2026

- The dashboard uses the complete ASHE 2026 provisional release published on 22 October 2026 at 9:30am.
- All eight required dataset pages were checked. Each provides a 2026 provisional archive and a 2025 revised archive; the dashboard consistently uses the newer 2026 provisional edition.
- The official 2026 archives for Tables 2, 3, 4, 6, 13, 14 and 20, plus UK region by age group (Table 34), were downloaded and regenerated. No Average Weekly Earnings data is used.
- The exact source pages and downloaded archive SHA-256 hashes are recorded in `data/ASHE_2026_PROVENANCE.json` so same-URL corrections can be detected later.
- Age data and pay composition are generated into `src/data/asheAge.js` and `src/data/asheAgeComposition.js`; there is no longer a manually maintained ASHE age block in `src/App.jsx`.
- The known December 2025 police-earnings correction is superseded by the 2026 source workbooks. Suppressed and unpublished values from the 2026 workbooks remain `null` in generated modules.
- Table 3 contains two internally invalid London managers P90 hourly-gross values (`1.02` and `1.03`, below their P80 values of `77.29` and `79.41`). The Table 3 importer leaves these unusable cells `null`; it does not invent corrected figures. Recheck them on every later revision or correction.

## Previous verified baseline: 31 August 2026

- The live site at https://uk-earnings.vercel.app/ identifies its data as ASHE 2025 Provisional.
- All eight source dataset pages below list 2025 provisional as their latest edition, released on 23 October 2025. The source files and generator filenames also use 2025 provisional.
- The latest correction notice affecting the occupation sources is dated 19 December 2025. It suppresses unreliable annual earnings for specified police occupation groups. The app's Table 14 annual records for SOC 3312 already contain null earnings values.
- The 2026 employee earnings release is provisionally scheduled for October 2026: https://www.gov.uk/government/statistics/announcements/employee-earnings-in-the-uk-2026--2. This is an announcement, not a published dataset.
- This check establishes release currency and checks the known occupation correction. It is not a cell-by-cell reconciliation of all published workbooks. Raw workbook downloads were not completed in this check.
- Validation passed: all six Table 14 annual gender/work-pattern records for SOC 3312 retain null earnings; the production build completed successfully in a separate scratch directory. Vite reported its existing large-bundle warning. Existing local source/build changes were preserved.
- A Codex monthly heartbeat named `Monthly UK earnings ASHE update` is active for the first day of each month at 10:00 local UK time. It checks for new releases and corrections, implements applicable updates, validates them and publishes through the verified project workflow when successful. No dataset replacement or deployment was required on this baseline date.

## Official sources

Use the latest edition and correction/version history on each page, not only the headline publication year. A revised edition supersedes the provisional edition of the same year; an older revised year does not supersede a newer provisional year.

| Dashboard data | ONS source | Local content |
| --- | --- | --- |
| Age | [Table 6](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/agegroupashetable6) | `asheAge.js`, `asheAgeComposition.js`; age gender gap in `asheGenderGap.js` |
| Occupation groups | [Table 2](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation2digitsocashetable2) | `asheOccupation.js`; occupation gender gap |
| Occupation by region | [Table 3](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/regionbyoccupation2digitsocashetable3) | `asheOccupationByRegion.js`, `asheOccupationByRegionGap.js` |
| Industry | [Table 4](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/industry2digitsicashetable4) | `asheIndustry.js`; industry gender gap |
| Sector | [Table 13](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/publicandprivatesectorashetable13) | `asheSector.js`; sector gender gap |
| Detailed occupation | [Table 14](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14) | `asheOccupationDetail.js`, `asheGenderGapDetail.js` |
| Occupation by age | [Table 20](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/agegroupbyoccupation2digitsocashetable20) | `asheOccupationByAge.js`; occupation-by-age gender gap |
| Workplace region | [UK region by age group](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/earningsandhoursworkedukregionbyagegroup) | `asheRegion.js`; region gender gap |

The region generators read the UK region-by-age workbooks, named `Work Region Age Table 34` in the 2026 release. Older project comments called this Table 15, but that is a separate region-by-four-digit-occupation dataset and must not be substituted.

## Monthly procedure

1. Read applicable project instructions and inspect the Git state. The source repository is https://github.com/kncube-stack/uk-earnings.git. Preserve uncommitted work. If necessary, use an isolated checkout/worktree of the latest upstream code; do not reset, stash, overwrite or publish unrelated edits.
2. Check all eight official dataset pages and the ONS release calendar. Inspect same-year revisions, correction notices and previous versions as well as newer years. A calendar announcement alone is not a release. Do not replace ASHE with the monthly Average Weekly Earnings series.
3. Compare the currently implemented release and source versions with what ONS actually provides. For downloadable archives, record the source URL, edition, correction/version date and SHA-256 in a provenance record. On later checks compare archive contents too, so a correction at the same URL is detected. A download failure is not evidence that nothing changed.
4. When nothing new applies, leave application data and production unchanged and record the check outcome.
5. When a release or relevant correction is available, download the official workbooks into scratch storage and inspect the year, edition, worksheet names and column headings. Adapt the existing `scripts/generate_*.py` importers as required. Their filenames currently target the 2026 provisional archives, so changing a displayed year alone is insufficient. Regenerate both age modules from Table 6 too.
6. Regenerate every affected data module, including earnings, gender gaps, detailed occupations and age/region refinements. Update source labels and provenance with the actual editions used. Do not silently mix years across views or mark the whole dashboard as a new edition while older embedded data remains. If required tables are missing, retain the last complete verified dataset or make differing vintages explicit.
7. Validate against the workbooks: representative medians and percentiles across views/work patterns; category coverage; numeric types; suppressed and unpublished cells remaining null; percentile ordering where published; and all applicable corrections. Gender pay gap calculations must continue to use median hourly pay excluding overtime. Never fill suppressed data with zero, interpolate it or infer unpublished combinations.
8. Build with `npm run build`. In the user's working checkout use a separate scratch output directory so existing tracked `dist/` changes are preserved. Check the affected views, filters, missing-data states and source labels in a preview. Add focused regression checks when the import schema or calculations change.
9. After successful validation, commit only the ASHE maintenance changes and publish through the project's existing verified Git/Vercel workflow to https://uk-earnings.vercel.app/. Verify the repository and deployment target before publishing. Confirm the production deployment and visible edition after release. If validation, authentication or deployment fails, keep the current working production version and report the concrete blocker; do not report a deployment that did not happen.
10. Update this baseline/provenance and report the release found, changes made, checks passed and whether the live dashboard was updated.

HBAI household percentiles and the tax/NI/student-loan assumptions are separate sources and are outside this ASHE-only schedule. Do not relabel those as current merely because ASHE was checked.

## Monthly check log

- **1 September 2026:** All eight ONS source pages still list 2025 provisional as their latest edition. No correction newer than 19 December 2025 was found, and the 2026 release remains provisionally scheduled for October 2026. The live dashboard still identifies its source as ASHE 2025 Provisional. No application data or production deployment changed.
- **1 October 2026:** All eight ONS source pages still list 2025 provisional as their latest edition, with no correction newer than 19 December 2025. ONS has now confirmed the 2026 release for 22 October 2026 at 9:30am. No application data or production deployment changed. A release-day follow-up was scheduled for 10:30am that day, while the monthly check remains active.
- **22 October 2026:** ONS published the complete 2026 provisional release. All eight required archives were downloaded, hashed and regenerated as one edition. Importers were adapted for 2026 workbook naming and cell formatting, Table 6 age data and composition gained generators, labels now identify 2026 provisional, and the workplace-region source is correctly identified as UK region by age group (Table 34).
