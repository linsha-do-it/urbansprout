const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const Course = require('../models/Course');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const axios = require('axios');
const User = require('../models/User');
const BeginnerUser = require('../models/BeginnerUser');
const ExpertUser = require('../models/ExpertUser');
const VendorUser = require('../models/VendorUser');

if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
}

const requireExpert = (req) => {
    if (!req.user || req.user.role !== 'expert') {
        throw new AppError('Expert access only', 403);
    }
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to extract image from URL if it's a website
const getActualImage = async (url) => {
    if (!url) return '';
    // If it already looks like an image, return it
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return url;

    try {
        const response = await axios.get(url, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UrbanSprout/1.0)' }
        });

        // Simple regex to find og:image
        const ogImageMatch = response.data.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (ogImageMatch && ogImageMatch[1]) {
            return ogImageMatch[1];
        }

        // Fallback: twitter:image
        const twitterImageMatch = response.data.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
            return twitterImageMatch[1];
        }

        return url; // Return original if no meta found
    } catch (err) {
        console.log('Error fetching image metadata:', err.message);
        return url; // Return original on error
    }
};

// Helper to get completion metrics for all lessons - REMOVED AS WE PERSIST DATA NOW

// @desc    Upload course cover image to Cloudinary (same pattern as vendor product images)
// @route   POST /api/courses/upload
// @access  Private (Expert only)
const uploadCourseImage = asyncHandler(async (req, res, next) => {
    requireExpert(req);
    if (!req.file || !req.file.buffer) {
        throw new AppError('No image file provided', 400);
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) {
        throw new AppError('Invalid file type. Use JPEG, PNG or WebP.', 400);
    }
    if (!process.env.CLOUDINARY_URL) {
        throw new AppError('Image upload is not configured', 503);
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'urbansprout/course-covers' },
            (err, result) => {
                if (err) {
                    reject(new AppError(err.message || 'Upload failed', 500));
                    return;
                }
                if (!result || !result.secure_url) {
                    reject(new AppError('Upload failed', 500));
                    return;
                }
                res.status(200).json({ success: true, url: result.secure_url });
                resolve();
            }
        );
        const stream = Readable.from(req.file.buffer);
        stream.pipe(uploadStream);
    });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Expert only)
const createCourse = asyncHandler(async (req, res, next) => {
    requireExpert(req);
    let { title, description, image, isCertificateCourse } = req.body;

    // If image is a URL (e.g. from upload), use as-is; otherwise try to get og:image from link
    if (image && !image.startsWith('http')) {
        image = await getActualImage(image);
    }

    const course = await Course.create({
        title,
        description,
        image: image || '',
        instructor: req.user._id,
        instructorName: req.user.name,
        lessons: [],
        isCertificateCourse: Boolean(isCertificateCourse)
    });

    res.status(201).json({
        success: true,
        data: course
    });
});

// @desc    Get all courses for logged in instructor
// @route   GET /api/courses/my-courses
// @access  Private (Expert only)
const getMyCourses = asyncHandler(async (req, res, next) => {
    requireExpert(req);
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });

    res.json({
        success: true,
        count: courses.length,
        data: courses
    });
});

// @desc    Add lesson to course
// @route   POST /api/courses/:id/lessons
// @access  Private (Instructor only)
const addLesson = asyncHandler(async (req, res, next) => {
    const { title, videoUrl, duration } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError('Course not found', 404));
    }

    // Verify ownership
    if (course.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this course', 403));
    }

    course.lessons.push({ title, videoUrl, duration });
    await course.save();

    res.status(201).json({
        success: true,
        data: course
    });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor only)
const deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError('Course not found', 404));
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to delete this course', 403));
    }

    await course.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});

// @desc    Delete lesson from course
// @route   DELETE /api/courses/:id/lessons/:lessonId
// @access  Private (Instructor only)
const deleteLesson = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError('Course not found', 404));
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this course', 403));
    }

    const lessonIndex = course.lessons.findIndex(
        lesson => lesson._id.toString() === req.params.lessonId
    );

    if (lessonIndex === -1) {
        return next(new AppError('Lesson not found', 404));
    }

    course.lessons.splice(lessonIndex, 1);
    await course.save();

    res.json({
        success: true,
        data: course
    });
});

