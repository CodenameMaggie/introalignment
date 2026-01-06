/**
 * Henry's Goal-Setting Service
 * Henry (Chief of Staff) analyzes business performance and sets strategic financial goals
 */

const db = require('../server/db');
const { withCronAuth } = require('../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  // Only Maggie can trigger Henry's goal setting
  if (req.user && req.user.email !== 'maggie@maggieforbesstrategies.com') {
    return res.status(403).json({
      success: false,
      error: 'This endpoint is only available to Maggie Forbes'
    });
  }

  try {
    console.log('[Henry Goal Setter] Starting goal analysis...');

    // =====================================================================
    // STEP 1: Gather business intelligence
    // =====================================================================

    console.log('[Henry Goal Setter] Step 1: Gathering business intelligence...');
    const businessData = await gatherBusinessIntelligence(tenantId);
    console.log('[Henry Goal Setter] Business data gathered:', JSON.stringify(businessData).substring(0, 200));

    // =====================================================================
    // STEP 2: Use AI to analyze and recommend goals
    // =====================================================================

    const systemPrompt = `You are Henry, the Chief of Staff for Maggie Forbes Strategies.

Your role is to analyze business performance data and set strategic financial goals for the team.

You work with:
- **Dave** (Accountant) - Tracks financial metrics and ensures goals are financially sound
- **Dan** (Marketing) - Generates leads and drives revenue through marketing

Based on the business data provided, you must:

1. Analyze current performance trends
2. Identify opportunities for growth
3. Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
4. Assign goals to the appropriate bot(s)
5. Define success criteria and strategies

Goal types you can set:
- **revenue**: Revenue generation targets
- **leads**: Lead generation targets
- **conversions**: Conversion rate improvements
- **cost_reduction**: Cost optimization targets
- **social_engagement**: Social media engagement targets

Periods available:
- **monthly**: 30-day goals
- **quarterly**: 90-day goals

Respond ONLY with valid JSON in this exact format:
{
  "goals": [
    {
      "goal_type": "revenue|leads|conversions|cost_reduction|social_engagement",
      "target_value": number,
      "period": "monthly|quarterly",
      "priority": "low|medium|high|critical",
      "assigned_to_bots": ["dave", "dan"],
      "description": "Clear description of the goal",
      "strategy": {
        "approach": "How we'll achieve this",
        "tactics": ["Tactic 1", "Tactic 2"],
        "dependencies": ["What we need"]
      },
      "success_criteria": {
        "metrics": ["Metric 1", "Metric 2"],
        "milestones": ["Milestone 1", "Milestone 2"]
      }
    }
  ],
  "analysis": "Your overall business analysis and reasoning"
}`;

    const userPrompt = `Here is our current business performance data:

**Revenue Metrics:**
- Current MRR: $${businessData.currentMRR}
- MRR Growth (30d): ${businessData.mrrGrowth}%
- Total Deals (Active): ${businessData.activeDeals}
- Avg Deal Value: $${businessData.avgDealValue}

**Lead Generation:**
- Total Contacts: ${businessData.totalContacts}
- New Contacts (30d): ${businessData.newContacts30d}
- Conversion Rate: ${businessData.conversionRate}%
- Pipeline Value: $${businessData.pipelineValue}

**Social Media (Last 30 days):**
- Posts Published: ${businessData.socialPosts}
- Engagement Rate: ${businessData.socialEngagement}%

**Current Active Goals:**
${businessData.activeGoals.map(g => `- ${g.goal_type}: $${g.target_value} (${g.achievement_percentage}% achieved)`).join('\\n')}

**Recommendations Needed:**
1. Set 2-3 quarterly goals for the next 90 days
2. Set 1-2 monthly goals for immediate focus
3. Ensure goals are ambitious but achievable based on current trends
4. Assign Dave to financial goals and Dan to lead/marketing goals
5. Consider current market conditions and business capacity

Please analyze this data and set strategic goals for our team.`;

    console.log('[Henry Goal Setter] Requesting AI analysis...');

    const atlasResponse = await queryAtlas(
      `${systemPrompt}\n\n${userPrompt}`,
      'organization',
      tenantId,
      {
        sources: ['gemini'],
        save_to_memory: true,
        calledBy: 'henry_goal_setter'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(`Atlas query failed: ${atlasResponse.error}`);
    }

    // Extract JSON from response (may have markdown code blocks)
    let responseText = atlasResponse.answer.trim();
    console.log('[Henry Goal Setter] AI response:', responseText.substring(0, 200));

    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // Extract just the JSON object
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Henry Goal Setter] Could not find JSON in response:', responseText.substring(0, 200));
      throw new Error('Invalid JSON response from Atlas');
    }

    // Parse AI response
    const aiResponse = JSON.parse(jsonMatch[0]);

    // =====================================================================
    // STEP 3: Create goals in database
    // =====================================================================

    const createdGoals = [];
    const today = new Date();

    for (const goalData of aiResponse.goals) {
      const periodDays = goalData.period === 'quarterly' ? 90 : 30;
      const periodEndDate = new Date(today);
      periodEndDate.setDate(periodEndDate.getDate() + periodDays);

      const result = await db.query(`
        INSERT INTO bot_financial_goals (
          tenant_id, goal_type, target_value, period,
          period_start_date, period_end_date, set_by_bot,
          assigned_to_bots, description, priority,
          success_criteria, strategy, kpis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        tenantId,
        goalData.goal_type,
        goalData.target_value,
        goalData.period,
        today.toISOString().split('T')[0],
        periodEndDate.toISOString().split('T')[0],
        'henry',
        goalData.assigned_to_bots,
        goalData.description,
        goalData.priority,
        JSON.stringify(goalData.success_criteria),
        JSON.stringify(goalData.strategy),
        JSON.stringify({ metrics: goalData.success_criteria?.metrics || [] })
      ]);

      const createdGoal = (result.rows || result.data)?.[0];
      if (!createdGoal) {
        throw new Error('Failed to create goal - no data returned');
      }
      createdGoals.push(createdGoal);

      // Log coordination for multi-bot goals
      if (goalData.assigned_to_bots.length > 1) {
        await db.query(`
          INSERT INTO bot_coordination_log (
            tenant_id, goal_id, event_type, from_bot, to_bot, message, data_shared
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          tenantId,
          createdGoal.id,
          'collaboration',
          'henry',
          goalData.assigned_to_bots[1],
          `Henry has assigned us a shared goal: ${goalData.description}`,
          JSON.stringify({ strategy: goalData.strategy })
        ]);
      }

      // Log action
      await db.query(`
        INSERT INTO bot_actions_log (
          goal_id, tenant_id, bot_name, action_type, action_description,
          status, triggered_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        createdGoal.id,
        tenantId,
        'henry',
        'goal_creation',
        `Set ${goalData.period} ${goalData.goal_type} goal: $${goalData.target_value}`,
        'completed',
        req.body.triggered_by || 'manual',
        JSON.stringify({ analysis: aiResponse.analysis })
      ]);
    }

    console.log(`[Henry Goal Setter] Created ${createdGoals.length} goals`);

    return res.json({
      success: true,
      data: {
        goals: createdGoals,
        analysis: aiResponse.analysis,
        business_data: businessData
      }
    });

  } catch (error) {
    console.error('[Henry Goal Setter] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Gather business intelligence from database
 */
async function gatherBusinessIntelligence(tenantId) {
  console.log('[Henry Intelligence] Fetching revenue metrics...');
  // Get revenue metrics
  const revenueResult = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'won') as won_deals,
      SUM(value) FILTER (WHERE status = 'won') as total_revenue,
      AVG(value) FILTER (WHERE status = 'won') as avg_deal_value,
      COUNT(*) FILTER (WHERE status IN ('proposal', 'negotiation')) as active_deals,
      SUM(value) FILTER (WHERE status IN ('proposal', 'negotiation')) as pipeline_value
    FROM deals
    WHERE tenant_id = $1
  `, [tenantId]);

  console.log('[Henry Intelligence] Revenue result:', JSON.stringify(revenueResult).substring(0, 300));

  // Handle both PostgreSQL pool (.rows) and Supabase client (.data) responses
  const revenue = (revenueResult.rows || revenueResult.data)?.[0] || {
    won_deals: 0,
    total_revenue: 0,
    avg_deal_value: 0,
    active_deals: 0,
    pipeline_value: 0
  };

  console.log('[Henry Intelligence] Revenue data:', JSON.stringify(revenue));

  console.log('[Henry Intelligence] Fetching contact metrics...');
  // Get contact/lead metrics
  const contactsResult = await db.query(`
    SELECT
      COUNT(*) as total_contacts,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_contacts_30d,
      COUNT(*) FILTER (WHERE stage = 'client') as clients
    FROM contacts
    WHERE tenant_id = $1
  `, [tenantId]);

  console.log('[Henry Intelligence] Contacts result:', JSON.stringify(contactsResult).substring(0, 300));

  const contacts = (contactsResult.rows || contactsResult.data)?.[0] || {
    total_contacts: 0,
    new_contacts_30d: 0,
    clients: 0
  };

  console.log('[Henry Intelligence] Contacts data:', JSON.stringify(contacts));

  console.log('[Henry Intelligence] Fetching social metrics...');
  // Get social media metrics
  const socialResult = await db.query(`
    SELECT
      COUNT(*) as posts_30d,
      COUNT(*) FILTER (WHERE status = 'published') as published_posts
    FROM social_posts
    WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
  `, [tenantId]);

  console.log('[Henry Intelligence] Social result:', JSON.stringify(socialResult).substring(0, 300));

  const social = (socialResult.rows || socialResult.data)?.[0] || {
    posts_30d: 0,
    published_posts: 0
  };

  console.log('[Henry Intelligence] Social data:', JSON.stringify(social));

  console.log('[Henry Intelligence] Fetching active goals...');
  // Get active goals
  const goalsResult = await db.query(`
    SELECT goal_type, target_value, current_value, achievement_percentage
    FROM bot_financial_goals
    WHERE tenant_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 5
  `, [tenantId]);

  console.log('[Henry Intelligence] Goals result:', JSON.stringify(goalsResult).substring(0, 300));

  // Calculate metrics
  const totalRevenue = parseFloat(revenue.total_revenue) || 0;
  const wonDeals = parseInt(revenue.won_deals) || 0;
  const totalContacts = parseInt(contacts.total_contacts) || 0;
  const clients = parseInt(contacts.clients) || 0;

  const currentMRR = (totalRevenue / 12).toFixed(2); // Rough MRR estimate
  const mrrGrowth = 5.0; // Placeholder - would need historical data
  const conversionRate = totalContacts > 0 ? ((clients / totalContacts) * 100).toFixed(2) : 0;

  return {
    currentMRR,
    mrrGrowth,
    totalRevenue,
    activeDeals: parseInt(revenue.active_deals) || 0,
    avgDealValue: parseFloat(revenue.avg_deal_value) || 0,
    pipelineValue: parseFloat(revenue.pipeline_value) || 0,
    totalContacts,
    newContacts30d: parseInt(contacts.new_contacts_30d) || 0,
    clients,
    conversionRate,
    socialPosts: parseInt(social.posts_30d) || 0,
    socialEngagement: 3.5, // Placeholder - would need actual engagement data
    activeGoals: (goalsResult.rows || goalsResult.data || [])
  };
}

module.exports = withCronAuth(handler);
