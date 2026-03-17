const axios = require('axios');

// Space planner now uses Gemini (Google Generative Language API) instead of OpenAI.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SPACE_PLANNER_MODEL =
  process.env.GEMINI_SPACE_PLANNER_MODEL || 'gemini-flash-latest';

if (!GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY is not set in server/.env (or server/.envnew). Space planner will return an error until it is configured.'
  );
}

function svgLayoutFallback({ spaceSummary, recommendations, note }) {
  const spaceType = spaceSummary?.space_type || 'space';
  const sizeCategory = spaceSummary?.size_category || 'unknown';
  const lightLevel = spaceSummary?.light_level || 'unknown';
  const plantSummaries =
    Array.isArray(recommendations) && recommendations.length > 0
      ? recommendations
          .slice(0, 6)
          .map(
            (r) =>
              `${r.plant_name || 'plant'} (${r.recommended_pot_diameter_cm || 20}cm × ${r.recommended_quantity || 1})`
          )
          .join(', ')
      : 'No plants provided.';

  const escape = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const lines = [
    `Space: ${sizeCategory} ${spaceType}`,
    `Light: ${lightLevel}`,
    `Plants: ${plantSummaries}`,
    note || 'Layout image is shown as a text card.'
  ];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#ffffff"/>
  <rect x="64" y="64" width="896" height="896" rx="32" fill="#f9fafb" stroke="#e5e7eb" stroke-width="4"/>
  <text x="96" y="140" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="#111827">${escape(
    'Layout preview'
  )}</text>
  ${lines
    .slice(0, 5)
    .map(
      (t, i) =>
        `<text x="96" y="${220 + i * 64}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#374151">${escape(
          t
        )}</text>`
    )
    .join('\n')}
  <text x="96" y="900" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#6b7280">Gemini Space Planner enabled • Image generation not configured</text>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function toGeminiInlineData(dataUrlOrBase64) {
  const t = typeof dataUrlOrBase64 === 'string' ? dataUrlOrBase64.trim() : '';
  if (!t) return null;
  const m = t.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (m) return { mimeType: m[1], data: m[2] };
  // Assume raw base64 jpeg when not a data URL
  return { mimeType: 'image/jpeg', data: t.replace(/^data:.*?base64,/, '') };
}

