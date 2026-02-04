import * as React from 'react';
import { PRODUCTS } from '../../constants';
import { BrickType } from '../../types';
import { Link } from 'react-router-dom';

import itta1 from '../assets/images/itta1.jpg';
import itta2 from '../assets/images/itta2.jpg';
import ntb1 from '../assets/images/NTB-1.jpeg';

const Products: React.FC = () => {
  const localProductImages: Record<BrickType, string> = {
    [BrickType.B101]: itta2, 
    [BrickType.CM]: itta1,  
    [BrickType.NTB]: ntb1,
  };

  return (
    <div className="py-16 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-brick-800 to-heritage-gold p-1 rounded-full mb-6">
            <div className="bg-white rounded-full px-6 py-2">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">Quality Bricks Selection</span>
            </div>  
          </div>
          <h1 className="text-5xl md:text-6xl font-oswald font-bold text-brick-900 mb-4 uppercase tracking-tight">
            Brick Catalog
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-brick-700 to-heritage-gold mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto font-mukta text-lg">
            Premium quality bricks for your construction needs. Each product is carefully selected for durability and value.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRODUCTS.map(product => (
            <div key={product.id} className="group h-full">
              {/* Product Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                
                {/* Image Container - FULL SIZE */}
                <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-brick-700 rounded-full -translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-heritage-gold rounded-full translate-x-16 translate-y-16"></div>
                  </div>
                  
                  {/* Product Image - FULL SIZE */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                    <img 
                      src={localProductImages[product.id] || product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-700" 
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x400?text=Brick+Image';
                      }}
                      style={{ maxHeight: '100%', maxWidth: '100%' }}
                    />
                  </div>

                  {/* Badge OVERLAY - Positioned on top of image with fade animation */}
                  <div className="absolute top-4 left-4 z-20">
                    {/* For NTB: Show Advance Deposit Required badge with fade */}
                    {product.id === BrickType.NTB && (
                      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg flex items-center gap-1 animate-pulse">
                        <i className="fas fa-money-bill-wave text-xs"></i>
                        <span>Advance Deposit</span>
                      </div>
                    )}
                    
                    {/* For CM: Show Best Choice with fade */}
                    {product.id === BrickType.CM && (
                      <div className="bg-gradient-to-r from-heritage-gold to-yellow-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg flex items-center gap-1 animate-pulse">
                        <i className="fas fa-crown text-xs"></i>
                        <span>Best Choice</span>
                      </div>
                    )}
                    
                    {/* For B101: Show Premium badge with fade */}
                    {product.id === BrickType.B101 && (
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg flex items-center gap-1 animate-pulse">
                        <i className="fas fa-award text-xs"></i>
                        <span>Premium</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-7 flex flex-col flex-grow">
                  {/* Product Title & Description */}
                  <div className="mb-5">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 font-oswald">{product.name}</h3>
                    <p className="text-gray-600 text-sm font-mukta leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>

                  {/* Features Section */}
                  <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100 flex-grow">
                    <div className="grid grid-cols-1 gap-3 h-full">
                      {product.id === BrickType.NTB ? (
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                              <i className="fas fa-home text-red-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Local Traditional Brick</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                              <i className="fas fa-check-circle text-amber-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Standard Quality Finish</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <i className="fas fa-coins text-green-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Reliable</span>
                          </div>
                        </div>
                      ) : product.id === BrickType.B101 ? (
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <i className="fas fa-award text-blue-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Grade A Quality Certified</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center mr-3">
                              <i className="fas fa-tint-slash text-cyan-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Low Water Absorption</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <i className="fas fa-layer-group text-purple-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">High Compression Strength</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                              <i className="fas fa-fire text-indigo-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Fire Resistant</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                              <i className="fas fa-expand text-pink-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Minimal Expansion</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <i className="fas fa-award text-blue-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Grade A Quality Certified</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center mr-3">
                              <i className="fas fa-tint-slash text-cyan-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Low Water Absorption</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <i className="fas fa-layer-group text-purple-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">High Compression Strength</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                              <i className="fas fa-ruler-combined text-emerald-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Precise Dimensions</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                              <i className="fas fa-wind text-rose-500 text-sm"></i>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">Weather Resistant</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Section */}
                  <div className="mt-auto">
                    {/* Price Row */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-baseline">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mr-2">Rate</span>
                        <div>
                          <span className="text-3xl font-bold text-brick-800 font-oswald">Rs. {product.pricePerUnit}</span>
                          <span className="text-sm text-gray-500 font-sans ml-1">/ unit</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {product.id === BrickType.NTB ? (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <i className="fas fa-money-bill-wave text-red-500 text-lg"></i>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <i className="fas fa-certificate text-green-500"></i>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <i className="fas fa-droplet text-blue-500"></i>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Terms Section - Different for each brick type */}
                    <div className="mb-5 space-y-3">
                      {product.id === BrickType.NTB ? (
                        <>
                          {/* NTB: Advance Deposit Required */}
                          <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                            <div className="flex items-center text-red-700 font-bold text-sm">
                              <i className="fas fa-exclamation-triangle mr-2 text-red-600"></i>
                              <span>Advance Deposit Required • Payment first, then brick supply</span>
                            </div>
                          
                          </div>
                          {/* Bhaktapur Area Restriction */}
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <div className="flex items-center text-amber-700 font-semibold text-sm">
                              <i className="fas fa-map-marker-alt mr-2"></i>
                              Available Only for Bhaktapur Municipality Areas
                            </div>
                          </div>
                        </>
                      ) : (
                        // 101 & CM: Standard Payment Terms
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex items-center text-blue-700 font-semibold text-sm">
                            <i className="fas fa-credit-card mr-2 text-blue-600"></i>
                            <span>Cash on delivery available • Bank transfer available </span>
                          </div>
                        
                        </div>
                      )}
                    </div>

                    {/* Book Button */}
                    <Link 
                      to={`/booking?brick=${product.id}`} 
                      className="block w-full bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-white py-4 rounded-xl font-bold text-center transition-all duration-300 shadow-lg hover:shadow-xl uppercase tracking-widest text-sm group/btn"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span>Book This Brick</span>
                        <i className="fas fa-arrow-right transform group-hover/btn:translate-x-1 transition-transform"></i>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-gray-100 to-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-shipping-fast text-green-500 text-xl"></i>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-brick-700">Delivery Policy:</span> 1 Trip = 2000 Bricks • Inside Ring Road Delivery Time After 7 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;