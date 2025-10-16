import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    // Get overall validation statistics
    let query = supabase
      .from('questions')
      .select('id, subject, validated_at, validation_version, validation_notes');

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data: questions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics by subject
    const statsBySubject = {};

    questions.forEach(q => {
      if (!statsBySubject[q.subject]) {
        statsBySubject[q.subject] = {
          total: 0,
          validated: 0,
          unvalidated: 0,
          byVersion: {},
          issueTypes: {},
          recentValidations: []
        };
      }

      const stats = statsBySubject[q.subject];
      stats.total++;

      if (q.validated_at) {
        stats.validated++;

        // Track by version
        const version = q.validation_version || 0;
        stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;

        // Track issue types
        if (q.validation_notes) {
          const issues = q.validation_notes.match(/Fixed: (.+)/);
          if (issues && issues[1]) {
            issues[1].split(', ').forEach(issue => {
              stats.issueTypes[issue] = (stats.issueTypes[issue] || 0) + 1;
            });
          }
        }

        // Track recent validations
        if (stats.recentValidations.length < 10) {
          stats.recentValidations.push({
            id: q.id,
            validated_at: q.validated_at,
            validation_notes: q.validation_notes
          });
        }
      } else {
        stats.unvalidated++;
      }
    });

    // Sort recent validations by date
    Object.values(statsBySubject).forEach(stats => {
      stats.recentValidations.sort((a, b) =>
        new Date(b.validated_at) - new Date(a.validated_at)
      );
    });

    return NextResponse.json({
      subjects: statsBySubject,
      summary: {
        totalQuestions: questions.length,
        totalValidated: questions.filter(q => q.validated_at).length,
        totalUnvalidated: questions.filter(q => !q.validated_at).length,
        validationPercentage: (questions.filter(q => q.validated_at).length / questions.length * 100).toFixed(1)
      }
    });

  } catch (error) {
    console.error('Validation stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