// @desc    Update lesson
// @route   PUT /api/courses/:id/lessons/:lessonId
// @access  Private (Instructor only)
const updateLesson = asyncHandler(async (req, res, next) => {
    const { title, videoUrl, duration } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError('Course not found', 404));
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this course', 403));
    }

    const lesson = course.lessons.id(req.params.lessonId);

    if (!lesson) {
        return next(new AppError('Lesson not found', 404));
    }

    lesson.title = title || lesson.title;
    lesson.videoUrl = videoUrl || lesson.videoUrl;
    lesson.duration = duration || lesson.duration;

    await course.save();

    res.json({
        success: true,
        data: course
    });
});

// @desc    Get all courses (public/market)
// @route   GET /api/courses
// @access  Private (All users)
const getAllCourses = asyncHandler(async (req, res, next) => {
    const courses = await Course.find().sort({ createdAt: -1 });

    res.json({
        success: true,
        count: courses.length,
        data: courses
    });
});

// @desc    Toggle save course (bookmark)
// @route   POST /api/courses/:id/save
// @access  Private
const toggleSaveCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError('Course not found', 404));
    }

    const user = req.user;

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Initialize savedCourses if undefined
    if (!user.savedCourses) {
        user.savedCourses = [];
    }

    const courseIdStr = course._id.toString();
    const isSaved = user.savedCourses.some(id => id.toString() === courseIdStr);

    if (isSaved) {
        // Remove
        user.savedCourses = user.savedCourses.filter(id => id.toString() !== courseIdStr);
    } else {
        // Add
        user.savedCourses.push(course._id);
    }

    await user.save();

    res.json({
        success: true,
        isSaved: !isSaved,
        savedCourses: user.savedCourses
    });
});

// @desc    Get saved courses
// @route   GET /api/courses/saved
// @access  Private
const getSavedCourses = asyncHandler(async (req, res, next) => {
    // req.user is already populated by the protect middleware.
    // We just need to ensure savedCourses is populated.
    if (!req.user) {
        return next(new AppError('User not found', 404));
    }

    try {
        const user = await req.user.populate('savedCourses');

        res.json({
            success: true,
            count: user.savedCourses ? user.savedCourses.length : 0,
            data: user.savedCourses || []
        });
    } catch (error) {
        console.error('Error populating saved courses:', error);
        return next(new AppError('Error fetching saved courses', 500));
    }
});

// @desc    Toggle lesson completion
// @route   POST /api/courses/lessons/:lessonId/complete
// @access  Private
const toggleLessonCompletion = asyncHandler(async (req, res, next) => {
    const { lessonId } = req.params;
    const user = req.user;

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    if (!user.completedLessons) {
        user.completedLessons = [];
    }

    const isCompleted = user.completedLessons.includes(lessonId);

    if (isCompleted) {
        // Remove completion from user
        user.completedLessons = user.completedLessons.filter(id => id !== lessonId);
    } else {
        // Add completion to user
        user.completedLessons.push(lessonId);
    }

    await user.save();

    // Persist to Course model
    try {
        const course = await Course.findOne({ "lessons._id": lessonId });
        if (course) {
            const lesson = course.lessons.id(lessonId);
            if (lesson) {
                if (isCompleted) {
                    // Decrement count
                    lesson.completionCount = Math.max(0, (lesson.completionCount || 0) - 1);
                    // Remove user avatar from list if it was there
                    if (user.avatar) {
                        lesson.completedByAvatars = lesson.completedByAvatars.filter(a => a !== user.avatar);
                    }
                } else {
                    // Increment count
                    lesson.completionCount = (lesson.completionCount || 0) + 1;
                    // Add user avatar to list if it exists and not already present (keep max 10)
                    if (user.avatar && !lesson.completedByAvatars.includes(user.avatar)) {
                        lesson.completedByAvatars.unshift(user.avatar);
                        lesson.completedByAvatars = lesson.completedByAvatars.slice(0, 10);
                    }
                }
                await course.save();
            }
        }
    } catch (err) {
        console.error('Error syncing completion to course:', err);
    }

    res.json({
        success: true,
        isCompleted: !isCompleted,
        completedLessons: user.completedLessons
    });
});

