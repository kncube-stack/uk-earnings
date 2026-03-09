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

## Data Sources

- Age view: embedded ASHE 2025 provisional age data already in the app.
- Occupation view: ONS ASHE Table 2.
- Industry view: ONS ASHE Table 4.
- Region view: ONS ASHE Table 15.
- Sector view: ONS ASHE Table 13.
- Occupation age-band refine: ONS ASHE Table 20.

## Generator Scripts

- `scripts/generate_occupation_data.py`
- `scripts/generate_industry_data.py`
- `scripts/generate_region_data.py`
- `scripts/generate_sector_data.py`
- `scripts/generate_age_occupation_data.py`

## Current Verification

- Build the app with `npm run build`.
- Confirm the new views render from official generated modules in `src/data/`.
- Keep `.DS_Store` out of commits.

## Next Good Candidates

- Region + occupation cross-filtering.
- Region + industry cross-filtering.
- Finer occupation detail where ONS suppression does not harm usability.
