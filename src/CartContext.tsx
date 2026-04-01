import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Plan } from './types';
import { db } from './firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

interface CartItem extends Plan {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (plan: Plan) => Promise<void>;
  updateQuantity: (planId: string, quantity: number) => Promise<void>;
  removeFromCart: (planId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  completePurchase: () => void;
  total: number;
  lastAddedItem: Plan | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastAddedItem, setLastAddedItem] = useState<Plan | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (plan: Plan) => {
    try {
      // Check current stock in Firestore first
      const planRef = doc(db, 'plans', plan.id);
      const planSnap = await getDoc(planRef);
      
      if (!planSnap.exists()) {
        alert('Plan no longer exists.');
        return;
      }
      
      const currentStock = planSnap.data().stock ?? 0;
      if (currentStock <= 0) {
        alert('Sorry, this item is out of stock.');
        return;
      }

      // Decrease stock in Firestore
      await updateDoc(planRef, {
        stock: increment(-1)
      });

      setLastAddedItem(null); // Reset
      setTimeout(() => setLastAddedItem(plan), 10); // Trigger animation
      setCart(prev => {
        const existing = prev.find(item => item.id === plan.id);
        if (existing) {
          return prev.map(item =>
            item.id === plan.id ? { ...item, quantity: item.quantity + 1, stock: currentStock - 1 } : item
          );
        }
        return [...prev, { ...plan, quantity: 1, stock: currentStock - 1 }];
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const updateQuantity = async (planId: string, quantity: number) => {
    const item = cart.find(i => i.id === planId);
    if (!item) return;

    const diff = quantity - item.quantity;
    if (diff === 0) return;

    try {
      const planRef = doc(db, 'plans', planId);
      
      if (diff > 0) {
        // Check stock before increasing
        const planSnap = await getDoc(planRef);
        const currentStock = planSnap.data()?.stock ?? 0;
        if (currentStock < diff) {
          alert('Not enough stock available.');
          return;
        }
      }

      // Update stock in Firestore
      await updateDoc(planRef, {
        stock: increment(-diff)
      });

      if (quantity < 1) {
        await removeFromCart(planId);
        return;
      }

      setCart(prev => prev.map(item => 
        item.id === planId ? { ...item, quantity, stock: (item.stock || 0) - diff } : item
      ));
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const removeFromCart = async (planId: string) => {
    const item = cart.find(i => i.id === planId);
    if (!item) return;

    try {
      // Increase stock back in Firestore
      const planRef = doc(db, 'plans', planId);
      await updateDoc(planRef, {
        stock: increment(item.quantity)
      });

      setCart(prev => prev.filter(item => item.id !== planId));
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const clearCart = async () => {
    try {
      // Increase stock back for all items
      for (const item of cart) {
        const planRef = doc(db, 'plans', item.id);
        await updateDoc(planRef, {
          stock: increment(item.quantity)
        });
      }
      setCart([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const completePurchase = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, completePurchase, total, lastAddedItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
