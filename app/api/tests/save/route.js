import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const {
      questions,
      answers,
      questionTimings,
      totalTime,
      correctCount,
      incorrectCount,
      skippedCount
    } = await request.json();

    // Insert test record into Supabase
    const { data: test, error: insertError } = await supabase
      .from('tests')
      .insert({
        user_id: user.id,
        total_questions: questions.length,
        answered_questions: Object.keys(answers).length,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        skipped_count: skippedCount,
        total_time: Math.round(totalTime), // Convert to integer
        question_timings: questionTimings,
        answers: answers,
        questions: questions.map(q => ({
          id: q.id,
          topic: q.topic,
          difficulty: q.difficulty
        }))
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save test' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      testId: test.id,
    });
  } catch (error) {
    console.error('Save test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