async function getSaveCountsByCourse(Model, courseIds) {
    if (!courseIds || courseIds.length === 0) return {};
    const rows = await Model.aggregate([
        { $match: { savedCourses: { $in: courseIds } } },
        { $unwind: '$savedCourses' },
        { $match: { savedCourses: { $in: courseIds } } },
        { $group: { _id: '$savedCourses', count: { $sum: 1 } } }
    ]);
    const map = {};
    for (const r of rows) {
        map[String(r._id)] = Number(r.count || 0);
    }
    return map;
}

function parseExpertAnalyticsPeriod(monthValue, yearValue, fallbackMonth, fallbackYear) {
    const now = new Date();
    const resolvedFallbackMonth = fallbackMonth || (now.getMonth() + 1);
    const resolvedFallbackYear = fallbackYear || now.getFullYear();

    const month = monthValue == null || monthValue === ''
        ? resolvedFallbackMonth
        : Number.parseInt(monthValue, 10);
    const year = yearValue == null || yearValue === ''
        ? resolvedFallbackYear
        : Number.parseInt(yearValue, 10);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new AppError('Month must be between 1 and 12', 400);
    }

    if (!Number.isInteger(year) || year < 2000 || year > resolvedFallbackYear + 1) {
        throw new AppError('Year is invalid', 400);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const yearStartDate = new Date(year, 0, 1);
    const yearEndDate = new Date(year + 1, 0, 1);

    return {
        month,
        year,
        label: `${MONTH_LABELS[month - 1]} ${year}`,
        startDate,
        endDate,
        yearStartDate,
        yearEndDate
    };
}

function buildCoursePerformance(courses, userCounts, beginnerCounts, expertCounts, vendorCounts) {
    return courses
        .map((course) => {
            const key = String(course._id);
            const lessonsCount = Array.isArray(course.lessons) ? course.lessons.length : 0;
            const watched = (Array.isArray(course.lessons) ? course.lessons : []).reduce(
                (sum, lesson) => sum + Number(lesson.completionCount || 0),
                0
            );
            const saves =
                Number(userCounts[key] || 0) +
                Number(beginnerCounts[key] || 0) +
                Number(expertCounts[key] || 0) +
                Number(vendorCounts[key] || 0);

            return {
                id: key,
                title: course.title,
                image: course.image || '',
                createdAt: course.createdAt,
                lessonsCount,
                saves,
                watched,
                engagementScore: saves + watched
            };
        })
        .sort((a, b) => (b.engagementScore - a.engagementScore) || (b.saves - a.saves));
}

function summarizeCoursePerformance(courses) {
    const summary = courses.reduce((acc, course) => {
        acc.coursesPublished += 1;
        acc.lessonsPublished += Number(course.lessonsCount || 0);
        acc.totalSaves += Number(course.saves || 0);
        acc.totalLessonCompletions += Number(course.watched || 0);
        return acc;
    }, {
        coursesPublished: 0,
        lessonsPublished: 0,
        totalSaves: 0,
        totalLessonCompletions: 0
    });

    summary.averageSavesPerCourse = summary.coursesPublished > 0
        ? Number((summary.totalSaves / summary.coursesPublished).toFixed(1))
        : 0;
    summary.averageCompletionsPerCourse = summary.coursesPublished > 0
        ? Number((summary.totalLessonCompletions / summary.coursesPublished).toFixed(1))
        : 0;

    return summary;
}

