# Geographic Mapping & Regional Targeting System

**Purpose:** State-by-state and regional mapping for attorney distribution, podcast guest targeting, and client-attorney matching.

---

## Overview

The geographic mapping system provides:

1. **State-by-State Analytics** - Track attorney coverage in all 50 US states
2. **Regional Grouping** - Northeast, Southeast, Midwest, Southwest, West
3. **Market Gap Analysis** - Identify high-value markets with insufficient coverage
4. **HNW Concentration Mapping** - Focus on states with high-net-worth populations
5. **Client-Attorney Geographic Matching** - Match clients with local attorneys
6. **Regional Podcast Targeting** - Target specific regions for podcast invitations

---

## Files Created

### Database
- **`Desktop/029_geographic_mapping.sql`** - Complete geographic mapping system
  - US states table (50 states with HNW data)
  - Canadian provinces table (13 provinces/territories)
  - 4 analytic views (by_state, by_region, high_value_markets, clients_by_state)
  - 3 SQL functions (get_attorneys_by_state, get_attorneys_by_region, get_market_gaps)

### API
- **`app/api/analytics/geography/route.ts`** - Geographic analytics API
  - `/api/analytics/geography?view=summary` - Overall summary
  - `/api/analytics/geography?view=by_state` - State breakdown
  - `/api/analytics/geography?view=by_region` - Regional breakdown
  - `/api/analytics/geography?view=market_gaps` - Gap analysis
  - `/api/analytics/geography?view=state_detail&state=CA` - State details
  - `/api/analytics/geography?view=region_detail&region=West` - Region details

### UI
- **`app/admin/geography/page.tsx`** - Geographic analytics dashboard
  - Visual summary cards
  - By Region tab
  - By State tab
  - Market Gaps tab with priority flagging

---

## US Regional Groupings

### Northeast (9 states)
**States:** CT, MA, NH, NJ, NY, PA, RI, VT, ME

**Characteristics:**
- Very high HNW concentration (CT, MA, NJ, NY)
- Mature estate planning market
- Major wealth centers: Greenwich, Boston, NYC, Hamptons
- Focus: Dynasty trusts, complex tax strategies

### Southeast (12 states)
**States:** FL, GA, NC, SC, VA, TN, AL, AR, KY, LA, MS, WV

**Characteristics:**
- Florida: Very high HNW (no state income tax, massive migration)
- Growing markets: GA (Atlanta), NC (Charlotte, Research Triangle), TN (Nashville)
- Focus: State migration, asset protection, multi-state planning

### Midwest (11 states)
**States:** IL, OH, MI, IN, WI, MN, MO, IA, KS, NE, ND, SD

**Characteristics:**
- Illinois: Very high HNW (Chicago financial center)
- Minnesota: High HNW (Minneapolis finance)
- South Dakota: Trust-friendly, no state income tax
- Focus: Business succession, agricultural estates, trusts

### Southwest (4 states)
**States:** TX, AZ, NM, OK

**Characteristics:**
- Texas: Very high HNW (no state income tax, energy wealth, tech boom)
- Arizona: High HNW (retiree wealth, Scottsdale)
- Focus: Oil/gas estates, business succession, retiree planning

### West (12 states)
**States:** CA, WA, OR, NV, ID, MT, WY, CO, UT, AK, HI

**Characteristics:**
- California: Highest HNW population (tech wealth, SF/LA/SD)
- Washington: Very high HNW (Seattle tech, no state income tax)
- Nevada, Wyoming: No state income tax, trust-friendly
- Focus: Tech wealth, international planning, asset protection

---

## HNW Concentration Ratings

### Very High (10 states)
**States:** CA, NY, FL, TX, IL, WA, NJ, MA, CT, NV, HI

**Why:** Major financial centers, tech hubs, no-tax havens, wealth migration destinations

