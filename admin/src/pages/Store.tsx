
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ShoppingBag, Trash2, X, Upload, Image as ImageIcon, Edit, AlertCircle, Ticket, CheckCircle, Truck, Package, FileText } from 'lucide-react';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const StorePage = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'coupons' | 'delivery' | 'orders'>('products');
    const [products, setProducts] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [deliveryZones, setDeliveryZones] = useState<any[]>([]);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'Merchandise',
        description: '',
        imageUrl: '',
        conditionLabel: 'Brand New',
        conditionColor: 'green'
    });

    const [couponForm, setCouponForm] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minOrderAmount: '',
        expiresAt: '',
        maxUses: ''
    });

    const [deliveryForm, setDeliveryForm] = useState({
        name: '',
        price: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchCoupons();
        fetchDelivery();
        fetchOrders();
    }, []);

    const fetchDelivery = async () => {
        try {
            const data = await api.delivery.getAll();
            setDeliveryZones(Array.isArray(data) ? data : []);
        } catch (error) { console.error(error); }
    };

    const fetchOrders = async () => {
        try {
            const data = await api.orders.getAll();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Error fetching orders:", error); }
    };

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
            const interval = setInterval(fetchOrders, 5000); // Poll every 5s for updates
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            // Optimistic update
            setOrders(orders.map(o => (o._id === id || o.id === id) ? { ...o, status: newStatus } : o));
            await api.orders.updateStatus(id, newStatus);
            fetchOrders();
        } catch (e) {
            console.error(e);
            alert("Failed to update status");
            fetchOrders(); // Revert on error
        }
    };

    const handleGenerateReceipt = (order: any) => {
        const doc = new jsPDF();

        // Brand Colors
        const brandBlue = [21, 94, 117]; // #155e75 (darker cyan/blue)
        const brandDark = [17, 24, 39]; // #111827 (gray-900)

        // Header
        doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("MEDICO HUB", 14, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Premium Academic Tools", 14, 32);

        doc.setFontSize(24);
        doc.text("RECEIPT", 195, 25, { align: 'right' });

        // Order Info
        const startY = 55;
        doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
        doc.setFontSize(10);

        // Left Column: Bill To
        doc.setFont("helvetica", "bold");
        doc.text("BILL TO:", 14, startY);
        doc.setFont("helvetica", "normal");
        doc.text(order.customer.name, 14, startY + 6);
        doc.text(order.customer.email, 14, startY + 11);
        doc.text(order.customer.phone || "", 14, startY + 16);
        doc.text(order.customer.address || "", 14, startY + 21);
        doc.text(order.customer.state || "", 14, startY + 26);

        // Right Column: Order Details
        doc.setFont("helvetica", "bold");
        doc.text("ORDER DETAILS:", 130, startY);
        doc.setFont("helvetica", "normal");
        doc.text(`Order ID:`, 130, startY + 6);
        doc.text(order.orderId, 195, startY + 6, { align: 'right' });

        doc.text(`Date:`, 130, startY + 11);
        doc.text(new Date(order.createdAt).toLocaleDateString(), 195, startY + 11, { align: 'right' });

        doc.text(`Status:`, 130, startY + 16);
        doc.text(order.status.toUpperCase(), 195, startY + 16, { align: 'right' });

        // Items Table
        const tableBody = order.items.map((item: any) => [
            item.name,
            item.quantity,
            `N ${item.price.toLocaleString()}`,
            `N ${(item.price * item.quantity).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: startY + 40,
            head: [['Item', 'Qty', 'Unit Price', 'Total']],
            body: tableBody,
            headStyles: { fillColor: brandBlue as [number, number, number], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Item
                1: { cellWidth: 20, halign: 'center' }, // Qty
                2: { cellWidth: 40, halign: 'right' }, // Price
                3: { cellWidth: 40, halign: 'right' }  // Total
            }
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const totalX = 130;
        const valX = 195;

        doc.text("Subtotal:", totalX, finalY);
        doc.text(`N ${order.financials.subtotal.toLocaleString()}`, valX, finalY, { align: 'right' });

        doc.text("Shipping:", totalX, finalY + 6);
        doc.text(`N ${order.financials.shippingFee.toLocaleString()}`, valX, finalY + 6, { align: 'right' });

        if (order.financials.discount > 0) {
            doc.setTextColor(220, 38, 38); // Red
            doc.text("Discount:", totalX, finalY + 12);
            doc.text(`- N ${order.financials.discount.toLocaleString()}`, valX, finalY + 12, { align: 'right' });
            doc.setTextColor(0, 0, 0); // Reset
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TOTAL:", totalX, finalY + 20);
        doc.text(`N ${order.financials.total.toLocaleString()}`, valX, finalY + 20, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Thank you for your business!", 105, 280, { align: 'center' });
        doc.text("Medico Hub", 105, 285, { align: 'center' });

        doc.save(`Receipt_${order.orderId}.pdf`);
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.delivery.create({ ...deliveryForm, price: Number(deliveryForm.price) });
            setIsDeliveryModalOpen(false);
            setDeliveryForm({ name: '', price: '' });
            fetchDelivery();
        } catch (e: any) {
            console.error(e);
            alert(`Failed to create zone: ${e.message || 'Unknown error'}`);
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (!confirm("Delete this delivery zone?")) return;
        await api.delivery.delete(id);
        fetchDelivery();
    };

    const fetchCoupons = async () => {
        try {
            const data = await api.coupons.getAll();
            const list = Array.isArray(data) ? data : [];
            // Filter out MCAMP coupons from the Store tab
            setCoupons(list.filter((c: any) => !c.code.startsWith('MCAMP-')));
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await api.products.getAll();
            const list = Array.isArray(data) ? data : ((data as any).data || []);
            setProducts(list);
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id || product._id);
        const { title, price, category, description, imageUrl, condition } = product;
        setFormData({
            title, price, category, description, imageUrl,
            conditionLabel: condition?.label || 'Brand New',
            conditionColor: condition?.color || 'green'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let downloadUrl = formData.imageUrl;

            if (imageFile) {
                downloadUrl = await api.files.upload(imageFile);
            }

            const payload = {
                title: formData.title,
                price: parseFloat(formData.price),
                category: formData.category,
                description: formData.description,
                imageUrl: downloadUrl, // Can be empty if no image
                inStock: true,
                condition: {
                    label: formData.conditionLabel,
                    color: formData.conditionColor
                }
            };

            if (editingId) {
                await api.products.update(editingId, payload);
            } else {
                await api.products.create(payload);
            }
            await fetchProducts();
            setIsModalOpen(false);
            setFormData({
                title: '',
                price: '',
                category: 'Merchandise',
                description: '',
                imageUrl: '',
                conditionLabel: 'Brand New',
                conditionColor: 'green'
            });
            setImageFile(null);
            setEditingId(null);
        } catch (error: any) {
            console.error("Failed to save product", error);
            const msg = error.details ? error.details.join('\n') : error.message;
            alert(`Failed to save product:\n${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsLoading(true);
        try {
            await api.products.delete(deleteId);
            await fetchProducts();
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete product");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...couponForm,
                value: Number(couponForm.value),
                maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : 100
            };
            await api.coupons.create(payload);
            setIsCouponModalOpen(false);
            setCouponForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', expiresAt: '', maxUses: '' });
            fetchCoupons();
        } catch (error: any) {
            console.error(error);
            const msg = error.details ? error.details.join('\n') : error.message;
            alert(`Failed to create coupon:\n${msg}`);
        }
    };

    const handleDeleteCoupon = (id: any) => {
        const couponId = typeof id === 'object' ? id.toString() : id;
        setDeleteCouponId(couponId);
    };

    const confirmDeleteCoupon = async () => {
        if (!deleteCouponId) return;
        setIsLoading(true);
        try {
            await api.coupons.delete(deleteCouponId);
            await fetchCoupons();
            setDeleteCouponId(null);
        } catch (error: any) {
            console.error(error);
            alert("Failed to delete coupon: " + (error.message || "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleCoupon = async (id: any) => {
        try {
            const couponId = typeof id === 'object' ? id.toString() : id;
            await api.coupons.toggle(couponId);
            fetchCoupons();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Store Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage products, coupons, delivery zones, and orders.</p>
                </div>

                {activeTab === 'products' && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '', price: '', category: 'Merchandise', description: '', imageUrl: '',
                                conditionLabel: 'Brand New', conditionColor: 'green'
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 active:scale-95"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 mb-8 w-fit shadow-sm overflow-x-auto">
                {[
                    { id: 'products', label: 'Products', icon: ShoppingBag },
                    { id: 'coupons', label: 'Coupons', icon: Ticket },
                    { id: 'delivery', label: 'Delivery', icon: Truck },
                    { id: 'orders', label: 'Orders', icon: Package }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: PRODUCTS */}
            {activeTab === 'products' && (
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {products.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400">No products found.</td></tr>
                                ) : (
                                    products.map((prod) => (
                                        <tr key={prod.id || prod._id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                        {prod.imageUrl ? (<img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />) : (<ShoppingBag size={20} className="text-gray-400" />)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-brand-dark group-hover:text-brand-blue transition-colors">{prod.title}</p>
                                                        <p className="text-gray-500 text-xs truncate max-w-[200px]">{prod.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5"><span className="font-bold text-brand-dark">₦{prod.price}</span></td>
                                            <td className="px-6 py-5"><span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase">{prod.category}</span></td>
                                            <td className="px-6 py-5 text-right flex justify-end gap-2">
                                                <button onClick={() => handleEdit(prod)} className="text-gray-400 hover:text-brand-blue transition-colors p-2 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(prod.id || prod._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: COUPONS */}
            {activeTab === 'coupons' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Manage Coupons</h2>
                            <p className="text-gray-500 text-sm">Create and activate discount codes.</p>
                        </div>
                        <button onClick={() => setIsCouponModalOpen(true)} className="flex items-center gap-2 bg-white text-brand-dark border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95">
                            <Plus size={18} /> Create Coupon
                        </button>
                    </div>
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Code</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Discount</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Min. Spend</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Expires</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {coupons.map(coupon => (
                                        <tr key={coupon._id || coupon.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5 font-mono font-bold text-brand-blue text-lg tracking-wide">{coupon.code}</td>
                                            <td className="px-6 py-5 font-bold text-gray-700">{coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₦${coupon.value} OFF`}</td>
                                            <td className="px-6 py-5">
                                                {coupon.minOrderAmount > 0 ? (
                                                    <span className="text-sm font-bold text-brand-dark">₦{coupon.minOrderAmount.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <button onClick={() => handleToggleCoupon(coupon._id || coupon.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${coupon.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    {coupon.isActive ? <CheckCircle size={12} /> : <X size={12} />} {coupon.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-500">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No Expiry'}</td>
                                            <td className="px-6 py-5 text-right">
                                                <button onClick={() => handleDeleteCoupon(coupon._id || coupon.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: DELIVERY */}
            {activeTab === 'delivery' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Delivery Zones</h2>
                            <p className="text-gray-500 text-sm">Set shipping rates for different locations.</p>
                        </div>
                        <button onClick={() => setIsDeliveryModalOpen(true)} className="flex items-center gap-2 bg-white text-brand-dark border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95">
                            <Plus size={18} /> Add Zone
                        </button>
                    </div>
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Zone Name</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Shipping Fee</th>
                                        <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {deliveryZones.length === 0 ? (
                                        <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-400">No delivery zones set.</td></tr>
                                    ) : (
                                        deliveryZones.map(zone => (
                                            <tr key={zone._id} className="hover:bg-gray-50/50">
                                                <td className="px-8 py-5 font-bold text-gray-800">{zone.name}</td>
                                                <td className="px-6 py-5 font-bold text-gray-600">₦{zone.price}</td>
                                                <td className="px-6 py-5 text-right">
                                                    <button onClick={() => handleDeleteZone(zone._id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ORDERS */}
            {activeTab === 'orders' && (
                <div className="animate-fade-in bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.length === 0 ? (
                                    <tr><td colSpan={6} className="px-8 py-10 text-center text-gray-400">No orders yet.</td></tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order._id || order.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-5 font-mono text-sm font-bold text-brand-blue">{order.orderId}</td>
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-gray-800">{order.customer.name}</p>
                                                <p className="text-xs text-gray-500">{order.customer.email}</p>
                                                <p className="text-xs text-brand-dark font-bold mt-1">📞 {order.customer.phone}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{order.customer.address}, {order.customer.state}</p>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-600">
                                                {order.items.map((item: any) => (
                                                    <div key={item.productId} className="flex gap-1 items-center">
                                                        <span className="font-bold">{item.quantity}x</span> {item.name}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="px-6 py-5 font-bold text-gray-800">₦{order.financials.total}</td>
                                            <td className="px-6 py-5">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order._id || order.id, e.target.value)}
                                                    className={`px-2 py-1 rounded-lg text-xs font-bold uppercase cursor-pointer border-none outline-none ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    <option value="pending">PENDING</option>
                                                    <option value="processing">PROCESSING</option>
                                                    <option value="shipped">SHIPPED</option>
                                                    <option value="delivered">DELIVERED</option>
                                                    <option value="cancelled">CANCELLED</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-5 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleGenerateReceipt(order)}
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors flex items-center gap-2 justify-center mx-auto"
                                                    title="Generate Receipt"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {isCouponModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-brand-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-pop-in">
                        <button onClick={() => setIsCouponModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">Create New Coupon</h2>
                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Coupon Code</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase" placeholder="e.g. SUMMER25" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Type</label><select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={couponForm.type} onChange={e => setCouponForm({ ...couponForm, type: e.target.value })}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₦)</option></select></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Value</label><input required type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="e.g. 10" value={couponForm.value} onChange={e => setCouponForm({ ...couponForm, value: e.target.value })} /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Min. Spend (₦) <span className="text-[10px] lowercase font-normal">(optional)</span></label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    placeholder="e.g. 20000"
                                    value={couponForm.minOrderAmount}
                                    onChange={e => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                                />
                            </div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Max Uses (Optional)</label><input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="e.g. 100" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Expires At (Optional)</label><input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={couponForm.expiresAt} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })} /></div>
                            <button type="submit" className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-black transition-all mt-2">Create Coupon</button>
                        </form>
                    </div>
                </div>, document.body
            )}

            {isDeliveryModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-brand-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative animate-pop-in">
                        <button onClick={() => setIsDeliveryModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Add Delivery Zone</h2>
                        <form onSubmit={handleCreateZone} className="space-y-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Zone Name</label><input required className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" placeholder="e.g. Lagos" value={deliveryForm.name} onChange={e => setDeliveryForm({ ...deliveryForm, name: e.target.value })} /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Price (₦)</label><input required type="number" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" placeholder="e.g. 2500" value={deliveryForm.price} onChange={e => setDeliveryForm({ ...deliveryForm, price: e.target.value })} /></div>
                            <button className="w-full bg-brand-blue text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-colors">Create Zone</button>
                        </form>
                    </div>
                </div>, document.body
            )}

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-brand-dark/50 backdrop-blur-sm animate-fade-in">
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative animate-pop-in my-8">
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"><X size={24} className="text-gray-400" /></button>
                            <h2 className="text-2xl font-bold text-brand-dark mb-6">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Display Image</label><div className="flex items-center gap-4"><label className="flex-1 cursor-pointer"><div className={`w-full px-4 py-8 bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${imageFile ? 'border-brand-blue bg-blue-50/30' : 'border-gray-200 hover:bg-gray-100'}`}>{imageFile ? (<ImageIcon size={32} className="text-brand-blue" />) : (<Upload size={32} className="text-gray-300" />)}<span className={`font-medium text-sm ${imageFile ? 'text-brand-blue' : 'text-gray-500'}`}>{imageFile ? imageFile.name : (formData.imageUrl && !imageFile ? 'Change Image' : 'Upload Product Image')}</span></div><input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} /></label></div></div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Product Title</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="e.g. Medico Hoodie" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Price (₦)</label>
                                        <input required type="number" step="0.01" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Category</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                            value={['Textbooks', 'Essentials', 'Stationery'].includes(formData.category) ? formData.category : 'custom'}
                                            onChange={e => {
                                                const v = e.target.value;
                                                setFormData({ ...formData, category: v === 'custom' ? '' : v });
                                            }}
                                        >
                                            <option value="Textbooks">Textbooks</option>
                                            <option value="Essentials">Essentials</option>
                                            <option value="Stationery">Stationery</option>
                                            <option value="custom">Create New Category...</option>
                                        </select>
                                        {/* Custom Category Input */}
                                        {!['Textbooks', 'Essentials', 'Stationery'].includes(formData.category) && (
                                            <input
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl mt-2 animate-fade-in"
                                                placeholder="Enter category name"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Condition</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                            value={formData.conditionLabel === 'Brand New' ? 'new' : formData.conditionLabel === 'Fairly Used' ? 'used' : 'custom'}
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (v === 'new') setFormData({ ...formData, conditionLabel: 'Brand New', conditionColor: '#16a34a' });
                                                else if (v === 'used') setFormData({ ...formData, conditionLabel: 'Fairly Used', conditionColor: '#ea580c' });
                                                else setFormData({ ...formData, conditionLabel: '', conditionColor: '#000000' });
                                            }}
                                        >
                                            <option value="new">Brand New</option>
                                            <option value="used">Fairly Used</option>
                                            <option value="custom">Create Custom Tag...</option>
                                        </select>
                                        {/* Custom Condition Label */}
                                        {(!['Brand New', 'Fairly Used'].includes(formData.conditionLabel)) && (
                                            <input
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl mt-2 animate-fade-in"
                                                placeholder="Tag Label (e.g. Refurbished)"
                                                value={formData.conditionLabel}
                                                onChange={e => setFormData({ ...formData, conditionLabel: e.target.value })}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Tag Color</label>
                                        <div className={`flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 h-[50px] transition-opacity ${['Brand New', 'Fairly Used'].includes(formData.conditionLabel) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <input
                                                type="color"
                                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent p-0"
                                                value={formData.conditionColor}
                                                onChange={e => setFormData({ ...formData, conditionColor: e.target.value })}
                                                disabled={['Brand New', 'Fairly Used'].includes(formData.conditionLabel)}
                                            />
                                            <span className="text-sm font-mono text-gray-600 uppercase">{formData.conditionColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Description</label><textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-24 resize-none" placeholder="Product details..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
                                <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/30 flex items-center justify-center gap-2">{isLoading ? 'Saving...' : (editingId ? 'Update Product' : 'Create Product')}</button>
                            </form>
                        </div>
                    </div>
                </div>, document.body
            )}

            {deleteId && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center animate-pop-in">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Delete Product?</h2>
                        <p className="text-gray-500 mb-8">Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div className="flex flex-col gap-3"><button onClick={confirmDelete} disabled={isLoading} className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">{isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Yes, Delete It"}</button><button onClick={() => setDeleteId(null)} disabled={isLoading} className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button></div>
                    </div>
                </div>, document.body
            )}
            {deleteCouponId && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center animate-pop-in">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Delete Coupon?</h2>
                        <p className="text-gray-500 mb-8">This will disable this discount code for all customers. This action cannot be undone.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={confirmDeleteCoupon} disabled={isLoading} className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
                                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Yes, Delete Coupon"}
                            </button>
                            <button onClick={() => setDeleteCouponId(null)} disabled={isLoading} className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

