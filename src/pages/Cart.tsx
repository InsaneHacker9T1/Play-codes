import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../CartContext';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, Loader2, CheckCircle2, Gift } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!auth.currentUser) {
      navigate('/login?redirect=cart');
      return;
    }
    navigate('/payment');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-8">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="text-white/60">Looks like you haven't added any plans to your cart yet.</p>
        </div>
        <Link 
          to="/plans" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
        >
          Browse Plans
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <h1 className="text-4xl font-bold">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl group"
            >
              <div className="w-24 h-24 bg-white/5 rounded-xl p-4 flex-shrink-0">
                <img 
                  src={item.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg"} 
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-sm text-white/50 line-clamp-1">{item.description}</p>
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-blue-400 font-bold">₹{item.price}</span>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                    <button 
                      onClick={async () => await updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={async () => await updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={async () => await removeFromCart(item.id)}
                className="p-3 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}

          <button 
            onClick={async () => await clearCart()}
            className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2"
          >
            Clear Cart
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Platform Fee</span>
                <span>₹0</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-400">₹{total}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              Proceed to Payment
            </button>
          </div>
          <p className="text-xs text-center text-white/30">
            By proceeding, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
