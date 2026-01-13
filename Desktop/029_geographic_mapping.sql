-- =====================================================
-- GEOGRAPHIC MAPPING SYSTEM
-- =====================================================
-- State-by-state and regional mapping for:
-- 1. Podcast guest targeting by region
-- 2. Client-attorney geographic matching
-- 3. Market analytics (which states/regions to focus on)
-- 4. Multi-state practice visualization

-- =====================================================
-- 1. CREATE US STATES & REGIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS us_states (
    state_code VARCHAR(2) PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    population INTEGER,
    high_net_worth_concentration VARCHAR(20), -- 'very_high', 'high', 'medium', 'low'
    estate_planning_market VARCHAR(20), -- 'mature', 'growing', 'emerging'
    notes TEXT
);

-- Insert US states with regional groupings
INSERT INTO us_states (state_code, state_name, region, population, high_net_worth_concentration, estate_planning_market, notes) VALUES
-- NORTHEAST (High-net-worth concentration)
('CT', 'Connecticut', 'Northeast', 3605000, 'very_high', 'mature', 'Greenwich, New Canaan - major wealth centers'),
('MA', 'Massachusetts', 'Northeast', 6981000, 'very_high', 'mature', 'Boston metro - finance, tech wealth'),
('NH', 'New Hampshire', 'Northeast', 1377000, 'high', 'mature', 'No state income tax, attracts wealthy'),
('NJ', 'New Jersey', 'Northeast', 9267000, 'very_high', 'mature', 'Proximity to NYC, major wealth corridor'),
('NY', 'New York', 'Northeast', 19835000, 'very_high', 'mature', 'NYC, Hamptons - top wealth concentration'),
('PA', 'Pennsylvania', 'Northeast', 12972000, 'high', 'mature', 'Philadelphia, Pittsburgh metros'),
('RI', 'Rhode Island', 'Northeast', 1095000, 'high', 'mature', 'Newport - historic wealth'),
('VT', 'Vermont', 'Northeast', 643000, 'medium', 'mature', NULL),
('ME', 'Maine', 'Northeast', 1362000, 'medium', 'mature', NULL),

-- SOUTHEAST (Growing wealth markets)
('FL', 'Florida', 'Southeast', 21538000, 'very_high', 'growing', 'No state income tax, massive migration, Miami/Naples/Palm Beach'),
('GA', 'Georgia', 'Southeast', 10711000, 'high', 'growing', 'Atlanta metro - business hub'),
('NC', 'North Carolina', 'Southeast', 10439000, 'high', 'growing', 'Charlotte financial center, Research Triangle'),
('SC', 'South Carolina', 'Southeast', 5149000, 'medium', 'growing', 'Charleston, Hilton Head - growing wealthy migration'),
('VA', 'Virginia', 'Southeast', 8631000, 'high', 'mature', 'DC suburbs - government wealth'),
('TN', 'Tennessee', 'Southeast', 6910000, 'high', 'growing', 'No state income tax, Nashville boom'),
('AL', 'Alabama', 'Southeast', 5024000, 'medium', 'mature', NULL),
('AR', 'Arkansas', 'Southeast', 3011000, 'low', 'mature', NULL),
('KY', 'Kentucky', 'Southeast', 4505000, 'medium', 'mature', NULL),
('LA', 'Louisiana', 'Southeast', 4657000, 'medium', 'mature', NULL),
('MS', 'Mississippi', 'Southeast', 2961000, 'low', 'mature', NULL),
('WV', 'West Virginia', 'Southeast', 1793000, 'low', 'mature', NULL),

