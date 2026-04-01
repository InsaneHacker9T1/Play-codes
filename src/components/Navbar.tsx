import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { ShoppingCart, User, LogOut, ShieldCheck } from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { cart, lastAddedItem } = useCart();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (lastAddedItem) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        }
      } else {
        setRole(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" 
            alt="Google Play" 
            className="w-8 h-8"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 bg-clip-text text-transparent">
            PlayCodes
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/plans" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Plans
          </Link>
          
          <Link to="/cart" className="relative text-white/70 hover:text-white transition-colors">
            <motion.div
              animate={isBouncing ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <ShoppingCart className="w-5 h-5" />
            </motion.div>
            {cart.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={cart.length}
                className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {cart.length}
              </motion.span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              {role === 'admin' && (
                <Link to="/admin" className="text-white/70 hover:text-white transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </Link>
              )}
              <Link to="/dashboard" className="text-white/70 hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} className="text-white/70 hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
