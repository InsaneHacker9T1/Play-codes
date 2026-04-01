import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Plan } from '../types';
import { useCart } from '../CartContext';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPlans = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          stock: data.stock ?? 0
        };
      }) as Plan[];
      setPlans(fetchedPlans);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching plans:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSeedPlans = async () => {
    setSeeding(true);
    const samplePlans = [
      { name: '₹50 Google Play Code', price: 50, stock: 100, description: 'Get ₹50 credit for your Google Play account. Instant delivery after verification.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
      { name: '₹100 Google Play Code', price: 100, stock: 50, description: 'Get ₹100 credit for your Google Play account. Perfect for small in-game purchases.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
      { name: '₹250 Google Play Code', price: 250, stock: 25, description: 'Get ₹250 credit for your Google Play account. Best value for apps and games.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
      { name: '₹500 Google Play Code', price: 500, stock: 10, description: 'Get ₹500 credit for your Google Play account. Premium pack for serious gamers.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg' },
    ];

    try {
      for (const plan of samplePlans) {
        await addDoc(collection(db, 'plans'), {
          ...plan,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      alert('Error seeding plans: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">Choose Your Plan</h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Select from our wide range of Google Play gift card packs. All codes are genuine and delivered instantly after verification.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl aspect-[4/5] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all flex flex-col"
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
              <div className="aspect-square overflow-hidden bg-white/5 p-8 relative">
                <img 
                  src={plan.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg"} 
                  alt={plan.name}
                  className={`w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ${plan.stock === 0 ? 'grayscale opacity-50' : ''}`}
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-3">{plan.description}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${plan.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {plan.stock > 0 ? `In Stock: ${plan.stock}` : 'Out of Stock'}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Price</span>
                    <span className="text-2xl font-black text-white">₹{plan.price}</span>
                  </div>
                  <button 
                    onClick={async () => await addToCart(plan)}
                    disabled={plan.stock === 0}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Add to Cart
                  </button>
                  <Link 
                    to={plan.stock > 0 ? "/cart" : "#"} 
                    onClick={async (e) => {
                      if (plan.stock === 0) e.preventDefault();
                      else await addToCart(plan);
                    }}
                    className={`block w-full py-3 text-white text-sm font-bold rounded-xl text-center transition-all ${
                      plan.stock > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {plans.length === 0 && !loading && (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 space-y-6">
          <p className="text-white/40">No plans available at the moment. Check back later!</p>
          {isAdmin && (
            <button 
              onClick={handleSeedPlans}
              disabled={seeding}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Seed Sample Plans
            </button>
          )}
        </div>
      )}
    </div>
  );
}