**Characteristics:**
- Estate sizes: $10M - $100M+
- Complex estate planning needs
- Dynasty trusts, asset protection, international tax
- High attorney demand

### High (13 states)
**States:** GA, NC, VA, PA, OH, MI, MN, AZ, CO, TN, SD, WY, NH

**Why:** Business hubs, growing metro areas, trust-friendly laws, emerging wealth centers

**Characteristics:**
- Estate sizes: $5M - $50M
- Growing demand for sophisticated planning
- Multi-state practices common

### Medium (15 states)
**States:** SC, IN, WI, MO, IA, OK, UT, ID, MT, AL, KY, LA, RI, VT, ME

**Why:** Secondary markets, regional wealth pockets

### Low (12 states)
**States:** AR, MS, WV, NM, ND, AK, NE, KS, OR (lower concentration relative to population)

**Why:** Smaller populations, rural, less wealth concentration

---

## Database Schema

### 1. `us_states` Table
```sql
CREATE TABLE us_states (
    state_code VARCHAR(2) PRIMARY KEY,      -- CA, NY, TX, etc.
    state_name VARCHAR(100),                -- California, New York, Texas
    region VARCHAR(50),                     -- Northeast, Southeast, etc.
    population INTEGER,                     -- State population
    high_net_worth_concentration VARCHAR(20), -- very_high, high, medium, low
    estate_planning_market VARCHAR(20),     -- mature, growing, emerging
    notes TEXT                              -- Special characteristics
);
```

**50 states included** with HNW ratings and market analysis.

### 2. `canadian_provinces` Table
```sql
CREATE TABLE canadian_provinces (
    province_code VARCHAR(2) PRIMARY KEY,   -- ON, QC, BC, etc.
    province_name VARCHAR(100),             -- Ontario, Quebec, British Columbia
    region VARCHAR(50),                     -- Central, West, Atlantic, North
    population INTEGER,
    high_net_worth_concentration VARCHAR(20),
    estate_planning_market VARCHAR(20),
    notes TEXT
);
```

**13 provinces/territories included** for Canadian expansion.

---

## Analytic Views

### 1. `partners_by_state`
Attorney distribution by state with engagement metrics.

```sql
SELECT * FROM partners_by_state
ORDER BY attorney_count DESC;
```

**Columns:**
- `state` - State name or code
- `attorney_count` - Number of attorneys
- `podcast_engaged` - Attorneys interested/scheduled/recorded
- `practice_owners` - Practice owners count
- `multi_state_attorneys` - Multi-state practitioners
- `avg_years_experience` - Average experience
- `region` - Geographic region
- `high_net_worth_concentration` - HNW rating
- `estate_planning_market` - Market maturity

### 2. `partners_by_region`
Regional rollup of attorney coverage.

```sql
SELECT * FROM partners_by_region
ORDER BY attorney_count DESC;
```

**Columns:**
- `region` - Northeast, Southeast, etc.
- `attorney_count` - Total attorneys in region
- `podcast_engaged` - Engagement count
- `practice_owners` - Practice owner count
- `avg_years_experience` - Average experience
- `states_covered` - Array of states in region

### 3. `high_value_markets`
Identifies high-opportunity markets for attorney recruitment.

```sql
SELECT * FROM high_value_markets
WHERE market_priority = 'HIGH_OPPORTUNITY';
```

**Columns:**
- `state_code`, `state_name`, `region`
- `high_net_worth_concentration` - HNW rating
- `estate_planning_market` - Market maturity
- `attorney_count` - Current coverage
- `untapped_prospects` - Prospects not yet contacted
- `market_priority` - HIGH_OPPORTUNITY, SATURATED, MEDIUM_OPPORTUNITY, LOW_PRIORITY

**Logic:**
- **HIGH_OPPORTUNITY:** very_high/high HNW + <5 attorneys
- **SATURATED:** very_high/high HNW + ≥5 attorneys
- **MEDIUM_OPPORTUNITY:** medium HNW concentration
- **LOW_PRIORITY:** low HNW concentration

