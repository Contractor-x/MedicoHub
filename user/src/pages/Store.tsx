
import * as React from 'react';
import { Product, User } from '../types';
import { ShoppingCart, Check, ArrowLeft, Trash2, Tag, Plus, Minus, MapPin, Search, Star } from 'lucide-react';
import { api } from '../services/api';
import { PaystackButton } from 'react-paystack';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { StatusModal, ModalType } from '../components/StatusModal';
import { useSettings } from '../context/SettingsContext';

/**
 * STORE PAGE:
 * This is where students can buy physical items like textbooks, scrubs, and medical kits.
 */
export const Store: React.FC<{ user: User | null }> = ({ user }) => {
  const settings = useSettings();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [deliveryZones, setDeliveryZones] = React.useState<any[]>([]); // Different prices for different states
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; title: string; message: string; type: ModalType }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // The 'cart' stores how many of each item the user wants to buy.
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [isCheckout, setIsCheckout] = React.useState(false);

  // Checkout Form State
  const [shippingLocation, setShippingLocation] = React.useState('');
  const [contactInfo, setContactInfo] = React.useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });

  const [couponCode, setCouponCode] = React.useState('');
  const [discount, setDiscount] = React.useState<{ type: string, value: number, code: string }>({ type: '', value: 0, code: '' });
  const [isVerifyingCoupon, setIsVerifyingCoupon] = React.useState(false);

  const categories = ['All', 'Textbooks', 'Essentials', 'Stationery', 'Merchandise', 'Digital'];

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch Products (Backend v3/MongoDB)
      try {
        const prodData = await api.products.getAll();
        if (prodData && Array.isArray(prodData)) {
          const mapped: Product[] = prodData.map((d: any) => ({
            id: d.id,
            name: d.title || 'Untitled Product',
            price: Number(d.price) || 0,
            category: d.category || 'Other',
            image: d.imageUrl || '',
            condition: d.condition || { label: 'Brand New', color: '#16a34a' },
            description: d.description
          }));
          setProducts(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }

      // Fetch Delivery Zones (Backend API)
      try {
        const zoneData = await api.delivery.getZones();
        if (zoneData && Array.isArray(zoneData)) {
          setDeliveryZones(zoneData);
        }
      } catch (error) {
        console.error("Failed to fetch delivery zones (Backend CORS?):", error);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const addToCart = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    const newCart = { ...cart };
    delete newCart[id];
    setCart(newCart);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty < 1) return prev;
      return { ...prev, [id]: newQty };
    });
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const cartItemIds = Object.keys(cart);
  const totalItems = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);

  const subtotal = cartItemIds.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    return sum + (product ? product.price * cart[id] : 0);
  }, 0);

  const shippingFee = React.useMemo(() => {
    const zone = deliveryZones.find(z => z.name === shippingLocation);
    return zone ? zone.price : 0;
  }, [shippingLocation, deliveryZones]);

  const discountAmount = discount.type === 'percentage'
    ? (subtotal * discount.value / 100)
    : (discount.type === 'fixed' ? discount.value : 0);

  const proDiscount = (user?.isSubscribed && settings.proDiscountEnabled)
    ? (subtotal * settings.proDiscountPercentage / 100)
    : 0;

  const isDemoMode = discount.code === 'DEMO2025';
  const grandTotal = isDemoMode ? 0 : Math.max(0, subtotal + shippingFee - discountAmount - proDiscount);

  const handleVerifyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    try {
      const res = await api.coupons.verify(couponCode, subtotal);
      setDiscount({ type: res.type, value: res.value, code: res.code });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: 'Invalid Coupon',
        message: err.message || "The coupon code you entered is invalid or expired.",
        type: 'error'
      });
      setDiscount({ type: '', value: 0, code: '' });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const config = React.useMemo(() => ({
    email: user?.email || "guest@medicohub.com",
    amount: Math.ceil(grandTotal * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_e325b3b91463d1090688c534049e80fef8d3360f',
  }), [user?.email, grandTotal]);

  const onSuccess = React.useCallback(async (reference: any) => {
    try {
      // We combine the customer's info, their cart, and the total price into one "Package" (Payload)
      // and send it to our backend to save the order.
      const payload = {
        customer: {
          name: contactInfo.name || "Guest",
          email: contactInfo.email || user?.email || "guest@medicohub.com",
          phone: contactInfo.phone || "0000000000",
          address: contactInfo.address || "No Address",
          state: shippingLocation || "Lagos"
        },
        items: cartItemIds.map(id => {
          const p = products.find(x => x.id === id);
          return {
            productId: id,
            name: p?.name || 'Unknown Product',
            quantity: cart[id],
            price: p?.price || 0,
            image: p?.image || ''
          };
        }),
        financials: {
          subtotal: subtotal || 0,
          shippingFee: shippingFee || 0,
          discount: (discountAmount + proDiscount) || 0,
          total: grandTotal || 0
        },
        payment: { reference: reference.reference, status: 'success' },
        couponCode: discount.code || undefined
      };

      await api.orders.create(payload);
      setIsSuccessModalOpen(true);
    } catch (e: any) {
      console.error(e);
      setModalConfig({
        isOpen: true,
        title: 'Order Failed',
        message: `Oops! We couldn't process your order: ${e.message}. Please contact our support team.`,
        type: 'error'
      });
    }
  }, [user, contactInfo, shippingLocation, cartItemIds, products, subtotal, shippingFee, discountAmount, grandTotal, discount, cart]);

  const handleSuccessClose = () => {
    setCart({});
    setShippingLocation('');
    setContactInfo({ name: '', email: '', phone: '', address: '' });
    setDiscount({ type: '', value: 0, code: '' });
    setIsCheckout(false);
    setIsSuccessModalOpen(false);
  };

  const onClose = React.useCallback(() => {
  }, []);



  if (isLoading) {
    return (
      <div className="pt-32 min-h-screen flex justify-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50 flex flex-col">
      <OrderSuccessModal isOpen={isSuccessModalOpen} onClose={handleSuccessClose} />
      <StatusModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Store Sub-header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-extrabold text-brand-dark">Medico Hub Store</h1>
            <p className="text-sm text-gray-500 font-medium">Curated academic tools, textbooks, and medical essentials. Positioned for excellence.</p>
          </div>

          <button
            onClick={() => setIsCheckout(!isCheckout)}
            className="relative flex items-center gap-2 bg-brand-dark hover:bg-black text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand-dark/20"
          >
            {isCheckout ? <ArrowLeft size={18} /> : <ShoppingCart size={18} />}
            <span className="font-bold text-sm">{isCheckout ? 'Back to Shop' : 'View Cart'}</span>
            {!isCheckout && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 h-6 w-6 bg-brand-yellow text-brand-dark text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {isCheckout ? (
          // Checkout View
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 max-w-5xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl font-bold text-brand-dark mb-8">Your Cart</h2>

            {cartItemIds.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="text-gray-300" size={40} />
                </div>
                <p className="text-gray-500 text-lg">Your cart is empty.</p>
                <button onClick={() => setIsCheckout(false)} className="mt-4 text-brand-blue font-bold hover:underline">Start Shopping</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><MapPin size={20} /> Contact & Delivery Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-colors" placeholder="e.g. John Doe" value={contactInfo.name} onChange={e => setContactInfo({ ...contactInfo, name: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-colors" placeholder="e.g. john@example.com" value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-colors" placeholder="e.g. 08012345678" value={contactInfo.phone} onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Street Address</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-colors" placeholder="e.g. 123 Main St" value={contactInfo.address} onChange={e => setContactInfo({ ...contactInfo, address: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {cartItemIds.map((id) => {
                      const item = products.find(p => p.id === id);
                      if (!item) return null;
                      const qty = cart[id];

                      return (
                        <div key={item.id} className="flex gap-6 p-4 border rounded-2xl border-gray-100 hover:border-brand-blue/20 transition-colors">
                          <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl bg-gray-100" />
                          <div className="flex-grow flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs text-brand-blue font-bold uppercase">{item.category}</p>
                                <h3 className="text-lg font-bold text-brand-dark leading-tight mb-1">{item.name}</h3>
                                {(() => {
                                  const cond = item.condition;
                                  const label = typeof cond === 'string' ? (cond === 'New' ? 'Brand New' : cond) : cond.label;
                                  const color = typeof cond === 'string' ? (cond === 'New' ? '#16a34a' : '#d97706') : cond.color;

                                  return (
                                    <span
                                      className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                                      style={{ backgroundColor: color }}
                                    >
                                      {label}
                                    </span>
                                  );
                                })()}
                              </div>
                              <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="flex justify-between items-end mt-4">
                              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-brand-dark"
                                  disabled={qty <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="font-bold text-sm w-4 text-center">{qty}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-brand-dark"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400 mb-0.5">{qty} x {formatCurrency(item.price)}</p>
                                <p className="font-bold text-lg text-brand-dark">{formatCurrency(item.price * qty)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Panel */}
                <div className="md:col-span-1">
                  <div className="bg-gray-50 rounded-[2rem] p-6 sticky top-40 border border-gray-100">
                    <h3 className="text-xl font-bold text-brand-dark mb-6">Order Summary</h3>

                    {/* Location Selector */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <MapPin size={12} /> Delivery Location
                      </label>
                      <div className="relative">
                        <select
                          value={shippingLocation}
                          onChange={(e) => setShippingLocation(e.target.value)}
                          className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select State...</option>
                          {deliveryZones.map(zone => (
                            <option key={zone._id || zone.id} value={zone.name}>{zone.name} - {formatCurrency(zone.price)}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ArrowLeft size={16} className="-rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Coupon Input */}
                    <div className="mb-6 border-t border-gray-100 pt-6">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        Have a Coupon?
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value)}
                          disabled={!!discount.code}
                        />
                        {discount.code ? (
                          <button onClick={() => { setDiscount({ type: '', value: 0, code: '' }); setCouponCode(''); }} className="bg-red-100 text-red-600 px-4 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={handleVerifyCoupon}
                            disabled={isVerifyingCoupon || !couponCode}
                            className="bg-brand-dark text-white px-4 rounded-xl font-bold text-sm hover:bg-black disabled:opacity-50 transition-colors"
                          >
                            {isVerifyingCoupon ? '...' : 'Apply'}
                          </button>
                        )}
                      </div>
                      {discount.code && (
                        <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1 animate-fade-in">
                          <Check size={12} /> Coupon {discount.code} applied!
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span className={shippingLocation ? 'text-gray-900' : 'text-gray-400 italic'}>
                          {shippingLocation ? formatCurrency(shippingFee) : '--'}
                        </span>
                      </div>
                      {discount.code && (
                        <div className="flex justify-between text-green-600 font-bold animate-fade-in">
                          <span className="flex items-center gap-1"><Tag size={12} /> Coupon Discount</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {proDiscount > 0 && (
                        <div className="flex justify-between text-brand-blue font-bold animate-fade-in">
                          <span className="flex items-center gap-1"><Star size={12} fill="currentColor" /> Pro Discount ({settings.proDiscountPercentage}%)</span>
                          <span>-{formatCurrency(proDiscount)}</span>
                        </div>
                      )}
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex justify-between text-xl font-bold text-brand-dark">
                        <span>Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                    {grandTotal === 0 && (shippingLocation && contactInfo.name && contactInfo.email && contactInfo.phone && contactInfo.address) ? (
                      <button
                        onClick={() => onSuccess({ reference: 'DEMO-BYPASS-' + Date.now() })}
                        className="w-full py-4 rounded-xl font-bold transition-all shadow-lg bg-brand-yellow hover:bg-yellow-500 text-brand-dark shadow-brand-yellow/20 flex items-center justify-center gap-2"
                      >
                        <Star size={18} fill="currentColor" /> Complete Demo Order
                      </button>
                    ) : (shippingLocation && contactInfo.name && contactInfo.email && contactInfo.phone && contactInfo.address) ? (
                      <PaystackButton
                        {...config}
                        text={`Pay Now (${formatCurrency(grandTotal)})`}
                        onSuccess={onSuccess}
                        onClose={onClose}
                        className="w-full py-4 rounded-xl font-bold transition-all shadow-lg bg-brand-blue hover:bg-blue-600 text-white shadow-brand-blue/20"
                      />
                    ) : (
                      <button
                        className="w-full py-4 rounded-xl font-bold transition-all shadow-lg bg-gray-200 text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        Enter Delivery Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Store View
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-12 flex-wrap animate-fade-in-up">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat
                    ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/20'
                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Store is Empty</h3>
                <p className="text-gray-500">Check back later for new products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, idx) => {
                  const qtyInCart = cart[product.id] || 0;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 animate-fade-in-up flex flex-col hover:shadow-xl hover:-translate-y-1"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Image Section */}
                      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden p-6 flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply filter contrast-110 group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <ShoppingCart size={40} className="text-gray-300" />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{product.category}</p>
                            {(() => {
                              const cond = product.condition;
                              const label = typeof cond === 'string' ? (cond === 'New' ? 'Brand New' : cond) : cond.label;
                              const color = typeof cond === 'string' ? (cond === 'New' ? '#16a34a' : '#d97706') : cond.color;

                              return (
                                <span
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                >
                                  {label}
                                </span>
                              );
                            })()}
                          </div>
                          <h3 className="text-lg font-bold text-brand-dark leading-snug mb-4 line-clamp-2">{product.name}</h3>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50">
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-xl font-extrabold text-brand-dark">{formatCurrency(product.price)}</p>
                          </div>

                          {qtyInCart > 0 ? (
                            <div className="flex items-center justify-between bg-brand-dark text-white rounded-xl p-1 shadow-lg shadow-brand-dark/20 w-full animate-pop-in">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (qtyInCart === 1) removeFromCart(product.id);
                                  else updateQuantity(product.id, -1);
                                }}
                                className="h-10 w-12 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                              >
                                <Minus size={18} />
                              </button>
                              <span className="font-extrabold text-base px-2">{qtyInCart}</span>
                              <button
                                onClick={(e) => addToCart(product.id, e)}
                                className="h-10 w-12 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => addToCart(product.id, e)}
                              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-brand-dark text-white hover:bg-black shadow-brand-dark/20`}
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};