-- MIDWEST
('IL', 'Illinois', 'Midwest', 12812000, 'very_high', 'mature', 'Chicago - major financial center'),
('OH', 'Ohio', 'Midwest', 11799000, 'high', 'mature', 'Cleveland, Columbus, Cincinnati'),
('MI', 'Michigan', 'Midwest', 10077000, 'high', 'mature', 'Detroit metro'),
('IN', 'Indiana', 'Midwest', 6785000, 'medium', 'mature', NULL),
('WI', 'Wisconsin', 'Midwest', 5893000, 'medium', 'mature', NULL),
('MN', 'Minnesota', 'Midwest', 5706000, 'high', 'mature', 'Minneapolis - finance hub'),
('MO', 'Missouri', 'Midwest', 6154000, 'medium', 'mature', NULL),
('IA', 'Iowa', 'Midwest', 3190000, 'medium', 'mature', NULL),
('KS', 'Kansas', 'Midwest', 2937000, 'medium', 'mature', NULL),
('NE', 'Nebraska', 'Midwest', 1961000, 'medium', 'mature', NULL),
('ND', 'North Dakota', 'Midwest', 779000, 'low', 'mature', NULL),
('SD', 'South Dakota', 'Midwest', 886000, 'high', 'mature', 'No state income tax, trust-friendly laws'),

-- SOUTHWEST
('TX', 'Texas', 'Southwest', 29145000, 'very_high', 'growing', 'No state income tax, Dallas/Houston/Austin booming'),
('AZ', 'Arizona', 'Southwest', 7151000, 'high', 'growing', 'Phoenix/Scottsdale - retiree wealth'),
('NM', 'New Mexico', 'Southwest', 2117000, 'low', 'emerging', NULL),
('OK', 'Oklahoma', 'Southwest', 3959000, 'medium', 'mature', NULL),

-- WEST (High-net-worth concentration)
('CA', 'California', 'West', 39538000, 'very_high', 'mature', 'Highest HNW population, tech wealth, SF/LA/SD/Silicon Valley'),
('WA', 'Washington', 'West', 7705000, 'very_high', 'growing', 'No state income tax, Seattle tech wealth'),
('OR', 'Oregon', 'West', 4237000, 'medium', 'mature', NULL),
('NV', 'Nevada', 'West', 3104000, 'very_high', 'growing', 'No state income tax, Las Vegas migration'),
('ID', 'Idaho', 'West', 1839000, 'medium', 'growing', 'Rapid wealthy migration from CA/WA'),
('MT', 'Montana', 'West', 1084000, 'medium', 'growing', 'Bozeman - wealthy migration'),
('WY', 'Wyoming', 'West', 576000, 'high', 'mature', 'No state income tax, Jackson Hole, trust-friendly'),
('CO', 'Colorado', 'West', 5773000, 'high', 'growing', 'Denver/Boulder/Aspen - growing wealth'),
('UT', 'Utah', 'West', 3271000, 'medium', 'growing', NULL),
('AK', 'Alaska', 'West', 733000, 'low', 'emerging', NULL),
('HI', 'Hawaii', 'West', 1455000, 'very_high', 'mature', 'High concentration of wealthy residents and visitors')
ON CONFLICT (state_code) DO NOTHING;

-- =====================================================
-- 2. CREATE CANADIAN PROVINCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS canadian_provinces (
    province_code VARCHAR(2) PRIMARY KEY,
    province_name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    population INTEGER,
    high_net_worth_concentration VARCHAR(20),
    estate_planning_market VARCHAR(20),
    notes TEXT
);

INSERT INTO canadian_provinces (province_code, province_name, region, population, high_net_worth_concentration, estate_planning_market, notes) VALUES
('ON', 'Ontario', 'Central', 14734000, 'very_high', 'mature', 'Toronto - major financial center'),
('QC', 'Quebec', 'Central', 8575000, 'high', 'mature', 'Montreal - second largest city'),
('BC', 'British Columbia', 'West', 5145000, 'very_high', 'mature', 'Vancouver - real estate wealth, international'),
('AB', 'Alberta', 'West', 4428000, 'high', 'mature', 'Calgary, Edmonton - oil wealth'),
('MB', 'Manitoba', 'Central', 1379000, 'medium', 'mature', NULL),
('SK', 'Saskatchewan', 'Central', 1179000, 'medium', 'mature', NULL),
('NS', 'Nova Scotia', 'Atlantic', 979000, 'medium', 'mature', NULL),
('NB', 'New Brunswick', 'Atlantic', 781000, 'low', 'mature', NULL),
('NL', 'Newfoundland and Labrador', 'Atlantic', 520000, 'low', 'mature', NULL),
('PE', 'Prince Edward Island', 'Atlantic', 159000, 'low', 'mature', NULL),
('NT', 'Northwest Territories', 'North', 45000, 'low', 'emerging', NULL),
('YT', 'Yukon', 'North', 42000, 'low', 'emerging', NULL),
('NU', 'Nunavut', 'North', 39000, 'low', 'emerging', NULL)
ON CONFLICT (province_code) DO NOTHING;

