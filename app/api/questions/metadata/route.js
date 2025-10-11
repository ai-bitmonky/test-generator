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

    // Get URL search params
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    // Get question counts by subject
    const { data: subjectCounts, error: subjectError } = await supabase
      .from('questions')
      .select('subject')
      .not('subject', 'is', null);

    if (subjectError) {
      console.error('Subject count error:', subjectError);
      return NextResponse.json(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      );
    }

    // Count questions by subject
    const subjectMap = {};
    subjectCounts.forEach(record => {
      const sub = record.subject || 'Unknown';
      subjectMap[sub] = (subjectMap[sub] || 0) + 1;
    });

    // If subject is specified, get chapters for that subject
    let chapters = [];
    if (subject) {
      const { data: chapterData, error: chapterError } = await supabase
        .from('questions')
        .select('chapter, topic')
        .eq('subject', subject)
        .not('chapter', 'is', null);

      if (chapterError) {
        console.error('Chapter error:', chapterError);
        return NextResponse.json(
          { error: 'Failed to fetch chapters' },
          { status: 500 }
        );
      }

      // Count questions by chapter
      const chapterMap = {};
      chapterData.forEach(record => {
        const ch = record.chapter || 'Unknown';
        chapterMap[ch] = (chapterMap[ch] || 0) + 1;
      });

      chapters = Object.entries(chapterMap).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);
    }

    return NextResponse.json({
      success: true,
      subjects: Object.entries(subjectMap).map(([name, count]) => ({
        name,
        count
      })),
      chapters: chapters
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
