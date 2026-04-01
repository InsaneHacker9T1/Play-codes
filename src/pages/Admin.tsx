import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { Plan, Order, Settings } from '../types';
import { uploadImage } from '../services/uploadService';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ExternalLink,
  Loader2,
  Search,
  Filter
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'orders' | 'plans' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [newPlan, setNewPlan] = useState({ name: '', price: 0, description: '', imageUrl: '', stock: 100, badgeText: '' });
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newSettings, setNewSettings] = useState({ upiId: '', qrCodeUrl: '', closingSoonTime: '' });
  const [redeemCode, setRedeemCode] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
    });

    const unsubPlans = onSnapshot(query(collection(db, 'plans'), orderBy('createdAt', 'desc')), (snap) => {
      setPlans(snap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data,
          stock: data.stock ?? 0
        };
      }) as Plan[]);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'payment'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Settings;
        setSettings(data);
        setNewSettings({ 
          upiId: data.upiId, 
          qrCodeUrl: data.qrCodeUrl,
          closingSoonTime: data.closingSoonTime || ''
        });
      }
    });

    setLoading(false);
    return () => { unsubOrders(); unsubPlans(); unsubSettings(); };
  }, []);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'plans'), {
      ...newPlan,
      createdAt: new Date().toISOString()
    });
    setNewPlan({ name: '', price: 0, description: '', imageUrl: '', stock: 100, badgeText: '' });
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    await updateDoc(doc(db, 'plans', editingPlan.id), {
      name: editingPlan.name || '',
      price: editingPlan.price || 0,
      description: editingPlan.description || '',
      stock: editingPlan.stock ?? 0,
      imageUrl: editingPlan.imageUrl || '',
      badgeText: editingPlan.badgeText || ''
    });
    setEditingPlan(null);
    alert('Plan updated!');
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await deleteDoc(doc(db, 'plans', id));
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'payment'), newSettings);
      alert('Settings updated!');
    } catch (error) {
      console.error("Settings Update Error:", error);
      alert('Failed to update settings. Please check your connection and permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!redeemCode) return alert('Please enter a redeem code');
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'approved',
      redeemCode,
      updatedAt: new Date().toISOString()
    });
    setRedeemCode('');
    setSelectedOrder(null);
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!adminNote) return alert('Please enter a reason for rejection');
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'rejected',
      adminNote,
      updatedAt: new Date().toISOString()
    });
    setAdminNote('');
    setSelectedOrder(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'plan' | 'qr' | 'edit-plan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.).');
      return;
    }

    // Check file size (limit to 1MB for Firestore)
    if (file.size > 1 * 1024 * 1024) {
      alert('File is too large. Please upload an image smaller than 1MB.');
      return;
    }

    setUploading(true);
    
    try {
      const url = await uploadImage(file, type === 'qr' ? 'settings' : 'plans');
      
      if (type === 'plan') setNewPlan({ ...newPlan, imageUrl: url });
      else if (type === 'edit-plan' && editingPlan) setEditingPlan({ ...editingPlan, imageUrl: url });
      else setNewSettings({ ...newSettings, qrCodeUrl: url });
    } catch (error: any) {
      console.error("Image Processing Error:", error);
      alert(error.message || 'Failed to process image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSeedPlans = async () => {
    const samplePlans = [
      { name: '₹50 Google Play Code', price: 50, description: 'Get ₹50 credit for your Google Play account. Instant delivery after verification.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg', stock: 100 },
      { name: '₹100 Google Play Code', price: 100, description: 'Get ₹100 credit for your Google Play account. Perfect for small in-game purchases.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg', stock: 100 },
      { name: '₹250 Google Play Code', price: 250, description: 'Get ₹250 credit for your Google Play account. Best value for apps and games.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg', stock: 100 },
      { name: '₹500 Google Play Code', price: 500, description: 'Get ₹500 credit for your Google Play account. Premium pack for serious gamers.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg', stock: 100 },
    ];

    try {
      for (const plan of samplePlans) {
        await addDoc(collection(db, 'plans'), {
          ...plan,
          createdAt: new Date().toISOString()
        });
      }
      alert('Sample plans added successfully!');
    } catch (error) {
      alert('Error seeding plans: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <p className="text-white/40">Manage your store, plans, and payments.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleSeedPlans}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold rounded-lg border border-white/10 transition-all"
          >
            Seed Sample Plans
          </button>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {[
              { id: 'orders', icon: LayoutDashboard, label: 'Orders' },
              { id: 'plans', icon: Package, label: 'Plans' },
              { id: 'settings', icon: SettingsIcon, label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                  <p className="text-xs text-white/40 uppercase font-bold">Pending Orders</p>
                  <p className="text-3xl font-bold text-yellow-400">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                  <p className="text-xs text-white/40 uppercase font-bold">Total Sales</p>
                  <p className="text-3xl font-bold text-green-400">₹{orders.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0)}</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                  <p className="text-xs text-white/40 uppercase font-bold">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-400">{orders.length}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-xs uppercase font-bold tracking-wider text-white/40 border-b border-white/10">
                        <th className="px-6 py-4">Order Info</th>
                        <th className="px-6 py-4">User / UTR</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-bold text-sm">{order.planName}</p>
                              <p className="text-[10px] text-white/30">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium">{order.userId.slice(0, 8)}...</p>
                              <p className="text-[10px] font-mono text-blue-400">{order.utrId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">₹{order.price}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              order.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                              order.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <a href={order.screenshotUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                <ExternalLink className="w-4 h-4 text-white/40" />
                              </a>
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => setSelectedOrder(order.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all"
                                >
                                  Process
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6 sticky top-24">
                  <h2 className="text-xl font-bold">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
                  <form onSubmit={editingPlan ? handleUpdatePlan : handleAddPlan} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Plan Name</label>
                      <input 
                        type="text" 
                        required
                        value={editingPlan ? (editingPlan.name || '') : newPlan.name}
                        onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, name: e.target.value }) : setNewPlan({ ...newPlan, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                        placeholder="e.g. ₹50 Google Play Code"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase">Price (₹)</label>
                        <input 
                          type="number" 
                          required
                          value={editingPlan ? (editingPlan.price || 0) : newPlan.price}
                          onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, price: Number(e.target.value) }) : setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase">Stock</label>
                        <input 
                          type="number" 
                          required
                          value={editingPlan ? (editingPlan.stock ?? 0) : newPlan.stock}
                          onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, stock: Number(e.target.value) }) : setNewPlan({ ...newPlan, stock: Number(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Badge Text (Top Left)</label>
                      <input 
                        type="text" 
                        value={editingPlan ? (editingPlan.badgeText || '') : newPlan.badgeText}
                        onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, badgeText: e.target.value }) : setNewPlan({ ...newPlan, badgeText: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                        placeholder="e.g. ₹50 (Leave empty to use price)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Description</label>
                      <textarea 
                        required
                        value={editingPlan ? (editingPlan.description || '') : newPlan.description}
                        onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, description: e.target.value }) : setNewPlan({ ...newPlan, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Plan Image URL</label>
                      <input 
                        type="text" 
                        required
                        value={editingPlan ? (editingPlan.imageUrl || '') : newPlan.imageUrl}
                        onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, imageUrl: e.target.value }) : setNewPlan({ ...newPlan, imageUrl: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                        placeholder="https://example.com/image.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase">Upload New Image</label>
                      <input 
                        type="file" 
                        onChange={e => handleFileUpload(e, editingPlan ? 'edit-plan' : 'plan')}
                        className="w-full text-xs text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      {editingPlan && (
                        <button 
                          type="button"
                          onClick={() => setEditingPlan(null)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                      )}
                      <button className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        {editingPlan ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingPlan ? 'Update Plan' : 'Add Plan'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map(plan => (
                  <div key={plan.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex gap-4 group relative">
                    <div className="w-20 h-20 bg-white/5 rounded-xl p-4 flex-shrink-0">
                      <img src={plan.imageUrl} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-sm">{plan.name}</h3>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingPlan(plan)} className="p-1.5 text-white/20 hover:text-blue-400 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-2">{plan.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-blue-400">Price: ₹{plan.price}</p>
                          {plan.badgeText && (
                            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Badge: {plan.badgeText}</p>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold ${plan.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {plan.stock > 0 ? `Stock: ${plan.stock}` : 'Out of Stock'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                <h2 className="text-2xl font-bold">Payment Settings</h2>
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase">UPI ID</label>
                    <input 
                      type="text" 
                      required
                      value={newSettings.upiId}
                      onChange={e => setNewSettings({ ...newSettings, upiId: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all"
                      placeholder="e.g. yourname@upi"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-white/40 uppercase">Closing Soon Timer</label>
                    <div className="flex gap-4">
                      <input 
                        type="datetime-local" 
                        value={newSettings.closingSoonTime}
                        onChange={e => setNewSettings({ ...newSettings, closingSoonTime: e.target.value })}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const date = new Date();
                          date.setHours(date.getHours() + 23);
                          // Format to local datetime string for input
                          const localISO = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                          setNewSettings({ ...newSettings, closingSoonTime: localISO });
                        }}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/10 transition-all"
                      >
                        Set 23h
                      </button>
                    </div>
                    <p className="text-[10px] text-white/30">This will show a countdown popup to users. Leave empty to disable.</p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-white/40 uppercase">Payment QR Code</label>
                    <div className="flex items-center gap-8">
                      <div className="w-32 h-32 bg-white rounded-xl p-2 relative">
                        {uploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          </div>
                        ) : null}
                        {newSettings.qrCodeUrl ? (
                          <img src={newSettings.qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                            <Plus className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          disabled={uploading}
                          onChange={e => handleFileUpload(e, 'qr')}
                          className="w-full text-xs text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
                        />
                        {uploading && (
                          <p className="mt-2 text-[10px] text-blue-400 animate-pulse">Processing image... Please wait.</p>
                        )}
                        <p className="mt-2 text-[10px] text-white/30">Upload a clear square image of your UPI QR code (Max 1MB).</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    disabled={saving || uploading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Processing Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Process Order</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Order ID</span>
                  <span className="font-mono">{selectedOrder}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Amount</span>
                  <span className="text-blue-400 font-bold">₹{orders.find(o => o.id === selectedOrder)?.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">UTR ID</span>
                  <span className="font-mono text-yellow-400">{orders.find(o => o.id === selectedOrder)?.utrId}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Redeem Code (For Approval)</label>
                  <input 
                    type="text" 
                    value={redeemCode}
                    onChange={e => setRedeemCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-green-500 transition-all font-mono"
                    placeholder="ABCD-1234-EFGH-5678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase">Admin Note (For Rejection)</label>
                  <textarea 
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-red-500 transition-all h-20 resize-none"
                    placeholder="e.g. Invalid UTR ID or Screenshot"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleRejectOrder(selectedOrder)}
                  className="py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> Reject
                </button>
                <button 
                  onClick={() => handleApproveOrder(selectedOrder)}
                  className="py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                >
                  <Check className="w-5 h-5" /> Approve
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