function extractJsonObject(text) {
  const s = typeof text === 'string' ? text.trim() : '';
  if (!s) return null;
  // strip common code fences
  const unfenced = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  // best-effort: take first JSON object block
  const match = unfenced.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function analyzeSpaceWithGemini(params) {
  if (!GEMINI_API_KEY) {
    const error = new Error('Gemini API key not configured');
    error.statusCode = 500;
    throw error;
  }

  const {
    imageUrls = [],
    imageBase64 = [],
    spaceType,
    areaDescription,
    sunlightHours,
    sunExposurePattern,
    location,
    climateNotes,
    goals,
    experienceLevel
  } = params || {};

  const userContextParts = [];
  if (spaceType) userContextParts.push(`Space type: ${spaceType}`);
  if (areaDescription) userContextParts.push(`Area description: ${areaDescription}`);
  if (sunlightHours) userContextParts.push(`Sunlight hours category: ${sunlightHours}`);
  if (sunExposurePattern) userContextParts.push(`Sun exposure pattern: ${sunExposurePattern}`);
  if (location) userContextParts.push(`Location: ${location}`);
  if (climateNotes) userContextParts.push(`Climate notes: ${climateNotes}`);
  if (goals) userContextParts.push(`User goals: ${goals}`);
  if (experienceLevel) userContextParts.push(`Experience level: ${experienceLevel}`);

  const systemInstruction =
    'You are Sprouty, an expert edible-plant space planner for small urban spaces.\n' +
    'Hard rules:\n' +
    '- Recommend ONLY edible vegetables and fruits (no ornamentals, no herbs/spices).\n' +
    '- Output MUST be a single VALID JSON object (no markdown fences, no commentary, no trailing commas).\n' +
    '- Use double quotes for all JSON keys and string values.\n' +
    '- Follow this structure EXACTLY (types matter):\n' +
    '{\n' +
    '  "space_summary": {\n' +
    '    "space_type": "balcony|windowsill|room_corner|rooftop|patio|garden_bed|unknown",\n' +
    '    "size_category": "very_small|small|medium|large|unknown",\n' +
    '    "approx_pot_capacity": "short string",\n' +
    '    "light_level": "very_low|low|medium|high|mixed|unknown",\n' +
    '    "notes": "short string"\n' +
    '  },\n' +
    '  "constraints": {\n' +
    '    "indoor_or_outdoor": "indoor|outdoor|mixed|unknown",\n' +
    '    "sunlight_hours": "<2h|2-4h|4-6h|>6h|unknown",\n' +
    '    "sun_exposure_pattern": "morning|afternoon|all_day|mixed|unknown",\n' +
    '    "location": "string",\n' +
    '    "climate_notes": "string"\n' +
    '  },\n' +
    '  "recommendations": [\n' +
    '    {\n' +
    '      "plant_name": "string",\n' +
    '      "category": "vegetable|fruit",\n' +
    '      "variety_hint": "string",\n' +
    '      "sun_requirement": "low|medium|high|flexible",\n' +
    '      "recommended_pot_diameter_cm": 20,\n' +
    '      "recommended_quantity": 1,\n' +
    '      "difficulty": "beginner|intermediate|advanced",\n' +
    '      "approx_time_to_harvest": "string",\n' +
    '      "key_reasons": "string",\n' +
    '      "care_summary": "string"\n' +
    '    }\n' +
    '  ],\n' +
    '  "layout_idea": { "summary": "string", "steps": ["string"] },\n' +
    '  "follow_up": { "ask_design_suggestion": true, "question": "string" }\n' +
    '}\n' +
    '\n' +
    'Return your answer by filling this exact template (keep the same keys):\n' +
    '{\n' +
    '  "space_summary": {\n' +
    '    "space_type": "unknown",\n' +
    '    "size_category": "unknown",\n' +
    '    "approx_pot_capacity": "",\n' +
    '    "light_level": "unknown",\n' +
    '    "notes": ""\n' +
    '  },\n' +
    '  "constraints": {\n' +
    '    "indoor_or_outdoor": "unknown",\n' +
    '    "sunlight_hours": "unknown",\n' +
    '    "sun_exposure_pattern": "unknown",\n' +
    '    "location": "unknown",\n' +
    '    "climate_notes": ""\n' +
    '  },\n' +
    '  "recommendations": [],\n' +
    '  "layout_idea": { "summary": "", "steps": [] },\n' +
    '  "follow_up": { "ask_design_suggestion": true, "question": "" }\n' +
    '}';

  const textDescription =
    userContextParts.length > 0
      ? 'User-provided context:\n' + userContextParts.join('\n')
      : 'User did not provide additional text context.';

  const parts = [{ text: textDescription }];

  // NOTE: Gemini API requires inlineData (base64) for images; it cannot fetch arbitrary URLs without extra steps.
  // If the client sent URLs, we treat them as extra text hints.
  for (const url of imageUrls) {
    if (typeof url === 'string' && url.trim()) {
      parts.push({ text: `Image URL (hint): ${url.trim()}` });
    }
  }
  for (const b64 of imageBase64) {
    const inlineData = toGeminiInlineData(b64);
    if (inlineData) parts.push({ inlineData });
  }

  const modelName = GEMINI_SPACE_PLANNER_MODEL.startsWith('models/')
    ? GEMINI_SPACE_PLANNER_MODEL
    : `models/${GEMINI_SPACE_PLANNER_MODEL}`;

  // Do NOT URL-encode the path segment (it contains slashes like "models/...").
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  try {
    const callGemini = async (userParts, sysText) => {
      const response = await axios.post(
        endpoint,
        {
          systemInstruction: { parts: [{ text: sysText }] },
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
        },
        { timeout: 30000 }
      );
      const text = response.data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join('\n');
      return { text, raw: response.data };
    };

    const first = await callGemini(parts, systemInstruction);
    const jsonText1 = extractJsonObject(first.text);
    let parsed = null;

    const isSchemaOk = (obj) =>
      obj &&
      typeof obj === 'object' &&
      obj.space_summary &&
      typeof obj.space_summary === 'object' &&
      Array.isArray(obj.recommendations);

    if (jsonText1) {
      try {
        parsed = JSON.parse(jsonText1);
      } catch {
        parsed = null;
      }
    }

    if (!isSchemaOk(parsed)) {
      throw new Error('Gemini space planner did not return valid structured data');
    }

    return parsed;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      const error = new Error('Gemini API key unauthorized (check GEMINI_API_KEY)');
      error.statusCode = status;
      throw error;
    }
    // For 429 or other errors, just bubble a clean error up to the client.
    console.error('Gemini space planner error:', err.response?.data || err.message);
    const error = new Error('Failed to analyze space with Gemini');
    error.statusCode = 502;
    throw error;
  }
}

/**
 * Analyze a growing space using images + basic metadata and return structured, concise plant recommendations.
 *
 * @param {Object} params
 * @param {string[]} [params.imageUrls] - Publicly accessible image URLs for the space (optional).
 * @param {string[]} [params.imageBase64] - Base64 image data (data URLs or raw base64 strings) from upload/camera (optional).
 * @param {string} [params.spaceType] - e.g. "balcony", "windowsill", "room_corner", "rooftop".
 * @param {string} [params.areaDescription] - Free-text size description, e.g. "2m x 1m balcony".
 * @param {string} [params.sunlightHours] - Categorical: "<2h", "2-4h", "4-6h", ">6h".
 * @param {string} [params.sunExposurePattern] - e.g. "morning", "afternoon", "mixed".
 * @param {string} [params.location] - City + country, e.g. "Kochi, India".
 * @param {string} [params.climateNotes] - Optional extra notes about climate.
 * @param {string} [params.goals] - e.g. "salad greens", "snacking fruits", "low maintenance".
 * @param {string} [params.experienceLevel] - "beginner" | "intermediate" | "advanced".
 */
// Keep the exported name for backward compatibility with routes.
async function analyzeSpaceWithOpenAI(params) {
  return analyzeSpaceWithGemini(params);
}

/**
 * Generate a balcony/space design image with the recommended plants.
 * Creates a new concept image (does not edit the user's photo).
 *
 * @param {Object} params
 * @param {Object} params.spaceSummary - data.space_summary from analyzeSpaceWithOpenAI
 * @param {Array} params.recommendations - data.recommendations (or subset)
 * @param {string} [params.baseImageHint] - optional short description of the original space.
 */
async function generateDesignImage(params) {
  // Gemini image generation isn't configured here; just signal this clearly.
  const error = new Error('Layout image generation is not configured for Gemini in this project.');
  error.statusCode = 501;
  throw error;
}

module.exports = {
  analyzeSpaceWithOpenAI,
  generateDesignImage
};

