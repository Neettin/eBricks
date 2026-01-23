import React from 'react';
import { PRODUCTS } from '../../constants';
import { Link } from 'react-router-dom';

import itta1 from '../assets/images/itta1.jpg';
import itta2 from '../assets/images/itta2.jpg';

const Products: React.FC = () => {
  const localProductImages: Record<string, string> = {
    '101': itta2, 
    'CM': itta1,  
  };

  return (
    <div className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-oswald font-bold text-brick-900 mb-4 uppercase tracking-tight">
            BRICK CATALOG
          </h1>
          <div className="w-20 h-1 bg-heritage-gold mx-auto rounded-full mb-6"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {PRODUCTS.map(product => (
            <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl transition-all duration-300 group">
              
              {/* Image Section */}
              <div className="relative h-72 bg-[#f8f8f8] flex items-center justify-center p-8">
                <img 
                  src={localProductImages[product.id] || product.image} 
                  alt={product.name} 
                  className="max-w-full max-h-full object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/400x300?text=Brick+Image';
                  }}
                />
                {product.isRecommended && (
                  <div className="absolute top-4 left-4 bg-heritage-gold text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md">
                    Best Choice
                  </div>
                )}
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <div className="min-h-[110px]">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-500 text-sm font-mukta leading-relaxed line-clamp-2 mb-4">
                    {product.description}
                  </p>
                  
                  {/* NEW: Detailed Brick Specifications Section */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center text-xs font-bold text-gray-600">
                      <i className="fas fa-check-circle text-heritage-gold mr-2"></i>
                      Grade A Quality
                    </div>
                    <div className="flex items-center text-xs font-bold text-gray-600">
                      <i className="fas fa-tint-slash text-heritage-gold mr-2"></i>
                      Low Water Absorption
                    </div>
                    <div className="flex items-center text-xs font-bold text-gray-600">
                      <i className="fas fa-layer-group text-heritage-gold mr-2"></i>
                      High Compression Strength
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rate</span>
                    <span className="text-2xl font-oswald font-bold text-brick-700">
                      Rs. {product.pricePerUnit} <span className="text-xs text-gray-400 font-sans uppercase">/ Unit</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <i className="fas fa-certificate text-green-500 opacity-50"></i>
                    <i className="fas fa-droplet text-blue-500 opacity-50"></i>
                  </div>
                </div>

                {/* UPDATED: Text Color set to heritage-gold */}
                <Link 
                  to={`/booking?brick=${product.id}`} 
                  className="mt-8 w-full bg-brick-800 hover:bg-brick-950 text-heritage-gold py-4 rounded-xl font-bold text-center transition-all shadow-lg uppercase tracking-widest text-sm border border-heritage-gold/20"
                >
                  Book This
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;