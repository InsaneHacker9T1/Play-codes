import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Order, User } from '../types';
import { Package, Clock, CheckCircle2, XCircle, Copy, Bell, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', auth.currentUser!.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as User);
      }
    };

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
      setLoading(false);
    });

    fetchProfile();
    return unsubscribe;
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Card */}
        <div className="w-full md:w-80 space-y-6">
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">{profile?.email.split('@')[0]}</h2>
              <p className="text-sm text-white/40">{profile?.email}</p>
            </div>
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Role</span>
                <span className="text-blue-400 font-bold uppercase text-xs">{profile?.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Joined</span>
                <span className="text-white/70">
                  {profile ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Bell className="w-4 h-4 text-blue-400" />
              Notifications
            </div>
            <div className="space-y-3">
              {orders.filter(o => o.status !== 'pending').slice(0, 3).map(order => (
                <div key={order.id} className="text-xs p-3 bg-white/5 rounded-xl border border-white/5">
                  Your order for <span className="text-blue-400">{order.planName}</span> has been <span className={order.status === 'approved' ? 'text-green-400' : 'text-red-400'}>{order.status}</span>.
                </div>
              ))}
              {orders.filter(o => o.status !== 'pending').length === 0 && (
                <p className="text-xs text-white/20">No new notifications</p>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Purchase History</h1>
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm font-medium">
              {orders.length} Orders
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6 group hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold">{order.planName}</h3>
                        <p className="text-xs text-white/40">Order ID: {order.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-bold">₹{order.price}</p>
                        <p className="text-[10px] text-white/30">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                        {getStatusIcon(order.status)}
                        <span className="text-xs font-bold uppercase tracking-wider">{order.status}</span>
                      </div>
                    </div>
                  </div>

                  {order.status === 'approved' && order.redeemCode && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-green-400 tracking-widest">Your Redeem Code</p>
                        <p className="text-xl font-mono font-bold tracking-wider text-white">{order.redeemCode}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(order.redeemCode!, order.id)}
                        className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center gap-2 font-bold text-sm"
                      >
                        {copiedId === order.id ? 'Copied!' : <><Copy className="w-4 h-4" /> Copy</>}
                      </button>
                    </div>
                  )}

                  {order.status === 'rejected' && order.adminNote && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-xs text-red-400 font-medium">Reason: {order.adminNote}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-white/30">
                    <span>UTR ID: {order.utrId}</span>
                    <a 
                      href={order.screenshotUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View Payment Screenshot
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 space-y-4">
              <Package className="w-12 h-12 text-white/10 mx-auto" />
              <p className="text-white/40">You haven't made any purchases yet.</p>
              <Link to="/plans" className="inline-block text-blue-400 font-bold hover:underline">Start Shopping</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
