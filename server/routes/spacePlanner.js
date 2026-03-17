const express = require('express');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const {
  analyzeSpaceWithOpenAI,
  generateDesignImage
} = require('../services/openaiSpacePlannerService');

const router = express.Router();

// POST /api/space-planner/analyze
// Public: analyzes a growing space using optional images + context and returns plant recommendations
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const {
      imageUrls,
      imageBase64,
      spaceType,
      areaDescription,
      sunlightHours,
      sunExposurePattern,
      location,
      climateNotes,
      goals,
      experienceLevel
    } = req.body || {};

    const hasImages = (arr) => Array.isArray(arr) && arr.length > 0;
    const normalizedImageUrls = Array.isArray(imageUrls)
      ? imageUrls
      : imageUrls && typeof imageUrls === 'string'
      ? [imageUrls]
      : [];
    const normalizedImageBase64 = Array.isArray(imageBase64)
      ? imageBase64.filter((s) => typeof s === 'string' && s.trim())
      : [];

    if (
      !hasImages(normalizedImageUrls) &&
      !hasImages(normalizedImageBase64) &&
      !spaceType &&
      !areaDescription &&
      !sunlightHours &&
      !location
    ) {
      throw new AppError(
        'Please provide at least one of: image (upload/camera), space type, area description, sunlight, or location.',
        400
      );
    }

    const result = await analyzeSpaceWithOpenAI({
      imageUrls: normalizedImageUrls,
      imageBase64: normalizedImageBase64,
      spaceType,
      areaDescription,
      sunlightHours,
      sunExposurePattern,
      location,
      climateNotes,
      goals,
      experienceLevel
    });

    if (!result.follow_up) {
      result.follow_up = {
        ask_design_suggestion: true,
        question: 'Want a layout image of your space with these plants?'
      };
    }

    res.json({
      success: true,
      data: result
    });
  })
);

// POST /api/space-planner/design
// Public: generates a layout image for the space with the recommended plants
router.post(
  '/design',
  asyncHandler(async (req, res) => {
    const { spaceSummary, recommendations, baseImageHint } = req.body || {};

    if (!spaceSummary || !recommendations || !Array.isArray(recommendations)) {
      throw new AppError(
        'Please provide spaceSummary and recommendations (array) from the analyze result.',
        400
      );
    }

    const result = await generateDesignImage({
      spaceSummary,
      recommendations,
      baseImageHint
    });

    res.json({
      success: true,
      data: result
    });
  })
);

module.exports = router;