-- =====================================================
-- 3. CREATE GEOGRAPHIC ANALYTICS VIEWS
-- =====================================================

-- Partners by State (US)
CREATE OR REPLACE VIEW partners_by_state AS
SELECT
    UNNEST(p.licensed_states) as state,
    COUNT(DISTINCT p.id) as attorney_count,
    COUNT(DISTINCT CASE WHEN p.podcast_status IN ('interested', 'scheduled', 'recorded') THEN p.id END) as podcast_engaged,
    COUNT(DISTINCT CASE WHEN p.practice_owner = true THEN p.id END) as practice_owners,
    COUNT(DISTINCT CASE WHEN p.multi_state_practice = true THEN p.id END) as multi_state_attorneys,
    AVG(p.years_experience)::INTEGER as avg_years_experience,
    s.region,
    s.high_net_worth_concentration,
    s.estate_planning_market
FROM partners p
CROSS JOIN us_states s
WHERE UNNEST(p.licensed_states) = s.state_name OR UNNEST(p.licensed_states) = s.state_code
GROUP BY state, s.region, s.high_net_worth_concentration, s.estate_planning_market
ORDER BY attorney_count DESC;

-- Partners by Region
CREATE OR REPLACE VIEW partners_by_region AS
SELECT
    s.region,
    COUNT(DISTINCT p.id) as attorney_count,
    COUNT(DISTINCT CASE WHEN p.podcast_status IN ('interested', 'scheduled', 'recorded') THEN p.id END) as podcast_engaged,
    COUNT(DISTINCT CASE WHEN p.practice_owner = true THEN p.id END) as practice_owners,
    AVG(p.years_experience)::INTEGER as avg_years_experience,
    ARRAY_AGG(DISTINCT UNNEST(p.licensed_states)) as states_covered
FROM partners p
CROSS JOIN us_states s
WHERE UNNEST(p.licensed_states) = s.state_name OR UNNEST(p.licensed_states) = s.state_code
GROUP BY s.region
ORDER BY attorney_count DESC;

-- High-Value Markets (HNW concentration + attorney coverage)
CREATE OR REPLACE VIEW high_value_markets AS
SELECT
    s.state_code,
    s.state_name,
    s.region,
    s.high_net_worth_concentration,
    s.estate_planning_market,
    COUNT(DISTINCT p.id) as attorney_count,
    COUNT(DISTINCT CASE WHEN p.podcast_status = 'not_contacted' THEN p.id END) as untapped_prospects,
    CASE
        WHEN s.high_net_worth_concentration IN ('very_high', 'high') AND COUNT(DISTINCT p.id) < 5 THEN 'HIGH_OPPORTUNITY'
        WHEN s.high_net_worth_concentration IN ('very_high', 'high') AND COUNT(DISTINCT p.id) >= 5 THEN 'SATURATED'
        WHEN s.high_net_worth_concentration = 'medium' THEN 'MEDIUM_OPPORTUNITY'
        ELSE 'LOW_PRIORITY'
    END as market_priority
FROM us_states s
LEFT JOIN partners p ON s.state_name = ANY(p.licensed_states) OR s.state_code = ANY(p.licensed_states)
WHERE s.high_net_worth_concentration IN ('very_high', 'high', 'medium')
GROUP BY s.state_code, s.state_name, s.region, s.high_net_worth_concentration, s.estate_planning_market
ORDER BY
    CASE s.high_net_worth_concentration
        WHEN 'very_high' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    attorney_count ASC;