### 4. `clients_by_state`
Client inquiry distribution by state.

```sql
SELECT * FROM clients_by_state
ORDER BY client_count DESC;
```

**Columns:**
- `state` - Client's primary residence
- `client_count` - Number of clients
- `matched_clients` - Successfully matched
- `unmatched_clients` - Awaiting matches
- `avg_estate_size_millions` - Average estate size
- `region` - Geographic region
- `high_net_worth_concentration` - HNW rating

---

## SQL Functions

### 1. `get_attorneys_by_state(state_code)`
Get all attorneys licensed in a specific state.

```sql
SELECT * FROM get_attorneys_by_state('CA');
```

**Returns:**
- `partner_id`, `full_name`, `email`, `firm_name`
- `years_experience`, `specializations`, `licensed_states`
- `practice_type`
- `business_builder_score`, `expertise_score`

**Sorted by:** Total fit score (descending)

### 2. `get_attorneys_by_region(region)`
Get all attorneys in a specific region.

```sql
SELECT * FROM get_attorneys_by_region('Northeast');
```

**Returns:**
- `partner_id`, `full_name`, `email`
- `primary_state`, `all_states`, `firm_name`
- `fit_score`

**Sorted by:** Fit score (descending)

### 3. `get_market_gaps()`
Identify high-value markets with insufficient attorney coverage.

```sql
SELECT * FROM get_market_gaps();
```

**Returns:**
- `state_code`, `state_name`, `region`
- `hnw_concentration` - HNW rating
- `attorney_count` - Current coverage
- `gap_priority` - CRITICAL_GAP, HIGH_GAP, MEDIUM_GAP, ADEQUATE_COVERAGE

**Logic:**
- **CRITICAL_GAP:** very_high HNW + <5 attorneys
- **HIGH_GAP:** high HNW + <3 attorneys
- **MEDIUM_GAP:** medium HNW + <2 attorneys
- **ADEQUATE_COVERAGE:** Otherwise

---

## API Endpoints

### GET `/api/analytics/geography`

**Query Parameters:**
- `view` - Required: summary, by_state, by_region, market_gaps, high_value_markets, state_detail, region_detail
- `state` - Required for state_detail (e.g., CA, NY, TX)
- `region` - Required for region_detail (e.g., Northeast, West)

**Examples:**

#### 1. Summary (Dashboard Data)
```bash
GET /api/analytics/geography?view=summary
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_attorneys": 150,
    "regions_covered": 5,
    "states_covered": 35,
    "market_gaps": 12
  },
  "by_region": [...],
  "top_states": [...],
  "market_gaps": [...],
  "high_value_markets": [...]
}
```

#### 2. By State
```bash
GET /api/analytics/geography?view=by_state
```

Returns all states with attorney counts.

#### 3. By Region
```bash
GET /api/analytics/geography?view=by_region
```

Returns regional rollup.

#### 4. Market Gaps
```bash
GET /api/analytics/geography?view=market_gaps
```

Returns high-value markets needing more coverage.

#### 5. State Detail
```bash
GET /api/analytics/geography?view=state_detail&state=CA
```

**Response:**
```json
{
  "success": true,
  "state_info": {
    "state_code": "CA",
    "state_name": "California",
    "region": "West",
    "high_net_worth_concentration": "very_high",
    "estate_planning_market": "mature",
    "notes": "Highest HNW population..."
  },
  "stats": {
    "attorney_count": 45,
    "podcast_engaged": 12,
    "practice_owners": 30,
    "multi_state_attorneys": 18,
    "avg_years_experience": 16
  },
  "attorneys": [...]
}
```

#### 6. Region Detail
```bash
GET /api/analytics/geography?view=region_detail&region=West
```

Returns stats, states, and attorneys for a region.

---

## Admin Dashboard

