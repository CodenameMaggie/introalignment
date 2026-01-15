-- Add slug field to partners table for profile URLs

-- Add slug column
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug);

-- Function to generate slug from full_name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9 ]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing partners with generated slugs
UPDATE partners
SET slug = generate_slug(full_name)
WHERE slug IS NULL;

-- Handle duplicate slugs by appending ID
UPDATE partners p1
SET slug = generate_slug(p1.full_name) || '-' || substring(p1.id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM partners p2
  WHERE p2.slug = p1.slug
  AND p2.id != p1.id
);

COMMENT ON COLUMN partners.slug IS 'URL-friendly identifier for attorney profile pages';
