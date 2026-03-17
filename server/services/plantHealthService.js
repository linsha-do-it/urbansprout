const axios = require('axios');

/**
 * PlantHealthService
 *
 * Single entry-point for plant health / disease / pest / deficiency analysis.
 * - Accepts an image buffer
 * - Calls the configured provider (mock / hosted vision API / custom HTTP endpoint)
 * - Normalizes the response into a beginner‑friendly structure
 *
 * This module is intentionally self‑contained so it can be wired into
 * controllers and routes later without changing its core API.
 */
class PlantHealthService {
  constructor() {
    // Provider can be: 'mock' | 'vertex' | 'rekognition' | 'custom'
    this.provider = (process.env.PLANT_HEALTH_PROVIDER || 'mock').toLowerCase();

    // Generic custom HTTP endpoint (for your own model server, FastAPI, etc.)
    this.customEndpoint = process.env.PLANT_HEALTH_CUSTOM_ENDPOINT || '';

    // Google Vertex Vision / other GCP services
    this.vertexEndpoint = process.env.PLANT_HEALTH_VERTEX_ENDPOINT || '';
    this.vertexApiKey = process.env.PLANT_HEALTH_VERTEX_API_KEY || '';

    // AWS Rekognition style configuration (not implemented end‑to‑end, but wired)
    this.awsRegion = process.env.PLANT_HEALTH_AWS_REGION || '';
    this.awsAccessKeyId = process.env.PLANT_HEALTH_AWS_ACCESS_KEY_ID || '';
    this.awsSecretAccessKey = process.env.PLANT_HEALTH_AWS_SECRET_ACCESS_KEY || '';

    if (this.provider === 'mock') {
      console.log('🌿 PlantHealthService running in MOCK mode (no real ML calls).');
    }
  }

  /**
   * Public API used by controllers.
   *
   * @param {Buffer} imageBuffer - Raw image bytes
   * @param {Object} options
   * @param {string} [options.filename]
   * @param {string} [options.mimeType]
   * @returns {Promise<Object>} Standardized analysis result
   */
  async analyzeImage(imageBuffer, options = {}) {
    if (!imageBuffer || !imageBuffer.length) {
      throw new Error('No image data provided for analysis.');
    }

    let rawResult;

    switch (this.provider) {
      case 'vertex':
        rawResult = await this.analyzeWithVertex(imageBuffer, options);
        break;
      case 'rekognition':
        rawResult = await this.analyzeWithRekognition(imageBuffer, options);
        break;
      case 'custom':
        rawResult = await this.analyzeWithCustomEndpoint(imageBuffer, options);
        break;
      case 'mock':
      default:
        rawResult = await this.analyzeWithMock(imageBuffer, options);
        break;
    }

    // Normalize into a consistent beginner‑friendly shape.
    return this.normalizeResult(rawResult);
  }

  /**
   * MOCK provider – returns deterministic, human‑readable data.
   * Useful for local development and for beginners who just want
   * to see the flow working before wiring a real model.
   */
  async analyzeWithMock(_buffer, _options) {
    return {
      provider: 'mock',
      model: 'plant-health-mock-v1',
      predictions: [
        {
          label: 'Early blight (tomato)',
          category: 'disease',
          confidence: 0.92,
          severityScore: 0.65, // 0‑1 scale
          explanation:
            'Dark brown circular spots with yellow halos on lower leaves. Typical of early blight in tomatoes.',
          treatments: [
            'Remove heavily infected lower leaves and dispose of them (do not compost).',
            'Avoid overhead watering; water at the base in the morning.',
            'Improve air circulation by lightly pruning dense foliage.',
            'Use a copper‑based fungicide labeled for tomatoes if disease is spreading.'
          ],
          preventionTips: [
            'Rotate crops; avoid planting tomatoes in the same spot each year.',
            'Mulch around the base to reduce soil splash.',
            'Space plants to allow good airflow.'
          ]
        }
      ]
    };
  }

