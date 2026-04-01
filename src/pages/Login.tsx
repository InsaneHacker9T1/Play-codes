import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(redirect ? `/${redirect}` : '/dashboard');
      }
    });
    return unsubscribe;
  }, [navigate, redirect]);

  const handleGoogleLogin = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the Terms and Conditions to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const adminEmails = ['Mr.bitu9t9@gmail.com', 'ribankumari533@gmail.com'];
      const isAdminEmail = adminEmails.includes(user.email || '');
      
      // Check if user profile exists, if not create it
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        });
      } else if (isAdminEmail && userSnap.data()?.role !== 'admin') {
        // Ensure existing admin user has the correct role in Firestore
        await setDoc(userRef, { role: 'admin' }, { merge: true });
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login method not enabled. Please enable Google Auth in Firebase Console.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups for this site.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Please add it in Firebase Console.');
      } else {
        setError(err.message || 'An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms and Conditions to continue.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const adminEmails = ['Mr.bitu9t9@gmail.com', 'ribankumari533@gmail.com'];
        const isAdminEmail = adminEmails.includes(user.email || '');
        
        if (isAdminEmail) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists() || userSnap.data()?.role !== 'admin') {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              role: 'admin',
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const adminEmails = ['Mr.bitu9t9@gmail.com', 'ribankumari533@gmail.com'];
        const isAdminEmail = adminEmails.includes(user.email || '');
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase Console.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.message?.includes('insufficient permissions')) {
        setError('Permission denied when creating user profile. Please contact support.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-white/60">
          {isLogin ? 'Sign in to access your dashboard' : 'Join PlayCodes to start buying gift cards'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <input 
              type="checkbox" 
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
            />
            <div className="flex-1 space-y-1">
              <label htmlFor="terms" className="text-xs text-white/60 leading-relaxed cursor-pointer select-none">
                I agree to the <span className="text-blue-400">Terms and Conditions</span>.
              </label>
              {!showFullTerms ? (
                <button 
                  type="button"
                  onClick={() => setShowFullTerms(true)}
                  className="text-[10px] text-blue-400 hover:underline block"
                >
                  Read More
                </button>
              ) : (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-[10px] text-white/40 leading-relaxed"
                >
                  I understand that in case of payment failures or wrong UTR ID entered, the platform is not responsible. We are also not responsible for not receiving Google Play gift codes due to incorrect information provided.
                  <button 
                    type="button"
                    onClick={() => setShowFullTerms(false)}
                    className="text-blue-400 hover:underline ml-1"
                  >
                    Show Less
                  </button>
                </motion.p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          <button 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-white/40">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google Login
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
