/**
 * Dave's Goal Tracking Service
 * Dave (Accountant) monitors financial goals and updates progress
 */

const db = require('../server/db');
const { withCronAuth } = require('../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  // Only Maggie or automated system can trigger Dave's tracking
  if (req.user && req.user.email !== 'maggie@maggieforbesstrategies.com' && !req.headers['x-cron-secret']) {
    return res.status(403).json({
      success: false,
      error: 'This endpoint is only available to Maggie Forbes or automated systems'
    });
  }

  try {
    console.log('[Dave Goal Tracker] Starting financial goal tracking...');

    // =====================================================================
    // STEP 1: Get Dave's active goals
    // =====================================================================

    const goalsResult = await db.query(`
      SELECT g.*,
        (SELECT COUNT(*) FROM bot_actions_log WHERE goal_id = g.id) as actions_count,
        (SELECT MAX(snapshot_date) FROM bot_goal_progress WHERE goal_id = g.id) as last_progress_date
      FROM bot_financial_goals g
      WHERE g.tenant_id = $1
        AND g.status = 'active'
        AND ('dave' = ANY(g.assigned_to_bots) OR g.set_by_bot = 'dave')
        AND (g.goal_type IN ('revenue', 'cost_reduction') OR g.goal_type LIKE '%financial%')
      ORDER BY g.priority DESC, g.period_end_date ASC
    `, [tenantId]);

    const goals = goalsResult.rows || [];

    if (goals.length === 0) {
      console.log('[Dave Goal Tracker] No active financial goals found');
      return res.json({
        success: true,
        data: {
          message: 'No active financial goals to track',
          goals_tracked: 0
        }
      });
    }

    console.log(`[Dave Goal Tracker] Found ${goals.length} active financial goals`);

    // =====================================================================
    // STEP 2: Gather current financial data
    // =====================================================================

    const financialData = await gatherFinancialData(tenantId);

    // =====================================================================
    // STEP 3: Update each goal's progress
    // =====================================================================

    const updates = [];

    for (const goal of goals) {
      let currentValue = goal.current_value || 0;
      let actionDescription = '';
      let impact = 0;

      // Calculate current value based on goal type
      if (goal.goal_type === 'revenue') {
        // Sum of won deals value
        currentValue = financialData.totalRevenue;
        impact = financialData.revenueChange30d;
        actionDescription = `Tracked revenue: $${currentValue.toFixed(2)} (${impact >= 0 ? '+' : ''}$${impact.toFixed(2)} this month)`;

      } else if (goal.goal_type === 'cost_reduction') {
        // Track cost metrics (placeholder - would need actual cost tracking)
        currentValue = financialData.estimatedMonthlyCosts;
        impact = financialData.costSavings;
        actionDescription = `Monitored costs: $${currentValue.toFixed(2)} (saved $${Math.abs(impact).toFixed(2)})`;
      }

      // Update goal progress
      const updateResult = await db.query(`
        UPDATE bot_financial_goals
        SET
          current_value = $1,
          last_checked_by_bot = 'dave',
          last_action_taken = $2,
          last_updated_at = NOW(),
          updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `, [currentValue, actionDescription, goal.id, tenantId]);

      // Log action
      await db.query(`
        INSERT INTO bot_actions_log (
          goal_id, tenant_id, bot_name, action_type, action_description,
          status, impact_on_goal, triggered_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        goal.id,
        tenantId,
        'dave',
        'financial_tracking',
        actionDescription,
        'completed',
        impact,
        req.body?.triggered_by || 'automated',
        JSON.stringify({
          previous_value: goal.current_value,
          new_value: currentValue,
          financial_snapshot: financialData
        })
      ]);

      updates.push({
        goal_id: goal.id,
        goal_type: goal.goal_type,
        description: goal.description,
        previous_value: goal.current_value,
        current_value: currentValue,
        target_value: goal.target_value,
        progress_percentage: ((currentValue / goal.target_value) * 100).toFixed(2),
        action: actionDescription
      });
    }

    // =====================================================================
    // STEP 4: Generate financial insights using AI
    // =====================================================================

    const systemPrompt = `You are Dave, the Accountant for Maggie Forbes Strategies.

You track financial goals and provide insights on progress.

Analyze the goal progress data and provide:
1. Summary of financial performance
2. Goals that are on track vs. at risk
3. Recommended actions to improve performance
4. Any financial concerns or opportunities

Respond in JSON format:
{
  "summary": "Brief overview of financial health",
  "on_track": ["Goal IDs that are on track"],
  "at_risk": ["Goal IDs that need attention"],
  "recommendations": ["Action 1", "Action 2"],
  "concerns": ["Any red flags"],
  "opportunities": ["Growth opportunities spotted"]
}`;

    const userPrompt = `Here's the current progress on financial goals:

${updates.map(u => `
Goal: ${u.description}
Type: ${u.goal_type}
Target: $${u.target_value}
Current: $${u.current_value}
Progress: ${u.progress_percentage}%
`).join('\\n')}

Overall Financial Snapshot:
- Total Revenue: $${financialData.totalRevenue}
- Active Deals: ${financialData.activeDeals}
- Pipeline Value: $${financialData.pipelineValue}
- Won Deals (30d): ${financialData.wonDeals30d}
- Conversion Rate: ${financialData.conversionRate}%

Please analyze and provide insights.`;

    const atlasResponse = await queryAtlas(
      `${systemPrompt}\n\n${userPrompt}`,
      'finance',
      tenantId,
      {
        sources: ['gemini'],
        save_to_memory: true,
        calledBy: 'dave_goal_tracker'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(`Atlas query failed: ${atlasResponse.error}`);
    }

    const insights = JSON.parse(atlasResponse.answer);

    console.log('[Dave Goal Tracker] Completed tracking for', updates.length, 'goals');

    return res.json({
      success: true,
      data: {
        goals_tracked: updates.length,
        updates,
        financial_data: financialData,
        insights
      }
    });

  } catch (error) {
    console.error('[Dave Goal Tracker] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Gather current financial data
 */
async function gatherFinancialData(tenantId) {
  // Revenue metrics
  const revenueResult = await db.query(`
    SELECT
      SUM(value) FILTER (WHERE status = 'won') as total_revenue,
      SUM(value) FILTER (WHERE status = 'won' AND updated_at > NOW() - INTERVAL '30 days') as revenue_30d,
      SUM(value) FILTER (WHERE status = 'won' AND updated_at > NOW() - INTERVAL '60 days' AND updated_at <= NOW() - INTERVAL '30 days') as revenue_prev_30d,
      COUNT(*) FILTER (WHERE status = 'won' AND updated_at > NOW() - INTERVAL '30 days') as won_deals_30d,
      COUNT(*) FILTER (WHERE status IN ('proposal', 'negotiation')) as active_deals,
      SUM(value) FILTER (WHERE status IN ('proposal', 'negotiation')) as pipeline_value,
      AVG(value) FILTER (WHERE status = 'won') as avg_deal_value
    FROM deals
    WHERE tenant_id = $1
  `, [tenantId]);

  const revenue = revenueResult.rows[0];

  // Contact conversion metrics
  const contactsResult = await db.query(`
    SELECT
      COUNT(*) as total_contacts,
      COUNT(*) FILTER (WHERE stage = 'client') as clients
    FROM contacts
    WHERE tenant_id = $1
  `, [tenantId]);

  const contacts = contactsResult.rows[0];

  // Actual expense tracking (if expenses table exists)
  let actualMonthlyCosts = 0;
  let costSavings = 0;

  try {
    const expensesResult = await db.query(`
      SELECT
        SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as monthly_expenses,
        SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '60 days' AND created_at <= NOW() - INTERVAL '30 days') as prev_month_expenses
      FROM expenses
      WHERE tenant_id = $1
    `, [tenantId]);

    const expenses = expensesResult.rows[0];
    actualMonthlyCosts = parseFloat(expenses.monthly_expenses) || 0;
    const prevMonthCosts = parseFloat(expenses.prev_month_expenses) || 0;

    // Cost savings = reduction from previous month
    costSavings = Math.max(0, prevMonthCosts - actualMonthlyCosts);
  } catch (error) {
    // Expenses table might not exist, use estimate based on revenue
    console.log('[Dave] Expenses table not found, estimating costs');
    const totalRevenue = parseFloat(revenue.total_revenue) || 0;
    // Estimate operating costs as 30% of total revenue (conservative)
    actualMonthlyCosts = totalRevenue > 0 ? totalRevenue * 0.3 : 0;
  }

  // Calculate metrics
  const totalRevenue = parseFloat(revenue.total_revenue) || 0;
  const revenue30d = parseFloat(revenue.revenue_30d) || 0;
  const revenuePrev30d = parseFloat(revenue.revenue_prev_30d) || 0;
  const totalContacts = parseInt(contacts.total_contacts) || 0;
  const clients = parseInt(contacts.clients) || 0;

  return {
    totalRevenue,
    revenueChange30d: revenue30d,
    revenuePrev30d,
    revenueGrowth: revenuePrev30d > 0 ? ((revenue30d - revenuePrev30d) / revenuePrev30d * 100).toFixed(2) : 0,
    wonDeals30d: parseInt(revenue.won_deals_30d) || 0,
    activeDeals: parseInt(revenue.active_deals) || 0,
    pipelineValue: parseFloat(revenue.pipeline_value) || 0,
    avgDealValue: parseFloat(revenue.avg_deal_value) || 0,
    conversionRate: totalContacts > 0 ? ((clients / totalContacts) * 100).toFixed(2) : 0,
    estimatedMonthlyCosts: actualMonthlyCosts,
    costSavings: costSavings,
    profitMargin: revenue30d > 0 ? (((revenue30d - actualMonthlyCosts) / revenue30d) * 100).toFixed(2) : 0
  };
}

module.exports = withCronAuth(handler);
