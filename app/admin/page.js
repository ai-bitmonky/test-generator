'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    bySubject: {},
    byDifficulty: {},
    recentChanges: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/questions?page=1&limit=1');
      const data = await response.json();

      if (data.success) {
        setStats({
          totalQuestions: data.pagination.total,
          bySubject: {},
          byDifficulty: {},
          recentChanges: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Manage JEE questions and view audit history</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Questions"
            value={loading ? '...' : stats.totalQuestions}
            icon="📝"
            color="blue"
          />
          <StatCard
            title="Recent Changes"
            value={loading ? '...' : stats.recentChanges}
            subtitle="Last 7 days"
            icon="🔄"
            color="green"
          />
          <StatCard
            title="Mathematics"
            value={loading ? '...' : (stats.bySubject?.Mathematics || 0)}
            icon="📐"
            color="purple"
          />
          <StatCard
            title="Physics"
            value={loading ? '...' : (stats.bySubject?.Physics || 0)}
            icon="⚛️"
            color="indigo"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/questions"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-2xl mr-3">📋</span>
              <div>
                <div className="font-medium text-gray-900">View All Questions</div>
                <div className="text-sm text-gray-500">Browse and filter questions</div>
              </div>
            </Link>

            <Link
              href="/admin/questions?sort_by=updated_at&sort_order=desc"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <span className="text-2xl mr-3">🕐</span>
              <div>
                <div className="font-medium text-gray-900">Recent Changes</div>
                <div className="text-sm text-gray-500">View latest modifications</div>
              </div>
            </Link>

            <Link
              href="/admin/audit"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <span className="text-2xl mr-3">📊</span>
              <div>
                <div className="font-medium text-gray-900">Audit Logs</div>
                <div className="text-sm text-gray-500">View change history</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Filter by Subject */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Subject</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SubjectCard
              name="Mathematics"
              icon="📐"
              count={stats.bySubject?.Mathematics || 0}
              href="/admin/questions?subject=Mathematics"
              color="blue"
            />
            <SubjectCard
              name="Physics"
              icon="⚛️"
              count={stats.bySubject?.Physics || 0}
              href="/admin/questions?subject=Physics"
              color="green"
            />
            <SubjectCard
              name="Chemistry"
              icon="🧪"
              count={stats.bySubject?.Chemistry || 0}
              href="/admin/questions?subject=Chemistry"
              color="purple"
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 Admin Panel Guide</h3>
          <p className="text-sm text-blue-800 mb-4">
            This admin panel allows you to manage JEE questions, view version history, and compare changes.
          </p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>View Questions:</strong> Browse, filter, and search all questions</li>
            <li>• <strong>Version History:</strong> Click on any question to see its complete change history</li>
            <li>• <strong>Compare Versions:</strong> Select two versions to see side-by-side differences</li>
            <li>• <strong>Audit Trail:</strong> All changes are automatically tracked with timestamps</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg border p-6`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{title}</div>
      {subtitle && <div className="text-xs mt-1 opacity-75">{subtitle}</div>}
    </div>
  );
}

function SubjectCard({ name, icon, count, href, color = 'blue' }) {
  const colorClasses = {
    blue: 'hover:border-blue-500 hover:bg-blue-50',
    green: 'hover:border-green-500 hover:bg-green-50',
    purple: 'hover:border-purple-500 hover:bg-purple-50',
  };

  return (
    <Link
      href={href}
      className={`flex items-center justify-between p-6 border-2 border-gray-200 rounded-lg ${colorClasses[color]} transition-colors`}
    >
      <div className="flex items-center">
        <span className="text-3xl mr-4">{icon}</span>
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">{count} questions</div>
        </div>
      </div>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
