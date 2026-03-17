import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vendorAPI } from '../../utils/api';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';

const VendorPayoutSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payoutDetails, setPayoutDetails] = useState({ hasUpi: false, upiMasked: null });
  const [loading, setLoading] = useState(true);
  const [upiInput, setUpiInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingUpi, setEditingUpi] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'vendor') {
      navigate('/unauthorized');
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const res = await vendorAPI.getPayoutDetails();
        setPayoutDetails({
          hasUpi: res?.data?.hasUpi ?? false,
          upiMasked: res?.data?.upiMasked ?? null,
        });
      } catch (e) {
        setPayoutDetails({ hasUpi: false, upiMasked: null });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const handleSaveUpi = async (e) => {
    e.preventDefault();
    const vpa = (upiInput || '').trim();
    if (!vpa) {
      setError('Please enter your UPI ID');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await vendorAPI.savePayoutDetails(vpa);
      setPayoutDetails({ hasUpi: true, upiMasked: res?.data?.upiMasked ?? null });
      setUpiInput('');
      setEditingUpi(false);
    } catch (err) {
      setError(err?.message || 'Failed to save UPI');
    } finally {
      setSaving(false);
    }
  };

  const showUpiForm = !payoutDetails.hasUpi || editingUpi;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/vendor/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-green-700 hover:text-forest-green-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payout settings</h1>
          <p className="mt-2 text-gray-600">
            Configure how you receive payments from orders. Your details are stored securely and never shared.
          </p>
        </div>

        {/* Main card: Receive payments via UPI */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-forest-green-600" />
              Receive payments via UPI
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your UPI ID to receive payouts when customers buy your products.
            </p>
          </div>

          <div className="px-6 py-6">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            ) : showUpiForm ? (
              <form onSubmit={handleSaveUpi} className="space-y-4">
                <div>
                  <label htmlFor="upi" className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUpi ? 'New UPI ID' : 'UPI ID'}
                  </label>
                  <input
                    id="upi"
                    type="text"
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    placeholder="e.g. yourname@paytm or merchant@ybl"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-forest-green-600 text-white text-sm font-semibold hover:bg-forest-green-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {saving ? 'Saving…' : editingUpi ? 'Update UPI' : 'Save UPI'}
                  </button>
                  {editingUpi && (
                    <button
                      type="button"
                      onClick={() => { setEditingUpi(false); setUpiInput(''); setError(''); }}
                      className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-forest-green-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-forest-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">UPI configured</p>
                    <p className="font-mono text-gray-700 mt-0.5">{payoutDetails.upiMasked || '••••••••'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingUpi(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-forest-green-700 bg-forest-green-100 hover:bg-forest-green-200"
                  >
                    <Pencil className="w-4 h-4" />
                    Change UPI
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Receiving limits may apply based on your bank/UPI type. For higher limits, use a business account or merchant UPI.
                </p>
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Use a merchant or business UPI for higher receive limits. Personal UPI accounts may have daily limits; payouts will fail if the limit is exceeded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPayoutSettings;
