import React from 'react';
import { VENDOR } from '../constants';
import ebricksLogo from '../src/assets/images/eBricks-logo.png'; // Import the same logo

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
        {/* Logo Section */}
        <div className="space-y-6">
          <a href="#/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="bg-white w-12 h-12 rounded-lg transform group-hover:rotate-12 transition-all duration-300 shadow-lg border border-heritage-gold/50 flex items-center justify-center p-1">
                <img 
                  src={ebricksLogo} 
                  alt="eBricks Nepal Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-construction-yellow w-3 h-3 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="text-2xl font-oswald font-bold tracking-tight leading-none block">
                <span className="text-brick-800">𝓮</span>
                <span className="text-heritage-gold">Bricks</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brick-800 font-mukta">The Golden Standard</span>
            </div>
          </a>
          <p className="text-gray-400 text-sm leading-relaxed">
            Leading the brick e-commerce revolution in Nepal. Quality bricks, transparent pricing, and dependable logistics.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brick-600 transition"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brick-600 transition"><i className="fab fa-instagram"></i></a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brick-600 transition"><i className="fab fa-twitter"></i></a>
          </div>
        </div>

        <div>
          <h4 className="font-oswald font-bold text-lg mb-6 uppercase tracking-widest text-heritage-gold">Quick Links</h4>
          <ul className="space-y-4 text-gray-400 font-medium">
            <li><a href="#/products" className="hover:text-white transition">Brick Catalog</a></li>
            <li><a href="#/booking" className="hover:text-white transition">Book an Order</a></li>
            <li><a href="#/gallery" className="hover:text-white transition">Photo Gallery</a></li>
            <li><a href="#/contact" className="hover:text-white transition">Support Center</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-oswald font-bold text-lg mb-6 uppercase tracking-widest text-heritage-gold">Business Rules</h4>
          <ul className="space-y-4 text-gray-400 font-medium">
            <li><a href="#/rules" className="hover:text-white transition">1 Trip = 2,000 Bricks</a></li>
            <li><a href="#/rules" className="hover:text-white transition">Inside Ring Road Delivery</a></li>
            <li><a href="#/rules" className="hover:text-white transition">Bulk Booking Policy</a></li>
            <li><a href="#/rules" className="hover:text-white transition">Broken Bricks Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-oswald font-bold text-lg mb-6 uppercase tracking-widest text-heritage-gold">Contact Us</h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <i className="fas fa-user text-brick-500 mt-1"></i>
              <div>
                <p className="font-bold text-white leading-none mb-1">{VENDOR.name}</p>
                <p className="text-xs text-gray-500 font-bold uppercase">Founder / Manager</p>
              </div>
            </div>
            <div className="flex gap-3">
              <i className="fas fa-phone text-brick-500 mt-1"></i>
              <p className="text-gray-400 font-bold">{VENDOR.phone}</p>
            </div>
            <div className="flex gap-3">
              <i className="fab fa-whatsapp text-green-500 mt-1"></i>
              <p className="text-gray-400 font-bold">{VENDOR.whatsapp}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
        <p>&copy; 2026 <span className="text-brick-700">e</span><span className="text-construction-yellow">Bricks</span>. All Rights Reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;