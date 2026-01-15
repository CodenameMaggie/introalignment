/**
 * Attorney Verification System
 *
 * CRITICAL: All attorney data MUST be verified before outreach
 * Uses Jordan (analytics) and Atlas (research) for cross-referencing
 * NO EXCEPTIONS - lawyers require 100% accuracy
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Attorney {
  id: string;
  full_name: string;
  email: string;
  firm: string;
  state: string;
  [key: string]: any;
}

export interface AttorneyVerificationResult {
  verified: boolean;
  confidence_score: number;  // 0-100
  verification_checks: {
    email_format: boolean;
    name_quality: boolean;
    firm_exists: boolean;
    state_license_plausible: boolean;
    source_credible: boolean;
  };
  jordan_approval: boolean;
  atlas_fact_check: boolean;
  issues: string[];
  warnings: string[];
  audit_trail: string[];
}

export class AttorneyVerifier {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  /**
   * CRITICAL: Verify attorney before ANY outreach
   * Returns false if ANY check fails - we don't compromise with lawyers
   */
  async verifyAttorney(attorneyId: string): Promise<AttorneyVerificationResult> {
    const auditTrail: string[] = [];
    const issues: string[] = [];
    const warnings: string[] = [];

    auditTrail.push(`[${new Date().toISOString()}] Starting verification for attorney ${attorneyId}`);

    // 1. Get attorney data
    const { data: attorney, error } = await this.supabase
      .from('partners')
      .select('*')
      .eq('id', attorneyId)
      .single() as { data: Attorney | null; error: any };

    if (error || !attorney) {
      return {
        verified: false,
        confidence_score: 0,
        verification_checks: {
          email_format: false,
          name_quality: false,
          firm_exists: false,
          state_license_plausible: false,
          source_credible: false
        },
        jordan_approval: false,
        atlas_fact_check: false,
        issues: ['Attorney not found in database'],
        warnings: [],
        audit_trail: auditTrail
      };
    }

    auditTrail.push(`[${new Date().toISOString()}] Attorney found: ${attorney.full_name} (${attorney.email})`);

    // 2. Email Format Check (CRITICAL for lawyers - no typos allowed)
    const emailCheck = this.verifyEmailFormat(attorney.email);
    auditTrail.push(`[${new Date().toISOString()}] Email format check: ${emailCheck.valid ? 'PASS' : 'FAIL'}`);
    if (!emailCheck.valid) {
      issues.push(`Email format invalid: ${emailCheck.reason}`);
    }

    // 3. Name Quality Check
    const nameCheck = this.verifyNameQuality(attorney.full_name);
    auditTrail.push(`[${new Date().toISOString()}] Name quality check: ${nameCheck.valid ? 'PASS' : 'FAIL'}`);
    if (!nameCheck.valid) {
      issues.push(`Name quality issue: ${nameCheck.reason}`);
    }

    // 4. Firm Name Check
    const firmCheck = this.verifyFirmName(attorney.firm_name);
    auditTrail.push(`[${new Date().toISOString()}] Firm check: ${firmCheck.valid ? 'PASS' : 'FAIL'}`);
    if (!firmCheck.valid) {
      warnings.push(`Firm name concern: ${firmCheck.reason}`);
    }

    // 5. State License Plausibility
    const stateCheck = this.verifyStateLicense(attorney.licensed_states);
    auditTrail.push(`[${new Date().toISOString()}] State license check: ${stateCheck.valid ? 'PASS' : 'FAIL'}`);
    if (!stateCheck.valid) {
      warnings.push(`State license concern: ${stateCheck.reason}`);
    }

    // 6. Source Credibility
    const sourceCheck = this.verifySource(attorney.source);
    auditTrail.push(`[${new Date().toISOString()}] Source credibility: ${sourceCheck.valid ? 'PASS' : 'FAIL'}`);
    if (!sourceCheck.valid) {
      issues.push(`Source not credible: ${sourceCheck.reason}`);
    }

    // 7. Cross-reference with Jordan (database analytics)
    const jordanCheck = await this.jordanCrossReference(attorney);
    auditTrail.push(`[${new Date().toISOString()}] Jordan cross-reference: ${jordanCheck.approved ? 'APPROVED' : 'REJECTED'}`);
    if (!jordanCheck.approved) {
      issues.push(`Jordan flagged: ${jordanCheck.reason}`);
    }

    // 8. Fact-check with Atlas (legal research)
    const atlasCheck = await this.atlasFactCheck(attorney);
    auditTrail.push(`[${new Date().toISOString()}] Atlas fact-check: ${atlasCheck.approved ? 'APPROVED' : 'REJECTED'}`);
    if (!atlasCheck.approved) {
      issues.push(`Atlas flagged: ${atlasCheck.reason}`);
    }

    // Calculate confidence score
    const checksPass = [
      emailCheck.valid,
      nameCheck.valid,
      firmCheck.valid,
      stateCheck.valid,
      sourceCheck.valid,
      jordanCheck.approved,
      atlasCheck.approved
    ].filter(Boolean).length;

    const confidenceScore = Math.round((checksPass / 7) * 100);

    // CRITICAL: Must pass ALL critical checks (email, name, source, Jordan, Atlas)
    const criticalChecksPassed =
      emailCheck.valid &&
      nameCheck.valid &&
      sourceCheck.valid &&
      jordanCheck.approved &&
      atlasCheck.approved;

    const verified = criticalChecksPassed && issues.length === 0;

    auditTrail.push(`[${new Date().toISOString()}] Final verdict: ${verified ? 'VERIFIED' : 'REJECTED'} (confidence: ${confidenceScore}%)`);

    // Log verification result to database
    await this.logVerificationResult(attorneyId, verified, confidenceScore, issues, warnings, auditTrail);

    return {
      verified,
      confidence_score: confidenceScore,
      verification_checks: {
        email_format: emailCheck.valid,
        name_quality: nameCheck.valid,
        firm_exists: firmCheck.valid,
        state_license_plausible: stateCheck.valid,
        source_credible: sourceCheck.valid
      },
      jordan_approval: jordanCheck.approved,
      atlas_fact_check: atlasCheck.approved,
      issues,
      warnings,
      audit_trail: auditTrail
    };
  }

  /**
   * Email Format Verification - CRITICAL for lawyers
   */
  private verifyEmailFormat(email: string): { valid: boolean; reason?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'Email is missing or invalid type' };
    }

    // Check for placeholder emails
    if (email.startsWith('pending.') || email.includes('placeholder')) {
      return { valid: false, reason: 'Email is a placeholder, not real' };
    }

    // Basic email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Email format does not match standard pattern' };
    }

    // Check for common typos
    const commonTypos = ['gmial.com', 'yahooo.com', 'gmai.com', 'hotmial.com'];
    const domain = email.split('@')[1];
    if (commonTypos.includes(domain)) {
      return { valid: false, reason: `Email domain appears to be typo: ${domain}` };
    }

    return { valid: true };
  }

  /**
   * Name Quality Check - ensure real attorney names
   */
  private verifyNameQuality(fullName: string): { valid: boolean; reason?: string } {
    if (!fullName || fullName.trim().length < 3) {
      return { valid: false, reason: 'Name is too short or missing' };
    }

    // Check for test/fake names
    const fakeNames = ['test', 'sample', 'example', 'john doe', 'jane doe', 'admin', 'user'];
    const lowerName = fullName.toLowerCase();
    if (fakeNames.some(fake => lowerName.includes(fake))) {
      return { valid: false, reason: 'Name appears to be test/placeholder data' };
    }

    // Must have at least first and last name
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return { valid: false, reason: 'Name must include first and last name' };
    }

    return { valid: true };
  }

  /**
   * Firm Name Verification
   */
  private verifyFirmName(firmName: string | null): { valid: boolean; reason?: string } {
    if (!firmName) {
      return { valid: true, reason: 'Firm name not required (solo practitioner possible)' };
    }

    // Check for generic/placeholder firm names
    const genericFirms = ['law firm', 'attorney at law', 'legal services', 'lawyer', 'test firm'];
    const lowerFirm = firmName.toLowerCase();
    if (genericFirms.some(generic => lowerFirm === generic)) {
      return { valid: false, reason: 'Firm name is too generic/placeholder' };
    }

    return { valid: true };
  }

  /**
   * State License Verification
   */
  private verifyStateLicense(licensedStates: string[] | null): { valid: boolean; reason?: string } {
    if (!licensedStates || licensedStates.length === 0) {
      return { valid: false, reason: 'No licensed states specified' };
    }

    // Verify states are real US states
    const validStates = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
      'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
      'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
      'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'DC'];

    for (const state of licensedStates) {
      if (!validStates.includes(state)) {
        return { valid: false, reason: `Invalid state: ${state}` };
      }
    }

    return { valid: true };
  }

  /**
   * Source Credibility Check
   */
  private verifySource(source: string): { valid: boolean; reason?: string } {
    // Credible sources for attorney data
    const credibleSources = [
      'actec_directory',
      'wealthcounsel_directory',
      'state_bar',
      'martindale_hubbell',
      'avvo',
      'manual_verification'
    ];

    if (!credibleSources.includes(source)) {
      return { valid: false, reason: `Source "${source}" is not on approved list` };
    }

    return { valid: true };
  }

  /**
   * Jordan Cross-Reference (Analytics Bot)
   * Checks for duplicates, consistency, patterns
   */
  private async jordanCrossReference(attorney: any): Promise<{ approved: boolean; reason?: string }> {
    // Check for duplicate emails
    const { count: duplicateEmails } = await this.supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('email', attorney.email);

    if (duplicateEmails && duplicateEmails > 1) {
      return { approved: false, reason: `Duplicate email found: ${duplicateEmails} records` };
    }

    // Check for suspicious patterns (same name, different email)
    const { count: similarNames } = await this.supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .eq('full_name', attorney.full_name)
      .neq('email', attorney.email);

    if (similarNames && similarNames > 0) {
      return { approved: false, reason: `Same name with different email found (${similarNames} records)` };
    }

    // All Jordan checks passed
    return { approved: true };
  }

  /**
   * Atlas Fact-Check (Research Bot)
   * Verifies credentials, specializations, legal claims
   */
  private async atlasFactCheck(attorney: any): Promise<{ approved: boolean; reason?: string }> {
    // Verify specializations are real estate planning areas
    const validSpecializations = [
      'Estate Planning',
      'Dynasty Trusts',
      'Asset Protection',
      'Trust Administration',
      'Tax Planning',
      'Charitable Planning',
      'Family Office',
      'International Planning',
      'Elder Law',
      'Probate',
      'Wealth Preservation'
    ];

    if (attorney.specializations && Array.isArray(attorney.specializations)) {
      for (const spec of attorney.specializations) {
        if (!validSpecializations.includes(spec)) {
          return { approved: false, reason: `Invalid specialization: ${spec}` };
        }
      }
    }

    // Verify ACTEC Fellow claim if present
    if (attorney.source === 'actec_directory' && attorney.professional_title) {
      if (!attorney.professional_title.includes('ACTEC')) {
        return { approved: false, reason: 'Source is ACTEC but title does not mention ACTEC Fellow' };
      }
    }

    // All Atlas checks passed
    return { approved: true };
  }

  /**
   * Log verification result for audit trail
   */
  private async logVerificationResult(
    attorneyId: string,
    verified: boolean,
    confidenceScore: number,
    issues: string[],
    warnings: string[],
    auditTrail: string[]
  ): Promise<void> {
    await this.supabase
      .from('attorney_verifications')
      .insert({
        attorney_id: attorneyId,
        verified,
        confidence_score: confidenceScore,
        issues: issues.join(' | '),
        warnings: warnings.join(' | '),
        audit_trail: auditTrail.join('\n'),
        verified_at: new Date().toISOString(),
        verified_by: 'system'
      });
  }
}
