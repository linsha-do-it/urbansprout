import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vendorAPI } from '../../utils/api';
import {
  MapPin,
  Star,
  Share2,
  Loader2,
  X,
  ShoppingCart,
  Plus,
  Check,
} from 'lucide-react';

const VendorStorefront = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [payUriData, setPayUriData] = useState(null);
  const [payUriLoading, setPayUriLoading] = useState(false);
  const [lastOrderSummary, setLastOrderSummary] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
  });

  const loadStore = async () => {
    try {
      setLoading(true);
      const res = await vendorAPI.getPublicStorefront(vendorId);
      setVendor(res.data.vendor);
      setProducts(res.data.products || []);
    } catch (e) {
      console.error('Failed to load vendor storefront', e);
      setError(e.message || 'Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) loadStore();
  }, [vendorId]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: vendor?.name || 'Vendor Store', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Store link copied to clipboard');
      }
    } catch {}
  };

  const isSoldOut = (product) => product.stock === 0;

  // Only beginner and expert users can buy; vendors cannot add to cart or buy on storefront
  const canBuy = isAuthenticated && (user?.role === 'beginner' || user?.role === 'expert');

  const addToCart = (product, qty = 1) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!canBuy) return;
    if (isSoldOut(product)) return;
    const n = Math.min(Math.max(1, qty), product.stock || 999);
    setCart((prev) => {
      const i = prev.findIndex((x) => x.product._id === product._id);
      if (i >= 0) {
        const next = [...prev];
        next[i].quantity = Math.min((next[i].quantity || 1) + n, product.stock || 999);
        return next;
      }
      return [...prev, { product, quantity: n }];
    });
    setSelectedProduct(null);
    setQuickViewQty(1);
  };

  const toggleSelect = (e, product) => {
    e.stopPropagation();
    if (!canBuy || isSoldOut(product)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(product._id)) next.delete(product._id);
      else next.add(product._id);
      return next;
    });
  };

  const openCheckoutWithSelection = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!canBuy) return;
    const items = products.filter((p) => selectedIds.has(p._id) && !isSoldOut(p));
    if (items.length === 0) return;
    setCheckoutItems(items.map((p) => ({ product: p, quantity: 1 })));
    setCheckoutOpen(true);
    setOrderError('');
    setOrderSuccess(false);
  };

  const openCheckoutWithCart = () => {
    if (cart.length === 0) return;
    setCheckoutItems([...cart]);
    setCheckoutOpen(true);
    setOrderError('');
    setOrderSuccess(false);
  };

  const openBuyNow = (product, qty = 1) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!canBuy) return;
    if (isSoldOut(product)) return;
    const n = Math.min(Math.max(1, qty), product.stock || 999);
    setCheckoutItems([{ product, quantity: n }]);
    setCheckoutOpen(true);
    setSelectedProduct(null);
    setQuickViewQty(1);
    setOrderError('');
    setOrderSuccess(false);
  };

  const getCheckoutTotal = () => {
    return checkoutItems.reduce((sum, it) => sum + (it.product.regularPrice || 0) * (it.quantity || 1), 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;
    setPlacing(true);
    setOrderError('');
    setPayUriData(null);
    const isUpi = paymentMethod === 'upi';
    try {
      await vendorAPI.vendorCheckout({
        items: checkoutItems.map((it) => ({
          vendorProductId: it.product._id,
          quantity: it.quantity || 1,
        })),
        shippingAddress,
        paymentMethod: isUpi ? 'UPI' : 'Cash on Delivery',
      });
      setOrderSuccess(true);
      setLastOrderSummary({
        items: checkoutItems.map((it) => ({ product: it.product, quantity: it.quantity })),
        total: getCheckoutTotal(),
      });
      if (isUpi && vendorId) {
        const total = getCheckoutTotal();
        setPayUriLoading(true);
        try {
          const res = await vendorAPI.getPayUri(vendorId, total);
          if (res?.data?.qrDataUrl) {
            setPayUriData({
              qrDataUrl: res.data.qrDataUrl,
              vendorName: res.data.vendorName || vendor?.name,
              amount: res.data.amount ?? total,
            });
          }
        } catch (qrErr) {
          console.error('Pay URI fetch failed', qrErr);
        } finally {
          setPayUriLoading(false);
        }
      }
      setCheckoutItems([]);
      setCart((prev) => prev.filter((c) => !checkoutItems.some((i) => i.product._id === c.product._id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        checkoutItems.forEach((i) => next.delete(i.product._id));
        return next;
      });
      loadStore();
    } catch (err) {
      setOrderError(err?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const cartCount = cart.reduce((n, it) => n + (it.quantity || 1), 0);
  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 text-forest-green-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        ) : !vendor ? (
          <div className="bg-white/80 border border-white/60 rounded-2xl p-6 text-center text-gray-600">Vendor not found.</div>
        ) : (
          <>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 overflow-hidden mb-6">
              <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-full border-4 border-white bg-forest-green-100 overflow-hidden flex items-center justify-center text-2xl font-semibold text-forest-green-700 shadow-md">
                    {vendor.avatar ? (
                      <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      (vendor.name || 'S')[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-1">
                      {vendor.name || 'Vendor'}
                    </h1>
                    <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                      <span className="inline-flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-forest-green-600" /> Home-based seller
                      </span>
                      <span className="inline-flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        {vendor.rating?.toFixed(1) || '0.0'} <span className="ml-1 text-gray-500">({vendor.reviewCount || 0} reviews)</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-forest-green-600 text-cream-50 text-xs font-semibold shadow hover:bg-forest-green-700 self-start sm:self-auto"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share Store
                </button>
              </div>
            </div>

            {/* Cart + Buy selected bar – only for beginner/expert */}
            {(cartCount > 0 || selectedCount > 0) && canBuy && (
              <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white/90 rounded-xl border border-forest-green-100">
                {cartCount > 0 && (
                  <button
                    onClick={openCheckoutWithCart}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-green-600 text-white text-sm font-medium hover:bg-forest-green-700"
                  >
                    <ShoppingCart className="w-4 h-4" /> Cart ({cartCount}) – Buy all
                  </button>
                )}
                {selectedCount > 0 && (
                  <button
                    onClick={openCheckoutWithSelection}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-forest-green-600 text-forest-green-700 text-sm font-medium hover:bg-forest-green-50"
                  >
                    <Check className="w-4 h-4" /> Buy selected ({selectedCount})
                  </button>
                )}
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4 sm:p-6">
              {products.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-10">This vendor has not listed any products yet.</div>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Products</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((product) => (
                      <div key={product._id} className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div
                          className="relative aspect-[4/3] bg-forest-green-50 cursor-pointer flex-shrink-0"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-forest-green-500 text-xs">No image</div>
                          )}
                          {isSoldOut(product) && (
                            <span className="absolute top-2 left-2 rounded-full bg-red-600 text-white text-[10px] px-2 py-0.5 font-semibold">Sold Out</span>
                          )}
                          {canBuy && !isSoldOut(product) && (
                            <div
                              className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded border-2 border-white bg-white/90 shadow"
                              onClick={(e) => toggleSelect(e, product)}
                            >
                              {selectedIds.has(product._id) ? (
                                <Check className="w-3.5 h-3.5 text-forest-green-600" />
                              ) : (
                                <div className="w-3 h-3 rounded border border-gray-300" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col p-2.5 sm:p-3">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className="text-left w-full"
                          >
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                            {product.description && (
                              <p className="text-[11px] text-gray-500 line-clamp-2 mb-1.5">{product.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-forest-green-700">₹{product.regularPrice?.toFixed(2) || '0.00'}</span>
                              <span className="px-2 py-0.5 rounded-full bg-forest-green-50 text-forest-green-700 text-[10px] font-medium">{product.category}</span>
                            </div>
                          </button>
                          {canBuy && !isSoldOut(product) && (
                            <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => addToCart(product, 1)}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-forest-green-300 text-forest-green-700 text-[11px] font-medium hover:bg-forest-green-50"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                              <button
                                type="button"
                                onClick={() => openBuyNow(product, 1)}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-forest-green-600 text-white text-[11px] font-medium hover:bg-forest-green-700"
                              >
                                Buy Now
                              </button>
                            </div>
                          )}
                          {!isAuthenticated && !isSoldOut(product) && (
                            <button
                              type="button"
                              onClick={() => navigate('/login')}
                              className="mt-2 w-full py-1.5 rounded-lg border border-gray-300 text-gray-600 text-[11px] font-medium hover:bg-gray-50"
                            >
                              Login to buy
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Quick view modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative aspect-video bg-forest-green-50">
                {selectedProduct.images?.[0] ? (
                  <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-forest-green-500 text-sm">No image</div>
                )}
                {isSoldOut(selectedProduct) && (
                  <span className="absolute top-2 left-2 rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5 font-semibold">Sold Out</span>
                )}
                <button onClick={() => setSelectedProduct(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-gray-700 hover:bg-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-base font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-xs text-gray-600">{selectedProduct.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between pt-2 text-sm">
                  <div>
                    <p className="text-lg font-bold text-forest-green-700">₹{selectedProduct.regularPrice?.toFixed(2) || '0.00'}</p>
                    <p className="text-[11px] text-gray-500">Stock: {selectedProduct.stock}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-forest-green-50 text-forest-green-700 text-[11px] font-medium">{selectedProduct.category}</span>
                </div>
                {canBuy && !isSoldOut(selectedProduct) && (
                  <div className="flex gap-2 pt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      Qty:
                      <input
                        type="number"
                        min={1}
                        max={selectedProduct.stock || 99}
                        value={quickViewQty}
                        onChange={(e) => setQuickViewQty(Number(e.target.value) || 1)}
                        className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => addToCart(selectedProduct, quickViewQty)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-xl border border-forest-green-300 text-forest-green-700 text-sm font-medium hover:bg-forest-green-50"
                    >
                      <Plus className="w-4 h-4" /> Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => openBuyNow(selectedProduct, quickViewQty)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-forest-green-600 text-white text-sm font-medium hover:bg-forest-green-700"
                    >
                      Buy Now
                    </button>
                  </div>
                )}
                {!isAuthenticated && !isSoldOut(selectedProduct) && (
                  <button type="button" onClick={() => navigate('/login')} className="w-full py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                    Login to buy
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Checkout modal */}
        {checkoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden my-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Checkout</h3>
                <button
                  type="button"
                  onClick={() => {
                    if (placing) return;
                    setCheckoutOpen(false);
                    setOrderSuccess(false);
                    setPayUriData(null);
                    setLastOrderSummary(null);
                    setShippingAddress({ fullName: '', address: '', city: '', state: '', postalCode: '', country: 'India', phone: '' });
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {orderSuccess ? (
                <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[70vh]">
                  <p className="text-sm text-forest-green-600 font-medium">Order placed successfully.</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-900 mb-1">Shipping address</p>
                    <p>{shippingAddress.fullName}</p>
                    <p>{shippingAddress.address}</p>
                    <p>{[shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ')} {shippingAddress.postalCode}</p>
                    <p>{shippingAddress.country}</p>
                    {shippingAddress.phone && <p className="mt-1">Phone: {shippingAddress.phone}</p>}
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="font-medium text-gray-900 mb-2">Products</p>
                    {(lastOrderSummary?.items || []).map((it) => (
                      <div key={it.product._id} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className="w-12 h-12 rounded-lg bg-white flex-shrink-0 overflow-hidden border border-gray-100">
                          {it.product.images?.[0] ? (
                            <img src={it.product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-forest-green-400 text-xs">—</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{it.product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {it.quantity} × ₹{it.product.regularPrice?.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-semibold text-forest-green-700">₹{((it.product.regularPrice || 0) * (it.quantity || 1)).toFixed(2)}</p>
                      </div>
                    ))}
                    <p className="text-base font-bold text-gray-900 pt-2">Total: ₹{(lastOrderSummary?.total ?? 0).toFixed(2)}</p>
                  </div>
                  {paymentMethod === 'upi' && (
                    <div className="rounded-xl border border-forest-green-200 bg-forest-green-50/50 p-4">
                      {payUriLoading && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading QR…
                        </p>
                      )}
                      {!payUriLoading && payUriData?.qrDataUrl && (
                        <>
                          <p className="text-sm font-medium text-gray-900 mb-2">Scan to pay {payUriData.vendorName}</p>
                          <p className="text-lg font-bold text-forest-green-700 mb-3">₹{Number(payUriData.amount).toFixed(2)}</p>
                          <div className="flex justify-center bg-white rounded-lg p-3 inline-block">
                            <img src={payUriData.qrDataUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Open any UPI app and scan this QR to complete payment.</p>
                        </>
                      )}
                      {!payUriLoading && !payUriData?.qrDataUrl && (
                        <p className="text-sm text-gray-600">Vendor has not set up UPI. Your order is placed; you can pay on delivery.</p>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                      setPayUriData(null);
                      setLastOrderSummary(null);
                      setShippingAddress({ fullName: '', address: '', city: '', state: '', postalCode: '', country: 'India', phone: '' });
                    }}
                    className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
              <div className="px-4 py-4 max-h-64 overflow-y-auto">
                {checkoutItems.map((it) => (
                  <div key={it.product._id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-14 h-14 rounded-lg bg-forest-green-50 flex-shrink-0 overflow-hidden">
                      {it.product.images?.[0] ? (
                        <img src={it.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-forest-green-400 text-xs">—</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{it.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {it.quantity} × ₹{it.product.regularPrice?.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-semibold text-forest-green-700">₹{((it.product.regularPrice || 0) * (it.quantity || 1)).toFixed(2)}</p>
                  </div>
                ))}
                <p className="text-base font-bold text-gray-900 pt-2">Total: ₹{getCheckoutTotal().toFixed(2)}</p>
              </div>
              <form onSubmit={handlePlaceOrder} className="px-4 pb-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Shipping address</p>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress((s) => ({ ...s, fullName: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <textarea
                  required
                  placeholder="Address"
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress((s) => ({ ...s, address: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress((s) => ({ ...s, city: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress((s) => ({ ...s, state: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Postal code"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress((s) => ({ ...s, postalCode: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Country"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress((s) => ({ ...s, country: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress((s) => ({ ...s, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Payment</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-forest-green-600"
                      />
                      <span className="text-sm">Cash on Delivery</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="text-forest-green-600"
                      />
                      <span className="text-sm">Pay online (UPI)</span>
                    </label>
                  </div>
                  {paymentMethod === 'upi' && !orderSuccess && (
                    <p className="text-xs text-gray-500">After placing order, scan the vendor&apos;s QR to pay.</p>
                  )}
                </div>
                {orderError && <p className="text-sm text-red-600">{orderError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (placing) return;
                      setCheckoutOpen(false);
                      setOrderSuccess(false);
                      setPayUriData(null);
                      setLastOrderSummary(null);
                      setShippingAddress({ fullName: '', address: '', city: '', state: '', postalCode: '', country: 'India', phone: '' });
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={placing} className="flex-1 py-2.5 rounded-xl bg-forest-green-600 text-white text-sm font-semibold hover:bg-forest-green-700 disabled:opacity-60">
                    {placing ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Place order'}
                  </button>
                </div>
              </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorStorefront;
