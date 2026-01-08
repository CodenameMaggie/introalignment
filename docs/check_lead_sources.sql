-- Check if lead sources were inserted
SELECT
    source_name,
    source_type,
    is_active,
    scrape_frequency,
    created_at
FROM lead_sources
WHERE source_type = 'reddit'
ORDER BY created_at DESC;

-- If no results, manually insert them
-- If results show is_active = false, run this:
-- UPDATE lead_sources SET is_active = TRUE WHERE source_type = 'reddit';
