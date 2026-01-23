
export enum BrickType {
  B101 = '101',
  CM = 'CM'
}

export interface Product {
  id: BrickType;
  name: string;
  pricePerUnit: number;
  isRecommended: boolean;
  image: string;
  description: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed'
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  brickType: BrickType;
  quantity: number;
  trips: number;
  location: string;
  deliveryCharge: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: OrderStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}
