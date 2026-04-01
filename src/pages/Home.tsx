import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Plan } from '../types';
import { useCart } from '../CartContext';
import { Loader2, Plus } from 'lucide-react';

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setIsAdmin(userSnap.data().role === 'admin');
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  const fetchPlans = async () => {
    const q = query(collection(db, 'plans'), limit(3));
    const querySnapshot = await getDocs(q);
    const fetchedPlans = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        stock: data.stock ?? 0
      };
    }) as Plan[];
    setPlans(fetchedPlans);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSeedPlans = async () => {
    setSeeding(true);
    const samplePlans = [
      { name: '₹50 Google Play Code', price: 50, description: 'Get ₹50 credit for your Google Play account. Instant delivery after verification.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
      { name: '₹100 Google Play Code', price: 100, description: 'Get ₹100 credit for your Google Play account. Perfect for small in-game purchases.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
      { name: '₹250 Google Play Code', price: 250, description: 'Get ₹250 credit for your Google Play account. Best value for apps and games.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
      { name: '₹500 Google Play Code', price: 500, description: 'Get ₹500 credit for your Google Play account. Premium pack for serious gamers.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
    ];

    try {
      for (const plan of samplePlans) {
        await addDoc(collection(db, 'plans'), {
          ...plan,
          createdAt: new Date().toISOString()
        });
      }
      await fetchPlans();
    } catch (error) {
      alert('Error seeding plans: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative px-4 pt-12 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400"
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Trusted by 10k+ Gamers</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            Get Google Play Codes <br />
            <span className="bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 bg-clip-text text-transparent">
              Instantly & Securely
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-white/60"
          >
            The premium destination for digital redeem codes. Buy, pay, and get your codes delivered to your dashboard in minutes.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link 
              to="/plans" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 group"
            >
              Browse Plans
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/dashboard" 
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
            >
              My Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Plans */}
      <section className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Featured Plans</h2>
            <p className="text-white/60">Our most popular Google Play packs</p>
          </div>
          <Link to="/plans" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.length > 0 ? (
            plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
              >
                <div className="absolute top-4 left-4 z-10 px-5 py-3 bg-green-600 text-white text-2xl font-black rounded-2xl shadow-2xl shadow-green-600/40 border-2 border-white/20">
                  {plan.badgeText || `₹${plan.price}`}
                </div>
                {plan.stock <= 5 && plan.stock > 0 && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded-full shadow-lg uppercase">
                    Low Stock
                  </div>
                )}
                {plan.stock === 0 && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-lg uppercase">
                    Out of Stock
                  </div>
                )}
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={plan.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg"} 
                    alt={plan.name}
                    className={`w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-500 ${plan.stock === 0 ? 'grayscale opacity-50' : ''}`}
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${plan.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {plan.stock > 0 ? `In Stock: ${plan.stock}` : 'Out of Stock'}
                    </p>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-2">{plan.description}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Price</span>
                      <span className="text-2xl font-black text-white">₹{plan.price}</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => addToCart(plan)}
                        disabled={plan.stock === 0}
                        className="flex-1 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
                      >
                        Add to Cart
                      </button>
                      <Link 
                        to={plan.stock > 0 ? "/cart" : "#"} 
                        onClick={(e) => {
                          if (plan.stock === 0) e.preventDefault();
                          else addToCart(plan);
                        }}
                        className={`flex-1 py-3 text-white text-sm font-bold rounded-xl text-center transition-all ${
                          plan.stock > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            isAdmin ? (
              <div className="col-span-full py-24 bg-white/5 rounded-3xl border border-white/10 text-center space-y-6">
                <p className="text-white/40">No featured plans available yet.</p>
                <button 
                  onClick={handleSeedPlans}
                  disabled={seeding}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Seed Sample Plans
                </button>
              </div>
            ) : (
              // Placeholder if no plans exist yet
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl aspect-[4/5] animate-pulse" />
              ))
            )
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-24 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Instant Delivery</h3>
            <p className="text-white/60">Get your redeem codes directly in your dashboard as soon as the payment is verified.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Secure Payments</h3>
            <p className="text-white/60">Pay via UPI with screenshot verification. Our admin team verifies every transaction manually.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">24/7 Support</h3>
            <p className="text-white/60">Need help? Our dedicated support team is always available to assist with your purchases.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