// @desc    Expert dashboard stats (real data)
// @route   GET /api/courses/expert/dashboard-stats
// @access  Private (Expert only)
const getExpertDashboardStats = asyncHandler(async (req, res, next) => {
    requireExpert(req);

    const courses = await Course.find({ instructor: req.user._id })
        .select('title description image lessons createdAt')
        .sort({ createdAt: -1 })
        .lean();

    const courseIds = courses.map(c => c._id);

    // Watched: sum of lesson completionCount across all lessons
    let lessonsWatched = 0;
    for (const c of courses) {
        const lessons = Array.isArray(c.lessons) ? c.lessons : [];
        for (const l of lessons) {
            lessonsWatched += Number(l.completionCount || 0);
        }
    }

    // Saved: count users who saved any of this expert's courses (across all user collections)
    const [savedUsers, savedBeginners, savedExperts, savedVendors] = await Promise.all([
        User.countDocuments({ savedCourses: { $in: courseIds } }),
        BeginnerUser.countDocuments({ savedCourses: { $in: courseIds } }),
        ExpertUser.countDocuments({ savedCourses: { $in: courseIds } }),
        VendorUser.countDocuments({ savedCourses: { $in: courseIds } })
    ]);
    const peopleSaved = Number(savedUsers || 0) + Number(savedBeginners || 0) + Number(savedExperts || 0) + Number(savedVendors || 0);

    // Per-course save counts for "in-demand" chart
    const [uMap, bMap, eMap, vMap] = await Promise.all([
        getSaveCountsByCourse(User, courseIds),
        getSaveCountsByCourse(BeginnerUser, courseIds),
        getSaveCountsByCourse(ExpertUser, courseIds),
        getSaveCountsByCourse(VendorUser, courseIds)
    ]);

    const perCourseSaves = {};
    for (const id of courseIds) {
        const k = String(id);
        perCourseSaves[k] =
            Number(uMap[k] || 0) +
            Number(bMap[k] || 0) +
            Number(eMap[k] || 0) +
            Number(vMap[k] || 0);
    }

    const topCourses = courses
        .map((c) => {
            const k = String(c._id);
            const completions = (Array.isArray(c.lessons) ? c.lessons : []).reduce(
                (sum, l) => sum + Number(l.completionCount || 0),
                0
            );
            return {
                id: k,
                title: c.title,
                image: c.image || '',
                saves: perCourseSaves[k] || 0,
                watched: completions
            };
        })
        .sort((a, b) => (b.saves - a.saves) || (b.watched - a.watched))
        .slice(0, 8);

    const recentCourses = courses.slice(0, 3).map((c) => {
        const k = String(c._id);
        const completions = (Array.isArray(c.lessons) ? c.lessons : []).reduce(
            (sum, l) => sum + Number(l.completionCount || 0),
            0
        );
        return {
            id: k,
            title: c.title,
            image: c.image || '',
            createdAt: c.createdAt,
            lessonsCount: Array.isArray(c.lessons) ? c.lessons.length : 0,
            saves: perCourseSaves[k] || 0,
            watched: completions
        };
    });

    res.json({
        success: true,
        data: {
            classesShared: courses.length,
            peopleSaved,
            lessonsWatched,
            topCourses,
            recentCourses
        }
    });
});

