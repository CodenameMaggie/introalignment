/**
 * Bot Health Tracking Utilities
 * Handles health metric updates for all bots
 */

export async function updateBotHealth(botName: string, supabase: any) {
  // First, get current health
  const { data: current } = await supabase
    .from('ai_bot_health')
    .select('actions_today, actions_this_hour')
    .eq('bot_name', botName)
    .single();

  // Increment counts
  const actionsToday = (current?.actions_today || 0) + 1;
  const actionsThisHour = (current?.actions_this_hour || 0) + 1;

  // Update or insert
  await supabase
    .from('ai_bot_health')
    .upsert({
      bot_name: botName,
      status: 'healthy',
      last_active: new Date().toISOString(),
      actions_today: actionsToday,
      actions_this_hour: actionsThisHour,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'bot_name'
    });

  return { actionsToday, actionsThisHour };
}

export async function logBotAction(
  botName: string,
  actionType: string,
  actionData: any,
  supabase: any
) {
  await supabase
    .from('ai_action_log')
    .insert({
      bot_name: botName,
      action_type: actionType,
      action_data: actionData,
      status: 'executed',
      executed_at: new Date().toISOString()
    });
}
