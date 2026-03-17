import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaUsers, FaChartLine, FaBookmark, FaPlayCircle, FaChalkboardTeacher } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { coursesAPI } from '../../utils/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const ExpertDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    classesShared: 0,
    peopleSaved: 0,
    lessonsWatched: 0,
    topCourses: [],
    recentCourses: [],
  });

  const handleLogout = () => {
    logout();
  };

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coursesAPI.getExpertDashboardStats();
      const d = res?.data || {};
      setStats({
        classesShared: d.classesShared ?? 0,
        peopleSaved: d.peopleSaved ?? 0,
        lessonsWatched: d.lessonsWatched ?? 0,
        topCourses: Array.isArray(d.topCourses) ? d.topCourses : [],
        recentCourses: Array.isArray(d.recentCourses) ? d.recentCourses : [],
      });
    } catch (e) {
      console.error('Failed to load expert dashboard stats', e);
      setStats({
        classesShared: 0,
        peopleSaved: 0,
        lessonsWatched: 0,
        topCourses: [],
        recentCourses: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const chartData = useMemo(
    () =>
      (stats.topCourses || []).map((c) => ({
        name: c.title?.length > 16 ? `${c.title.slice(0, 15)}…` : c.title,
        fullName: c.title,
        saves: Number(c.saves || 0),
        watched: Number(c.watched || 0),
      })),
    [stats.topCourses]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-forest-green-500 to-teal-600 rounded-xl p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Expert Dashboard</h2>
          <p className="text-green-100">
            Share your knowledge and help the UrbanSprout community grow!
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-forest-green-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-forest-green-100 p-3 rounded-lg">
                  <FaChalkboardTeacher className="text-forest-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.classesShared}</h3>
                  <p className="text-gray-600 text-sm">Classes shared</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <FaBookmark className="text-emerald-700 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.peopleSaved}</h3>
                  <p className="text-gray-600 text-sm">People saved your classes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FaPlayCircle className="text-blue-700 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.lessonsWatched}</h3>
                  <p className="text-gray-600 text-sm">Lessons watched</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-forest-green-100 p-3 rounded-lg">
                  <FaUsers className="text-forest-green-700 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{user?.name ? '—' : '—'}</h3>
                  <p className="text-gray-600 text-sm">Expert rating (coming soon)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaChalkboardTeacher className="text-forest-green-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Create Class</h3>
            </div>
            <p className="text-gray-600">Share your plant knowledge through lessons</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaUsers className="text-forest-green-500 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Answer Questions</h3>
            </div>
            <p className="text-gray-600">Help beginners with their plant care questions</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaChartLine className="text-forest-green-700 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">View Analytics</h3>
            </div>
            <p className="text-gray-600">Track your impact and engagement metrics</p>
          </button>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View analytics</h3>
            <p className="text-xs text-gray-500 mb-4">Demand based on saves per class</p>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-forest-green-600 animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">
                No analytics yet. Create and publish classes to start seeing demand.
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'saves'
                          ? [`${value} saves`, 'Saves']
                          : [`${value} watched`, 'Watched']
                      }
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullName || label
                      }
                    />
                    <Bar dataKey="saves" radius={[6, 6, 0, 0]} fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Your Recent Classes */}
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Classes</h3>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-forest-green-600 animate-spin" />
                </div>
              ) : stats.recentCourses.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No classes yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentCourses.map((c) => (
                    <div key={c.id} className="flex items-start">
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.title}
                          className="w-12 h-12 rounded-lg object-cover mr-3 border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg mr-3 bg-forest-green-50 border border-gray-200 flex items-center justify-center text-forest-green-700 text-xs font-semibold">
                          CL
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{c.title}</h4>
                        <p className="text-gray-600 text-sm">
                          {c.lessonsCount} lessons • {c.watched} watched • {c.saves} saves
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Content Performance Snapshot</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Avg. read time</p>
                  <p className="text-gray-900 font-semibold">—</p>
                </div>
                <div>
                  <p className="text-gray-500">Completion rate</p>
                  <p className="text-gray-900 font-semibold">—</p>
                </div>
                <div>
                  <p className="text-gray-500">Positive feedback</p>
                  <p className="text-gray-900 font-semibold">—</p>
                </div>
                <div>
                  <p className="text-gray-500">New followers this week</p>
                  <p className="text-gray-900 font-semibold">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExpertDashboard;