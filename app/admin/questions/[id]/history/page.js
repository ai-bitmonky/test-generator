'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QuestionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id;

  const [question, setQuestion] = useState(null);
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [questionId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/questions/${questionId}/history`);
      const data = await response.json();

      if (data.success) {
        setQuestion(data.question);
        setHistory(data.data);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVersionSelection = (auditId) => {
    setSelectedVersions(prev => {
      if (prev.includes(auditId)) {
        return prev.filter(id => id !== auditId);
      } else if (prev.length < 2) {
        return [...prev, auditId];
      } else {
        // Replace oldest selection
        return [prev[1], auditId];
      }
    });
  };

  const compareSelectedVersions = () => {
    if (selectedVersions.length === 2) {
      router.push(`/admin/questions/${questionId}/compare?version1=${selectedVersions[0]}&version2=${selectedVersions[1]}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin/questions" className="text-sm text-blue-600 hover:text-blue-700 mb-2 block">
            ← Back to Questions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
              {question && (
                <p className="text-sm text-gray-500 mt-1">
                  {question.external_id} • {question.subject} • {question.topic}
                </p>
              )}
            </div>
            {selectedVersions.length === 2 && (
              <button
                onClick={compareSelectedVersions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Compare Selected Versions
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Changes" value={statistics.total_changes} color="blue" />
            <StatCard title="Inserts" value={statistics.inserts} color="green" />
            <StatCard title="Updates" value={statistics.updates} color="yellow" />
            <StatCard title="Deletes" value={statistics.deletes} color="red" />
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Select two versions (click the checkboxes) to compare them side-by-side.
            {selectedVersions.length > 0 && ` Selected: ${selectedVersions.length}/2`}
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border">
          {history.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No version history available for this question.
            </div>
          ) : (
            <div className="divide-y">
              {history.map((version, index) => (
                <VersionCard
                  key={version.audit_id}
                  version={version}
                  isLatest={index === 0}
                  isSelected={selectedVersions.includes(version.audit_id)}
                  onSelect={() => toggleVersionSelection(version.audit_id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg border p-4`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{title}</div>
    </div>
  );
}

function VersionCard({ version, isLatest, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  const operationColors = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  const changedFields = version.changed_fields || [];

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />

        {/* Timeline Dot */}
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${isLatest ? 'bg-blue-600' : 'bg-gray-300'} mt-1`}></div>
          {!isLatest && <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs font-medium rounded ${operationColors[version.operation_type]}`}>
                {version.operation_type}
              </span>
              {isLatest && (
                <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                  Current Version
                </span>
              )}
              <span className="text-sm text-gray-500">
                Version #{version.version_number}
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            {new Date(version.changed_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {changedFields.length > 0 && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Changed fields: </span>
              <span className="text-sm text-gray-600">
                {changedFields.join(', ')}
              </span>
            </div>
          )}

          {expanded && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Subject:</span>{' '}
                  {version.subject}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Topic:</span>{' '}
                  {version.topic}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Difficulty:</span>{' '}
                  {version.difficulty}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>{' '}
                  {version.question_type}
                </div>
              </div>

              {version.question_html && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Question Preview:</div>
                  <div
                    className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded"
                    dangerouslySetInnerHTML={{ __html: version.question_html.substring(0, 200) + '...' }}
                  />
                </div>
              )}

              {version.row_data && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    View Full Snapshot (JSON)
                  </summary>
                  <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(version.row_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
