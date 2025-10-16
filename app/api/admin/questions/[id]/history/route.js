import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin API Route: Get Question Version History
 * GET /api/admin/questions/[id]/history
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - operation_type: Filter by operation (INSERT, UPDATE, DELETE)
 *
 * Returns:
 * - List of all changes made to the question
 * - Each change includes timestamp, user, operation type, and changed fields
 * - Complete row snapshot for each version
 */

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id, 10))) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const questionId = parseInt(id, 10);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;
    const operation_type = searchParams.get('operation_type');

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Verify question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, external_id, subject, topic')
      .eq('id', questionId)
      .single();

    if (questionError) {
      if (questionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch question', details: questionError.message },
        { status: 500 }
      );
    }

    // Build audit history query
    let query = supabase
      .from('question_audit')
      .select('*', { count: 'exact' })
      .eq('question_id', questionId)
      .order('changed_at', { ascending: false });

    // Filter by change type if specified
    if (operation_type && ['create', 'update', 'delete', 'validate', 'enrich'].includes(operation_type.toLowerCase())) {
      query = query.eq('change_type', operation_type.toLowerCase());
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: history, error: historyError, count } = await query;

    if (historyError) {
      console.error('History fetch error:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch version history', details: historyError.message },
        { status: 500 }
      );
    }

    // Add version numbers (most recent = version 1)
    const versionsWithNumbers = (history || []).map((record, index) => ({
      ...record,
      version_number: offset + index + 1,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get change statistics
    const { data: changeStats } = await supabase
      .from('question_audit')
      .select('change_type')
      .eq('question_id', questionId);

    const stats = {
      total_changes: count || 0,
      creates: (changeStats || []).filter(c => c.change_type === 'create').length,
      updates: (changeStats || []).filter(c => c.change_type === 'update').length,
      deletes: (changeStats || []).filter(c => c.change_type === 'delete').length,
      validates: (changeStats || []).filter(c => c.change_type === 'validate').length,
      enriches: (changeStats || []).filter(c => c.change_type === 'enrich').length,
    };

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        external_id: question.external_id,
        subject: question.subject,
        topic: question.topic,
      },
      data: versionsWithNumbers,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      statistics: stats,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
