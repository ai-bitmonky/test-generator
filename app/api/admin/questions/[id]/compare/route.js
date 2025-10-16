import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin API Route: Compare Question Versions
 * GET /api/admin/questions/[id]/compare
 *
 * Query Parameters:
 * - version1: Audit ID of first version (required)
 * - version2: Audit ID of second version (required)
 * or
 * - v1_index: Version index (1 = most recent) for first version
 * - v2_index: Version index for second version
 *
 * Returns:
 * - Side-by-side comparison of two versions
 * - List of changed fields with before/after values
 * - Metadata about each version (timestamp, user, etc.)
 */

export async function GET(request, { params }) {
  try {
    const { id } = params;

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

    // Support both audit_id and version index approaches
    let audit_id_1 = searchParams.get('version1');
    let audit_id_2 = searchParams.get('version2');
    const v1_index = searchParams.get('v1_index');
    const v2_index = searchParams.get('v2_index');

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // If version indexes provided, fetch corresponding audit IDs
    if (v1_index || v2_index) {
      const index1 = parseInt(v1_index || '1', 10) - 1; // Convert to 0-based
      const index2 = parseInt(v2_index || '2', 10) - 1;

      const { data: versions, error: versionError } = await supabase
        .from('questions_audit')
        .select('audit_id')
        .eq('question_id', questionId)
        .order('changed_at', { ascending: false })
        .range(Math.min(index1, index2), Math.max(index1, index2));

      if (versionError || !versions || versions.length < 2) {
        return NextResponse.json(
          { error: 'Could not find specified versions' },
          { status: 404 }
        );
      }

      audit_id_1 = versions[index1 - Math.min(index1, index2)].audit_id;
      audit_id_2 = versions[index2 - Math.min(index1, index2)].audit_id;
    }

    // Validate audit IDs
    if (!audit_id_1 || !audit_id_2) {
      return NextResponse.json(
        { error: 'Must provide either version1/version2 or v1_index/v2_index' },
        { status: 400 }
      );
    }

    // Fetch both versions
    const { data: version1, error: error1 } = await supabase
      .from('questions_audit')
      .select('*')
      .eq('audit_id', audit_id_1)
      .eq('question_id', questionId)
      .single();

    const { data: version2, error: error2 } = await supabase
      .from('questions_audit')
      .select('*')
      .eq('audit_id', audit_id_2)
      .eq('question_id', questionId)
      .single();

    if (error1 || error2 || !version1 || !version2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      );
    }

    // Compare all fields
    const fieldsToCompare = [
      'external_id',
      'subject',
      'topic',
      'sub_topic',
      'difficulty',
      'question_type',
      'question_html',
      'options',
      'correct_answer',
      'solution_html',
      'strategy',
      'expert_insight',
      'key_facts',
    ];

    const differences = [];
    const similarities = [];

    for (const field of fieldsToCompare) {
      const value1 = version1.row_data?.[field] ?? version1[field];
      const value2 = version2.row_data?.[field] ?? version2[field];

      // Convert to strings for comparison
      const str1 = JSON.stringify(value1);
      const str2 = JSON.stringify(value2);

      const isDifferent = str1 !== str2;

      const comparisonObj = {
        field,
        value1,
        value2,
        is_different: isDifferent,
        type: typeof value1 === 'object' ? 'object' : typeof value1,
      };

      if (isDifferent) {
        differences.push(comparisonObj);
      } else {
        similarities.push(comparisonObj);
      }
    }

    // Calculate similarity percentage
    const totalFields = fieldsToCompare.length;
    const similarFields = similarities.length;
    const similarityPercentage = ((similarFields / totalFields) * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      question_id: questionId,
      version1: {
        audit_id: version1.audit_id,
        changed_at: version1.changed_at,
        changed_by: version1.changed_by,
        operation_type: version1.operation_type,
        changed_fields: version1.changed_fields,
      },
      version2: {
        audit_id: version2.audit_id,
        changed_at: version2.changed_at,
        changed_by: version2.changed_by,
        operation_type: version2.operation_type,
        changed_fields: version2.changed_fields,
      },
      comparison: {
        total_fields: totalFields,
        different_fields: differences.length,
        similar_fields: similarFields,
        similarity_percentage: parseFloat(similarityPercentage),
      },
      differences,
      // Optionally include similarities (uncomment if needed)
      // similarities,
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
 * Helper endpoint to get quick comparison summary
 * Use query param ?summary=true
 */
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const { version1, version2 } = body;

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'Must provide version1 and version2 in request body' },
        { status: 400 }
      );
    }

    // Redirect to GET with appropriate query params
    const url = new URL(request.url);
    url.searchParams.set('version1', version1.toString());
    url.searchParams.set('version2', version2.toString());

    // Use the GET handler
    return GET(new Request(url), { params });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