### Access
Visit: **http://localhost:3000/admin/geography**

### Features

1. **Summary Cards**
   - Total attorneys
   - Regions covered
   - States with coverage
   - Market gaps identified

2. **By Region Tab**
   - Attorney count per region
   - Podcast engagement
   - Practice owners
   - Average experience

3. **By State Tab**
   - State-by-state breakdown
   - HNW concentration badges (color-coded)
   - Region grouping
   - Practice owner count
   - Multi-state attorney count

4. **Market Gaps Tab**
   - High-value markets with insufficient coverage
   - Priority flags: CRITICAL_GAP, HIGH_GAP, MEDIUM_GAP
   - Recommended actions
   - Recruitment strategy suggestions

---

## Use Cases

### 1. Identify High-Opportunity Markets
**Goal:** Find states where we should recruit more attorneys.

```sql
-- Get critical gaps (very_high HNW, <5 attorneys)
SELECT * FROM get_market_gaps()
WHERE gap_priority = 'CRITICAL_GAP';
```

**Example Results:**
- Florida (very_high HNW, 2 attorneys) → **CRITICAL_GAP**
- Texas (very_high HNW, 3 attorneys) → **CRITICAL_GAP**
- Nevada (very_high HNW, 1 attorney) → **CRITICAL_GAP**

**Action:** Prioritize recruitment in these states via LinkedIn Sales Navigator, ACTEC chapters, state bar directories.

### 2. Target Regional Podcast Outreach
**Goal:** Focus podcast invitations on a specific region.

```sql
-- Get all Northeast attorneys (high-quality prospects)
SELECT * FROM get_attorneys_by_region('Northeast')
WHERE fit_score >= 12
AND podcast_status = 'not_contacted';
```

**Use Case:** "This quarter, let's focus on building Northeast coverage."

### 3. Match Clients with Local Attorneys
**Goal:** Find attorneys in client's state.

```sql
-- Client in Texas needs dynasty trust attorney
SELECT * FROM get_attorneys_by_state('TX')
WHERE 'Dynasty Trusts' = ANY(specializations)
ORDER BY (business_builder_score + expertise_score) DESC
LIMIT 5;
```

**Integration:** Already used in `match_client_with_attorneys()` function (migration 026).

### 4. Analyze Coverage vs. Demand
**Goal:** See where clients are vs. where attorneys are.

```sql
-- Compare client locations to attorney coverage
SELECT
    c.state,
    c.client_count,
    c.unmatched_clients,
    a.attorney_count,
    CASE
        WHEN a.attorney_count = 0 THEN 'NO_COVERAGE'
        WHEN c.unmatched_clients > a.attorney_count THEN 'UNDERSUPPLIED'
        ELSE 'ADEQUATE'
    END as supply_status
FROM clients_by_state c
LEFT JOIN partners_by_state a ON c.state = a.state
ORDER BY c.client_count DESC;
```

### 5. Track Regional Growth
**Goal:** Monitor attorney recruitment progress by region over time.

```sql
-- Monthly growth by region
SELECT
    region,
    attorney_count,
    podcast_engaged,
    (podcast_engaged::FLOAT / attorney_count * 100)::INTEGER as engagement_rate
FROM partners_by_region
ORDER BY attorney_count DESC;
```

---

## Integration with Automated Outreach

### Current Integration
The geographic mapping system is **read-only analytics** right now. It provides insights but doesn't directly control outreach targeting.

### Future Enhancement: Regional Targeting
You could enhance the outreach system to target specific regions:

```typescript
// In partner-outreach-engine.ts
async enrollPartnersByRegion(region: string): Promise<void> {
  const { data: partners } = await supabase
    .rpc('get_attorneys_by_region', { p_region: region });

  for (const partner of partners || []) {
    if (partner.fit_score >= 12) {
      await this.enrollPartner(partner.partner_id);
    }
  }
}
```

