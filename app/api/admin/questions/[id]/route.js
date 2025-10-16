import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin API Route: Get Question Details
 * GET /api/admin/questions/[id]
 *
 * Returns complete question data including:
 * - All question fields
 * - Latest audit information
 * - Total number of revisions
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

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get question data
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError) {
      if (questionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', questionError);
      return NextResponse.json(
        { error: 'Failed to fetch question', details: questionError.message },
        { status: 500 }
      );
    }

    // Get audit history count and latest change
    const { data: auditHistory, error: auditError, count: totalRevisions } = await supabase
      .from('question_audit')
      .select('*', { count: 'exact' })
      .eq('question_id', questionId)
      .order('changed_at', { ascending: false })
      .limit(5);

    if (auditError) {
      console.warn('Failed to fetch audit history:', auditError);
    }

    // Get the latest audit record for last modified info
    const latestAudit = auditHistory && auditHistory.length > 0 ? auditHistory[0] : null;

    // Get most recent changes (what fields were changed)
    const recentChanges = latestAudit?.field_changed ? [latestAudit.field_changed] : [];

    return NextResponse.json({
      success: true,
      data: {
        ...question,
        audit_info: {
          total_revisions: totalRevisions || 0,
          latest_change: latestAudit ? {
            changed_at: latestAudit.changed_at,
            changed_by: latestAudit.changed_by,
            change_type: latestAudit.change_type,
            field_changed: latestAudit.field_changed,
            change_notes: latestAudit.change_notes,
            version_number: latestAudit.version_number,
          } : null,
          recent_history: auditHistory || [],
        },
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
 * Admin API Route: Update Question
 * PATCH /api/admin/questions/[id]
 *
 * Updates question fields
 * Body: JSON with fields to update
 */
export async function PATCH(request, { params }) {
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

    // Parse request body
    const body = await request.json();

    // Validate that body is not empty
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Remove fields that shouldn't be updated via API
    const { id: _, created_at, ...updateFields } = body;

    // Add updated_at timestamp
    updateFields.updated_at = new Date().toISOString();

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Update question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update(updateFields)
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion,
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
 * Admin API Route: Delete Question
 * DELETE /api/admin/questions/[id]
 *
 * Soft delete or hard delete based on query parameter
 * Query: ?hard=true for permanent deletion
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Validate ID
    if (!id || isNaN(parseInt(id, 10))) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const questionId = parseInt(id, 10);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (hardDelete) {
      // Permanent deletion
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete question', details: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Question permanently deleted',
      });
    } else {
      // Soft delete (mark as deleted)
      const { data: updatedQuestion, error: updateError } = await supabase
        .from('questions')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId)
        .select()
        .single();

      if (updateError) {
        console.error('Soft delete error:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark question as deleted', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Question marked as deleted',
        data: updatedQuestion,
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
