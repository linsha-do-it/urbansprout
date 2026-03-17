import React, { useEffect, useState, useCallback } from 'react';
import { vendorAPI } from '../../utils/api';
import { Loader2, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const VendorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    ordersThisMonth: 0,
    productsListed: 0,
    topSellingProducts: [],
  });

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vendorAPI.getDashboardStats();
      const d = res?.data || {};
      setStats({
        monthlyRevenue: d.monthlyRevenue ?? 0,
        ordersThisMonth: d.ordersThisMonth ?? 0,
        productsListed: d.productsListed ?? 0,
        topSellingProducts: Array.isArray(d.topSellingProducts)
          ? d.topSellingProducts
          : [],
      });
    } catch (e) {
      console.error('Failed to load vendor analytics', e);
      setStats({
        monthlyRevenue: 0,
        ordersThisMonth: 0,
        productsListed: 0,
        topSellingProducts: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const chartData = stats.topSellingProducts.map((p) => ({
    name: p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name,
    fullName: p.name,
    units: Number(p.quantitySold || 0),
    revenue: Number(p.revenue || 0),
  }));

  const totalUnits = chartData.reduce((sum, p) => sum + p.units, 0);
  const topProduct = chartData[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-forest-green-100 text-forest-green-700">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Vendor Analytics
            </h1>
            <p className="text-sm text-gray-600">
              See which products are in highest demand and how your shop is
              performing this month.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-forest-green-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Monthly revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹
                  {Number(stats.monthlyRevenue).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Orders this month
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.ordersThisMonth}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Active products
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.productsListed}
                </p>
              </div>
            </div>

            {/* Main analytics area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Best in-demand products
                    </h2>
                    <p className="text-xs text-gray-500">
                      Units sold per product this month
                    </p>
                  </div>
                </div>
                {chartData.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8">
                    No sales data yet. Once you start selling, you&apos;ll see a
                    bar chart of your top products here.
                  </p>
                ) : (
                  <div className="h-80">
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
                            name === 'units'
                              ? [`${value} units`, 'Units sold']
                              : [`₹${Number(value).toFixed(2)}`, 'Revenue']
                          }
                          labelFormatter={(label, payload) =>
                            payload?.[0]?.payload?.fullName || label
                          }
                        />
                        <Bar
                          dataKey="units"
                          radius={[6, 6, 0, 0]}
                          fill="#16a34a"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Top product spotlight
                </h2>
                {topProduct ? (
                  <>
                    <p className="text-sm text-gray-500 mb-1">Best in-demand</p>
                    <p className="text-base font-semibold text-gray-900 mb-3">
                      {topProduct.fullName}
                    </p>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Units sold</dt>
                        <dd className="font-medium text-gray-900">
                          {topProduct.units}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Revenue</dt>
                        <dd className="font-medium text-gray-900">
                          ₹{topProduct.revenue.toFixed(2)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Share of units</dt>
                        <dd className="font-medium text-gray-900">
                          {totalUnits > 0
                            ? `${Math.round(
                                (topProduct.units / totalUnits) * 100
                              )}%`
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-xs text-gray-500">
                      Use this product as a hero item in your storefront, feature
                      it in promotions, or bundle it with slower-moving stock.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">
                    We&apos;ll highlight your strongest product here once you
                    have sales data.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default VendorAnalytics;

