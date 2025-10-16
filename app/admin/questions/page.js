'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function QuestionsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detailed'

  // Get filter values from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const subject = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const sortBy = searchParams.get('sort_by') || 'updated_at';
  const sortOrder = searchParams.get('sort_order') || 'desc';
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '10');

  useEffect(() => {
    fetchQuestions();
  }, [searchParams]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      if (subject) params.append('subject', subject);
      if (topic) params.append('topic', topic);
      if (difficulty) params.append('difficulty', difficulty);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data);
        setPagination(data.pagination);
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/questions?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/questions');
  };

  const changePage = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/questions?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 mb-1 block">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={limit}
                onChange={(e) => updateFilter('limit', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
              </select>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1.5 rounded text-sm ${
                    viewMode === 'detailed'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  Detailed
                </button>
              </div>

              <div className="text-sm text-gray-600">
                {pagination && `${pagination.total} total`}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Filters</h2>
            {(subject || topic || difficulty || search) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <select
                value={subject}
                onChange={(e) => updateFilter('subject', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Subjects</option>
                {filters?.subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={difficulty}
                onChange={(e) => updateFilter('difficulty', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Difficulties</option>
                {filters?.difficulties.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => updateFilter('sort_by', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="updated_at">Last Modified</option>
                <option value="created_at">Date Added</option>
                <option value="external_id">Question ID</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>

            <div>
              <select
                value={sortOrder}
                onChange={(e) => updateFilter('sort_order', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-lg text-gray-600 font-medium">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border p-16 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg text-gray-500 mb-4">No questions found matching your filters.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="space-y-5">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onClick={() => setSelectedQuestion(question)}
                  />
                ))}
              </div>
            ) : (
              <DetailedQuestionsView questions={questions} />
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 bg-white rounded-xl shadow-md border p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                  Showing page <span className="text-blue-600 font-bold">{pagination.page}</span> of <span className="font-bold">{pagination.totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all font-medium flex items-center gap-2"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
}

function DetailedQuestionsView({ questions }) {
  return (
    <div className="bg-white rounded-xl shadow-md border p-8">
      <style jsx>{`
        .question-container {
          margin-bottom: 50px;
          padding-bottom: 40px;
          border-bottom: 3px solid #e5e7eb;
        }
        .question-container:last-child {
          border-bottom: none;
        }
        .question-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 20px;
          border-radius: 10px 10px 0 0;
          margin-bottom: 20px;
        }
        .question-text {
          line-height: 1.9;
          margin: 20px 0;
          font-size: 17px;
          color: #2c3e50;
        }
        .options-container {
          margin: 20px 0;
        }
        .option-item {
          margin: 12px 0;
          padding: 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .option-item.correct-answer {
          border-color: #28a745;
          background: #d4edda;
        }
        .option-item input[type="radio"] {
          margin-right: 15px;
          width: 20px;
          height: 20px;
        }
        .option-item label {
          flex: 1;
          font-size: 16px;
        }
        .solution-box {
          margin-top: 20px;
          padding: 20px;
          background: #fff3cd;
          border-left: 5px solid #ffc107;
          border-radius: 5px;
        }
        .solution-box h4 {
          color: #856404;
          margin-bottom: 10px;
        }
        .metadata-section {
          background: #f0f7ff;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
        }
        .metadata-section h5 {
          color: #667eea;
          margin-bottom: 8px;
          font-size: 1.1em;
        }
        .metadata-section p {
          color: #333;
          line-height: 1.6;
        }
        .metadata-section.strategy {
          background: #fff3e0;
          border-left-color: #ff6f00;
        }
        .metadata-section.strategy h5 {
          color: #ff6f00;
        }
        .metadata-section.insight {
          background: #e8f5e9;
          border-left-color: #4caf50;
        }
        .metadata-section.insight h5 {
          color: #4caf50;
        }
      `}</style>

      {questions.map((question, index) => (
        <div key={question.id} className="question-container">
          <div className="question-header">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-lg">Question {index + 1}</span>
                <span className="ml-4 text-sm opacity-90">{question.external_id || `Q-${question.id}`}</span>
              </div>
              <div className="flex gap-3">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm">
                  {question.subject}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm">
                  {question.difficulty}
                </span>
              </div>
            </div>
          </div>

          <div className="question-text">
            <div dangerouslySetInnerHTML={{ __html: question.question_html }} />
            {question.figure_svg && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <div dangerouslySetInnerHTML={{ __html: question.figure_svg }} />
              </div>
            )}
          </div>

          {question.options && (
            <div className="options-container">
              {['A', 'B', 'C', 'D'].map((label) => {
                const optionKey = label.toLowerCase();
                const isCorrect = question.correct_answer === optionKey ||
                                 question.correct_answer === label ||
                                 question.correct_answer?.includes(label);

                return question.options[optionKey] ? (
                  <div
                    key={label}
                    className={`option-item ${isCorrect ? 'correct-answer' : ''}`}
                  >
                    <input
                      type="radio"
                      checked={isCorrect}
                      disabled
                      readOnly
                    />
                    <label>
                      <strong>({label})</strong>{' '}
                      <span dangerouslySetInnerHTML={{ __html: question.options[optionKey] }} />
                    </label>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {question.solution_html && (
            <div className="solution-box">
              <h4>✓ Solution</h4>
              <div dangerouslySetInnerHTML={{ __html: question.solution_html }} />
            </div>
          )}

          {question.strategy && (
            <div className="metadata-section strategy">
              <h5>📋 Strategy</h5>
              <p>{question.strategy}</p>
            </div>
          )}

          {question.expert_insight && (
            <div className="metadata-section insight">
              <h5>💡 Expert Insight</h5>
              <p>{question.expert_insight}</p>
            </div>
          )}

          {question.key_facts && (
            <div className="metadata-section">
              <h5>🔑 Key Facts</h5>
              <p>{question.key_facts}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuestionCard({ question, onClick }) {
  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Hard: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const subjectColors = {
    Mathematics: 'bg-blue-50 text-blue-700',
    Physics: 'bg-purple-50 text-purple-700',
    Chemistry: 'bg-green-50 text-green-700',
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:border-blue-400 hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1.5 text-sm font-mono font-semibold text-gray-700 bg-gray-100 rounded-lg">
            {question.external_id || `Q-${question.id}`}
          </span>
          <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${difficultyColors[question.difficulty] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {question.difficulty || 'Unknown'}
          </span>
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${subjectColors[question.subject] || 'bg-gray-100 text-gray-700'}`}>
            {question.subject}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 mb-1">Last Updated</div>
          <div className="text-sm font-semibold text-gray-700">
            {new Date(question.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {question.topic} {question.sub_topic && `• ${question.sub_topic}`}
        </div>
        <div
          className="text-gray-900 line-clamp-2 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: question.question_html?.substring(0, 200) + '...' || 'No question text' }}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {question.question_type || 'N/A'}
          </span>
        </div>
        <button className="px-4 py-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition-all flex items-center gap-2">
          View Details
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function QuestionDetailModal({ question, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between shadow-lg z-10">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Question Details
            </h2>
            <p className="text-blue-100 text-sm">
              {question.external_id || `Q-${question.id}`} • {question.subject}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-8">
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out;
            }
            .animate-slideUp {
              animation: slideUp 0.3s ease-out;
            }
            .question-text {
              line-height: 1.9;
              margin: 20px 0;
              font-size: 17px;
              color: #2c3e50;
            }
            .options-container {
              margin: 20px 0;
            }
            .option-item {
              margin: 12px 0;
              padding: 15px;
              background: white;
              border: 2px solid #ddd;
              border-radius: 8px;
              display: flex;
              align-items: center;
              transition: all 0.2s;
            }
            .option-item.correct-answer {
              border-color: #28a745;
              background: #d4edda;
            }
            .option-item input[type="radio"] {
              margin-right: 15px;
              width: 20px;
              height: 20px;
            }
            .option-item label {
              flex: 1;
              font-size: 16px;
            }
            .solution-box {
              margin-top: 20px;
              padding: 20px;
              background: #fff3cd;
              border-left: 5px solid #ffc107;
              border-radius: 5px;
            }
            .solution-box h4 {
              color: #856404;
              margin-bottom: 10px;
            }
            .solution-box p {
              color: #856404;
              line-height: 1.6;
            }
            .metadata-section {
              background: #f0f7ff;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
            }
            .metadata-section h5 {
              color: #667eea;
              margin-bottom: 8px;
              font-size: 1.1em;
            }
            .metadata-section p {
              color: #333;
              line-height: 1.6;
            }
            .metadata-section.strategy {
              background: #fff3e0;
              border-left-color: #ff6f00;
            }
            .metadata-section.insight {
              background: #e8f5e9;
              border-left-color: #4caf50;
            }
          `}</style>

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-xs font-semibold text-blue-600 mb-1">Question ID</div>
              <div className="font-bold text-gray-900">{question.external_id || question.id}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-xs font-semibold text-purple-600 mb-1">Difficulty</div>
              <div className="font-bold text-gray-900">{question.difficulty || 'N/A'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-xs font-semibold text-green-600 mb-1">Subject</div>
              <div className="font-bold text-gray-900">{question.subject}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <div className="text-xs font-semibold text-amber-600 mb-1">Topic</div>
              <div className="font-bold text-gray-900">{question.topic}</div>
            </div>
          </div>

          {/* Question */}
          <div className="question-text">
            <div dangerouslySetInnerHTML={{ __html: question.question_html }} />
            {question.figure_svg && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <div dangerouslySetInnerHTML={{ __html: question.figure_svg }} />
              </div>
            )}
          </div>

          {/* Options */}
          {question.options && (
            <div className="options-container">
              {['A', 'B', 'C', 'D'].map((label) => {
                const optionKey = label.toLowerCase();
                const isCorrect = question.correct_answer === optionKey ||
                                 question.correct_answer === label ||
                                 question.correct_answer?.includes(label);

                return question.options[optionKey] ? (
                  <div
                    key={label}
                    className={`option-item ${isCorrect ? 'correct-answer' : ''}`}
                  >
                    <input
                      type="radio"
                      checked={isCorrect}
                      disabled
                      readOnly
                    />
                    <label>
                      <strong>({label})</strong>{' '}
                      <span dangerouslySetInnerHTML={{ __html: question.options[optionKey] }} />
                    </label>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Solution */}
          {question.solution_html && (
            <div className="solution-box">
              <h4>✓ Solution</h4>
              <div className="solution-content" dangerouslySetInnerHTML={{ __html: question.solution_html }} />
            </div>
          )}

          {/* Strategy */}
          {question.strategy && (
            <div className="metadata-section strategy">
              <h5>📋 Strategy</h5>
              <p>{question.strategy}</p>
            </div>
          )}

          {/* Expert Insight */}
          {question.expert_insight && (
            <div className="metadata-section insight">
              <h5>💡 Expert Insight</h5>
              <p>{question.expert_insight}</p>
            </div>
          )}

          {/* Key Facts */}
          {question.key_facts && (
            <div className="metadata-section">
              <h5>🔑 Key Facts</h5>
              <p>{question.key_facts}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t mt-8 sticky bottom-0 bg-white pb-2">
            <Link
              href={`/admin/questions/${question.id}/history`}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </Link>
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