// @desc    Expert analytics with month/year filters
// @route   GET /api/courses/expert/analytics
// @access  Private (Expert only)
const getExpertAnalytics = asyncHandler(async (req, res, next) => {
    requireExpert(req);

    const allCourses = await Course.find({ instructor: req.user._id })
        .select('title image lessons createdAt')
        .sort({ createdAt: -1 })
        .lean();

    const latestCourseDate = allCourses[0]?.createdAt ? new Date(allCourses[0].createdAt) : new Date();

    const {
        month,
        year,
        label,
        startDate,
        endDate,
        yearStartDate,
        yearEndDate
    } = parseExpertAnalyticsPeriod(
        req.query.month,
        req.query.year,
        latestCourseDate.getMonth() + 1,
        latestCourseDate.getFullYear()
    );

    const periodCourses = allCourses.filter((course) => {
        const createdAt = new Date(course.createdAt);
        return createdAt >= startDate && createdAt < endDate;
    });
    const yearlyCourses = allCourses.filter((course) => {
        const createdAt = new Date(course.createdAt);
        return createdAt >= yearStartDate && createdAt < yearEndDate;
    });

    const allCourseIds = allCourses.map((course) => course._id);
    const periodCourseIds = periodCourses.map((course) => course._id);
    const yearlyCourseIds = yearlyCourses.map((course) => course._id);

    const [
        allUserCounts,
        allBeginnerCounts,
        allExpertCounts,
        allVendorCounts,
        periodUserCounts,
        periodBeginnerCounts,
        periodExpertCounts,
        periodVendorCounts,
        yearlyUserCounts,
        yearlyBeginnerCounts,
        yearlyExpertCounts,
        yearlyVendorCounts
    ] = await Promise.all([
        getSaveCountsByCourse(User, allCourseIds),
        getSaveCountsByCourse(BeginnerUser, allCourseIds),
        getSaveCountsByCourse(ExpertUser, allCourseIds),
        getSaveCountsByCourse(VendorUser, allCourseIds),
        getSaveCountsByCourse(User, periodCourseIds),
        getSaveCountsByCourse(BeginnerUser, periodCourseIds),
        getSaveCountsByCourse(ExpertUser, periodCourseIds),
        getSaveCountsByCourse(VendorUser, periodCourseIds),
        getSaveCountsByCourse(User, yearlyCourseIds),
        getSaveCountsByCourse(BeginnerUser, yearlyCourseIds),
        getSaveCountsByCourse(ExpertUser, yearlyCourseIds),
        getSaveCountsByCourse(VendorUser, yearlyCourseIds)
    ]);

    const allCoursePerformance = buildCoursePerformance(
        allCourses,
        allUserCounts,
        allBeginnerCounts,
        allExpertCounts,
        allVendorCounts
    );
    const periodCoursePerformance = buildCoursePerformance(
        periodCourses,
        periodUserCounts,
        periodBeginnerCounts,
        periodExpertCounts,
        periodVendorCounts
    );
    const summary = summarizeCoursePerformance(periodCoursePerformance);
    const allTimeSummary = summarizeCoursePerformance(allCoursePerformance);

    const monthlyBreakdownMap = new Map(
        MONTH_LABELS.map((monthLabel, index) => [
            index,
            {
                month: index + 1,
                label: monthLabel,
                classes: 0,
                lessons: 0,
                saves: 0,
                watched: 0
            }
        ])
    );

    yearlyCourses.forEach((course) => {
        const courseDate = new Date(course.createdAt);
        const monthIndex = courseDate.getMonth();
        const bucket = monthlyBreakdownMap.get(monthIndex);
        const key = String(course._id);
        const lessonsCount = Array.isArray(course.lessons) ? course.lessons.length : 0;
        const watched = (Array.isArray(course.lessons) ? course.lessons : []).reduce(
            (sum, lesson) => sum + Number(lesson.completionCount || 0),
            0
        );
        const saves =
            Number(yearlyUserCounts[key] || 0) +
            Number(yearlyBeginnerCounts[key] || 0) +
            Number(yearlyExpertCounts[key] || 0) +
            Number(yearlyVendorCounts[key] || 0);

        bucket.classes += 1;
        bucket.lessons += lessonsCount;
        bucket.saves += saves;
        bucket.watched += watched;
    });

    const availableYears = Array.from(
        new Set(allCourses.map((course) => new Date(course.createdAt).getFullYear()))
    )
        .filter((value) => Number.isInteger(value))
        .sort((a, b) => b - a);

    if (availableYears.length === 0) {
        availableYears.push(new Date().getFullYear());
    }

    res.json({
        success: true,
        data: {
            period: { month, year, label },
            latestAvailablePeriod: {
                month: latestCourseDate.getMonth() + 1,
                year: latestCourseDate.getFullYear(),
                label: `${MONTH_LABELS[latestCourseDate.getMonth()]} ${latestCourseDate.getFullYear()}`
            },
            availableYears,
            allTimeSummary,
            summary,
            topPerformer: periodCoursePerformance[0] || null,
            coursePerformance: periodCoursePerformance,
            recentCourses: periodCoursePerformance
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5),
            monthlyBreakdown: Array.from(monthlyBreakdownMap.values())
        }
    });
});

module.exports = {
    uploadCourseImage,
    createCourse,
    getMyCourses,
    addLesson,
    deleteCourse,
    deleteLesson,
    updateLesson,
    getAllCourses,
    toggleSaveCourse,
    getSavedCourses,
    toggleLessonCompletion,
    getExpertDashboardStats,
    getExpertAnalytics
};
