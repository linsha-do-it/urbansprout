const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
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
} = require('../controllers/courseController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Use JPEG, PNG or WebP.'), false);
    }
});

router.use(protect); // All routes are protected

router.post('/upload', upload.single('image'), uploadCourseImage);

router.route('/')
    .get(getAllCourses)
    .post(createCourse);

router.get('/my-courses', getMyCourses);
router.get('/expert/dashboard-stats', getExpertDashboardStats);
router.get('/expert/analytics', getExpertAnalytics);
router.get('/saved', getSavedCourses);
router.post('/saved/:id/save', toggleSaveCourse); // Keep this for clarity if needed, or stick to /:id/save
router.post('/:id/save', toggleSaveCourse);
router.post('/lessons/:lessonId/complete', toggleLessonCompletion);

router.route('/:id')
    .delete(deleteCourse);

router.route('/:id/lessons')
    .post(addLesson);

router.route('/:id/lessons/:lessonId')
    .delete(deleteLesson)
    .put(updateLesson);

module.exports = router;
