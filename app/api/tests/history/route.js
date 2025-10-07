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

    // Get user's tests from Supabase
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (testsError) {
      console.error('Get tests error:', testsError);
      return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase for frontend
    const transformedTests = tests.map(test => ({
      id: test.id,
      userId: test.user_id,
      totalQuestions: test.total_questions,
      answeredQuestions: test.answered_questions,
      correctCount: test.correct_count,
      incorrectCount: test.incorrect_count,
      skippedCount: test.skipped_count,
      totalTime: test.total_time,
      questionTimings: test.question_timings,
      answers: test.answers,
      questions: test.questions,
      createdAt: test.created_at
    }));

    return NextResponse.json({
      success: true,
      tests: transformedTests,
    });
  } catch (error) {
    console.error('Get tests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
