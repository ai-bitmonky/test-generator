'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface EnrichmentStats {
  total: number;
  enriched: number;
  needEnrichment: number;
  percentComplete: number;
}

interface SubjectStats {
  Mathematics: EnrichmentStats;
  Physics: EnrichmentStats;
  Chemistry: EnrichmentStats;
}

interface RecentUpdate {
  id: string;
  subject: string;
  topic: string;
  timestamp: Date;
  changes: string[];
}

export default function EnrichmentMonitor() {
  const [stats, setStats] = useState<SubjectStats>({
    Mathematics: { total: 433, enriched: 0, needEnrichment: 433, percentComplete: 0 },
    Physics: { total: 249, enriched: 0, needEnrichment: 249, percentComplete: 0 },
    Chemistry: { total: 124, enriched: 0, needEnrichment: 124, percentComplete: 0 },
  });

  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Load initial stats
    loadStats();

    // Subscribe to realtime updates
    const channel: RealtimeChannel = supabase
      .channel('questions-enrichment')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'questions',
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('✅ Connected to realtime updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStats = async () => {
    const subjects = ['Mathematics', 'Physics', 'Chemistry'];
    const newStats: any = {};

    for (const subject of subjects) {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('strategy, expert_insight, key_facts, figure_svg')
        .eq('subject', subject);

      if (!error && questions) {
        const enriched = questions.filter(
          (q: any) =>
            q.strategy && q.strategy.trim() !== '' &&
            q.expert_insight && q.expert_insight.trim() !== '' &&
            q.key_facts && q.key_facts.trim() !== ''
        ).length;

        newStats[subject] = {
          total: questions.length,
          enriched,
          needEnrichment: questions.length - enriched,
          percentComplete: Math.round((enriched / questions.length) * 100),
        };
      }
    }

    setStats(newStats);
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { new: newRecord, old: oldRecord } = payload;

    // Detect what changed
    const changes: string[] = [];
    if (newRecord.strategy && !oldRecord.strategy) changes.push('strategy');
    if (newRecord.expert_insight && !oldRecord.expert_insight) changes.push('expert_insight');
    if (newRecord.key_facts && !oldRecord.key_facts) changes.push('key_facts');
    if (newRecord.figure_svg && !oldRecord.figure_svg) changes.push('figure_svg');
    if (JSON.stringify(newRecord.options) !== JSON.stringify(oldRecord.options)) changes.push('options');

    // Add to recent updates
    if (changes.length > 0) {
      const update: RecentUpdate = {
        id: newRecord.id,
        subject: newRecord.subject,
        topic: newRecord.topic || 'Unknown',
        timestamp: new Date(),
        changes,
      };

      setRecentUpdates((prev) => [update, ...prev.slice(0, 19)]); // Keep last 20

      // Update stats
      setStats((prev) => {
        const subject = newRecord.subject as keyof SubjectStats;
        if (!prev[subject]) return prev;

        const wasEnriched = oldRecord.strategy && oldRecord.expert_insight && oldRecord.key_facts;
        const isNowEnriched = newRecord.strategy && newRecord.expert_insight && newRecord.key_facts;

        if (!wasEnriched && isNowEnriched) {
          const enriched = prev[subject].enriched + 1;
          return {
            ...prev,
            [subject]: {
              ...prev[subject],
              enriched,
              needEnrichment: prev[subject].total - enriched,
              percentComplete: Math.round((enriched / prev[subject].total) * 100),
            },
          };
        }

        return prev;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Enrichment Pipeline Monitor</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected to realtime updates' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Subject Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(stats).map(([subject, data]) => (
            <div key={subject} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-4">{subject}</h2>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-bold">{data.percentComplete}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${data.percentComplete}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Questions:</span>
                  <span className="font-semibold">{data.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Enriched:</span>
                  <span className="font-semibold text-green-400">{data.enriched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining:</span>
                  <span className="font-semibold text-yellow-400">{data.needEnrichment}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Updates */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Recent Updates</h2>

          {recentUpdates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Waiting for updates... Pipelines will appear here in real-time.
            </p>
          ) : (
            <div className="space-y-3">
              {recentUpdates.map((update, index) => (
                <div
                  key={`${update.id}-${index}`}
                  className="bg-gray-700 rounded p-4 border border-gray-600 animate-fade-in"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-blue-400">{update.subject}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-300">{update.topic}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {update.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {update.changes.map((change) => (
                      <span
                        key={change}
                        className="px-2 py-1 bg-gray-600 rounded text-xs text-green-400"
                      >
                        ✓ {change}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overall Stats */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Overall Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Total Questions</div>
              <div className="text-3xl font-bold">
                {stats.Mathematics.total + stats.Physics.total + stats.Chemistry.total}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Enriched</div>
              <div className="text-3xl font-bold text-green-400">
                {stats.Mathematics.enriched + stats.Physics.enriched + stats.Chemistry.enriched}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Remaining</div>
              <div className="text-3xl font-bold text-yellow-400">
                {stats.Mathematics.needEnrichment + stats.Physics.needEnrichment + stats.Chemistry.needEnrichment}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Overall %</div>
              <div className="text-3xl font-bold text-blue-400">
                {Math.round(
                  ((stats.Mathematics.enriched + stats.Physics.enriched + stats.Chemistry.enriched) /
                    (stats.Mathematics.total + stats.Physics.total + stats.Chemistry.total)) *
                    100
                )}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
