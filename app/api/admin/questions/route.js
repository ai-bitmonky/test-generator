import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin API Route: List Questions
 * GET /api/admin/questions
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - subject: Filter by subject (Mathematics, Physics, Chemistry)
 * - topic: Filter by topic
 * - sub_topic: Filter by sub-topic
 * - difficulty: Filter by difficulty (Easy, Medium, Hard)
 * - question_type: Filter by type (MCQ, Numerical, etc.)
 * - sort_by: Sort field (created_at, updated_at, external_id, difficulty)
 * - sort_order: asc or desc (default: desc)
 * - search: Search in question_html and solution_html
 */

export async function GET(request) {
  try {
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // Filter parameters
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const sub_topic = searchParams.get('sub_topic');
    const difficulty = searchParams.get('difficulty');
    const question_type = searchParams.get('question_type');
    const search = searchParams.get('search');

    // Sort parameters
    const sort_by = searchParams.get('sort_by') || 'updated_at';
    const sort_order = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' });

    // Apply filters
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (topic) {
      query = query.eq('topic', topic);
    }
    if (sub_topic) {
      query = query.eq('sub_topic', sub_topic);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (question_type) {
      query = query.eq('question_type', question_type);
    }

    // Apply search (full-text search on question_html and solution_html)
    if (search) {
      query = query.or(`question_html.ilike.%${search}%,solution_html.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'external_id', 'difficulty', 'subject', 'topic'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'updated_at';
    const ascending = sort_order === 'asc';

    query = query.order(sortField, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: questions, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions', details: error.message },
        { status: 500 }
      );
    }

    // Get unique filter values for dropdowns (optional, can be cached)
    const { data: subjects } = await supabase
      .from('questions')
      .select('subject')
      .not('subject', 'is', null);

    const { data: topics } = await supabase
      .from('questions')
      .select('topic')
      .not('topic', 'is', null);

    const uniqueSubjects = [...new Set((subjects || []).map(s => s.subject))].sort();
    const uniqueTopics = [...new Set((topics || []).map(t => t.topic))].sort();

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        subjects: uniqueSubjects,
        topics: uniqueTopics,
        difficulties: ['Easy', 'Medium', 'Hard'],
        questionTypes: ['MCQ', 'Numerical', 'Integer', 'True/False'],
      },
      appliedFilters: {
        subject,
        topic,
        sub_topic,
        difficulty,
        question_type,
        search,
        sort_by: sortField,
        sort_order,
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Admin API Route: Get Statistics
 * Example usage: GET /api/admin/questions?stats=true
 */
export async function HEAD(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get counts by subject
    const { data: subjectCounts, error: subjectError } = await supabase
      .rpc('count_questions_by_subject');

    // Get counts by difficulty
    const { data: difficultyCounts, error: difficultyError } = await supabase
      .rpc('count_questions_by_difficulty');

    // Get recent changes count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentChanges } = await supabase
      .from('questions_audit')
      .select('*', { count: 'exact', head: true })
      .gte('changed_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      success: true,
      statistics: {
        by_subject: subjectCounts || [],
        by_difficulty: difficultyCounts || [],
        recent_changes_7d: recentChanges || 0,
      },
    });

  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error.message },
      { status: 500 }
    );
  }
}
