import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Plans from './pages/Plans';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import Admin from './pages/Admin';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import CartToast from './components/CartToast';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          const adminEmails = ['Mr.bitu9t9@gmail.com', 'ribankumari533@gmail.com'];
          const isAdminEmail = adminEmails.includes(u.email || '');
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          let currentRole = docSnap.exists() ? docSnap.data().role : null;
          
          if (isAdminEmail) {
            currentRole = 'admin';
          }
          setRole(currentRole);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" 
            alt="Loading" 
            className="w-16 h-16"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
          <Navbar />
          <CartToast />
          <main className="pt-20 pb-10">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={user ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/payment" 
                  element={user ? <Payment /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/admin" 
                  element={role === 'admin' ? <Admin /> : <Navigate to="/" />} 
                />
              </Routes>
            </AnimatePresence>
          </main>
          <footer className="border-t border-white/10 py-8 px-4 text-center text-white/40 text-sm">
            <p>© 2026 PlayCodes. All rights reserved.</p>
            <p className="mt-2 text-xs">Official Google Play Redeem Code Reseller</p>
          </footer>
        </div>
      </Router>
    </CartProvider>
  );
}
