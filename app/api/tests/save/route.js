import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createTest } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
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

    // Create test record
    const test = {
      id: uuidv4(),
      userId: decoded.userId,
      totalQuestions: questions.length,
      answeredQuestions: Object.keys(answers).length,
      correctCount,
      incorrectCount,
      skippedCount,
      totalTime, // in seconds
      questionTimings, // array of {questionId, timeTaken}
      answers,
      questions: questions.map(q => ({
        id: q.id,
        topic: q.topic,
        difficulty: q.difficulty
      })),
      createdAt: new Date().toISOString(),
    };

    createTest(test);

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
