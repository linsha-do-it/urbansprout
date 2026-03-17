const fetch = require('node-fetch');

/**
 * Analyze blog content using a transformer-based toxicity model.
 * This service is designed to work with a Hugging Face BERT toxicity model.
 *
 * It expects the environment variable HF_API_KEY to be set. If the key or
 * remote model are not available, it falls back to a very simple keyword-based
 * heuristic so that the rest of the pipeline keeps working.
 */

const HF_API_URL =
  process.env.HF_TOXICITY_MODEL_URL ||
  'https://api-inference.huggingface.co/models/unitary/toxic-bert';

const HF_API_KEY = process.env.HF_API_KEY;

// Categories we expose to the rest of the app
const CATEGORY_KEYS = [
  'toxicity',
  'hate',
  'religious_attack',
  'sexual_content',
  'threat',
  'harassment',
  'identity_attack',
  'political_propaganda',
  'profanity',
];

/**
 * Map raw model labels to our canonical category keys.
 * This will depend on the chosen model. For unitary/toxic-bert-like models,
 * labels are often things like "toxic", "severe_toxic", "obscene", etc.
 */
function mapModelLabelsToCategories(rawScores) {
  const categories = {};

  // Start with zeros
  CATEGORY_KEYS.forEach((key) => {
    categories[key] = 0;
  });

  rawScores.forEach((item) => {
    const label = String(item.label || '').toLowerCase();
    const score = typeof item.score === 'number' ? item.score : 0;

    if (label.includes('toxic')) {
      categories.toxicity = Math.max(categories.toxicity, score);
    }
    if (label.includes('hate')) {
      categories.hate = Math.max(categories.hate, score);
      categories.identity_attack = Math.max(categories.identity_attack, score);
    }
    if (label.includes('relig')) {
      categories.religious_attack = Math.max(categories.religious_attack, score);
    }
    if (label.includes('sexual') || label.includes('obscene')) {
      categories.sexual_content = Math.max(categories.sexual_content, score);
    }
    if (label.includes('threat')) {
      categories.threat = Math.max(categories.threat, score);
    }
    if (label.includes('insult') || label.includes('harass')) {
      categories.harassment = Math.max(categories.harassment, score);
    }
    if (label.includes('identity') || label.includes('religion') || label.includes('race')) {
      categories.identity_attack = Math.max(categories.identity_attack, score);
    }
    if (label.includes('politic')) {
      categories.political_propaganda = Math.max(
        categories.political_propaganda,
        score
      );
    }
    if (label.includes('obscene') || label.includes('insult') || label.includes('toxic')) {
      categories.profanity = Math.max(categories.profanity, score);
    }
  });

  return categories;
}

async function callHuggingFace(text) {
  if (!HF_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      console.error('HF toxicity API error:', await response.text());
      return null;
    }

    const data = await response.json();

    let rawScores;

    // Some models return [[{ label, score }]], others [{ label, score }]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      rawScores = data[0];
    } else if (Array.isArray(data)) {
      rawScores = data;
    } else {
      console.error('HF toxicity API unexpected response shape:', data);
      return null;
    }

    if (!rawScores.every((item) => item && typeof item.label === 'string')) {
      console.error('HF toxicity API invalid label/score payload:', rawScores);
      return null;
    }

    return rawScores;
  } catch (err) {
    console.error('HF toxicity API exception:', err);
    return null;
  }
}

/**
 * Very small keyword-based fallback when HF model is not configured.
 * This is intentionally simple and conservative.
 */
function heuristicScores(text) {
  const lowered = text.toLowerCase();

  const badWords = [
    'hate',
    'kill',
    'stupid',
    'idiot',
    'fuck',
    'fucking',
    'bitch',
    'bastard',
  ];
  const religiousWords = ['religion', 'hindu', 'muslim', 'christian'];
  const sexualWords = ['sex', 'porn', 'nude'];
  const threatWords = ['bomb', 'attack', 'destroy', 'murder', 'beat you', 'kill you'];
  const politicalWords = ['election', 'party', 'vote', 'propaganda'];

  const categories = {};
  CATEGORY_KEYS.forEach((key) => (categories[key] = 0));

  const containsAny = (list) => list.some((w) => lowered.includes(w));

  if (containsAny(badWords)) {
    categories.toxicity = 0.45;
    categories.harassment = 0.45;
    categories.profanity = 0.4;
  }
  if (containsAny(religiousWords)) {
    categories.religious_attack = 0.4;
  }
  if (containsAny(sexualWords)) {
    categories.sexual_content = 0.5;
  }
  if (containsAny(threatWords)) {
    categories.threat = 0.8;
    categories.toxicity = Math.max(categories.toxicity, 0.8);
  }
  if (containsAny(politicalWords)) {
    categories.political_propaganda = 0.5;
  }

  return categories;
}

/**
 * Analyze a blog's text and return:
 * - overallScore: max category score
 * - categories: per-category scores
 * - moderationDecision: 'safe' | 'flagged' | 'removed'
 */
async function analyzeBlogContent(text) {
  let categories;

  const raw = await callHuggingFace(text);
  if (raw) {
    categories = mapModelLabelsToCategories(raw);
  } else {
    categories = heuristicScores(text);
  }

  const scores = Object.values(categories);
  const overallScore = scores.length ? Math.max(...scores) : 0;

  let moderationDecision = 'safe';
  if (overallScore >= 0.75) {
    moderationDecision = 'removed';
  } else if (overallScore >= 0.4) {
    moderationDecision = 'flagged';
  }

  // Helpful for debugging moderation behaviour in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('📝 Blog moderation result:', {
      sample: (text || '').slice(0, 120),
      overallScore,
      categories,
      moderationDecision,
    });
  }

  return {
    overallScore,
    categories,
    moderationDecision,
  };
}

module.exports = {
  analyzeBlogContent,
  CATEGORY_KEYS,
};

