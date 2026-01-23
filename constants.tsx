import React from 'react';
import { BrickType, Product } from './types';

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
    id: BrickType.B101,
    name: "101 High Grade Bricks",
    pricePerUnit: 15,
    isRecommended: false,
    image: "/images/itta2.jpg",
    description: "Superior quality traditional bricks known for extreme durability and standard size. Perfect for multi-story residential buildings."
  },
  {
    id: BrickType.CM,
    name: "C.M. Special Bricks",
    pricePerUnit: 14,
    isRecommended: true,
    image: "/images/itta1.jpg",
    description: "Machine-cut precision bricks. Highly recommended for cost-effective construction without compromising on load-bearing strength."
  }
];

export const ORDER_RULES = {
  minNormal: 2000,
  minBooking: 50000,
  smallQtyWarning: "Orders of 500 or 1000 bricks have significantly higher delivery costs due to logistics overhead.",
  brokenBricksPolicy: "Note: Up to 5% broken bricks may be included as per standard industrial norms. These are highly useful for floor management and sub-base preparation."
};
