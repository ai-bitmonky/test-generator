'use client';

import { useState, useEffect } from 'react';

export default function ValidationAuditPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchValidationStats();
  }, [selectedSubject]);

  const fetchValidationStats = async () => {
    try {
      setLoading(true);
      const url = selectedSubject === 'all'
        ? '/api/admin/validation-stats'
        : `/api/admin/validation-stats?subject=${selectedSubject}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch stats');

      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading validation statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Stats</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchValidationStats}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subjects = Object.keys(stats?.subjects || {});

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validation Audit Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor validation status and track question quality across all subjects
          </p>
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* Overall Summary */}
        {stats?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Questions</div>
              <div className="text-3xl font-bold text-gray-900">{stats.summary.totalQuestions}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Validated</div>
              <div className="text-3xl font-bold text-green-600">{stats.summary.totalValidated}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Unvalidated</div>
              <div className="text-3xl font-bold text-orange-600">{stats.summary.totalUnvalidated}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Validation Rate</div>
              <div className="text-3xl font-bold text-blue-600">{stats.summary.validationPercentage}%</div>
            </div>
          </div>
        )}

        {/* Subject-wise Statistics */}
        <div className="space-y-6">
          {subjects.map(subject => {
            const subjectStats = stats.subjects[subject];
            const validationRate = ((subjectStats.validated / subjectStats.total) * 100).toFixed(1);

            return (
              <div key={subject} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Subject Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">{subject}</h2>
                </div>

                <div className="p-6">
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Validation Progress
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {subjectStats.validated} / {subjectStats.total} ({validationRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${validationRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Validation by Version */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Validation Versions
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(subjectStats.byVersion).map(([version, count]) => (
                          <div key={version} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">
                              Version {version}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {count} questions
                            </span>
                          </div>
                        ))}
                        {subjectStats.unvalidated > 0 && (
                          <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded">
                            <span className="text-sm font-medium text-orange-700">
                              Not Validated
                            </span>
                            <span className="text-sm font-bold text-orange-900">
                              {subjectStats.unvalidated} questions
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Issue Types */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Issues Found & Fixed
                      </h3>
                      <div className="space-y-2">
                        {Object.keys(subjectStats.issueTypes).length > 0 ? (
                          Object.entries(subjectStats.issueTypes)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([issue, count]) => (
                              <div key={issue} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {issue.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  {count}
                                </span>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No issues recorded yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Validations */}
                  {subjectStats.recentValidations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Recent Validations
                      </h3>
                      <div className="space-y-2">
                        {subjectStats.recentValidations.slice(0, 5).map((validation, idx) => (
                          <div key={idx} className="py-2 px-3 bg-gray-50 rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-mono text-gray-600">
                                  ID: {validation.id.substring(0, 8)}...
                                </p>
                                {validation.validation_notes && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {validation.validation_notes}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 ml-4">
                                {new Date(validation.validated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchValidationStats}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Refresh Statistics
          </button>
        </div>
      </div>
    </div>
  );
}