-- Client Geographic Distribution
CREATE OR REPLACE VIEW clients_by_state AS
SELECT
    c.primary_residence as state,
    COUNT(*) as client_count,
    COUNT(CASE WHEN c.match_status = 'matched' THEN 1 END) as matched_clients,
    COUNT(CASE WHEN c.match_status = 'pending' THEN 1 END) as unmatched_clients,
    AVG(
        CASE c.estate_size
            WHEN '100M+' THEN 100
            WHEN '50M-100M' THEN 75
            WHEN '25M-50M' THEN 37.5
            WHEN '10M-25M' THEN 17.5
            WHEN '5M-10M' THEN 7.5
            WHEN '1M-5M' THEN 3
            ELSE 0
        END
    )::INTEGER as avg_estate_size_millions,
    s.region,
    s.high_net_worth_concentration
FROM client_inquiries c
LEFT JOIN us_states s ON c.primary_residence = s.state_name OR c.primary_residence = s.state_code
GROUP BY c.primary_residence, s.region, s.high_net_worth_concentration
ORDER BY client_count DESC;

-- =====================================================
-- 4. GEOGRAPHIC MATCHING FUNCTIONS
-- =====================================================

-- Get attorneys in specific state
CREATE OR REPLACE FUNCTION get_attorneys_by_state(p_state_code VARCHAR(2))
RETURNS TABLE(
    partner_id UUID,
    full_name VARCHAR(255),
    email VARCHAR(255),
    firm_name VARCHAR(255),
    years_experience INTEGER,
    specializations TEXT[],
    licensed_states TEXT[],
    practice_type VARCHAR(100),
    business_builder_score INTEGER,
    expertise_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.email,
        p.firm_name,
        p.years_experience,
        p.specializations,
        p.licensed_states,
        p.practice_type,
        (COALESCE(p.practice_owner::int, 0) * 3 +
         COALESCE(p.multi_state_practice::int, 0) * 2 +
         COALESCE(p.content_creator::int, 0) * 2 +
         COALESCE(p.conference_speaker::int, 0) * 2 +
         COALESCE(p.actec_fellow::int, 0))::INTEGER,
        (COALESCE(p.dynasty_trust_specialist::int, 0) * 3 +
         COALESCE(p.asset_protection_specialist::int, 0) * 3 +
         COALESCE(p.international_planning::int, 0) * 2 +
         CASE WHEN p.years_experience >= 15 THEN 2 ELSE 0 END)::INTEGER
    FROM partners p
    WHERE (
        p_state_code = ANY(p.licensed_states) OR
        (SELECT state_name FROM us_states WHERE state_code = p_state_code) = ANY(p.licensed_states)
    )
    AND p.status = 'approved'
    ORDER BY
        (COALESCE(p.practice_owner::int, 0) * 3 +
         COALESCE(p.multi_state_practice::int, 0) * 2 +
         COALESCE(p.content_creator::int, 0) * 2 +
         COALESCE(p.conference_speaker::int, 0) * 2 +
         COALESCE(p.actec_fellow::int, 0) +
         COALESCE(p.dynasty_trust_specialist::int, 0) * 3 +
         COALESCE(p.asset_protection_specialist::int, 0) * 3 +
         COALESCE(p.international_planning::int, 0) * 2 +
         CASE WHEN p.years_experience >= 15 THEN 2 ELSE 0 END) DESC;
END;
$$ LANGUAGE plpgsql;

-- Get attorneys in specific region
CREATE OR REPLACE FUNCTION get_attorneys_by_region(p_region VARCHAR(50))
RETURNS TABLE(
    partner_id UUID,
    full_name VARCHAR(255),
    email VARCHAR(255),
    primary_state TEXT,
    all_states TEXT[],
    firm_name VARCHAR(255),
    fit_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.email,
        p.licensed_states[1],
        p.licensed_states,
        p.firm_name,
        (COALESCE(p.practice_owner::int, 0) * 3 +
         COALESCE(p.multi_state_practice::int, 0) * 2 +
         COALESCE(p.content_creator::int, 0) * 2 +
         COALESCE(p.conference_speaker::int, 0) * 2 +
         COALESCE(p.actec_fellow::int, 0) +
         COALESCE(p.dynasty_trust_specialist::int, 0) * 3 +
         COALESCE(p.asset_protection_specialist::int, 0) * 3 +
         COALESCE(p.international_planning::int, 0) * 2 +
         CASE WHEN p.years_experience >= 15 THEN 2 ELSE 0 END)::INTEGER
    FROM partners p
    WHERE EXISTS (
        SELECT 1
        FROM us_states s
        WHERE s.region = p_region
        AND (s.state_code = ANY(p.licensed_states) OR s.state_name = ANY(p.licensed_states))
    )
    AND p.status = 'approved'
    ORDER BY fit_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Get market gap analysis (high-value markets with few attorneys)
CREATE OR REPLACE FUNCTION get_market_gaps()
RETURNS TABLE(
    state_code VARCHAR(2),
    state_name VARCHAR(100),
    region VARCHAR(50),
    hnw_concentration VARCHAR(20),
    attorney_count BIGINT,
    gap_priority VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.state_code,
        s.state_name,
        s.region,
        s.high_net_worth_concentration,
        COUNT(DISTINCT p.id),
        CASE
            WHEN s.high_net_worth_concentration = 'very_high' AND COUNT(DISTINCT p.id) < 5 THEN 'CRITICAL_GAP'
            WHEN s.high_net_worth_concentration = 'high' AND COUNT(DISTINCT p.id) < 3 THEN 'HIGH_GAP'
            WHEN s.high_net_worth_concentration = 'medium' AND COUNT(DISTINCT p.id) < 2 THEN 'MEDIUM_GAP'
            ELSE 'ADEQUATE_COVERAGE'
        END
    FROM us_states s
    LEFT JOIN partners p ON s.state_name = ANY(p.licensed_states) OR s.state_code = ANY(p.licensed_states)
    WHERE s.high_net_worth_concentration IN ('very_high', 'high', 'medium')
    GROUP BY s.state_code, s.state_name, s.region, s.high_net_worth_concentration
    HAVING COUNT(DISTINCT p.id) < 10
    ORDER BY
        CASE s.high_net_worth_concentration
            WHEN 'very_high' THEN 1
            WHEN 'high' THEN 2
            ELSE 3
        END,
        COUNT(DISTINCT p.id) ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. SAMPLE QUERIES
-- =====================================================

-- View attorneys by state
-- SELECT * FROM partners_by_state;

-- View attorneys by region
-- SELECT * FROM partners_by_region;

-- Find high-opportunity markets
-- SELECT * FROM high_value_markets WHERE market_priority = 'HIGH_OPPORTUNITY';

-- Get attorneys in California
-- SELECT * FROM get_attorneys_by_state('CA');

-- Get attorneys in Northeast region
-- SELECT * FROM get_attorneys_by_region('Northeast');

-- Find market gaps (states needing more attorney coverage)
-- SELECT * FROM get_market_gaps();

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_partners_licensed_states_gin ON partners USING GIN (licensed_states);
CREATE INDEX IF NOT EXISTS idx_client_inquiries_primary_residence ON client_inquiries(primary_residence);

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
1. TARGET SPECIFIC REGION FOR PODCAST OUTREACH:
   SELECT * FROM get_attorneys_by_region('Southeast')
   WHERE fit_score >= 12 AND podcast_status = 'not_contacted';

2. FIND MARKET GAPS (states needing more coverage):
   SELECT * FROM get_market_gaps();

3. VIEW ATTORNEY DISTRIBUTION:
   SELECT * FROM partners_by_state ORDER BY attorney_count DESC;

4. VIEW HIGH-VALUE MARKETS:
   SELECT * FROM high_value_markets WHERE market_priority = 'HIGH_OPPORTUNITY';

5. MATCH CLIENT TO LOCAL ATTORNEYS:
   SELECT * FROM get_attorneys_by_state('TX')
   WHERE 'Dynasty Trusts' = ANY(specializations);
*/
