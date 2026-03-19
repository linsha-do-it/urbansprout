import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiCall } from '../../utils/api';
import { Plus, Search, RefreshCw, Trash2, Edit, Eye, EyeOff, X, CheckCircle, AlertTriangle, Upload, Download } from 'lucide-react';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const emptyQuiz = () => ({
  title: '',
  area: '',
  level: 'beginner',
  description: '',
  passingScore: 70,
  isPublished: true,
  questions: [
    {
      text: '',
      options: [''],
      correctIndex: 0,
      points: 1,
    },
  ],
});

function validateQuiz(q) {
  const errors = [];
  if (!q.title?.trim()) errors.push('Title is required.');
  if (!q.area?.trim()) errors.push('Area is required (e.g. soil, watering, pests).');
  if (!LEVELS.includes(q.level)) errors.push('Level must be beginner, intermediate, or advanced.');
  const ps = Number(q.passingScore);
  if (Number.isNaN(ps) || ps < 0 || ps > 100) errors.push('Passing score must be a number between 0 and 100.');
  if (!Array.isArray(q.questions) || q.questions.length === 0) errors.push('At least one question is required.');

  (q.questions || []).forEach((qq, idx) => {
    if (!qq.text?.trim()) errors.push(`Question ${idx + 1}: text is required.`);
    if (!Array.isArray(qq.options) || qq.options.length < 2) errors.push(`Question ${idx + 1}: at least 2 options are required.`);
    qq.options?.forEach((opt, oIdx) => {
      if (!String(opt || '').trim()) errors.push(`Question ${idx + 1}: option ${oIdx + 1} cannot be empty.`);
    });
    const ci = Number(qq.correctIndex);
    if (Number.isNaN(ci) || ci < 0 || ci >= (qq.options?.length || 0)) errors.push(`Question ${idx + 1}: correct option must be selected.`);
    const pts = Number(qq.points);
    if (Number.isNaN(pts) || pts < 0) errors.push(`Question ${idx + 1}: points must be 0 or more.`);
  });

  return errors;
}

