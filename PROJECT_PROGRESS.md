# UK Earnings Explorer Progress

## Project Aim

Build a clean, mobile-friendly earnings explorer using official ONS ASHE data without inventing or extrapolating values.

## Completed Phases

### Phase 1

- Refactored the app into smaller components and shared utilities.
- Kept the existing visual design and interaction model intact.
- Left the core age view behavior unchanged while making the codebase safer to extend.

### Phase 2

- Added an `Occupation` view.
- Used official ONS ASHE 2025 Table 2 data for SOC20 major occupation groups.
- Added a generator script so the occupation dataset can be rebuilt from the official workbook.

### Phase 3

- Added an `Industry` view.
- Used official ONS ASHE 2025 Table 4 data for SIC2007 section-level industry groups.
- Reused the same chart and insight card pattern to avoid UI sprawl.

### Phase 4

- Added a `Region` view using official ONS ASHE 2025 Table 15 workplace region data.
- Added a `Sector` view using official ONS ASHE 2025 Table 13 public/private/non-profit data.
- Added an age-band refine inside `Occupation` using official ONS ASHE 2025 Table 20 age-by-occupation data.
- Kept the visual layout stable and only adjusted the selector row to wrap cleanly on mobile.

### Phase 5

- Added optional finer job detail inside `Occupation` using official ONS ASHE 2025 Table 14 four-digit occupation data.
- Kept the existing occupation flow: major group first, then optional job detail drill-down.
- Added horizontal chart scrolling only where needed so dense detailed occupation sets remain usable on mobile.
- Kept age-band refine and 4-digit drill-down separate because this source set does not publish that combination here.

### Phase 6

- Added an `Analysis` mode switch so the app can stay in its existing earnings workflow or move into a dedicated official `Gender pay gap` mode.
- Kept the UI shape stable by reusing the current view system for `Age`, `Occupation`, `Industry`, `Region`, and `Sector`.
- Restricted gender pay gap mode to official ONS hourly pay excluding overtime only, rather than reusing annual or weekly earnings values.
- Added dedicated gender pay gap datasets, charting, and summary card for:
  - age from ONS ASHE Table 6
  - occupation from Table 2
  - industry from Table 4
  - sector from Table 13
  - region from Table 15
  - occupation age-band refine from Table 20
  - four-digit occupation drill-down from Table 14
- Used the official ONS formula: `(men's median hourly pay excluding overtime - women's median hourly pay excluding overtime) / men's median hourly pay excluding overtime`.
- Preserved mobile usability by keeping the filter stack compact and using a dedicated dumbbell-style comparison chart rather than overloading the existing percentile chart.

### Phase 7

- Added view-aware label handling for dense chart states so `Region`, `Industry`, `Sector`, and other crowded category views use curated shorter labels instead of one generic wrap rule.
- Added a more deliberate compact mobile chart mode with reduced annotation clutter and clearer swipe/tap guidance.
- Reworked special-case explanatory copy so constraints like age-band versus four-digit job detail read as intentional data-source limits rather than broken UI behavior.

### Phase 8

- Added smoother horizontal chart scrolling on both desktop and mobile containers.
- Added automatic centering so the currently selected age band or category scrolls into view instead of forcing the user to find it manually.
- Reused the same centering behavior in both the earnings chart and the gender pay gap chart for consistency.

### Phase 9

- Replaced bare four-digit occupation codes on detailed job charts with shorter recognisable job labels on the axis.
- Kept full official ONS job titles in the selector and selected badge so the UI balances readability with source fidelity.
- Applied the same detailed-job labeling strategy in both earnings and gender pay gap chart modes.

### Phase 10

- Updated the selected badge in mobile chart states so the chosen band or category always shows its median value even before the user enters their own pay.
- Kept the change in the selected state rather than adding more persistent chart clutter.

### Phase 11

- Added a production-only fresh-open path so the app forces a cache-busting reload when opened, which is especially useful for mobile web-app style launches.
- Added Vercel cache headers to keep the HTML document itself out of stale caches while leaving hashed assets to version normally.

## Data Sources

- Age view: embedded ASHE 2025 provisional age data already in the app.
- Occupation view: ONS ASHE Table 2.
- Industry view: ONS ASHE Table 4.
- Region view: ONS ASHE Table 15.
- Sector view: ONS ASHE Table 13.
- Occupation age-band refine: ONS ASHE Table 20.
- Occupation four-digit drill-down: ONS ASHE Table 14.
- Official gender pay gap mode: ONS ASHE Tables 6, 2, 4, 13, 15, 20, and 14 using hourly pay excluding overtime only.

## Generator Scripts

- `scripts/generate_occupation_data.py`
- `scripts/generate_industry_data.py`
- `scripts/generate_region_data.py`
- `scripts/generate_sector_data.py`
- `scripts/generate_age_occupation_data.py`
- `scripts/generate_occupation_detail_data.py`
- `scripts/generate_gender_gap_data.py`
- `scripts/generate_gender_gap_detail_data.py`

## Current Verification

- Build the app with `npm run build`.
- Confirm the new views render from official generated modules in `src/data/`.
- Confirm gender pay gap mode uses only hourly pay excluding overtime and shows the official UK benchmark for the current work pattern.
- Keep `.DS_Store` out of commits.

## Next Good Candidates

- Region + occupation cross-filtering.
- Region + industry cross-filtering.
- Additional cross-breakdowns only where they can be added without cluttering the current interaction model.
