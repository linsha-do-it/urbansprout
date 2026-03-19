import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { FaSearch, FaBookmark, FaRegBookmark, FaPlay, FaClock, FaChalkboardTeacher, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const Learn = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('explore');
    const [courses, setCourses] = useState([]);
    const [savedCourses, setSavedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingId, setSavingId] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [playingVideo, setPlayingVideo] = useState(null);
    const [questionModal, setQuestionModal] = useState({ open: false, course: null, lesson: null });
    const [questionText, setQuestionText] = useState('');
    const [questionSubmitting, setQuestionSubmitting] = useState(false);
    const [questionError, setQuestionError] = useState('');
    const [myQuestions, setMyQuestions] = useState([]);
    const [myQuestionsLoading, setMyQuestionsLoading] = useState(false);
    const [myQuestionsError, setMyQuestionsError] = useState('');
    const [courseCompleting, setCourseCompleting] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchSavedCourses();
        fetchUserProfile();
    }, []);

    // Allow deep-linking into Q&A: /qa or /learn?tab=myquestions
    useEffect(() => {
        try {
            const isQaRoute = location?.pathname === '/qa';
            const params = new URLSearchParams(location?.search || '');
            const tab = String(params.get('tab') || '').toLowerCase();
            if (isQaRoute || tab === 'myquestions') {
                setActiveTab('myquestions');
            }
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location?.pathname, location?.search]);

    useEffect(() => {
        if (user?.role === 'beginner') {
            fetchMyQuestions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const fetchUserProfile = async () => {
        try {
            const response = await apiCall('/auth/profile');
            if (response.success && response.user) {
                setCompletedLessons(response.user.completedLessons || []);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await apiCall('/courses');
            if (response.success) {
                setCourses(response.data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchSavedCourses = async () => {
        try {
            const response = await apiCall('/courses/saved');
            if (response.success) {
                setSavedCourses(response.data);
            }
        } catch (error) {
            console.error('Error fetching saved courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyQuestions = async () => {
        try {
            setMyQuestionsLoading(true);
            setMyQuestionsError('');
            const response = await apiCall('/course-questions/my');
            if (response.success) {
                setMyQuestions(Array.isArray(response.data) ? response.data : []);
            } else {
                setMyQuestions([]);
            }
        } catch (e) {
            setMyQuestionsError(e?.message || 'Failed to load your questions.');
            setMyQuestions([]);
        } finally {
            setMyQuestionsLoading(false);
        }
    };

    const handleSaveToggle = async (e, course) => {
        e.stopPropagation();
        setSavingId(course._id);
        try {
            const response = await apiCall(`/courses/${course._id}/save`, { method: 'POST' });
            if (response.success) {
                if (response.isSaved) {
                    setSavedCourses([...savedCourses, course]);
                } else {
                    setSavedCourses(savedCourses.filter(c => c._id !== course._id));
                }
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        } finally {
            setSavingId(null);
        }
    };

    const isCourseSaved = (courseId) => {
        return savedCourses.some(c => c._id === courseId);
    };

    const filteredCourses = (activeTab === 'explore' ? courses : savedCourses).filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isCourseCompleted = (course) => {
        const lessons = course?.lessons || [];
        if (!Array.isArray(lessons) || lessons.length === 0) return false;
        return lessons.every((l) => l?._id && completedLessons.includes(l._id));
    };

    const handleLessonToggle = async (e, lessonId) => {
        e.stopPropagation();
        try {
            const response = await apiCall(`/courses/lessons/${lessonId}/complete`, { method: 'POST' });
            if (response.success) {
                if (response.isCompleted) {
                    setCompletedLessons(prev => [...prev, lessonId]);
                } else {
                    setCompletedLessons(prev => prev.filter(id => id !== lessonId));
                }
            }
        } catch (error) {
            console.error('Error toggling lesson completion:', error);
        }
    };

    const isLessonCompleted = (lessonId) => completedLessons.includes(lessonId);

    const canAskQuestions = user?.role === 'beginner';

    const openQuestionModal = (course, lesson) => {
        setQuestionError('');
        setQuestionText('');
        setQuestionModal({ open: true, course, lesson });
    };

    const closeQuestionModal = () => {
        setQuestionModal({ open: false, course: null, lesson: null });
        setQuestionError('');
        setQuestionText('');
        setQuestionSubmitting(false);
    };

    const submitQuestion = async () => {
        if (!questionModal.course?._id) return;
        const text = String(questionText || '').trim();
        if (!text) {
            setQuestionError('Please type your question.');
            return;
        }
        setQuestionSubmitting(true);
        setQuestionError('');
        try {
            await apiCall('/course-questions', {
                method: 'POST',
                body: JSON.stringify({
                    courseId: questionModal.course._id,
                    lessonId: questionModal.lesson?._id,
                    question: text
                })
            });
            closeQuestionModal();
            alert('Question sent to the expert!');
            fetchMyQuestions();
        } catch (e) {
            setQuestionError(e?.message || 'Failed to send question.');
        } finally {
            setQuestionSubmitting(false);
        }
    };

    const toggleCourseCompletion = async (course) => {
        if (!course?._id) return;
        const lessons = Array.isArray(course.lessons) ? course.lessons : [];
        if (lessons.length === 0) return;

        const targetCompleted = !isCourseCompleted(course);
        setCourseCompleting(true);
        try {
            if (targetCompleted) {
                for (const lesson of lessons) {
                    if (!lesson?._id) continue;
                    if (completedLessons.includes(lesson._id)) continue;
                    // eslint-disable-next-line no-await-in-loop
                    await apiCall(`/courses/lessons/${lesson._id}/complete`, { method: 'POST' });
                    setCompletedLessons((prev) => (prev.includes(lesson._id) ? prev : [...prev, lesson._id]));
                }
            } else {
                for (const lesson of lessons) {
                    if (!lesson?._id) continue;
                    if (!completedLessons.includes(lesson._id)) continue;
                    // eslint-disable-next-line no-await-in-loop
                    await apiCall(`/courses/lessons/${lesson._id}/complete`, { method: 'POST' });
                    setCompletedLessons((prev) => prev.filter((id) => id !== lesson._id));
                }
            }
        } catch (e) {
            alert(e?.message || 'Failed to update course completion.');
        } finally {
            setCourseCompleting(false);
        }
    };

    const VideoPlayerModal = ({ lesson, onClose }) => {
        if (!lesson) return null;

        // Simple check for YouTube URL
        const isYouTube = lesson.videoUrl?.includes('youtube.com') || lesson.videoUrl?.includes('youtu.be');
        let embedUrl = lesson.videoUrl;

        if (isYouTube) {
            const videoId = lesson.videoUrl.split('v=')[1]?.split('&')[0] || lesson.videoUrl.split('/').pop();
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>
                    {isYouTube ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            title={lesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={lesson.videoUrl}
                            className="w-full h-full"
                            controls
                            autoPlay
                        />
                    )}
                </div>
            </div>
        );
    };

    const CourseCard = ({ course }) => (
        <div
            onClick={() => setSelectedCourse(course)}
            className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={course.image || 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80'}
                    alt={course.title}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Completed Badge */}
                {isCourseCompleted(course) && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-forest-green-700 text-xs font-bold border border-white/60 flex items-center gap-2 z-10">
                        <FaCheckCircle className="text-forest-green-600" />
                        Completed
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={(e) => handleSaveToggle(e, course)}
                    disabled={savingId === course._id}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white hover:text-forest-green-600 transition-all duration-300 disabled:opacity-50 z-10"
                >
                    {isCourseSaved(course._id) ? <FaBookmark /> : <FaRegBookmark />}
                </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow relative">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">
                        {course.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {course.description || 'No description available.'}
                    </p>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <FaChalkboardTeacher className="text-forest-green-500" />
                        <span className="font-medium text-gray-600">{course.instructorName || 'Expert'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FaPlay className="text-xs" />
                        <span>{course.lessons?.length || 0} Lessons</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const CourseDetail = ({ course }) => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back Button */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => setSelectedCourse(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-forest-green-600 transition-colors group"
                >
                    <div className="p-2 rounded-full group-hover:bg-forest-green-50 transition-colors">
                        <FaPlay className="rotate-180 text-xs" />
                    </div>
                    <span className="font-semibold">Back</span>
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 h-[400px] mb-12 max-w-4xl mx-auto">
                <img
                    src={course.image || 'https://images.unsplash.com/photo-1501854140884-074bf86ee91c?auto=format&fit=crop&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-bold shadow-sm">
                            {course.lessons?.length || 0} {course.lessons?.length === 1 ? 'Project' : 'Projects'}
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleCourseCompletion(course)}
                            disabled={courseCompleting || !course.lessons?.length}
                            className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all border border-white/30 text-sm font-semibold disabled:opacity-60"
                        >
                            {isCourseCompleted(course) ? 'Mark as incomplete' : 'Mark course complete'}
                        </button>
                        <button
                            onClick={() => course.lessons?.length > 0 && setPlayingVideo(course.lessons[0])}
                            className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all border border-white/30"
                        >
                            <FaPlay className="text-white text-sm" />
                        </button>
                        <button
                            disabled={savingId === course._id}
                            onClick={(e) => handleSaveToggle(e, course)}
                            className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all border border-white/30 disabled:opacity-50"
                        >
                            {isCourseSaved(course._id) ? <FaBookmark className="text-white text-sm" /> : <FaRegBookmark className="text-white text-sm" />}
                        </button>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">{course.title}</h1>
                    <p className="text-lg md:text-xl text-gray-200 max-w-3xl leading-relaxed">
                        {course.description || 'Master the essential urban gardening workflows. Build your skills with step-by-step projects and expert guidance.'}
                    </p>
                </div>
            </div>

            {/* Lessons List */}
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 px-2">Course Curriculum</h2>
                <div className="space-y-4">
                    {course.lessons && course.lessons.length > 0 ? (
                        course.lessons.map((lesson, index) => (
                            <div
                                key={lesson._id || index}
                                className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
                                onClick={() => setPlayingVideo(lesson)}
                            >
                                <div className="flex items-center gap-6">
                                    <div
                                        className="relative flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLessonToggle(e, lesson._id);
                                        }}
                                    >
                                        {isLessonCompleted(lesson._id) ? (
                                            <FaCheckCircle className="text-2xl text-forest-green-500 animate-in zoom-in duration-300" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-forest-green-500 transition-colors" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 transition-colors group-hover:text-forest-green-700">
                                            {lesson.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-gray-400 text-sm font-medium">Part {index + 1}</span>
                                            {lesson.duration && (
                                                <>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className="text-gray-400 text-sm">{lesson.duration} mins</span>
                                                </>
                                            )}

                                            {/* Social Completion metrics */}
                                            {lesson.completionCount > 0 && (
                                                <>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <div className="flex items-center gap-1">
                                                        {lesson.completedByAvatars?.length > 0 && (
                                                            <div className="flex -space-x-2 mr-1">
                                                                {lesson.completedByAvatars.map((avatar, i) => (
                                                                    <img
                                                                        key={i}
                                                                        src={avatar}
                                                                        alt="Student"
                                                                        className="w-5 h-5 rounded-full border border-white object-cover shadow-sm"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <span className="text-gray-400 text-sm font-medium">
                                                            {lesson.completionCount} {lesson.completionCount === 1 ? 'student' : 'students'} completed
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {canAskQuestions && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openQuestionModal(course, lesson);
                                            }}
                                            className="px-4 py-2 rounded-2xl bg-forest-green-50 text-forest-green-700 border border-forest-green-100 hover:bg-forest-green-100 transition-colors text-sm font-semibold"
                                        >
                                            Ask expert
                                        </button>
                                    )}
                                    <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-forest-green-50 group-hover:text-forest-green-600 transition-all">
                                        <FaPlay className="text-sm" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                            <FaChalkboardTeacher className="text-4xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No lessons available for this course yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8 pt-28">
                {!selectedCourse ? (
                    <>
                        {/* Header */}
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Grow Your Skills</h1>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Discover expert-led courses to master urban gardening, from basics to advanced techniques.
                            </p>
                        </div>

                        {/* Tabs & Search */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                            {/* Tabs */}
                            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                                <button
                                    onClick={() => setActiveTab('explore')}
                                    className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'explore'
                                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Explore
                                </button>
                                <button
                                    onClick={() => setActiveTab('mylearnings')}
                                    className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'mylearnings'
                                        ? 'bg-black text-white shadow-lg'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    My Learning
                                </button>
                                {user?.role === 'beginner' && (
                                    <button
                                        onClick={() => setActiveTab('myquestions')}
                                        className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'myquestions'
                                            ? 'bg-forest-green-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        My Questions
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div className="relative w-full md:w-96 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-400 group-focus-within:text-forest-green-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="I want to learn..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-green-100 focus:border-forest-green-500 transition-all shadow-sm group-hover:shadow-md text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Content Grid */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green-600 mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading courses...</p>
                            </div>
                        ) : activeTab === 'myquestions' ? (
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">My Questions & Answers</h2>
                                    <button
                                        type="button"
                                        onClick={fetchMyQuestions}
                                        className="text-sm font-semibold text-forest-green-700 hover:text-forest-green-800"
                                    >
                                        Refresh
                                    </button>
                                </div>
                                {myQuestionsLoading ? (
                                    <div className="flex justify-center py-16">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-green-600" />
                                    </div>
                                ) : myQuestionsError ? (
                                    <p className="text-sm text-red-600">{myQuestionsError}</p>
                                ) : myQuestions.length === 0 ? (
                                    <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-500">
                                        No questions yet. Open a lesson and click <span className="font-semibold">Ask expert</span>.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myQuestions.map((q) => (
                                            <div key={q._id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                                <p className="text-xs text-gray-500">
                                                    {q.courseTitle || 'Course'}{q.lessonTitle ? ` • ${q.lessonTitle}` : ''}
                                                </p>
                                                <p className="text-gray-900 font-semibold mt-2 whitespace-pre-wrap">{q.question}</p>
                                                <div className="mt-4 border-t border-gray-100 pt-4">
                                                    {q.status === 'answered' && q.answer ? (
                                                        <>
                                                            <p className="text-xs text-forest-green-700 font-bold mb-2">Expert Answer</p>
                                                            <p className="text-gray-800 whitespace-pre-wrap">{q.answer}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Waiting for expert answer…</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : filteredCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredCourses.map(course => (
                                    <CourseCard key={course._id} course={course} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <div className="bg-white p-8 rounded-[2rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                                    <FaBookmark className="text-4xl text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    {activeTab === 'explore' ? 'No courses found' : activeTab === 'mylearnings' ? 'No saved courses yet' : 'No questions yet'}
                                </h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    {activeTab === 'explore'
                                        ? 'Try adjusting your search terms or exploring different categories.'
                                        : activeTab === 'mylearnings'
                                            ? 'Explore courses and save them here to start your learning journey!'
                                            : 'Open a lesson and ask your expert a question.'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <CourseDetail course={selectedCourse} />
                )}
            </div>
            <Footer />

            {/* Video Player Modal */}
            {playingVideo && (
                <VideoPlayerModal
                    lesson={playingVideo}
                    onClose={() => setPlayingVideo(null)}
                />
            )}

            {/* Ask Question Modal */}
            {questionModal.open && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeQuestionModal} />
                    <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="min-w-0">
                                <h3 className="text-xl font-bold text-gray-900">Ask the expert</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {questionModal.course?.title}
                                    {questionModal.lesson?.title ? ` • ${questionModal.lesson.title}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeQuestionModal}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            rows={5}
                            placeholder="Type your question about this lesson..."
                            className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-forest-green-100 focus:border-forest-green-500 text-gray-800"
                        />
                        {questionError && <p className="text-sm text-red-600 mt-2">{questionError}</p>}

                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                type="button"
                                onClick={closeQuestionModal}
                                className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                                disabled={questionSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitQuestion}
                                disabled={questionSubmitting}
                                className="px-5 py-2 rounded-2xl bg-forest-green-600 text-white hover:bg-forest-green-700 font-semibold disabled:opacity-60"
                            >
                                {questionSubmitting ? 'Sending…' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Learn;
