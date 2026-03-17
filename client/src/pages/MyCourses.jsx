import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, coursesAPI } from '../utils/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FaPlus, FaVideo, FaTrash, FaBook } from 'react-icons/fa';
import { Upload, Loader2 } from 'lucide-react';

const MyCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null); // For adding lessons
    const [viewingCourse, setViewingCourse] = useState(null); // For detail view
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [newCourse, setNewCourse] = useState({ title: '', description: '', image: '' });
    const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '' });
    const [lessonToEdit, setLessonToEdit] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const courseImageInputRef = useRef(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response = await apiCall('/courses/my-courses');
            if (response.success) {
                setCourses(response.data);
            }
        } catch (err) {
            setError('Failed to load courses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const response = await apiCall('/courses', {
                method: 'POST',
                body: JSON.stringify(newCourse)
            });
            if (response.success) {
                setCourses([response.data, ...courses]);
                setShowCreateForm(false);
                setNewCourse({ title: '', description: '', image: '' });
                setUploadError('');
            }
        } catch (err) {
            console.error('Course creation error:', err);
            alert(err.message || 'Failed to create course');
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;

        try {
            const response = await apiCall(`/courses/${selectedCourse._id}/lessons`, {
                method: 'POST',
                body: JSON.stringify(newLesson)
            });
            if (response.success) {
                // Update local state
                const updatedCourses = courses.map(c =>
                    c._id === selectedCourse._id ? response.data : c
                );
                setCourses(updatedCourses);
                setSelectedCourse(null); // Close modal
                setNewLesson({ title: '', videoUrl: '' });

                // Update viewingCourse if currently viewing this course
                if (viewingCourse && viewingCourse._id === selectedCourse._id) {
                    setViewingCourse(response.data);
                }
            }
        } catch (err) {
            alert('Failed to add lesson');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await apiCall(`/courses/${courseId}`, { method: 'DELETE' });
            setCourses(courses.filter(c => c._id !== courseId));
            if (viewingCourse && viewingCourse._id === courseId) {
                setViewingCourse(null);
            }
        } catch (err) {
            alert('Failed to delete course');
        }
    };

    const handleDeleteLesson = async (courseId, lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            const response = await apiCall(`/courses/${courseId}/lessons/${lessonId}`, {
                method: 'DELETE'
            });
            if (response.success) {
                // Update viewingCourse
                setViewingCourse(response.data);

                // Update courses list
                setCourses(courses.map(c => c._id === courseId ? response.data : c));
            }
        } catch (err) {
            alert('Failed to delete lesson');
        }
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        if (!lessonToEdit) return;

        try {
            const response = await apiCall(`/courses/${viewingCourse._id}/lessons/${lessonToEdit._id}`, {
                method: 'PUT',
                body: JSON.stringify(lessonToEdit)
            });
            if (response.success) {
                setViewingCourse(response.data);
                setCourses(courses.map(c => c._id === viewingCourse._id ? response.data : c));
                setLessonToEdit(null);
            }
        } catch (err) {
            alert('Failed to update lesson');
        }
    };

    const renderCourseDetail = () => (
        <div className="animate-fade-in">
            {/* Back Button container */}
            <div className="max-w-4xl mx-auto mb-6">
                <button
                    onClick={() => setViewingCourse(null)}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Back to courses"
                >
                    <span className="mr-2 text-xl">←</span> Back
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12 group max-w-4xl mx-auto border border-gray-100">
                <img
                    src={viewingCourse.image || 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80'}
                    alt={viewingCourse.title}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80';
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        {viewingCourse.title}
                    </h1>

                    <div className="flex items-center gap-4">
                        <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-semibold border border-white/30">
                            {viewingCourse.lessons.length} {viewingCourse.lessons.length === 1 ? 'Project' : 'Projects'}
                        </span>

                        <button
                            onClick={() => setSelectedCourse(viewingCourse)}
                            className="bg-white text-gray-900 px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center"
                        >
                            <FaPlus className="mr-2" /> Add Lesson
                        </button>
                    </div>
                    <p className="text-gray-200 mt-4 max-w-2xl text-lg opacity-90">{viewingCourse.description}</p>
                </div>
            </div>

            {/* Lessons List */}
            <div className="max-w-4xl mx-auto space-y-6">
                {viewingCourse.lessons.map((lesson, idx) => (
                    <div key={idx} className="group bg-white rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-forest-green-500 transition-colors bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-500 group-hover:text-forest-green-600">
                                {idx + 1}
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-1">{lesson.title}</h3>
                            <div className="flex items-center text-sm text-gray-500 gap-3">
                                <span className="text-forest-green-600 font-medium tracking-wide">
                                    {viewingCourse.title} (Part {idx + 1})
                                </span>
                                {lesson.duration && (
                                    <>
                                        <span>•</span>
                                        <span>{lesson.duration}</span>
                                    </>
                                )}

                                {/* Social Completion Proof */}
                                {lesson.completionCount > 0 && (
                                    <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            {lesson.completedByAvatars?.length > 0 && (
                                                <div className="flex -space-x-1.5 mr-1">
                                                    {lesson.completedByAvatars.map((avatar, i) => (
                                                        <img
                                                            key={i}
                                                            src={avatar}
                                                            alt="Student"
                                                            className="w-4 h-4 rounded-full border border-white object-cover"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <span className="text-forest-green-600/70 font-medium">
                                                {lesson.completionCount} {lesson.completionCount === 1 ? 'student' : 'students'} completed
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Lesson Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-forest-green-600 transition-colors" title="Watch Video">
                                <FaVideo size={18} />
                            </a>
                            <button
                                onClick={() => setLessonToEdit({ ...lesson })}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Lesson"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleDeleteLesson(viewingCourse._id, lesson._id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Lesson"
                            >
                                <FaTrash size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {viewingCourse.lessons.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-lg">No lessons added yet.</p>
                        <button
                            onClick={() => setSelectedCourse(viewingCourse)}
                            className="text-forest-green-600 font-semibold mt-2 hover:underline"
                        >
                            Add your first lesson
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8 pt-28">
                {viewingCourse ? (
                    renderCourseDetail()
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-forest-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-forest-green-700"
                            >
                                <FaPlus /> Create New Course
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-10">Loading...</div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                No courses yet. Start sharing your knowledge!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map(course => (
                                    <div
                                        key={course._id}
                                        onClick={() => setViewingCourse(course)}
                                        className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group cursor-pointer hover:shadow-xl transition-all duration-300"
                                    >
                                        {/* Background Image */}
                                        <img
                                            src={course.image || 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80'}
                                            alt={course.title}
                                            onError={(e) => {
                                                e.target.onerror = null; // Prevent infinite loop
                                                e.target.src = 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80';
                                            }}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                            <h3 className="text-2xl font-bold mb-2 leading-tight">{course.title}</h3>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/30">
                                                    {course.lessons.length} {course.lessons.length === 1 ? 'Lesson' : 'Lessons'}
                                                </span>
                                            </div>

                                            {/* Action Buttons (visible on hover or always, depending on preference. Keeping them accessible) */}
                                            <div className="flex gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); }}
                                                    className="bg-forest-green-600 hover:bg-forest-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors"
                                                >
                                                    <FaPlus className="mr-1" /> Add Lesson
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course._id); }}
                                                    className="bg-red-500/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors backdrop-blur-sm"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Create Course Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Create New Course</h2>
                            <form onSubmit={handleCreateCourse}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={newCourse.title}
                                        onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        required
                                        className="w-full border rounded-lg p-2"
                                        rows="3"
                                        value={newCourse.description}
                                        onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                    <input
                                        ref={courseImageInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setUploadError('');
                                            setUploading(true);
                                            try {
                                                const res = await coursesAPI.uploadImage(file);
                                                const url = res?.url;
                                                if (url) {
                                                    setNewCourse(prev => ({ ...prev, image: url }));
                                                } else {
                                                    setUploadError('Upload failed.');
                                                }
                                            } catch (err) {
                                                setUploadError(err?.message || 'Upload failed.');
                                            } finally {
                                                setUploading(false);
                                                if (courseImageInputRef.current) courseImageInputRef.current.value = '';
                                            }
                                        }}
                                    />
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => courseImageInputRef.current?.click()}
                                            disabled={uploading}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 text-sm font-medium"
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {uploading ? 'Uploading…' : 'Upload cover image'}
                                        </button>
                                        {newCourse.image && (
                                            <div className="flex items-center gap-2">
                                                <img src={newCourse.image} alt="Cover" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                                <button
                                                    type="button"
                                                    onClick={() => setNewCourse(prev => ({ ...prev, image: '' }))}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-forest-green-600 text-white px-4 py-2 rounded-lg hover:bg-forest-green-700"
                                    >
                                        Create Course
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Lesson Modal */}
                {selectedCourse && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Add Lesson to "{selectedCourse.title}"</h2>
                            <form onSubmit={handleAddLesson}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={newLesson.title}
                                        onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full border rounded-lg p-2"
                                        value={newLesson.videoUrl}
                                        onChange={e => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCourse(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Add Lesson
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Lesson Modal */}
                {lessonToEdit && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Edit Lesson</h2>
                            <form onSubmit={handleUpdateLesson}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={lessonToEdit.title}
                                        onChange={e => setLessonToEdit({ ...lessonToEdit, title: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full border rounded-lg p-2"
                                        value={lessonToEdit.videoUrl}
                                        onChange={e => setLessonToEdit({ ...lessonToEdit, videoUrl: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setLessonToEdit(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-forest-green-600 text-white px-4 py-2 rounded-lg hover:bg-forest-green-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default MyCourses;
