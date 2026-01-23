import React, { useState, useEffect } from 'react';
import { PRODUCTS } from '../../constants';
import { getSmartAssistance } from '../../services/geminiService';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

// Update imports to include your new logo
import itta1 from '../assets/images/itta1.jpg';
import itta2 from '../assets/images/itta2.jpg';
import temple from '../assets/images/temple.jpg';
import pic2 from '../assets/images/pic2.jpg';
import pt from '../assets/images/pt.jpg';
import boudha from '../assets/images/boudha.jpg';
import ebricksLogo from "../assets/images/ebricks-logo.png";


const Home: React.FC = () => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  
  // NEW STATES FOR POPUP
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  // Initialize hero images with fallback
  useEffect(() => {
    const images = [temple, pic2, pt, boudha].filter(img => img);
    if (images.length === 0) {
      setHeroImages([
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1546180059-8d4d5b3c6c2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
      ]);
    } else {
      setHeroImages(images);
    }
  }, []);

  // NEW: Logic to show popup for guests after 2 seconds
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const timer = setTimeout(() => {
          setShowAuthModal(true);
        }, 2500); // 2.5 seconds delay
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  const handleAiAsk = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await getSmartAssistance(aiPrompt);
      setAiResponse(res);
    } catch (error) {
      setAiResponse('Sorry, I encountered an error. Please try again.');
      console.error('AI Assistant error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const featuredBrickImages: Record<string, string> = {
    '101': itta2,
    'CM': itta1,
  };

  const getProductImage = (productId: string, defaultImage: string) => {
    const customImage = featuredBrickImages[productId];
    return customImage || defaultImage || 'https://images.unsplash.com/photo-1546180059-8d4d5b3c6c2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
  };

  return (
    <div className="relative min-h-screen">
      
      {/* --- AUTH MODAL POPUP --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-brick-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-[2.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border border-heritage-gold/30">
            {/* Branded Header - Updated with your logo */}
            <div className="bg-brick-800 p-6 text-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-heritage-gold/50"></div>
              
              {/* Replaced crown icon with your eBricks logo */}
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 p-2 border-2 border-heritage-gold/30 shadow-lg">
                <img 
                  src={ebricksLogo} 
                  alt="eBricks Nepal Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h2 className="text-xl font-oswald font-bold tracking-wider uppercase">
                <span className="text-brick-600 italic">𝓮</span>
                <span className="text-heritage-gold">Bricks</span>
              </h2>
              <p className="text-xs text-brick-500/80 mt-1 font-medium tracking-wide">
                THE GOLDEN STANDARD
              </p>
            </div>
            
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-brick-900 mb-3">Namaste!</h3>
              <p className="text-gray-600 text-sm font-mukta leading-relaxed mb-8">
                Sign in to view <span className="text-brick-700 font-bold">exclusive bulk pricing</span>, manage your brick deliveries, and unlock heritage discounts.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-brick-800 text-heritage-gold py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl hover:bg-brick-900 transition-all transform hover:scale-[1.02]"
                >
                  SIGN IN / REGISTER
                </button>
                
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-2 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-brick-800 transition-colors"
                >
                  Continue Browsing as Guest
                </button>
              </div>
            </div>
            <div className="bg-gray-50 py-3 text-[10px] text-center text-gray-400 border-t border-gray-100">
              THE GOLD STANDARD OF NEPALESE CONSTRUCTION
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Remains the same */}
      <section className="relative h-[95vh] min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImages.length > 0 ? (
            heroImages.map((image, index) => (
              <img 
                key={index}
                src={image}
                className={`absolute inset-0 w-full h-full object-cover brightness-50 transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                alt={`Nepal Heritage ${index + 1}`}
              />
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-brick-950 via-brick-900 to-brick-800"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-brick-950/90 via-brick-900/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="text-white space-y-6 animate-fadeIn max-w-3xl mx-auto lg:ml-12 px-4">
            <div className="inline-flex items-center gap-2 bg-heritage-gold/30 backdrop-blur-md border border-heritage-gold/50 px-5 py-2.5 rounded-full text-heritage-gold font-bold text-xs tracking-[0.2em] uppercase">
              <i className="fas fa-landmark animate-pulse"></i>
              Nepal's Heritage Brick Provider
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-oswald font-bold leading-[1.1] text-left">
              STRENGTH OF <span className="text-heritage-gold">NEPAL</span> IN EVERY <span className="underline decoration-heritage-gold underline-offset-8">BRICK.</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 font-mukta leading-relaxed text-left max-w-2xl">
              Crafting legacy with every trip. Trusted for building Nepal's homes and heritage sites with uncompromising durability.
            </p>
            <div className="flex flex-wrap gap-4 pt-6 text-left">
              <Link to="/booking" className="bg-brick-600 hover:bg-brick-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all transform hover:-translate-y-1 flex items-center gap-3">
                Book My Bricks <i className="fas fa-chevron-right text-sm"></i>
              </Link>
              <Link to="/products" className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all">
                Check Prices
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bricks Section - Remains the same */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-oswald font-bold text-brick-900 uppercase">Premium Selection</h2>
              <div className="h-1.5 w-24 bg-heritage-gold rounded-full mt-4"></div>
            </div>
            <Link to="/products" className="text-brick-700 font-bold hover:underline text-lg">
              View All Products →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {PRODUCTS && PRODUCTS.map(product => {
                const imageUrl = getProductImage(product.id, product.image);
                return (
                  <div key={product.id} className="group bg-gray-50 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500">
                    <div className="h-64 md:h-72 overflow-hidden relative">
                      <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name}/>
                      {product.isRecommended && (
                        <div className="absolute top-6 left-6 bg-heritage-gold text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">BEST CHOICE</div>
                      )}
                    </div>
                    <div className="p-6 md:p-10">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">{product.name}</h3>
                      <p className="text-gray-600 font-mukta mb-6 md:mb-8 text-sm md:text-base">{product.description}</p>
                      <Link to={`/booking?brick=${product.id}`} className="block text-center bg-brick-800 text-heritage-gold py-3 md:py-4 rounded-xl font-bold hover:bg-brick-900 transition-colors text-sm md:text-base">
                        BOOK THIS
                      </Link>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      </section>

      {/* Smart Assistant Section - Remains the same */}
      <section className="py-20 md:py-32 bg-brick-950 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
           <div className="inline-block bg-heritage-gold text-brick-950 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">NAMASTE! SMART ASSISTANT</div>
           <h2 className="text-4xl md:text-5xl font-oswald font-bold text-white mb-6 uppercase">HAVE A QUESTION?</h2>
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 50000 bricks lida delivery charge kati huncha?"
                className="w-full bg-transparent border-b-2 border-white/30 text-white text-lg md:text-xl placeholder-white/40 p-4 focus:outline-none focus:border-heritage-gold transition-all resize-none"
                rows={3}
              />
              <button 
                onClick={handleAiAsk}
                className="mt-6 bg-heritage-gold text-brick-950 px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 shadow-xl"
                disabled={isAiLoading || !aiPrompt.trim()}
              >
                {isAiLoading ? 'PROCESSING...' : 'GET INSTANT ANSWER'}
              </button>
           </div>
           {aiResponse && (
             <div className="mt-8 bg-white/10 p-6 rounded-2xl border border-white/10 text-left text-white font-mukta animate-fadeIn">
                <p>{aiResponse}</p>
             </div>
           )}
        </div>
      </section>
    </div>
  );
};

export default Home;