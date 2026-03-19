const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { Readable } = require('stream');
const csvParser = require('csv-parser');

const requireAdmin = (req) => {
  if (!req || (!req.isAdmin && req.user?.role !== 'admin')) {
    throw new AppError('Admin access only', 403);
  }
};

// GET /api/quizzes?area=&level=
// List published quizzes, optionally filtered by area and level
const getQuizzes = asyncHandler(async (req, res) => {
  const { area, level } = req.query || {};
  const filter = { isPublished: true };

  if (area) {
    filter.area = String(area);
  }
  if (level && ['beginner', 'intermediate', 'advanced'].includes(String(level))) {
    filter.level = String(level);
  }

  const quizzes = await Quiz.find(filter)
    .select('title area level description passingScore questions')
    .sort({ createdAt: -1 })
    .lean();

  // Do not send correct answers to client
  const safe = quizzes.map(q => ({
    _id: q._id,
    title: q.title,
    area: q.area,
    level: q.level,
    description: q.description,
    passingScore: q.passingScore,
    questions: (q.questions || []).map((ques) => ({
      text: ques.text,
      options: ques.options,
      points: ques.points,
    })),
  }));

  res.json({ success: true, count: safe.length, data: safe });
});

// GET /api/quizzes/:id
// Single quiz detail without correct answers
const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .select('title area level description passingScore questions')
    .lean();
  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  const safe = {
    _id: quiz._id,
    title: quiz.title,
    area: quiz.area,
    level: quiz.level,
    description: quiz.description,
    passingScore: quiz.passingScore,
    questions: (quiz.questions || []).map((ques) => ({
      text: ques.text,
      options: ques.options,
      points: ques.points,
    })),
  };

  res.json({ success: true, data: safe });
});

// =========================
// Admin CRUD
// =========================

// GET /api/admin/quizzes?area=&level=&published=&search=
const adminListQuizzes = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const { area, level, published, search } = req.query || {};
  const filter = {};
  if (area) filter.area = String(area);
  if (level && ['beginner', 'intermediate', 'advanced'].includes(String(level))) {
    filter.level = String(level);
  }
  if (published === 'true') filter.isPublished = true;
  if (published === 'false') filter.isPublished = false;
  if (search) {
    filter.title = { $regex: String(search).trim(), $options: 'i' };
  }

  const quizzes = await Quiz.find(filter)
    .sort({ updatedAt: -1 })
    .lean();

  res.json({ success: true, count: quizzes.length, data: quizzes });
});

// GET /api/admin/quizzes/:id
const adminGetQuiz = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) throw new AppError('Quiz not found', 404);
  res.json({ success: true, data: quiz });
});

// POST /api/admin/quizzes
const adminCreateQuiz = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const payload = req.body || {};
  const quiz = await Quiz.create({
    title: payload.title,
    area: payload.area,
    level: payload.level,
    description: payload.description || '',
    passingScore: typeof payload.passingScore === 'number' ? payload.passingScore : Number(payload.passingScore || 70),
    isPublished: Boolean(payload.isPublished),
    questions: payload.questions,
  });

  res.status(201).json({ success: true, data: quiz });
});

// PUT /api/admin/quizzes/:id
const adminUpdateQuiz = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const payload = req.body || {};
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  if (payload.title !== undefined) quiz.title = payload.title;
  if (payload.area !== undefined) quiz.area = payload.area;
  if (payload.level !== undefined) quiz.level = payload.level;
  if (payload.description !== undefined) quiz.description = payload.description;
  if (payload.passingScore !== undefined) quiz.passingScore = Number(payload.passingScore);
  if (payload.isPublished !== undefined) quiz.isPublished = Boolean(payload.isPublished);
  if (payload.questions !== undefined) quiz.questions = payload.questions;

  await quiz.save();
  res.json({ success: true, data: quiz });
});

// PATCH /api/admin/quizzes/:id/publish
// Body: { isPublished: boolean }
const adminSetPublished = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  quiz.isPublished = Boolean(req.body?.isPublished);
  await quiz.save();
  res.json({ success: true, data: quiz });
});

// DELETE /api/admin/quizzes/:id
const adminDeleteQuiz = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);

  await quiz.deleteOne();
  res.json({ success: true, data: {} });
});

