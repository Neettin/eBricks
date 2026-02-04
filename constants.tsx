// constants.tsx
import { BrickType as BrickTypeFromTypes, Product } from './types';

// Re-export BrickType
export { BrickTypeFromTypes as BrickType };
export type { Product };

export const VENDOR = {
  name: "Sachin Gupta",
  phone: "9851210449",
  whatsapp: "9824589706",
  company: "𝓮Bricks"
};

export const TRIP_RULE = {
  bricksPerTrip: 2000,
  insideRingRoadFree: true,
  insideRingRoadTime: "After 7 PM"
};

export const PRODUCTS: Product[] = [
  {
    id: BrickTypeFromTypes.B101,
    name: "101 High Grade Bricks",
    pricePerUnit: 15,
    isRecommended: false,
    image: "/images/itta2.jpg",
    description: "Superior quality traditional bricks known for extreme durability and standard size. Perfect for multi-story residential buildings."
  },
  {
    id: BrickTypeFromTypes.CM,
    name: "C.M. Special Bricks",
    pricePerUnit: 14,
    isRecommended: true,
    image: "/images/itta1.jpg",
    description: "Machine-cut precision bricks. Highly recommended for cost-effective construction without compromising on load-bearing strength."
  },
  {
    id: BrickTypeFromTypes.NTB,
    name: "NTB Local Bricks",
    pricePerUnit: 14.5,
    isRecommended: false,
    image: "/images/NTB-1.jpeg",
    description: "Traditional locally manufactured bricks with standard quality finish. Cash payment only. Ideal for budget-conscious projects requiring reliable construction materials."
  }
];

export const ORDER_RULES = {
  minNormal: 2000,
  minBooking: 50000,
  smallQtyWarning: "Orders of 500 or 1000 bricks have significantly higher delivery costs due to logistics overhead.",
};

export const HUBS = {
  [BrickTypeFromTypes.CM]: { lat: 27.631685, lng: 85.303183, name: 'C.M. Brick Factory, Karyabinayak' },
  [BrickTypeFromTypes.B101]: { lat: 27.666880, lng: 85.321960, name: '101 Brick, Khichapukhu Marg, Lalitpur' },
  [BrickTypeFromTypes.NTB]: { lat: 27.695978971370593, lng: 85.46120202474324, name: 'NTB Local Bricks, Changunarayan' }
};