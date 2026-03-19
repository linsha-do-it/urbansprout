const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lesson title is required'],
        trim: true
    },
    videoUrl: {
        type: String,
        required: [true, 'Video URL is required'],
        trim: true
    },
    duration: {
        type: String,
        trim: true
    },
    completionCount: {
        type: Number,
        default: 0
    },
    completedByAvatars: [{
        type: String
    }]
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the base User model, but logically points to ExpertUser
        required: true
    },
    instructorName: {
        type: String,
        required: true
    },
    lessons: [lessonSchema],
    // If true, completing the course is intended to grant a certificate (UI/feature layer).
    isCertificateCourse: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'expertcourses'  // Dedicated collection for expert-created courses (cover image stored in image field)
});

module.exports = mongoose.model('Course', courseSchema);