const AdminQuizzes = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterPublished, setFilterPublished] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // quiz object or null
  const [draft, setDraft] = useState(emptyQuiz());
  const [validationErrors, setValidationErrors] = useState([]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filterLevel) params.set('level', filterLevel);
      if (filterArea) params.set('area', filterArea);
      if (filterPublished) params.set('published', filterPublished);

      const res = await apiCall(`/admin/quizzes?${params.toString()}`);
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

  useEffect(() => {
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLevel, filterArea, filterPublished]);

  const areas = useMemo(() => {
    const set = new Set((quizzes || []).map((q) => q.area).filter(Boolean));
    return Array.from(set);
  }, [quizzes]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyQuiz());
    setValidationErrors([]);
    setModalOpen(true);
  };

  const openEdit = (quiz) => {
    setEditing(quiz);
    setDraft({
      _id: quiz._id,
      title: quiz.title || '',
      area: quiz.area || '',
      level: quiz.level || 'beginner',
      description: quiz.description || '',
      passingScore: quiz.passingScore ?? 70,
      isPublished: quiz.isPublished !== false,
      questions: Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz.questions : emptyQuiz().questions,
    });
    setValidationErrors([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDraft(emptyQuiz());
    setValidationErrors([]);
  };

  const saveQuiz = async () => {
    const errs = validateQuiz(draft);
    setValidationErrors(errs);
    if (errs.length > 0) return;

    try {
      setSaving(true);
      setMessage('');
      setError('');
      const payload = {
        title: draft.title,
        area: draft.area,
        level: draft.level,
        description: draft.description,
        passingScore: Number(draft.passingScore),
        isPublished: Boolean(draft.isPublished),
        questions: draft.questions.map((q) => ({
          text: q.text,
          options: q.options,
          correctIndex: Number(q.correctIndex),
          points: Number(q.points ?? 1),
        })),
      };

      if (editing?._id) {
        await apiCall(`/admin/quizzes/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Quiz updated.');
      } else {
        await apiCall('/admin/quizzes', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Quiz created.');
      }
      closeModal();
      await loadQuizzes();
    } catch (e) {
      setError(e?.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"? This cannot be undone.`)) return;
    try {
      setMessage('');
      setError('');
      await apiCall(`/admin/quizzes/${quiz._id}`, { method: 'DELETE' });
      setMessage('Quiz deleted.');
      await loadQuizzes();
    } catch (e) {
      setError(e?.message || 'Failed to delete quiz.');
    }
  };

  const togglePublish = async (quiz) => {
    try {
      setMessage('');
      setError('');
      await apiCall(`/admin/quizzes/${quiz._id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !quiz.isPublished }),
      });
      await loadQuizzes();
    } catch (e) {
      setError(e?.message || 'Failed to update publish status.');
    }
  };

  const filteredBySearch = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return quizzes;
    return (quizzes || []).filter((q) => (q.title || '').toLowerCase().includes(s));
  }, [quizzes, search]);

  const downloadTemplate = () => {
    const header = [
      'title',
      'area',
      'level',
      'description',
      'passingScore',
      'isPublished',
      'question',
      'option1',
      'option2',
      'option3',
      'option4',
      'correctIndex',
      'points',
      'mode',
    ].join(',');
    const sample = [
      'Soil Basics',
      'soil',
      'beginner',
      'Core soil concepts for container gardening',
      '70',
      'true',
      'Which component improves drainage in potting mix?',
      'Perlite',
      'Sugar',
      'Oil',
      'Salt',
      '0',
      '1',
      'append',
    ].join(',');
    const content = `${header}\n${sample}\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uploadCsv = async (file) => {
    if (!file) return;
    const name = String(file.name || '').toLowerCase();
    if (!name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('CSV file must be <= 5MB');
      return;
    }

    try {
      setUploading(true);
      setMessage('');
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiCall('/admin/quizzes/upload-csv', {
        method: 'POST',
        body: formData,
      });
      if (res.success) {
        const d = res.data || {};
        setMessage(
          `Upload complete: ${d.quizzesCreated || 0} created, ${d.quizzesUpdated || 0} updated, ${d.questionsAdded || 0} questions added.`
        );
        await loadQuizzes();
      } else {
        setError(res.message || 'Upload failed.');
      }
    } catch (e) {
      // If backend returned validation errors, show a concise message.
      const msg = e?.message || 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
              <p className="text-gray-600 text-sm">Create quizzes by area & level. Publish to make them available in the Quizzes page.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCsv(f);
                }}
              />
              <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                type="button"
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
                type="button"
                disabled={uploading}
                title="Upload CSV (bulk import)"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading…' : 'Upload CSV'}
              </button>
              <button
                onClick={openCreate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New quiz
              </button>
              <button
                onClick={loadQuizzes}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterArea('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                !filterArea ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              All areas
            </button>
            {areas.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setFilterArea(a)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  filterArea === a ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        {(message || error) && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="mb-4 bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm font-semibold text-gray-900">Bulk upload format</p>
          <p className="text-xs text-gray-600 mt-1">
            Upload a CSV where <span className="font-semibold">each row is one question</span>. Rows with the same
            <span className="font-semibold"> title + area + level</span> are grouped into one quiz.
            Use <span className="font-semibold">mode</span> = <span className="font-semibold">replace</span> to replace existing questions,
            or <span className="font-semibold">append</span> to add new questions (default).
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass%</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredBySearch.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      No quizzes found.
                    </td>
                  </tr>
                ) : (
                  filteredBySearch.map((q) => (
                    <tr key={q._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{q.title}</div>
                        {q.description ? <div className="text-xs text-gray-500 line-clamp-1">{q.description}</div> : null}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{q.area}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 capitalize">{q.level}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{q.questions?.length || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{q.passingScore ?? 70}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                            q.isPublished ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {q.isPublished ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" /> Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" /> Unpublished
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(q)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => togglePublish(q)}
                            className="text-gray-700 hover:text-gray-900"
                            title={q.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {q.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteQuiz(q)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit quiz' : 'Create quiz'}</h2>
                <p className="text-xs text-gray-500">Define questions, options, and correct answers.</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-auto">
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Fix these issues before saving:
                  </div>
                  <ul className="list-disc ml-5 space-y-1">
                    {validationErrors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {validationErrors.length > 10 && <li>…and {validationErrors.length - 10} more</li>}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Title</label>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Soil Basics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Area</label>
                  <input
                    value={draft.area}
                    onChange={(e) => setDraft((p) => ({ ...p, area: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. soil / watering / pests"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Level</label>
                  <select
                    value={draft.level}
                    onChange={(e) => setDraft((p) => ({ ...p, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Passing score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.passingScore}
                    onChange={(e) => setDraft((p) => ({ ...p, passingScore: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.isPublished)}
                      onChange={(e) => setDraft((p) => ({ ...p, isPublished: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    Published (visible to learners)
                  </label>
                </div>
              </div>

              {/* Questions */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Questions</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        questions: [
                          ...p.questions,
                          { text: '', options: ['', ''], correctIndex: 0, points: 1 },
                        ],
                      }))
                    }
                    className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black"
                  >
                    + Add question
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.questions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Question {qIdx + 1}</label>
                          <input
                            value={q.text}
                            onChange={(e) =>
                              setDraft((p) => {
                                const next = [...p.questions];
                                next[qIdx] = { ...next[qIdx], text: e.target.value };
                                return { ...p, questions: next };
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Type the question..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== qIdx) }))
                          }
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          title="Remove question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Points</label>
                          <input
                            type="number"
                            min="0"
                            value={q.points}
                            onChange={(e) =>
                              setDraft((p) => {
                                const next = [...p.questions];
                                next[qIdx] = { ...next[qIdx], points: e.target.value };
                                return { ...p, questions: next };
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Correct option</label>
                          <select
                            value={q.correctIndex}
                            onChange={(e) =>
                              setDraft((p) => {
                                const next = [...p.questions];
                                next[qIdx] = { ...next[qIdx], correctIndex: Number(e.target.value) };
                                return { ...p, questions: next };
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {q.options.map((_, idx) => (
                              <option key={idx} value={idx}>
                                Option {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-700">Options</p>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => {
                                const next = [...p.questions];
                                const opts = Array.isArray(next[qIdx].options) ? next[qIdx].options : [];
                                next[qIdx] = { ...next[qIdx], options: [...opts, ''] };
                                return { ...p, questions: next };
                              })
                            }
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                          >
                            + Add option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                                {optIdx + 1}
                              </div>
                              <input
                                value={opt}
                                onChange={(e) =>
                                  setDraft((p) => {
                                    const next = [...p.questions];
                                    const opts = [...next[qIdx].options];
                                    opts[optIdx] = e.target.value;
                                    next[qIdx] = { ...next[qIdx], options: opts };
                                    // Keep correctIndex valid
                                    if (Number(next[qIdx].correctIndex) >= opts.length) {
                                      next[qIdx].correctIndex = Math.max(0, opts.length - 1);
                                    }
                                    return { ...p, questions: next };
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setDraft((p) => {
                                    const next = [...p.questions];
                                    const opts = next[qIdx].options.filter((_, i) => i !== optIdx);
                                    next[qIdx] = { ...next[qIdx], options: opts };
                                    if (Number(next[qIdx].correctIndex) >= opts.length) {
                                      next[qIdx].correctIndex = Math.max(0, opts.length - 1);
                                    }
                                    return { ...p, questions: next };
                                  })
                                }
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                                title="Remove option"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-forest-green-600" />
                Saving publishes immediately if “Published” is checked.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveQuiz}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizzes;

