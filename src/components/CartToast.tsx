import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useCart } from '../CartContext';

export default function CartToast() {
  const { lastAddedItem } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastAddedItem) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  return (
    <AnimatePresence>
      {visible && lastAddedItem && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className="fixed top-24 right-4 z-[110] flex items-center gap-4 p-4 bg-zinc-900 border border-green-500/30 rounded-2xl shadow-2xl shadow-green-500/10"
        >
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Added to Cart</p>
            <p className="text-sm font-bold text-white">{lastAddedItem.name}</p>
          </div>
          <div className="pl-4 border-l border-white/10">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
