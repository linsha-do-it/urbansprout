import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { coursesAPI } from '../../utils/api';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const getDefaultPeriod = () => {
  const today = new Date();
  return {
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  };
};

const defaultAnalytics = {
  period: { month: getDefaultPeriod().month, year: getDefaultPeriod().year, label: '' },
  latestAvailablePeriod: null,
  availableYears: [getDefaultPeriod().year],
  allTimeSummary: {
    coursesPublished: 0,
    lessonsPublished: 0,
    totalSaves: 0,
    totalLessonCompletions: 0,
    averageSavesPerCourse: 0,
    averageCompletionsPerCourse: 0,
  },
  summary: {
    coursesPublished: 0,
    lessonsPublished: 0,
    totalSaves: 0,
    totalLessonCompletions: 0,
    averageSavesPerCourse: 0,
    averageCompletionsPerCourse: 0,
  },
  topPerformer: null,
  coursePerformance: [],
  recentCourses: [],
  monthlyBreakdown: [],
};

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

const ExpertAnalytics = () => {
  const initialPeriod = getDefaultPeriod();
  const [selectedMonth, setSelectedMonth] = useState(initialPeriod.month);
  const [selectedYear, setSelectedYear] = useState(initialPeriod.year);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(defaultAnalytics);

  const loadAnalytics = useCallback(async (month, year, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await coursesAPI.getExpertAnalytics({ month, year });
      const data = response?.data || defaultAnalytics;

      setAnalytics({
        period: data.period || defaultAnalytics.period,
        latestAvailablePeriod: data.latestAvailablePeriod || null,
        availableYears:
          Array.isArray(data.availableYears) && data.availableYears.length > 0
            ? data.availableYears
            : defaultAnalytics.availableYears,
        allTimeSummary: {
          ...defaultAnalytics.allTimeSummary,
          ...(data.allTimeSummary || {}),
        },
        summary: {
          ...defaultAnalytics.summary,
          ...(data.summary || {}),
        },
        topPerformer: data.topPerformer || null,
        coursePerformance: Array.isArray(data.coursePerformance) ? data.coursePerformance : [],
        recentCourses: Array.isArray(data.recentCourses) ? data.recentCourses : [],
        monthlyBreakdown: Array.isArray(data.monthlyBreakdown) ? data.monthlyBreakdown : [],
      });

      if (data?.period?.month && data?.period?.year) {
        if (month !== data.period.month) {
          setSelectedMonth(Number(data.period.month));
        }
        if (year !== data.period.year) {
          setSelectedYear(Number(data.period.year));
        }
      }
    } catch (error) {
      console.error('Failed to load expert analytics', error);
      setAnalytics(defaultAnalytics);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(selectedMonth, selectedYear, true);
  }, [loadAnalytics, selectedMonth, selectedYear]);

  const performanceChartData = useMemo(
    () =>
      analytics.coursePerformance.slice(0, 8).map((course) => ({
        name: course.title?.length > 16 ? `${course.title.slice(0, 15)}…` : course.title,
        fullName: course.title,
        saves: Number(course.saves || 0),
        watched: Number(course.watched || 0),
      })),
    [analytics.coursePerformance]
  );

  const trendChartData = useMemo(
    () =>
      analytics.monthlyBreakdown.map((entry) => ({
        label: entry.label,
        classes: Number(entry.classes || 0),
        saves: Number(entry.saves || 0),
      })),
    [analytics.monthlyBreakdown]
  );

  const yearOptions = useMemo(
    () =>
      Array.from(new Set([selectedYear, ...(analytics.availableYears || [])])).sort((a, b) => b - a),
    [analytics.availableYears, selectedYear]
  );

  const selectedMonthLabel =
    MONTH_OPTIONS.find((month) => month.value === selectedMonth)?.label || analytics.period.label;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-forest-green-100 text-forest-green-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <Link
                to="/expert/dashboard"
                className="inline-flex items-center text-sm font-medium text-forest-green-700 hover:text-forest-green-800 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to expert dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                Expert Analytics
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Review how your classes are performing for a selected month and year.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="min-w-40 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-100 focus:border-forest-green-500"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="min-w-32 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-100 focus:border-forest-green-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadAnalytics(selectedMonth, selectedYear, false)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center rounded-xl bg-forest-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-green-700 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 text-forest-green-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Selected reporting period
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {analytics.period.label || `${selectedMonthLabel} ${selectedYear}`}
                </p>
              </div>
              <div className="inline-flex items-center text-sm text-gray-600">
                <CalendarDays className="w-4 h-4 mr-2 text-forest-green-600" />
                Showing stored course data from your account, starting with the latest month that has data.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  All-time classes
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.allTimeSummary.coursesPublished)}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  All-time lessons
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.allTimeSummary.lessonsPublished)}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  All-time saves
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.allTimeSummary.totalSaves)}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  All-time completions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.allTimeSummary.totalLessonCompletions)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  {analytics.period.label || `${selectedMonthLabel} ${selectedYear}`} classes
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.coursesPublished)}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  {analytics.period.label || `${selectedMonthLabel} ${selectedYear}`} lessons
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.lessonsPublished)}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  {analytics.period.label || `${selectedMonthLabel} ${selectedYear}`} saves
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.totalSaves)}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                  {analytics.period.label || `${selectedMonthLabel} ${selectedYear}`} completions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analytics.summary.totalLessonCompletions)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Class engagement comparison
                  </h2>
                  <p className="text-xs text-gray-500">
                    Compare saves and lesson completions across your top classes in the selected month.
                  </p>
                </div>

                {performanceChartData.length === 0 ? (
                  <p className="text-sm text-gray-500 py-12">
                    No classes were published in this month. Choose another month or year to see class-level analytics.
                  </p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceChartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        />
                        <Legend />
                        <Bar dataKey="saves" name="Saves" fill="#16a34a" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="watched" name="Lesson completions" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance snapshot</h2>
                {analytics.topPerformer ? (
                  <>
                    <p className="text-sm text-gray-500 mb-1">Top class this period</p>
                    <p className="text-lg font-semibold text-gray-900 mb-4">
                      {analytics.topPerformer.title}
                    </p>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Saves</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatNumber(analytics.topPerformer.saves)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Lesson completions</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatNumber(analytics.topPerformer.watched)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Lessons in class</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatNumber(analytics.topPerformer.lessonsCount)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Avg. saves per class</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatNumber(analytics.summary.averageSavesPerCourse)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Avg. completions per class</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatNumber(analytics.summary.averageCompletionsPerCourse)}
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No standout class yet for this period. Publish more content or switch the filter to a month with existing classes.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedYear} publishing trend
                  </h2>
                  <p className="text-xs text-gray-500">
                    See how many classes you published each month and how many saves they generated.
                  </p>
                </div>

                {trendChartData.every((entry) => entry.classes === 0 && entry.saves === 0) ? (
                  <p className="text-sm text-gray-500 py-12">
                    No yearly trend data is available for {selectedYear} yet.
                  </p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="classes" name="Classes published" fill="#0f766e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="saves" name="Saves" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent classes in period</h2>
                {analytics.recentCourses.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    There are no classes in this selected month yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentCourses.map((course) => (
                      <div key={course.id} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="font-semibold text-gray-900">{course.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(course.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Lessons</p>
                            <p className="font-semibold text-gray-900">{formatNumber(course.lessonsCount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Saves</p>
                            <p className="font-semibold text-gray-900">{formatNumber(course.saves)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Completions</p>
                            <p className="font-semibold text-gray-900">{formatNumber(course.watched)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ExpertAnalytics;
