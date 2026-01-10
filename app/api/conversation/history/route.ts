import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!conversation) {
      return NextResponse.json({
        messages: [],
        conversationId: null
      });
    }

    // Get all messages
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('id, role, content, question_number, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages || []
    });

  } catch (error: any) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
