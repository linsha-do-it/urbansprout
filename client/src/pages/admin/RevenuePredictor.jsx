import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import io from 'socket.io-client';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  RefreshCw,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const RevenuePredictor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [predictionDays, setPredictionDays] = useState(30);
  const [confidence, setConfidence] = useState('');
  const [avgDailyRevenue, setAvgDailyRevenue] = useState(0);
  const [modelAccuracy, setModelAccuracy] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [futureDates, setFutureDates] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadRevenuePrediction();
    setupRealtimeUpdates();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [predictionDays]);

  const setupRealtimeUpdates = () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const token = localStorage.getItem('urbansprout_token');

      socketRef.current = io('http://localhost:5001', {
        auth: token ? { token } : undefined,
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to revenue prediction real-time updates');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from revenue prediction updates');
      });

      // Listen for new orders and update predictions
      socketRef.current.on('orderCreated', (order) => {
        console.log('New order detected, updating revenue prediction...', order);
        loadRevenuePrediction();
      });

      socketRef.current.on('orderUpdated', (order) => {
        console.log('Order updated, refreshing prediction...', order);
        loadRevenuePrediction();
      });

    } catch (e) {
      console.warn('Realtime updates initialization failed:', e);
    }
  };

  const loadRevenuePrediction = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/admin/revenue-prediction?days=${predictionDays}`);
      
      if (response.success && response.data) {
        setPredictions(response.data.predictions || []);
        setConfidence(response.data.confidence || 'low');
        setAvgDailyRevenue(response.data.avgDailyRevenue || 0);
        setModelAccuracy(response.data.modelAccuracy || null);
        setCurrentMetrics(response.data.currentMetrics || {});
        setTrainingData(response.data.trainingData || {});
        setFutureDates(response.data.futureDates || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading revenue prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceIcon = () => {
    switch (confidence) {
      case 'high': return <CheckCircle2 className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const totalPredictedRevenue = predictions.reduce((sum, val) => sum + val, 0);
  const avgPrediction = predictions.length > 0 ? totalPredictedRevenue / predictions.length : 0;
  const maxPrediction = Math.max(...predictions, 0);
  const minPrediction = Math.min(...predictions, 0);
  const weekOneRevenue = predictions.slice(0, 7).reduce((sum, val) => sum + val, 0);
  const weekTwoRevenue = predictions.slice(7, 14).reduce((sum, val) => sum + val, 0);
  const monthRevenue = totalPredictedRevenue;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Predictor</h1>
              <p className="text-gray-600 text-sm">AI-powered revenue forecasting using decision tree algorithm</p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={predictionDays}
                onChange={(e) => setPredictionDays(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="7">Next 7 days</option>
                <option value="14">Next 14 days</option>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
              </select>
              <button
                onClick={loadRevenuePrediction}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Model Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Prediction Model</h2>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor()}`}>
              {getConfidenceIcon()}
              <span className="ml-2 capitalize">{confidence} confidence</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Model Accuracy</div>
              <div className="text-2xl font-bold text-gray-900">
                {modelAccuracy !== null ? `${modelAccuracy.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Training Data</div>
              <div className="text-2xl font-bold text-gray-900">
                {trainingData?.totalOrders || 0} orders
              </div>
              {trainingData?.dateRange && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(trainingData.dateRange.start).toLocaleDateString()} - {new Date(trainingData.dateRange.end).toLocaleDateString()}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Average Daily Revenue</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(avgDailyRevenue)}
              </div>
            </div>
          </div>
        </div>

        {/* Current Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentMetrics?.today?.revenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{currentMetrics?.today?.orders || 0} orders</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentMetrics?.week?.revenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{currentMetrics?.week?.orders || 0} orders</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentMetrics?.month?.revenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{currentMetrics?.month?.orders || 0} orders</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">All Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentMetrics?.allTime?.revenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{currentMetrics?.allTime?.orders || 0} orders</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-sm text-amber-600 font-medium mb-1">Total Predicted</div>
              <div className="text-2xl font-bold text-amber-900">{formatCurrency(totalPredictedRevenue)}</div>
              <div className="text-xs text-amber-600 mt-1">Next {predictionDays} days</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium mb-1">Average Daily</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(avgPrediction)}</div>
              <div className="text-xs text-blue-600 mt-1">Daily projection</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium mb-1">Peak Day</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(maxPrediction)}</div>
              <div className="text-xs text-green-600 mt-1">Highest prediction</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-medium mb-1">Lowest Day</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(minPrediction)}</div>
              <div className="text-xs text-purple-600 mt-1">Lowest prediction</div>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        {predictionDays >= 14 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Week 1</span>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {formatCurrency(weekOneRevenue)}
                  </div>
                </div>
                <div className="text-xs text-gray-500">Days 1-7</div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Week 2</span>
                  <div className="flex items-center text-blue-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {formatCurrency(weekTwoRevenue)}
                  </div>
                </div>
                <div className="text-xs text-gray-500">Days 8-14</div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Chart (Line) */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Prediction (Line Chart)</h3>
          <div className="h-80 overflow-x-auto">
            {predictions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No prediction data available</p>
                  <p className="text-sm mt-1">This may occur if there are too few orders</p>
                </div>
              </div>
            ) : (
              (() => {
                const widthPerPoint = 24; // px per point for readability
                const padding = 24; // chart padding
                const height = 280; // svg height
                const count = predictions.length;
                const width = Math.max(400, padding * 2 + (count - 1) * widthPerPoint);
                const maxVal = Math.max(...predictions, 0);
                const safeMax = maxVal > 0 ? maxVal : 1; // avoid divide-by-zero
                const points = predictions.map((v, i) => {
                  const x = padding + i * widthPerPoint;
                  const y = padding + (1 - v / safeMax) * (height - padding * 2);
                  return { x, y };
                });
                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return (
                  <div className="min-w-max">
                    <svg width={width} height={height} role="img" aria-label="Revenue prediction line chart">
                      {/* Axes */}
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
                      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
                      {/* Line */}
                      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" />
                      {/* Points */}
                      {points.map((p, i) => {
                        const labelDate = futureDates[i] ? formatDate(futureDates[i]) : `Day ${i + 1}`;
                        const value = predictions[i];
                        return (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3" fill="#f59e0b">
                              <title>{`${labelDate}: ${formatCurrency(value)}`}</title>
                            </circle>
                            {/* X labels every 5 points if date available */}
                            {i % 5 === 0 && futureDates[i] && (
                              <text x={p.x} y={height - padding + 14} fontSize="10" textAnchor="middle" fill="#6b7280" transform={`rotate(-45 ${p.x},${height - padding + 14})`}>
                                {new Date(futureDates[i]).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Daily Predictions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Daily Predictions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predicted Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deviation from Avg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictions.slice(0, 30).map((prediction, index) => {
                  const deviation = prediction - avgPrediction;
                  const deviationPercent = avgPrediction > 0 ? ((deviation / avgPrediction) * 100) : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {futureDates[index] ? formatDate(futureDates[index]) : `Day ${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(prediction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={deviation >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {deviation >= 0 ? '+' : ''}{formatCurrency(deviation)} ({deviationPercent >= 0 ? '+' : ''}{deviationPercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {deviation >= 0 ? (
                          <div className="flex items-center text-green-600">
                            <ArrowUpRight className="h-4 w-4" />
                            <span className="ml-1">Above avg</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <ArrowDownRight className="h-4 w-4" />
                            <span className="ml-1">Below avg</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePredictor;


