const Course = require('../models/Course');
const CourseQuestion = require('../models/CourseQuestion');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

const requireBeginner = (req) => {
  if (!req.user || req.user.role !== 'beginner') {
    throw new AppError('Beginner access only', 403);
  }
};

const requireExpert = (req) => {
  if (!req.user || req.user.role !== 'expert') {
    throw new AppError('Expert access only', 403);
  }
};

// POST /api/course-questions
// Beginner only: ask a question about a course/lesson
const createQuestion = asyncHandler(async (req, res) => {
  requireBeginner(req);

  const { courseId, lessonId, question } = req.body || {};
  if (!courseId) throw new AppError('courseId is required', 400);
  if (!question || !String(question).trim()) throw new AppError('question is required', 400);

  const course = await Course.findById(courseId).select('instructor lessons title').lean();
  if (!course) throw new AppError('Course not found', 404);

  let normalizedLessonId = undefined;
  if (lessonId) {
    const exists = Array.isArray(course.lessons) && course.lessons.some((l) => String(l._id) === String(lessonId));
    if (!exists) throw new AppError('Lesson not found in this course', 404);
    normalizedLessonId = lessonId;
  }

  const doc = await CourseQuestion.create({
    course: courseId,
    lessonId: normalizedLessonId,
    expert: course.instructor,
    askedBy: req.user._id,
    question: String(question).trim()
  });

  res.status(201).json({ success: true, data: doc });
});

// GET /api/course-questions/expert?status=open|answered
// Expert only: view questions for their own courses
const getExpertQuestions = asyncHandler(async (req, res) => {
  requireExpert(req);

  const status = req.query?.status;
  const filter = { expert: req.user._id };
  if (status && ['open', 'answered'].includes(String(status))) {
    filter.status = String(status);
  }

  const rows = await CourseQuestion.find(filter)
    .sort({ createdAt: -1 })
    .populate('askedBy', 'name email avatar')
    .populate('course', 'title lessons instructor')
    .lean();

  const data = rows.map((q) => {
    const lessons = q.course?.lessons || [];
    const lesson = q.lessonId ? lessons.find((l) => String(l._id) === String(q.lessonId)) : null;
    return {
      ...q,
      courseTitle: q.course?.title || '',
      lessonTitle: lesson?.title || ''
    };
  });

  res.json({ success: true, count: data.length, data });
});

// GET /api/course-questions/my
// Beginner only: view own questions
const getMyQuestions = asyncHandler(async (req, res) => {
  requireBeginner(req);

  const rows = await CourseQuestion.find({ askedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('expert', 'name email avatar')
    .populate('course', 'title lessons')
    .lean();

  const data = rows.map((q) => {
    const lessons = q.course?.lessons || [];
    const lesson = q.lessonId ? lessons.find((l) => String(l._id) === String(q.lessonId)) : null;
    return {
      ...q,
      courseTitle: q.course?.title || '',
      lessonTitle: lesson?.title || ''
    };
  });

  res.json({ success: true, count: data.length, data });
});

// PUT /api/course-questions/:id/answer
// Expert only: answer a question directed to them
const answerQuestion = asyncHandler(async (req, res) => {
  requireExpert(req);

  const { answer } = req.body || {};
  if (!answer || !String(answer).trim()) throw new AppError('answer is required', 400);

  const q = await CourseQuestion.findById(req.params.id);
  if (!q) throw new AppError('Question not found', 404);
  if (String(q.expert) !== String(req.user._id)) throw new AppError('Not authorized to answer this question', 403);

  q.answer = String(answer).trim();
  q.status = 'answered';
  await q.save();

  res.json({ success: true, data: q });
});

module.exports = {
  createQuestion,
  getExpertQuestions,
  getMyQuestions,
  answerQuestion
};

