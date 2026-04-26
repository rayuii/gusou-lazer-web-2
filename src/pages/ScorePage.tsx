import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { scoreAPI } from '../utils/api';

const ScorePage: React.FC = () => {
  const { scoreId } = useParams<{ scoreId: string }>();
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scoreId) return;
    scoreAPI.getScore(parseInt(scoreId))
      .then(setScore)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scoreId]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!score) return <div className="flex items-center justify-center h-screen">Score not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Beatmap header */}
      <div
        className="bg-card rounded-xl p-6 mb-4"
        style={{ backgroundImage: `url(${score.beatmapset?.covers?.cover})`, backgroundSize: 'cover' }}
      >
        <div className="bg-black/60 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-white">
            {score.beatmapset?.title}{' '}
            <span className="text-gray-300 font-normal">by {score.beatmapset?.artist}</span>
          </h1>
          <p className="text-gray-300 mt-1">
            {score.beatmap?.difficulty_rating}★ {score.beatmap?.version} mapped by {score.beatmapset?.creator}
          </p>
        </div>
      </div>

      {/* Score details */}
      <div className="bg-card rounded-xl p-6 mb-4 flex items-center gap-8">
        {/* Grade */}
        <div className="text-8xl font-bold" style={{ color: gradeColor(score.rank) }}>
          {score.rank}
        </div>

        {/* Score */}
        <div>
          <div className="text-5xl font-bold text-white">
            {score.total_score?.toLocaleString()}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm text-gray-400">
            <span>Played by <span className="text-white">{score.user?.username}</span></span>
            <span>Accuracy <span className="text-white">{((score.accuracy ?? 0) * 100).toFixed(2)}%</span></span>
            <span>Submitted on <span className="text-white">{new Date(score.ended_at).toLocaleString()}</span></span>
            <span>Max Combo <span className="text-white">{score.max_combo}x</span></span>
          </div>
        </div>

        {/* Global rank */}
        {score.rank_global && (
          <div className="ml-auto text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Global Rank</div>
            <div className="text-3xl font-bold text-osu-pink">#{score.rank_global}</div>
          </div>
        )}
      </div>

      {/* Hit counts */}
      <div className="bg-card rounded-xl p-6 mb-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          {Object.entries(score.statistics ?? {}).map(([key, val]) => (
            <div key={key}>
              <div className="text-xs text-gray-400 uppercase">{key.replace('count_', '')}</div>
              <div className="text-2xl font-bold text-white">{String(val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Download replay */}
      <a
        href={`/api/v2/scores/${scoreId}/download`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-osu-pink text-white rounded-lg hover:bg-osu-pink/90 transition-colors"
      >
        Download Replay
      </a>
    </div>
  );
};

const gradeColor = (rank: string) => {
  const colors: Record<string, string> = {
    XH: '#aaaaaa', X: '#f4c932', SH: '#aaaaaa',
    S: '#f4c932', A: '#57c12a', B: '#0096e6',
    C: '#d8519f', D: '#d82b2b', F: '#666666',
  };
  return colors[rank] ?? '#ffffff';
};

export default ScorePage;