import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with the user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get excluded questions (solved, flagged, replaced)
    const { data: history, error: historyError } = await supabase
      .from('question_history')
      .select('question_id, status')
      .eq('user_id', user.id);

    if (historyError) {
      console.error('History error:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    // Categorize questions
    const excludedQuestions = new Set();
    const allowedQuestions = new Set();

    history.forEach(record => {
      if (record.status === 'solved' || record.status === 'flagged' || record.status === 'replaced') {
        excludedQuestions.add(record.question_id);
      } else if (record.status === 'incorrect' || record.status === 'skipped') {
        allowedQuestions.add(record.question_id);
      }
    });

    return NextResponse.json({
      success: true,
      excludedQuestions: Array.from(excludedQuestions),
      allowedQuestions: Array.from(allowedQuestions)
    });
  } catch (error) {
    console.error('Get question history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with the user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { questionId, status, testId } = await request.json();

    if (!questionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert question history record
    const { error: insertError } = await supabase
      .from('question_history')
      .insert({
        user_id: user.id,
        question_id: questionId,
        status: status,
        test_id: testId || null
      });

    if (insertError) {
      console.error('Insert history error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Save question history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