**Use Case:**
- "This month, focus on Southeast region (Florida, Georgia, North Carolina)"
- "Q2 goal: Build West Coast coverage (California, Washington, Oregon)"

---

## Setup Instructions

### 1. Run SQL Migration
```bash
# In Supabase SQL Editor:
/Users/Kristi/introalignment/Desktop/029_geographic_mapping.sql
```

This creates:
- 2 tables (us_states, canadian_provinces)
- 4 views (partners_by_state, partners_by_region, high_value_markets, clients_by_state)
- 3 functions (get_attorneys_by_state, get_attorneys_by_region, get_market_gaps)
- 2 indexes (for performance)

### 2. Verify Data
```sql
-- Check states loaded
SELECT COUNT(*) FROM us_states; -- Should be 50

-- Check views work
SELECT * FROM partners_by_state LIMIT 5;
SELECT * FROM partners_by_region;

-- Test functions
SELECT * FROM get_market_gaps();
```

### 3. Access Dashboard
Visit: **http://localhost:3000/admin/geography**

---

## Sample Queries

### Top 10 States by Attorney Count
```sql
SELECT state, attorney_count, region, high_net_worth_concentration
FROM partners_by_state
ORDER BY attorney_count DESC
LIMIT 10;
```

### States Needing More Coverage
```sql
SELECT state_name, attorney_count, hnw_concentration, gap_priority
FROM get_market_gaps()
WHERE gap_priority IN ('CRITICAL_GAP', 'HIGH_GAP');
```

### Regional Summary
```sql
SELECT
    region,
    attorney_count,
    practice_owners,
    (podcast_engaged::FLOAT / attorney_count * 100)::INTEGER as engagement_pct
FROM partners_by_region
ORDER BY attorney_count DESC;
```

### Multi-State Attorneys
```sql
SELECT full_name, email, licensed_states, num_states_licensed
FROM partners
WHERE num_states_licensed >= 3
ORDER BY num_states_licensed DESC;
```

### High-Value Markets Summary
```sql
SELECT
    market_priority,
    COUNT(*) as state_count,
    AVG(attorney_count) as avg_coverage
FROM high_value_markets
GROUP BY market_priority
ORDER BY
    CASE market_priority
        WHEN 'HIGH_OPPORTUNITY' THEN 1
        WHEN 'MEDIUM_OPPORTUNITY' THEN 2
        WHEN 'SATURATED' THEN 3
        ELSE 4
    END;
```

---

## Next Steps

### 1. Targeted Recruitment
Use market gap analysis to guide LinkedIn Sales Navigator searches:
- Filter by location: Critical gap states
- Search: "Estate Planning Attorney" OR "Trust Attorney"
- Qualifiers: Practice owner, 10+ years experience

### 2. Regional Campaigns
Create region-specific podcast outreach campaigns:
- "Northeast Estate Planning Leaders Series"
- "Southeast Wealth Migration Experts"
- "West Coast Tech Wealth Strategies"

### 3. Client-Attorney Matching
Enhance automatic matching with geographic scoring:
- +20 points for same-state attorney
- +10 points for same-region attorney
- +5 points for multi-state attorney covering client's state

### 4. Market Expansion
Track Canadian provinces for future expansion:
- Ontario (Toronto) - Major financial center
- British Columbia (Vancouver) - International wealth
- Alberta (Calgary) - Energy wealth

---

## System Status: READY ✅

**Created:**
- ✅ US states table (50 states with HNW ratings)
- ✅ Canadian provinces table (13 provinces)
- ✅ 4 analytic views
- ✅ 3 SQL functions
- ✅ Geographic analytics API
- ✅ Admin dashboard with visualization

**To Activate:**
1. Run `029_geographic_mapping.sql` in Supabase
2. Visit `/admin/geography` to view analytics
3. Use market gap analysis to guide recruitment

**Zero additional coding required. Ready for data-driven recruitment.**