  /**
   * Example skeleton for Google Vertex AI Vision / custom vision models.
   * This does NOT include authentication boilerplate; instead it expects
   * a simple API key or pre‑authorized endpoint configured via env vars.
   */
  async analyzeWithVertex(imageBuffer, options = {}) {
    if (!this.vertexEndpoint || !this.vertexApiKey) {
      throw new Error(
        'Vertex provider selected but PLANT_HEALTH_VERTEX_ENDPOINT or PLANT_HEALTH_VERTEX_API_KEY is not set.'
      );
    }

    const base64Image = imageBuffer.toString('base64');

    try {
      const response = await axios.post(
        this.vertexEndpoint,
        {
          image: {
            content: base64Image
          },
          metadata: {
            filename: options.filename || null,
            mimeType: options.mimeType || null
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.vertexApiKey
          },
          timeout: 15000
        }
      );

      return {
        provider: 'vertex',
        model: response.data?.model || 'vertex-plant-health',
        predictions: response.data?.predictions || []
      };
    } catch (error) {
      console.error('Vertex plant health error:', error.response?.data || error.message);
      throw new Error('Failed to analyze image with Vertex provider.');
    }
  }

  /**
   * Placeholder for AWS Rekognition or similar hosted vision APIs.
   * This is intentionally minimal and can be expanded if you decide
   * to use AWS for production.
   */
  async analyzeWithRekognition(_imageBuffer, _options = {}) {
    throw new Error(
      'Rekognition provider is not fully implemented yet. Choose "mock", "vertex", or "custom", or extend analyzeWithRekognition.'
    );
  }

  /**
   * Generic HTTP endpoint provider for custom Python/ML servers.
   * Expects a POST endpoint that accepts a base64 image and returns
   * a `predictions` array compatible with normalizeResult().
   */
  async analyzeWithCustomEndpoint(imageBuffer, options = {}) {
    if (!this.customEndpoint) {
      throw new Error(
        'Custom provider selected but PLANT_HEALTH_CUSTOM_ENDPOINT is not set.'
      );
    }

    const base64Image = imageBuffer.toString('base64');

    try {
      const response = await axios.post(
        this.customEndpoint,
        {
          image: base64Image,
          filename: options.filename || null,
          mimeType: options.mimeType || null
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      return {
        provider: 'custom',
        model: response.data?.model || 'custom-plant-health-model',
        predictions: response.data?.predictions || []
      };
    } catch (error) {
      console.error('Custom plant health endpoint error:', error.response?.data || error.message);
      throw new Error('Failed to analyze image with custom plant health endpoint.');
    }
  }

  /**
   * Convert provider‑specific output into a single, clean structure
   * tailored for beginner users and UI consumption.
   */
  normalizeResult(raw) {
    const provider = raw?.provider || this.provider || 'unknown';
    const model = raw?.model || 'unknown-model';

    const top =
      raw?.predictions && raw.predictions.length > 0
        ? raw.predictions[0]
        : {
            label: 'Unknown issue',
            category: 'unknown',
            confidence: 0.0,
            severityScore: 0.0,
            explanation:
              'The system could not confidently recognize a specific disease, pest, or deficiency from this photo.',
            treatments: [],
            preventionTips: []
          };

    const severity = this.mapSeverity(top.severityScore);

    return {
      success: true,
      plantHealth: {
        label: top.label || 'Unknown issue',
        category: top.category || 'unknown', // disease | pest | deficiency | healthy | unknown
        confidence: typeof top.confidence === 'number' ? top.confidence : null,
        severity,
        explanation: top.explanation || null,
        recommendations: {
          immediateCare: Array.isArray(top.treatments) ? top.treatments : [],
          prevention: Array.isArray(top.preventionTips) ? top.preventionTips : []
        }
      },
      metadata: {
        provider,
        model,
        rawPredictions: raw.predictions || []
      }
    };
  }

  /**
   * Translate a numeric severity score into human‑friendly buckets.
   * Accepts 0‑1 or 0‑100; values outside the range are clamped.
   */
  mapSeverity(rawScore) {
    if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
      return {
        level: 'unknown',
        score: null,
        description: 'Severity could not be determined from this photo.'
      };
    }

    let score = rawScore;
    if (score > 1) {
      score = score / 100;
    }
    score = Math.min(Math.max(score, 0), 1);

    let level;
    let description;

    if (score < 0.25) {
      level = 'mild';
      description =
        'Early or mild symptoms. With quick action, the plant should recover well.';
    } else if (score < 0.6) {
      level = 'moderate';
      description =
        'Noticeable problem that needs attention soon to prevent serious damage.';
    } else {
      level = 'severe';
      description =
        'Significant damage detected. Take action immediately and consider removing heavily affected parts.';
    }

    return {
      level,
      score: Number(score.toFixed(2)),
      description
    };
  }
}

module.exports = new PlantHealthService();

