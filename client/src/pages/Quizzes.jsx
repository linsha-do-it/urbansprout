import React, { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLevel, setActiveLevel] = useState('beginner');
  const [activeArea, setActiveArea] = useState('all');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitState, setSubmitState] = useState({ loading: false, result: null, error: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiCall(`/quizzes?level=${encodeURIComponent(activeLevel)}`);
        if (res.success) {
          setQuizzes(Array.isArray(res.data) ? res.data : []);
        } else {
          setQuizzes([]);
        }
      } catch (e) {
        setError(e?.message || 'Failed to load quizzes.');
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeLevel]);

  const areas = React.useMemo(() => {
    const set = new Set(quizzes.map((q) => q.area).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [quizzes]);

  const filtered = quizzes.filter((q) => (activeArea === 'all' ? true : q.area === activeArea));

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setSubmitState({ loading: false, result: null, error: '' });
  };

  const handleAnswerChange = (qIndex, optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  };

  const submitQuiz = async () => {
    if (!selectedQuiz?._id) return;
    try {
      setSubmitState({ loading: true, result: null, error: '' });
      const res = await apiCall(`/quizzes/${selectedQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
      if (res.success) {
        setSubmitState({ loading: false, result: res.data, error: '' });
      } else {
        setSubmitState({ loading: false, result: null, error: res.message || 'Failed to submit quiz.' });
      }
    } catch (e) {
      setSubmitState({ loading: false, result: null, error: e?.message || 'Failed to submit quiz.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8 pt-28">
        {!selectedQuiz ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Quizzes</h1>
              <p className="text-gray-600">Test your knowledge by level and area, and earn profile badges when you pass.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setActiveLevel(lvl)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      activeLevel === lvl
                        ? 'bg-forest-green-600 text-white border-forest-green-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-forest-green-300'
                    }`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {areas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setActiveArea(area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeArea === area
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {area === 'all' ? 'All areas' : area}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-green-600" />
              </div>
            ) : error ? (
              <p className="text-center text-sm text-red-600">{error}</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-600 font-medium">No quizzes available for this level/area yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((quiz) => (
                  <button
                    key={quiz._id}
                    type="button"
                    onClick={() => startQuiz(quiz)}
                    className="bg-white rounded-3xl border border-gray-100 p-6 text-left shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      {quiz.area} • {quiz.level}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h2>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {quiz.description || 'Short quiz to validate your skills in this area.'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quiz.questions?.length || 0} questions • Pass mark {quiz.passingScore || 70}%
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedQuiz(null);
                setSubmitState({ loading: false, result: null, error: '' });
              }}
              className="text-sm text-gray-600 hover:text-forest-green-700 mb-4"
            >
              ← Back to quizzes
            </button>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                {selectedQuiz.area} • {selectedQuiz.level}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedQuiz.title}</h1>
              <p className="text-sm text-gray-600 mb-2">{selectedQuiz.description}</p>
              <p className="text-xs text-gray-500">
                {selectedQuiz.questions?.length || 0} questions • Pass mark {selectedQuiz.passingScore || 70}%
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              {selectedQuiz.questions.map((q, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Q{idx + 1}. {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          className="h-4 w-4 text-forest-green-600"
                          checked={answers[idx] === optIdx}
                          onChange={() => handleAnswerChange(idx, optIdx)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {submitState.error && (
                <p className="text-sm text-red-600">{submitState.error}</p>
              )}

              {submitState.result && (
                <div className="mt-4 rounded-2xl border p-4 bg-gray-50">
                  <p className="text-sm text-gray-800">
                    Score: <span className="font-semibold">{submitState.result.score.percent}%</span>{' '}
                    ({submitState.result.score.earnedPoints}/{submitState.result.score.totalPoints})
                  </p>
                  <p className="text-sm mt-1">
                    Status:{' '}
                    <span
                      className={
                        submitState.result.score.passed
                          ? 'text-forest-green-700 font-semibold'
                          : 'text-red-600 font-semibold'
                      }
                    >
                      {submitState.result.score.passed ? 'Passed' : 'Not passed'}
                    </span>
                  </p>
                  {submitState.result.badgeEarned && submitState.result.badge && (
                    <p className="text-sm mt-2 text-forest-green-700">
                      🎉 Badge earned: <span className="font-semibold">{submitState.result.badge.label}</span>. It
                      will now appear on your profile.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={submitState.loading}
                  className="px-5 py-2 rounded-xl bg-forest-green-600 text-white hover:bg-forest-green-700 text-sm font-semibold disabled:opacity-60"
                >
                  {submitState.loading ? 'Submitting…' : 'Submit quiz'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Quizzes;

