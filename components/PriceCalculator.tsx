
import React, { useState, useEffect } from 'react';
import { PRODUCTS, TRIP_RULE, ORDER_RULES } from '../constants';
import { BrickType } from '../types';

const PriceCalculator: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(2000);
  const [selectedBrick, setSelectedBrick] = useState<BrickType>(BrickType.CM);
  const [isOutsideRingRoad, setIsOutsideRingRoad] = useState(false);

  const product = PRODUCTS.find(p => p.id === selectedBrick)!;
  const trips = Math.ceil(quantity / TRIP_RULE.bricksPerTrip);
  
  // Delivery Logic
  let deliveryCharge = 0;
  if (isOutsideRingRoad) {
    deliveryCharge = trips * 1000; // Mock calculation
  } else if (quantity < 2000) {
    deliveryCharge = 2500; // Small quantity penalty
  }

  // Bulk Discount
  let unitPrice = product.pricePerUnit;
  if (quantity >= 50000) {
    unitPrice = unitPrice * 0.95; // 5% discount
  }

  const subtotal = quantity * unitPrice;
  const total = subtotal + deliveryCharge;

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 lg:p-10 border border-gray-100">
      <h3 className="text-2xl font-oswald font-bold mb-6 text-gray-800 flex items-center gap-2">
        <i className="fas fa-calculator text-brick-600"></i>
        Instant Price Estimator
      </h3>

      <div className="space-y-6">
        {/* Brick Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Select Brick Type</label>
          <div className="grid grid-cols-2 gap-4">
            {PRODUCTS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedBrick(p.id)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedBrick === p.id 
                  ? 'border-brick-600 bg-brick-50 text-brick-900 shadow-inner' 
                  : 'border-gray-200 hover:border-brick-200'
                }`}
              >
                <span className="font-bold">{p.name}</span>
                <span className="text-xs font-semibold opacity-70">Rs. {p.pricePerUnit}/unit</span>
                {p.isRecommended && (
                  <span className="bg-construction-yellow text-[10px] font-black px-2 py-0.5 rounded-full text-construction-dark">RECOMMENDED</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">How many bricks?</label>
          <div className="relative">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-xl font-bold text-brick-900 focus:border-brick-500 focus:outline-none transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Units</div>
          </div>
          {quantity > 0 && quantity < 2000 && (
            <div className="mt-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold flex items-start gap-2 border border-red-100">
              <i className="fas fa-exclamation-triangle mt-0.5"></i>
              {ORDER_RULES.smallQtyWarning}
            </div>
          )}
        </div>

        {/* Location Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h4 className="font-bold text-gray-700">Outside Ring Road?</h4>
            <p className="text-xs text-gray-500">KTM Valley outskirts or other cities</p>
          </div>
          <button
            onClick={() => setIsOutsideRingRoad(!isOutsideRingRoad)}
            className={`w-14 h-8 rounded-full transition-colors relative ${isOutsideRingRoad ? 'bg-brick-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all ${isOutsideRingRoad ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Results */}
        <div className="bg-brick-900 rounded-2xl p-6 text-white space-y-4 shadow-xl">
          <div className="flex justify-between items-center opacity-80 border-b border-brick-800 pb-3">
            <span className="font-medium">Calculated Trips</span>
            <span className="text-xl font-bold">{trips} {trips === 1 ? 'Trip' : 'Trips'}</span>
          </div>
          
          <div className="flex justify-between items-center opacity-80 border-b border-brick-800 pb-3">
            <span className="font-medium">Brick Cost</span>
            <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center opacity-80 border-b border-brick-800 pb-3">
            <span className="font-medium">Delivery Fee</span>
            <span className="font-bold">{deliveryCharge === 0 ? 'FREE' : `Rs. ${deliveryCharge.toLocaleString()}`}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold">Total Estimate</span>
            <span className="text-3xl font-oswald font-bold text-construction-yellow">Rs. {total.toLocaleString()}</span>
          </div>

          {quantity >= 50000 && (
            <div className="bg-green-600/20 text-green-400 p-2 rounded text-center text-xs font-bold border border-green-600/30">
              🎉 5% BULK DISCOUNT APPLIED!
            </div>
          )}
        </div>
        
        <a 
          href={`#/booking?brick=${selectedBrick}&qty=${quantity}`}
          className="w-full block text-center bg-construction-yellow text-construction-dark py-4 rounded-xl font-black text-lg hover:bg-yellow-400 transition transform hover:-translate-y-1 active:translate-y-0 shadow-lg"
        >
          CONTINUE TO BOOKING
        </a>
      </div>
    </div>
  );
};

export default PriceCalculator;