// POST /api/admin/quizzes/upload-csv
// Upload CSV to create/update quizzes in bulk.
// CSV format (one row per question):
// title,area,level,description,passingScore,isPublished,question,option1,option2,option3,option4,correctIndex,points,mode
// mode: "append" (default) | "replace" (replaces existing questions on same quiz key)
const adminUploadQuizzesCsv = asyncHandler(async (req, res) => {
  requireAdmin(req);

  if (!req.file || !req.file.buffer) {
    throw new AppError('No file provided', 400);
  }

  const rows = [];
  const errors = [];

  const stream = Readable.from(req.file.buffer);
  await new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on('data', (data) => rows.push(data))
      .on('error', (err) => reject(err))
      .on('end', resolve);
  });

  // Group by (title|area|level)
  const groups = new Map();

  const normLevel = (v) => String(v || '').trim().toLowerCase();
  const normBool = (v) => {
    const s = String(v || '').trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
    return undefined;
  };

  rows.forEach((r, idx) => {
    const line = idx + 2; // header = 1
    const title = String(r.title || '').trim();
    const area = String(r.area || '').trim();
    const level = normLevel(r.level);
    const description = String(r.description || '').trim();
    const passingScore = r.passingScore !== undefined && r.passingScore !== '' ? Number(r.passingScore) : 70;
    const isPublished = normBool(r.isPublished);
    const questionText = String(r.question || '').trim();

    const options = [
      String(r.option1 || '').trim(),
      String(r.option2 || '').trim(),
      String(r.option3 || '').trim(),
      String(r.option4 || '').trim(),
    ].filter(Boolean);

    const correctIndex = r.correctIndex !== undefined && r.correctIndex !== '' ? Number(r.correctIndex) : NaN;
    const points = r.points !== undefined && r.points !== '' ? Number(r.points) : 1;
    const mode = String(r.mode || 'append').trim().toLowerCase();

    if (!title) return errors.push(`Line ${line}: title is required`);
    if (!area) return errors.push(`Line ${line}: area is required`);
    if (!['beginner', 'intermediate', 'advanced'].includes(level)) return errors.push(`Line ${line}: level must be beginner|intermediate|advanced`);
    if (!questionText) return errors.push(`Line ${line}: question is required`);
    if (options.length < 2) return errors.push(`Line ${line}: at least option1 and option2 are required`);
    if (Number.isNaN(passingScore) || passingScore < 0 || passingScore > 100) return errors.push(`Line ${line}: passingScore must be 0..100`);
    if (Number.isNaN(points) || points < 0) return errors.push(`Line ${line}: points must be >= 0`);
    if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      return errors.push(`Line ${line}: correctIndex must be between 0 and ${options.length - 1}`);
    }
    if (!['append', 'replace'].includes(mode)) return errors.push(`Line ${line}: mode must be append|replace`);

    const key = `${title}|||${area}|||${level}`;
    if (!groups.has(key)) {
      groups.set(key, {
        title,
        area,
        level,
        description,
        passingScore,
        isPublished: isPublished === undefined ? true : isPublished,
        mode,
        questions: [],
      });
    }
    const g = groups.get(key);
    // If any row says replace, treat whole quiz as replace
    if (mode === 'replace') g.mode = 'replace';
    if (description) g.description = description;
    if (!Number.isNaN(passingScore)) g.passingScore = passingScore;
    if (isPublished !== undefined) g.isPublished = isPublished;

    g.questions.push({
      text: questionText,
      options,
      correctIndex,
      points,
    });
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'CSV validation failed',
      data: { errors },
    });
  }

  let created = 0;
  let updated = 0;
  let questionsAdded = 0;

  for (const [, g] of groups.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Quiz.findOne({ title: g.title, area: g.area, level: g.level });
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await Quiz.create({
        title: g.title,
        area: g.area,
        level: g.level,
        description: g.description || '',
        passingScore: g.passingScore,
        isPublished: Boolean(g.isPublished),
        questions: g.questions,
      });
      created += 1;
      questionsAdded += g.questions.length;
    } else {
      existing.description = g.description || existing.description || '';
      existing.passingScore = g.passingScore;
      existing.isPublished = Boolean(g.isPublished);
      if (g.mode === 'replace') {
        existing.questions = g.questions;
        questionsAdded += g.questions.length;
      } else {
        existing.questions = Array.isArray(existing.questions) ? existing.questions : [];
        existing.questions.push(...g.questions);
        questionsAdded += g.questions.length;
      }
      // eslint-disable-next-line no-await-in-loop
      await existing.save();
      updated += 1;
    }
  }

  return res.json({
    success: true,
    data: {
      totalRows: rows.length,
      quizzesCreated: created,
      quizzesUpdated: updated,
      questionsAdded,
    },
  });
});

// POST /api/quizzes/:id/submit
// Body: { answers: [Number] } – index per question
// Returns score and whether badge earned
const submitQuiz = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz || !quiz.isPublished) {
    throw new AppError('Quiz not found', 404);
  }

  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const questions = quiz.questions || [];

  if (answers.length !== questions.length) {
    throw new AppError('Answers length does not match questions', 400);
  }

  let totalPoints = 0;
  let earnedPoints = 0;

  questions.forEach((q, idx) => {
    const pts = typeof q.points === 'number' ? q.points : 1;
    totalPoints += pts;
    const answerIndex = typeof answers[idx] === 'number' ? answers[idx] : -1;
    if (answerIndex === q.correctIndex) {
      earnedPoints += pts;
    }
  });

  const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percent >= (quiz.passingScore || 70);

  let badgeEarned = false;
  let badge;

  if (passed) {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.badges = Array.isArray(user.badges) ? user.badges : [];

    const key = `quiz:${quiz._id.toString()}`;
    const exists = user.badges.some((b) => b.key === key);

    if (!exists) {
      const label = `${quiz.title} – ${quiz.level.charAt(0).toUpperCase()}${quiz.level.slice(1)}`;
      badge = {
        key,
        label,
        area: quiz.area,
        level: quiz.level,
        quiz: quiz._id,
      };
      user.badges.push(badge);
      await user.save();
      badgeEarned = true;
    } else {
      badge = user.badges.find((b) => b.key === key);
    }
  }

  res.json({
    success: true,
    data: {
      score: {
        earnedPoints,
        totalPoints,
        percent,
        passed,
        passingScore: quiz.passingScore || 70,
      },
      badgeEarned,
      badge,
    },
  });
});

module.exports = {
  getQuizzes,
  getQuizById,
  submitQuiz,
  adminListQuizzes,
  adminGetQuiz,
  adminCreateQuiz,
  adminUpdateQuiz,
  adminSetPublished,
  adminDeleteQuiz,
  adminUploadQuizzesCsv,
};

