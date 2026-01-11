-- =====================================================
-- LEGAL DOCUMENTATION SYSTEM
-- Trust, Estate Planning & C-Corp Legal Resources
-- =====================================================

-- Create legal_documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source Information
  source_id UUID REFERENCES lead_sources(id),
  source_type TEXT NOT NULL, -- 'irs', 'legal_caselaw', 'sec_edgar', 'state_business', 'legal_knowledge'
  source_url TEXT NOT NULL,
  source TEXT,

  -- Document Information
  document_type TEXT NOT NULL, -- 'form', 'instruction', 'publication', 'case', 'filing', 'guide', 'definition'
  title TEXT NOT NULL,
  content TEXT,
  keywords TEXT[],

  -- IRS-specific fields
  form_number TEXT,
  publication_number TEXT,
  year TEXT,

  -- Case Law fields
  citation TEXT,
  court TEXT,
  decision_date TEXT,
  jurisdiction TEXT,

  -- SEC EDGAR fields
  company_name TEXT,
  cik TEXT,
  filing_type TEXT,
  filing_date TEXT,
  accession_number TEXT,

  -- State Business fields
  entity_name TEXT,
  entity_number TEXT,
  state TEXT,
  entity_type TEXT,
  registered_agent TEXT,

  -- Legal Knowledge fields
  topic TEXT,
  last_updated TEXT,

  -- Status
  status TEXT DEFAULT 'new',

  -- Indexes
  CONSTRAINT unique_legal_doc_url UNIQUE(source_url)
);

-- Create indexes for performance
CREATE INDEX idx_legal_docs_source_type ON legal_documents(source_type);
CREATE INDEX idx_legal_docs_document_type ON legal_documents(document_type);
CREATE INDEX idx_legal_docs_form_number ON legal_documents(form_number) WHERE form_number IS NOT NULL;
CREATE INDEX idx_legal_docs_cik ON legal_documents(cik) WHERE cik IS NOT NULL;
CREATE INDEX idx_legal_docs_state ON legal_documents(state) WHERE state IS NOT NULL;
CREATE INDEX idx_legal_docs_jurisdiction ON legal_documents(jurisdiction) WHERE jurisdiction IS NOT NULL;
CREATE INDEX idx_legal_docs_keywords ON legal_documents USING GIN(keywords);
CREATE INDEX idx_legal_docs_created_at ON legal_documents(created_at DESC);

-- =====================================================
-- ADD LEGAL DATA SOURCES
-- =====================================================

-- IRS Sources (Tax Forms & Guidance)
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES

('irs', 'IRS - Trust & Estate Forms', 'https://www.irs.gov/forms-pubs', '{
  "form_types": ["1041", "706", "709", "1041-A", "1041-ES", "8855"],
  "topics": ["trusts", "estates", "fiduciary tax"],
  "keywords": ["trust", "estate", "fiduciary", "inheritance", "beneficiary"],
  "publications": ["559", "542", "950"]
}'::jsonb, 'weekly', true),

('irs', 'IRS - C-Corporation Tax', 'https://www.irs.gov/forms-pubs', '{
  "form_types": ["1120", "1120S", "SS-4", "2553", "8832"],
  "topics": ["c-corp", "corporate tax", "tax exemption"],
  "keywords": ["corporation", "c-corp", "corporate", "tax exempt", "501c"],
  "publications": ["542", "334", "535"]
}'::jsonb, 'weekly', true),

('irs', 'IRS - Asset Protection & Tax Planning', 'https://www.irs.gov/forms-pubs', '{
  "form_types": ["8283", "8886", "8918"],
  "topics": ["asset protection", "tax planning", "charitable trusts"],
  "keywords": ["asset protection", "tax planning", "charitable", "donation"],
  "publications": ["526", "551"]
}'::jsonb, 'weekly', true);

-- Legal Case Law Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES

('legal_caselaw', 'Justia - Trust Law Cases', 'https://law.justia.com', '{
  "sources": ["justia"],
  "topics": ["trust law", "estate planning", "fiduciary duty"],
  "keywords": ["trust", "estate", "fiduciary", "trustee", "beneficiary"],
  "jurisdictions": ["federal", "supreme-court"],
  "max_results_per_topic": 50
}'::jsonb, 'weekly', true),

('legal_caselaw', 'Cornell Law - Corporate Cases', 'https://www.law.cornell.edu', '{
  "sources": ["cornell"],
  "topics": ["corporate law", "c-corporation", "tax law"],
  "keywords": ["corporation", "corporate", "tax", "business entity"],
  "jurisdictions": ["federal"],
  "max_results_per_topic": 50
}'::jsonb, 'weekly', true),

