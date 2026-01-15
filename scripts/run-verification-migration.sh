#!/bin/bash
# Run attorney_verifications table migration on Supabase

echo "🔒 Creating attorney_verifications table for audit trail..."
echo ""
echo "This table is CRITICAL for legal compliance:"
echo "  - Every attorney must be verified by Jordan + Atlas"
echo "  - No outreach without verification record"
echo "  - Full audit trail of all checks"
echo ""

# Run the migration
psql $DATABASE_URL -f supabase/migrations/create_attorney_verifications.sql

if [ $? -eq 0 ]; then
  echo "✅ attorney_verifications table created successfully!"
  echo ""
  echo "Verification system is now active. All outreach will be verified."
else
  echo "❌ Migration failed. Check DATABASE_URL and try again."
  exit 1
fi
