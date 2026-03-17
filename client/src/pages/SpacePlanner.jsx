import React, { useState, useRef, useCallback } from 'react';
import { apiCall } from '../utils/api';

const MAX_IMAGES = 3;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

const SUNLIGHT_OPTIONS = [
  { value: '<2h', label: 'Less than 2 hours' },
  { value: '2-4h', label: '2–4 hours' },
  { value: '4-6h', label: '4–6 hours' },
  { value: '>6h', label: '6+ hours' },
];

const SPACE_TYPES = [
  { value: 'balcony', label: 'Balcony' },
  { value: 'windowsill', label: 'Windowsill' },
  { value: 'room_corner', label: 'Room corner' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'patio', label: 'Patio' },
  { value: 'garden_bed', label: 'Garden bed' },
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const SpacePlanner = () => {
  const [form, setForm] = useState({
    spaceType: '',
    areaDescription: '',
    sunlightHours: '',
    sunExposurePattern: '',
    location: '',
    goals: '',
    experienceLevel: 'beginner',
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [designImage, setDesignImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [designLoading, setDesignLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const files = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    setUploadedFiles((prev) => {
      const combined = [...prev, ...files].slice(0, MAX_IMAGES);
      setPreviewUrls((urls) => {
        urls.forEach((u) => URL.revokeObjectURL(u));
        return combined.map((f) => URL.createObjectURL(f));
      });
      return combined;
    });
  }, []);

  const removeFile = (index) => {
    setUploadedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setPreviewUrls((urls) => {
        if (urls[index]) URL.revokeObjectURL(urls[index]);
        return urls.filter((_, i) => i !== index);
      });
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setDesignImage(null);
    const hasImages = uploadedFiles.length > 0;
    if (
      !hasImages &&
      !form.spaceType &&
      !form.areaDescription &&
      !form.sunlightHours &&
      !form.location
    ) {
      setError('Add a photo (drag & drop or choose file), or fill in space type, area, sunlight, or location.');
      return;
    }
    setLoading(true);
    try {
      const imageBase64 =
        uploadedFiles.length > 0
          ? await Promise.all(uploadedFiles.map((f) => fileToDataUrl(f)))
          : [];
      const res = await apiCall('/space-planner/analyze', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: imageBase64.length ? imageBase64 : undefined,
          spaceType: form.spaceType || undefined,
          areaDescription: form.areaDescription || undefined,
          sunlightHours: form.sunlightHours || undefined,
          sunExposurePattern: form.sunExposurePattern || undefined,
          location: form.location || undefined,
          goals: form.goals || undefined,
          experienceLevel: form.experienceLevel || undefined,
        }),
      });
      if (res.success && res.data) setResult(res.data);
      else setError('Analysis failed.');
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDesign = async () => {
    if (!result?.space_summary || !result?.recommendations?.length) return;
    setDesignLoading(true);
    setDesignImage(null);
    setError('');
    try {
      const res = await apiCall('/space-planner/design', {
        method: 'POST',
        body: JSON.stringify({
          spaceSummary: result.space_summary,
          recommendations: result.recommendations,
          baseImageHint: result.space_summary?.notes || undefined,
        }),
      });
      if (res.success && res.data?.imageUrl) setDesignImage(res.data);
      else setError('Design image failed.');
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setDesignLoading(false);
    }
  };

  const summary = result?.space_summary;
  const recommendations = result?.recommendations || [];
  const layoutIdea = result?.layout_idea;
  const followUp = result?.follow_up;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Space Planner</h1>
        <p className="text-gray-600 text-sm mb-6">
          Add a photo of your space (drag & drop or choose file) and a few details. We’ll suggest plants and can generate a layout image.
        </p>

        <form onSubmit={handleAnalyze} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo of your space (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div
              className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
              }}
            >
              <p className="text-gray-600 text-sm mb-2">
                Drag & drop image(s) here, or
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Choose file
              </button>
              <p className="text-gray-400 text-xs mt-2">Up to {MAX_IMAGES} images (JPEG, PNG, WebP, GIF)</p>
            </div>
            {previewUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Space type</label>
              <select
                name="spaceType"
                value={form.spaceType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {SPACE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sunlight</label>
              <select
                name="sunlightHours"
                value={form.sunlightHours}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                {SUNLIGHT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (e.g. 2m x 1m balcony)</label>
            <input
              type="text"
              name="areaDescription"
              value={form.areaDescription}
              onChange={handleChange}
              placeholder="Short description"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City, country</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Kochi, India"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goals (optional)</label>
            <input
              type="text"
              name="goals"
              value={form.goals}
              onChange={handleChange}
              placeholder="e.g. salad greens, snacking fruits"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : 'Get plant recommendations'}
          </button>
        </form>

        {summary && (
          <section className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Your space</h2>
            <p className="text-gray-700 text-sm">{summary.notes}</p>
            <p className="text-gray-500 text-xs mt-1">
              {summary.size_category} · {summary.light_level} · {summary.approx_pot_capacity}
            </p>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Recommended plants</h2>
            <ul className="space-y-3">
              {recommendations.map((r, i) => (
                <li key={i} className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="font-medium text-gray-800">{r.plant_name} {r.variety_hint && `(${r.variety_hint})`}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r.recommended_pot_diameter_cm}cm pot · qty {r.recommended_quantity} · {r.approx_time_to_harvest} · {r.difficulty}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.key_reasons}</p>
                  {r.care_summary && <p className="text-xs text-gray-500 mt-1">{r.care_summary}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {layoutIdea?.summary && (
          <section className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Layout</h2>
            <p className="text-sm text-gray-700">{layoutIdea.summary}</p>
            {layoutIdea.steps?.length > 0 && (
              <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                {layoutIdea.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </section>
        )}

        {followUp?.ask_design_suggestion && followUp?.question && (
          <section className="mb-6">
            <p className="text-gray-700 text-sm mb-2">{followUp.question}</p>
            <button
              type="button"
              onClick={handleGetDesign}
              disabled={designLoading}
              className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              {designLoading ? 'Generating image…' : 'Yes, show layout image (if available)'}
            </button>
          </section>
        )}

        {designImage?.imageUrl && (
          <section className="p-4 bg-white rounded-xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Layout preview</h2>
            <img
              src={designImage.imageUrl}
              alt="Space layout with recommended plants"
              className="w-full rounded-lg border border-gray-200"
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default SpacePlanner;
