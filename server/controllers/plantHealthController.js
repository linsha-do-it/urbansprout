const plantHealthService = require('../services/plantHealthService');

/**
 * POST /api/plant-health/analyze
 *
 * Accepts:
 * - multipart/form-data with field "image" (recommended)
 * - OR JSON { imageBase64: "data..." } for clients that cannot use multipart
 *
 * Returns a normalized, beginner‑friendly analysis result.
 */
exports.analyzePlant = async (req, res, next) => {
  try {
    let imageBuffer = null;
    let mimeType = null;
    let filename = null;

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      filename = req.file.originalname;
    } else if (req.body && req.body.imageBase64) {
      const base64String = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64String, 'base64');
      mimeType = 'image/jpeg';
      filename = 'upload-from-base64.jpg';
    }

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        message: 'No image provided. Please upload a plant photo.'
      });
    }

    const result = await plantHealthService.analyzeImage(imageBuffer, {
      mimeType,
      filename
    });

    return res.json(result);
  } catch (err) {
    console.error('Plant health analysis error:', err);
    return next(err);
  }
};

