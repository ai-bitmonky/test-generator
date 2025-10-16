'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VersionComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const questionId = params.id;

  const version1 = searchParams.get('version1');
  const version2 = searchParams.get('version2');

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (version1 && version2) {
      fetchComparison();
    }
  }, [version1, version2]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/questions/${questionId}/compare?version1=${version1}&version2=${version2}`
      );
      const data = await response.json();

      if (data.success) {
        setComparisonData(data);
      } else {
        setError(data.error || 'Failed to load comparison');
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Comparing versions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/admin/questions/${questionId}/history`}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return null;
  }

  const { version1: v1, version2: v2, comparison, differences } = comparisonData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/admin/questions/${questionId}/history`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 block"
          >
            ← Back to History
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Version Comparison</h1>
              <p className="text-sm text-gray-500 mt-1">
                Comparing {differences.length} different field{differences.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {comparison.similarity_percentage}%
              </div>
              <div className="text-sm text-gray-500">Similar</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Version Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <VersionInfoCard version={v1} label="Version 1 (Older)" color="blue" />
          <VersionInfoCard version={v2} label="Version 2 (Newer)" color="green" />
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparison Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">{comparison.total_fields}</div>
              <div className="text-sm text-gray-500">Total Fields</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{comparison.different_fields}</div>
              <div className="text-sm text-gray-500">Changed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{comparison.similar_fields}</div>
              <div className="text-sm text-gray-500">Unchanged</div>
            </div>
          </div>
        </div>

        {/* Differences */}
        {differences.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-500">No differences found between these versions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Changed Fields</h2>
            {differences.map((diff) => (
              <DifferenceCard key={diff.field} difference={diff} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function VersionInfoCard({ version, label, color }) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} p-6`}>
      <h3 className="font-semibold text-gray-900 mb-4">{label}</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Audit ID:</span> {version.audit_id}
        </div>
        <div>
          <span className="font-medium text-gray-700">Operation:</span> {version.operation_type}
        </div>
        <div>
          <span className="font-medium text-gray-700">Changed At:</span>{' '}
          {new Date(version.changed_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        {version.changed_fields && version.changed_fields.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Changed Fields:</span>{' '}
            {version.changed_fields.length}
          </div>
        )}
      </div>
    </div>
  );
}

function DifferenceCard({ difference }) {
  const { field, value1, value2, type } = difference;
  const [expanded, setExpanded] = useState(false);

  const isLongValue = (value) => {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return str.length > 100;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (typeof value === 'object') {
      return <pre className="text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    if (typeof value === 'string' && value.includes('<')) {
      // Likely HTML
      return <div dangerouslySetInnerHTML={{ __html: value }} className="prose max-w-none" />;
    }
    return <span>{String(value)}</span>;
  };

  const needsExpand = isLongValue(value1) || isLongValue(value2);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{field}</h3>
          <p className="text-xs text-gray-500 mt-1">Type: {type}</p>
        </div>
        {needsExpand && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        {/* Version 1 */}
        <div className="p-6">
          <div className="text-xs font-medium text-gray-500 mb-2 uppercase">Version 1 (Older)</div>
          <div className={`text-sm ${!expanded && needsExpand ? 'line-clamp-3' : ''}`}>
            {formatValue(value1)}
          </div>
        </div>

        {/* Version 2 */}
        <div className="p-6 bg-green-50">
          <div className="text-xs font-medium text-gray-500 mb-2 uppercase">Version 2 (Newer)</div>
          <div className={`text-sm ${!expanded && needsExpand ? 'line-clamp-3' : ''}`}>
            {formatValue(value2)}
          </div>
        </div>
      </div>

      {/* Visual Diff Indicator */}
      <div className="px-6 py-2 bg-yellow-50 border-t text-xs text-yellow-800">
        ⚠️ This field was modified between versions
      </div>
    </div>
  );
}
