export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
  badgeText?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  utrId?: string;
  screenshotUrl?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  redeemCode?: string;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface Settings {
  qrCodeUrl: string;
  upiId: string;
  closingSoonTime?: string;
}