('legal_caselaw', 'Justia & Cornell - Tax Exemption', 'https://law.justia.com', '{
  "sources": ["justia", "cornell"],
  "topics": ["tax exemption", "non-profit law", "501c3"],
  "keywords": ["tax exempt", "non-profit", "501c", "charitable"],
  "jurisdictions": ["federal", "supreme-court"],
  "max_results_per_topic": 30
}'::jsonb, 'weekly', true);

-- SEC EDGAR Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES

('sec_edgar', 'SEC - Trust Companies', 'https://www.sec.gov/edgar', '{
  "filing_types": ["10-K", "10-Q", "8-K"],
  "company_keywords": ["trust", "trust company", "fiduciary"],
  "keywords": ["trust", "fiduciary", "asset management"],
  "max_results_per_filing": 20
}'::jsonb, 'weekly', true),

('sec_edgar', 'SEC - Corporate Structures', 'https://www.sec.gov/edgar', '{
  "filing_types": ["S-1", "10-K", "DEF 14A"],
  "company_keywords": ["holding company", "corporate", "tax structure"],
  "keywords": ["corporate structure", "holding", "subsidiary", "tax"],
  "max_results_per_filing": 20
}'::jsonb, 'weekly', true);

-- State Business Filing Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES

('state_business', 'Delaware - C-Corps & LLCs', 'https://icis.corp.delaware.gov', '{
  "states": ["DE"],
  "entity_types": ["corporation", "llc", "trust"],
  "keywords": ["c-corp", "llc", "trust", "tax"],
  "search_terms": ["trust", "holding company"]
}'::jsonb, 'monthly', true),

('state_business', 'Wyoming - Asset Protection Entities', 'https://wyobiz.wyo.gov', '{
  "states": ["WY"],
  "entity_types": ["llc", "corporation", "trust"],
  "keywords": ["asset protection", "privacy", "llc"],
  "search_terms": ["asset protection", "trust"]
}'::jsonb, 'monthly', true),

('state_business', 'Nevada - Tax-Free Entities', 'https://esos.nv.gov', '{
  "states": ["NV"],
  "entity_types": ["corporation", "llc"],
  "keywords": ["tax free", "no income tax", "privacy"],
  "search_terms": ["corporation", "llc"]
}'::jsonb, 'monthly', true),

('state_business', 'Multi-State Business Formation', 'https://various', '{
  "states": ["CA", "TX", "FL", "NY"],
  "entity_types": ["corporation", "llc", "trust"],
  "keywords": ["business", "corporation", "llc", "trust"]
}'::jsonb, 'monthly', true);

-- Legal Knowledge Base Sources
INSERT INTO lead_sources (source_type, source_name, source_url, scrape_config, scrape_frequency, is_active) VALUES

('legal_knowledge', 'Cornell Wex - Trust & Estate Law', 'https://www.law.cornell.edu/wex', '{
  "sources": ["cornell_wex"],
  "topics": ["trust", "estate", "fiduciary", "probate", "will", "inheritance"],
  "keywords": ["trust", "estate", "fiduciary", "probate", "inheritance"],
  "max_results_per_topic": 20
}'::jsonb, 'monthly', true),

('legal_knowledge', 'Nolo - Business Formation', 'https://www.nolo.com', '{
  "sources": ["nolo"],
  "topics": ["c-corporation", "llc formation", "business entity", "asset protection"],
  "keywords": ["c-corp", "corporation", "llc", "business", "asset protection"],
  "max_results_per_topic": 20
}'::jsonb, 'monthly', true),

('legal_knowledge', 'FindLaw - Tax Law', 'https://www.findlaw.com', '{
  "sources": ["findlaw"],
  "topics": ["tax law", "tax planning", "tax exemption", "corporate tax"],
  "keywords": ["tax", "tax planning", "tax exempt", "deduction"],
  "max_results_per_topic": 20
}'::jsonb, 'monthly', true),

('legal_knowledge', 'Multi-Source Legal Encyclopedia', 'https://various', '{
  "sources": ["cornell_wex", "nolo", "findlaw", "legal_dictionary"],
  "topics": ["estate planning", "trust administration", "corporate formation"],
  "keywords": ["trust", "estate", "corporation", "tax", "asset protection"],
  "max_results_per_topic": 15
}'::jsonb, 'monthly', true);

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT
  'Legal documentation system created' as status,
  (SELECT COUNT(*) FROM legal_documents) as legal_docs_count,
  (SELECT COUNT(*) FROM lead_sources WHERE source_type IN ('irs', 'legal_caselaw', 'sec_edgar', 'state_business', 'legal_knowledge')) as legal_sources_count;

-- Show legal sources by type
SELECT
  source_type,
  COUNT(*) as count,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
FROM lead_sources
WHERE source_type IN ('irs', 'legal_caselaw', 'sec_edgar', 'state_business', 'legal_knowledge')
GROUP BY source_type
ORDER BY count DESC;
