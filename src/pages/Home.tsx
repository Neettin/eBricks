import { useState, useEffect, useRef } from "react";
import { PRODUCTS } from '../../constants';
import { getSmartAssistance, getQuickReplies } from '../../services/geminiService';
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
import ktm from '../assets/images/ktm.jpg';
import ebricksLogo from "../assets/images/ebricks-logo.png";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Home: React.FC = () => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Price kati cha?",
    "Kun kun brick cha?",
    "Delivery charge?",
    "Booking info?"
  ]);
  
  // NEW STATES FOR POPUP
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const navigate = useNavigate();
  
  // Ref for auto-scrolling chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        }, 2500);
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        requestAnimationFrame(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [chatMessages]);

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Send initial greeting when component mounts
  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: `🙏 **Namaste! 𝓮Bricks ma swagat cha!** 

Tapailai sahayog garna ma yahan uplabdha chu. Price, delivery, ra quality ko barema kehi sodhnu parema nirdhakka bhayi sodhnu hola.

📞 **Direct:** 9851210449 `,
      timestamp: new Date()
    };
    setChatMessages([initialMessage]);
  }, []);

  const handleQuickReply = (reply: string) => {
    setAiPrompt(reply);
    handleAiAsk(reply);
  };

  const handleAiAsk = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiPrompt;
    if (!promptToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: promptToSend,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setAiPrompt('');
    setShowQuickReplies(false);
    setIsAiLoading(true);

    try {
      const res = await getSmartAssistance(promptToSend);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: res,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMessage]);
      
      updateQuickRepliesBasedOnQuestion(promptToSend, res);
      setShowQuickReplies(true);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '❌ Sorry, malai error bhayo. Please call 9851210449 for immediate assistance.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      console.error('AI Assistant error:', error);
      
      setQuickReplies(["Price kati cha?", "Kun kun brick cha?", "Delivery charge?", "Call garnu"]);
      setShowQuickReplies(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const updateQuickRepliesBasedOnQuestion = (question: string, response: string) => {
    const lowerQuestion = question.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    if (lowerQuestion.includes('price') || lowerQuestion.includes('kati') || lowerQuestion.includes('dam')) {
      setQuickReplies([
        "Delivery charge?",
        "Kun kun brick cha?",
        "Calculate 5000 bricks",
        "Book garnu"
      ]);
    } else if (lowerQuestion.includes('delivery') || lowerQuestion.includes('charge') || lowerQuestion.includes('kharcha')) {
      setQuickReplies([
        "Price kati cha?",
        "Kun brick ramro?",
        "Book delivery",
        "Call garnu"
      ]);
    } else if (lowerQuestion.includes('kun kun') || lowerQuestion.includes('kati kati') || lowerResponse.includes('available bricks')) {
      setQuickReplies([
        "Price kati cha?",
        "Delivery charge?",
        "Kun brick ramro?",
        "Book garnu"
      ]);
    } else if (lowerQuestion.includes('ramro') || lowerQuestion.includes('recommend') || lowerQuestion.includes('kun')) {
      setQuickReplies([
        "Price kati cha?",
        "Kun kun brick cha?",
        "Calculate cost",
        "Book garnu"
      ]);
    } else {
      setQuickReplies(getQuickReplies());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiAsk();
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

  const featuredProducts = PRODUCTS.filter(product => product.id !== 'NTB');

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-1 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.match(/^(🙏|📊|🚚|💎|📞|💰|🏆|⭐|⚖️|🧮|💳|⏰|🏠|🏢|🤔|📍|⚠️|🏗️)/)) {
        return <p key={index} className="font-bold text-brick-800 mb-1.5 text-sm md:text-base mt-2">{line}</p>;
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('✓') || line.trim().startsWith('✅') || line.trim().startsWith('❌')) {
        return <p key={index} className="ml-3 mb-1 text-xs md:text-sm">{line}</p>;
      }
      if (line.trim()) {
        return <p key={index} className="mb-1 text-xs md:text-sm leading-relaxed">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  const handleResetChat = () => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: `🙏 **Namaste! 𝓮Bricks ma swagat cha!** 

Tapailai sahayog garna ma yahan uplabdha chu. Price, delivery, ra quality ko barema kehi sodhnu parema nirdhakka bhayi sodhnu hola.

📞 **Direct:** 9851210449 (Sachin)`,
      timestamp: new Date()
    };
    setChatMessages([initialMessage]);
    setShowQuickReplies(true);
    setQuickReplies(["Price kati cha?", "Kun kun brick cha?", "Delivery charge?", "Book garnu"]);
  };

  return (
    <div className="relative min-h-screen">
      
      {/* --- AUTH MODAL POPUP --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-brick-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-[2.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border border-heritage-gold/30">
            <div className="bg-brick-800 p-6 text-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-heritage-gold/50"></div>
              
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
                  className="w-full bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-heritage-gold py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl transition-all duration-300 group/btn"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>SIGN IN / REGISTER</span>
                    <i className="fas fa-arrow-right transform group-hover/btn:translate-x-1 transition-transform"></i>
                  </div>
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

      {/* Hero Section - UPDATED WITH NEW MESSAGING */}
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
              <i className="fas fa-building"></i>
              Nepal's Premier Online Brick Marketplace
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-oswald font-bold leading-[1.1] text-left">
              PROFESSIONAL BRICK SUPPLY<br/>
              <span className="text-heritage-gold">DELIVERED TO YOUR SITE.</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 font-mukta leading-relaxed text-left max-w-2xl">
              Order premium bricks anywhere in Kathmandu Valley. Professional service, quality assurance, and reliable delivery for contractors, builders, and homeowners.
            </p>
            <div className="flex flex-wrap gap-4 pt-6 text-left">
              <Link to="/booking" className="bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-heritage-gold px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
                <div className="flex items-center gap-3">
                  <i className="fas fa-shopping-cart"></i>
                  <span>Order Now</span>
                  <i className="fas fa-arrow-right transform group-hover/btn:translate-x-1 transition-transform"></i>
                </div>
              </Link>
              <Link to="/products" className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all group/btn2">
                <div className="flex items-center gap-3">
                  <i className="fas fa-tags"></i>
                  <span>Check Prices</span>
                  <i className="fas fa-arrow-right transform group-hover/btn2:translate-x-1 transition-transform"></i>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Trust & Credibility Section */}
      <section className="py-8 md:py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brick-50 to-brick-100 rounded-2xl mb-3 md:mb-4">
                <i className="fas fa-industry text-2xl md:text-3xl text-brick-600"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-brick-900 mb-1">3+</h3>
              <p className="text-sm md:text-base text-gray-600 font-medium">Years Experience</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl mb-3 md:mb-4">
                <i className="fas fa-truck-loading text-2xl md:text-3xl text-green-600"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-brick-900 mb-1">1,000+</h3>
              <p className="text-sm md:text-base text-gray-600 font-medium">Deliveries Completed</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-3 md:mb-4">
                <i className="fas fa-users text-2xl md:text-3xl text-blue-600"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-brick-900 mb-1">50+</h3>
              <p className="text-sm md:text-base text-gray-600 font-medium">Satisfied Customers</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-heritage-gold/20 to-heritage-gold/40 rounded-2xl mb-3 md:mb-4">
                <i className="fas fa-certificate text-2xl md:text-3xl text-heritage-gold"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-brick-900 mb-1">100%</h3>
              <p className="text-sm md:text-base text-gray-600 font-medium">Quality Certified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bricks Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-4xl md:text-5xl font-oswald font-bold text-brick-900 uppercase">Premium Selection</h2>
            <div className="h-1.5 w-24 bg-heritage-gold rounded-full mt-4"></div>
            <p className="text-gray-600 mt-4 text-lg">Browse and order directly from our catalog</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-12">
            {featuredProducts && featuredProducts.map(product => {
                const imageUrl = getProductImage(product.id, product.image);
                return (
                  <div key={product.id} className="group bg-white rounded-3xl md:rounded-[3rem] overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-500">
                    <div className="h-64 md:h-72 overflow-hidden relative">
                      <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name}/>
                      
                      {product.id === '101' && (
                        <div className="absolute top-6 left-6 z-20">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg flex items-center gap-1 animate-pulse">
                            <i className="fas fa-award text-xs"></i>
                            <span>Premium</span>
                          </div>
                        </div>
                      )}
                      
                      {product.id === 'CM' && (
                        <div className="absolute top-6 left-6 z-20">
                          <div className="bg-gradient-to-r from-heritage-gold to-yellow-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase shadow-lg flex items-center gap-1 animate-pulse">
                            <i className="fas fa-crown text-xs"></i>
                            <span>Best Choice</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">{product.name}</h3>
                      <p className="text-gray-600 font-mukta mb-6 md:mb-8 text-sm md:text-base">{product.description}</p>
                      <Link to={`/booking?brick=${product.id}`} className="block text-center bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-heritage-gold py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl group/btn5">
                        <div className="flex items-center justify-center gap-3">
                          <i className="fas fa-shopping-cart"></i>
                          <span>ORDER THIS BRICK</span>
                          <i className="fas fa-arrow-right transform group-hover/btn5:translate-x-1 transition-transform"></i>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
            })}
          </div>

          {/* Complete Product Catalog Section */}
          <div className="bg-gradient-to-r from-brick-50 to-white p-6 md:p-8 rounded-2xl border border-brick-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brick-900 mb-3">Complete Product Catalog Available</h3>
                <p className="text-gray-600">
                  For detailed specifications, pricing, and additional brick types including NTB Local Bricks, 
                  please visit our full product catalog. Get comprehensive information on all our premium construction materials.
                </p>
              </div>
              <Link 
                to="/products" 
                className="bg-gradient-to-r from-brick-700 to-brick-900 text-heritage-gold px-6 py-3 rounded-xl font-bold text-sm tracking-wide hover:from-brick-800 hover:to-brick-950 transition-all duration-300 shadow-md hover:shadow-lg group/btn4 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <span>Explore Catalog</span>
                  <i className="fas fa-arrow-right transform group-hover/btn4:translate-x-1 transition-transform"></i>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: How It Works */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-heritage-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brick-500/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
              <i className="fas fa-tasks"></i>
              <span>OUR PROCESS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-oswald font-bold text-brick-900 mb-4">
              How <span className="text-heritage-gold">
  <span className="text-brick-900">𝓮</span>Bricks
</span> Works
            </h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
              A streamlined, professional ordering process designed for your convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-heritage-gold/10 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="bg-gradient-to-br from-white to-brick-50 rounded-3xl p-8 shadow-lg border border-brick-100 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-gold/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-brick-600 to-brick-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                    <span className="text-4xl font-black text-heritage-gold">1</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 bg-brick-100 px-4 py-1.5 rounded-full mb-3">
                      <i className="fas fa-mobile-alt text-brick-600"></i>
                      <span className="text-sm font-bold text-brick-700">BROWSE & SELECT</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-brick-900 mb-4">Browse Our Catalog</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Access our comprehensive product catalog online from any device. View detailed specifications, current pricing, and high-quality product images to make informed decisions.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-white px-3 py-1 rounded-full border border-brick-200 text-brick-600"> Multi-device Access</span>
                    <span className="bg-white px-3 py-1 rounded-full border border-brick-200 text-brick-600">Detailed Information</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
<div className="relative group md:mt-12">
  <div className="absolute -top-6 -left-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
  <div className="bg-gradient-to-br from-white to-amber-50 rounded-3xl p-8 shadow-lg border border-amber-100 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16"></div>
    
    <div className="relative z-10">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
        <span className="text-4xl font-black text-white">2</span>
      </div>
      
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-1.5 rounded-full mb-3">
          <i className="fas fa-shopping-cart text-amber-600"></i>
          <span className="text-sm font-bold text-amber-700">PLACE ORDER</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-amber-900 mb-4">Submit Your Request</h3>
      <p className="text-gray-600 leading-relaxed mb-4">
        Complete our online booking form with your requirements and delivery details. Our team will contact you within hours to confirm specifications and finalize your order.
      </p>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-white px-3 py-1 rounded-full border border-amber-200 text-amber-600">Quick Response</span>
        <span className="bg-white px-3 py-1 rounded-full border border-amber-200 text-amber-600">Expert Guidance</span>
      </div>
    </div>
  </div>
</div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-green-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="bg-gradient-to-br from-white to-brick-50 rounded-3xl p-8 shadow-lg border border-brick-100 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                    <span className="text-4xl font-black text-white">3</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-1.5 rounded-full mb-3">
                      <i className="fas fa-truck text-green-600"></i>
                      <span className="text-sm font-bold text-green-700">RECEIVE DELIVERY</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-brick-900 mb-4">Receive Professional Delivery</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Your order is delivered directly to your construction site by our experienced logistics team. Quality-checked materials with professional handling and placement.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-white px-3 py-1 rounded-full border border-green-200 text-green-600">Professional Team</span>
                    <span className="bg-white px-3 py-1 rounded-full border border-green-200 text-green-600">Direct to Site</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-brick-50 to-heritage-gold/10 rounded-3xl p-8 md:p-12 border border-brick-200">
              <h3 className="text-2xl md:text-3xl font-bold text-brick-900 mb-3">
                <i className="fas fa-handshake text-heritage-gold mr-3"></i>
                Partner With Nepal's Leading Brick Supplier
              </h3>
              <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
                Join thousands of satisfied contractors, builders, and homeowners who trust 𝓮Bricks for their construction material needs.
              </p>
              <Link 
                to="/booking" 
                className="inline-flex items-center gap-3 bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-heritage-gold px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group/cta2"
              >
                <i className="fas fa-clipboard-list"></i>
                <span>Request a Quote</span>
                <i className="fas fa-arrow-right transform group-hover/cta2:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: Delivery Coverage */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-brick-900 to-brick-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Side - Content */}
              <div className="p-8 md:p-12 lg:p-16">
                <div className="inline-flex items-center gap-2 bg-heritage-gold/20 backdrop-blur-md px-4 py-2 rounded-full text-heritage-gold font-bold text-sm uppercase tracking-wider mb-6">
                  <i className="fas fa-map-marked-alt"></i>
                  <span>DELIVERY COVERAGE</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-oswald font-bold text-white mb-6">
                  We Deliver Across <span className="text-heritage-gold">Kathmandu Valley</span>
                </h2>
                
                <p className="text-brick-200 text-lg mb-8 leading-relaxed">
                  No matter where your construction site is located in Kathmandu Valley, we ensure timely delivery of premium quality bricks right to your doorstep.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <i className="fas fa-truck text-heritage-gold text-2xl mb-2"></i>
                    <h4 className="text-white font-bold mb-1">Reliable Delivery</h4>
                    <p className="text-brick-300 text-sm">Timely and efficient</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <i className="fas fa-hands-helping text-heritage-gold text-2xl mb-2"></i>
                    <h4 className="text-white font-bold mb-1">Professional Service</h4>
                    <p className="text-brick-300 text-sm">Experienced team</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <i className="fas fa-shield-alt text-heritage-gold text-2xl mb-2"></i>
                    <h4 className="text-white font-bold mb-1">Quality Assurance</h4>
                    <p className="text-brick-300 text-sm">Certified materials</p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <i className="fas fa-phone text-heritage-gold text-2xl mb-2"></i>
                    <h4 className="text-white font-bold mb-1">Customer Support</h4>
                    <p className="text-brick-300 text-sm">Always available</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="tel:9851210449"
                    className="inline-flex items-center justify-center gap-3 bg-heritage-gold hover:bg-yellow-500 text-brick-900 px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all group/call"
                  >
                    <i className="fas fa-phone"></i>
                    <span>Call for Delivery Quote</span>
                  </a>
                  
                  <Link 
                    to="/booking"
                    className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold border-2 border-white/20 hover:border-white/40 transition-all group/book"
                  >
                    <span>Book Delivery</span>
                    <i className="fas fa-arrow-right transform group-hover/book:translate-x-1 transition-transform"></i>
                  </Link>
                </div>
              </div>

              {/* Right Side - Image/Map */}
              <div className="relative min-h-[400px] lg:min-h-auto">
                <img 
                  src={ktm || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"}
                  alt="Kathmandu Valley Coverage"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brick-900/80 via-brick-800/40 to-transparent"></div>
                
                {/* Coverage Areas Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-brick-900 mb-4 flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600"></i>
                      Coverage Areas Include:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-brick-600"></i>
                        <span>Kathmandu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-brick-600"></i>
                        <span>Lalitpur</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-brick-600"></i>
                        <span>Bhaktapur</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-brick-600"></i>
                        <span>Surrounding Areas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-brick-50 to-white overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-heritage-gold/5 to-transparent rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-brick-500/5 to-transparent rounded-full translate-x-48 translate-y-48"></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
              <i className="fas fa-star"></i>
              <span>BUILDING TRUST</span>
              <i className="fas fa-star"></i>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-oswald font-bold text-brick-900 mb-6">
             Why Choose <span className="text-heritage-gold">
    <span className="text-brick-900">𝓮</span>Bricks
  </span>?
            </h2>
            
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto font-mukta leading-relaxed">
              Nepal's most trusted online brick marketplace
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-brick-100">
            <div className="p-8 md:p-12 lg:p-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Pillar 1 - Convenience */}
                <div className="text-center group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <i className="fas fa-mobile-alt text-3xl text-emerald-600"></i>
                  </div>
                  <h4 className="text-xl font-bold text-brick-800 mb-3">Ultimate Convenience</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Order from anywhere - home, office, or on-site. No need to visit factories or wait in queues. Everything online, delivered to you.
                  </p>
                </div>

                {/* Pillar 2 - Quality */}
                <div className="text-center group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <i className="fas fa-award text-3xl text-blue-600"></i>
                  </div>
                  <h4 className="text-xl font-bold text-brick-800 mb-3">Premium Quality</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Direct-from-source guarantee ensures top-grade bricks at competitive prices. No middlemen, no quality compromise.
                  </p>
                </div>

                {/* Pillar 3 - Delivery */}
                <div className="text-center group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <i className="fas fa-truck text-3xl text-amber-600"></i>
                  </div>
                  <h4 className="text-xl font-bold text-brick-800 mb-3">Professional Delivery</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Reliable doorstep delivery across Kathmandu Valley. Experienced logistics team ensuring safe transportation.
                  </p>
                </div>

                {/* Pillar 4 - Quality Assurance */}
                <div className="text-center group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <i className="fas fa-shield-alt text-3xl text-purple-600"></i>
                  </div>
                  <h4 className="text-xl font-bold text-brick-800 mb-3">Quality Assurance</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Rigorous testing for strength, durability, and dimensional accuracy. Every brick meets our strict quality standards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-brick-800 to-brick-900 rounded-3xl p-8 md:p-12 text-white shadow-xl mt-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Build Your Dream?</h3>
            <p className="text-brick-200 mb-8 max-w-2xl mx-auto">
              Experience the future of construction material procurement. Order now!
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link 
                to="/booking"
                className="bg-gradient-to-r from-heritage-gold to-yellow-500 hover:from-yellow-500 hover:to-heritage-gold text-brick-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group/cta flex items-center gap-3"
              >
                <i className="fas fa-shopping-cart"></i>
                <span>START ORDERING</span>
                <i className="fas fa-arrow-right transform group-hover/cta:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section id="ai-assistant" className="py-12 md:py-20 bg-gradient-to-br from-brick-50 via-white to-heritage-gold/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-brick-500/10 to-heritage-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-brick-500/10 to-heritage-gold/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg mb-4 md:mb-6">
              <i className="fas fa-magic animate-pulse"></i>
              <span>SMART BRICK ASSISTANT</span>
              <i className="fas fa-star text-heritage-gold animate-spin" style={{ animationDuration: '2s' }}></i>
            </div>
            
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-brick-900 mb-3 md:mb-4 px-2">
              Ask Me <span className="text-heritage-gold">Anything</span> About Bricks!
            </h2>
            <p className="text-gray-600 text-base md:text-lg lg:text-xl max-w-3xl mx-auto font-mukta px-4">
              Get instant answers about prices, delivery, quality, and recommendations - available 24/7
            </p>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden border border-brick-200 hover:border-brick-300 transition-all duration-300">
            <div className="bg-gradient-to-r from-brick-600 via-brick-700 to-brick-800 p-3 md:p-4 lg:p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-heritage-gold/10 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-heritage-gold/10 rounded-full translate-x-12 translate-y-12"></div>
              
              <div className="flex items-center justify-between relative z-10 gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-lg p-1 md:p-1.5">
                      <img 
                        src={ebricksLogo} 
                        alt="eBricks Nepal Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-green-400 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm md:text-lg lg:text-xl truncate">𝓮Bricks AI</h3>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-heritage-gold text-xs md:text-sm lg:text-base font-medium">Ready to help</span>
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={handleResetChat}
                    className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg md:rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group/refresh flex-shrink-0"
                    title="Reset chat"
                  >
                    <i className="fas fa-redo text-sm md:text-base text-white group-hover/refresh:rotate-180 transition-transform"></i>
                  </button>
                  
                  <a 
                    href="tel:9851210449"
                    className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-lg md:rounded-xl bg-heritage-gold hover:bg-yellow-500 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl flex-shrink-0"
                    title="Call for help"
                  >
                    <i className="fas fa-phone text-sm md:text-base text-white"></i>
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 p-3 md:p-5 lg:p-6 bg-gradient-to-b from-gray-50 to-white">
              <div className="lg:col-span-2 flex flex-col">
                <div 
                  ref={chatContainerRef}
                  className="h-[350px] md:h-[400px] lg:h-[450px] rounded-xl md:rounded-2xl overflow-y-auto p-3 md:p-4 bg-white border border-gray-200 shadow-inner mb-3 md:mb-4"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.05) 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                  }}
                >
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3 md:mb-4 animate-fadeIn`}
                    >
                      <div
                        className={`max-w-[90%] md:max-w-[85%] rounded-xl md:rounded-2xl p-3 md:p-4 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-brick-600 to-brick-500 text-white rounded-br-none shadow-lg'
                            : 'bg-gradient-to-r from-gray-50 to-white text-gray-800 border border-gray-100 rounded-bl-none shadow-md'
                        }`}
                      >
                        {message.type === 'bot' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center border border-brick-200">
                              <img 
                                src={ebricksLogo} 
                                alt="eBricks AI" 
                                className="w-4 h-4 md:w-5 md:h-5 object-contain"
                              />
                            </div>
                            <span className="text-[10px] md:text-xs text-gray-500 font-medium">eBricks AI</span>
                          </div>
                        )}
                        <div className="text-sm md:text-base font-mukta leading-relaxed">
                          {formatMessage(message.content)}
                        </div>
                        <div className={`text-[9px] md:text-[10px] mt-2 ${message.type === 'user' ? 'text-heritage-gold/80' : 'text-gray-400'} flex justify-end`}>
                          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isAiLoading && (
                    <div className="flex justify-start mb-4 animate-fadeIn">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-none p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center border border-brick-200">
                            <img 
                              src={ebricksLogo} 
                              alt="eBricks AI" 
                              className="w-5 h-5 object-contain"
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">𝓮 Bricks AI</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brick-500 rounded-full animate-bounce"></div>
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brick-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brick-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {showQuickReplies && !isAiLoading && (
                  <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-r from-brick-50 to-heritage-gold/5 rounded-xl md:rounded-2xl border border-brick-100">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <p className="text-xs md:text-sm font-semibold text-brick-700">Quick questions:</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(reply)}
                          className="px-3 py-2.5 md:px-4 md:py-3 bg-white hover:bg-gradient-to-r hover:from-brick-50 hover:to-brick-100 active:scale-95 text-brick-700 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all duration-200 border border-brick-200 hover:border-brick-300 hover:shadow-md group/quick"
                        >
                          <div className="flex items-center justify-center gap-1.5 md:gap-2">
                            <i className={`fas ${
                              reply.includes('Price') ? 'fa-tag' : 
                              reply.includes('brick cha') ? 'fa-bricks' : 
                              reply.includes('Delivery') ? 'fa-truck' : 
                              reply.includes('Book') ? 'fa-shopping-cart' :
                              reply.includes('Calculate') ? 'fa-calculator' :
                              reply.includes('Call') ? 'fa-phone-alt' :
                              'fa-question'
                            } text-brick-500 text-[10px] md:text-xs group-hover/quick:scale-110 transition-transform`}></i>
                            <span className="text-xs md:text-sm leading-tight">{reply}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden transition-all duration-300 hover:border-brick-300 focus-within:border-brick-500 focus-within:shadow-xl">
                  <div className="flex items-end gap-2 p-2">
                    <textarea
                      ref={inputRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={handleInputFocus}
                      placeholder="Type your question here..."
                      className="flex-1 bg-transparent px-3 py-2.5 md:py-3 resize-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm md:text-base"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={() => handleAiAsk()}
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 bg-brick-600 hover:bg-brick-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
                      title="Send message"
                    >
                      {isAiLoading ? (
                        <i className="fas fa-circle-notch fa-spin text-base md:text-lg"></i>
                      ) : (
                        <i className="fas fa-paper-plane text-base md:text-lg"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-gradient-to-b from-brick-50 to-white rounded-2xl p-5 md:p-6 border border-brick-100 shadow-md h-full sticky top-4">
                  <h4 className="text-lg font-bold text-brick-900 mb-4 flex items-center gap-2">
                    Why Use Our AI?
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-bolt text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800 text-sm">Instant Responses</h5>
                        <p className="text-xs text-gray-600">Get answers in seconds, 24/7</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-language text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800 text-sm">Bilingual Support</h5>
                        <p className="text-xs text-gray-600">Chat in Nepali or English</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-calculator text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800 text-sm">Smart Calculations</h5>
                        <p className="text-xs text-gray-600">Estimate costs & quantities</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-award text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800 text-sm">Expert Advice</h5>
                        <p className="text-xs text-gray-600">Professional recommendations</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-brick-200">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-700 to-brick-800 text-white px-4 py-2 rounded-full text-xs font-bold mb-2">
                        <i className="fas fa-phone"></i>
                        <span>Need Human Help?</span>
                      </div>
                      <a 
                        href="tel:9851210449"
                        className="block text-lg font-bold text-brick-700 hover:text-brick-900 transition-colors"
                      >
                        9851210449
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-4 p-4 bg-gradient-to-r from-brick-50 to-white rounded-2xl border border-brick-100">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Need human assistance?</p>
                  <a 
                    href="tel:9851210449"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-brick-700 to-brick-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                  >
                    <i className="fas fa-phone"></i>
                    <span>Call 9851210449</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-heritage-gold/5 rounded-full blur-3xl -translate-x-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brick-500/5 rounded-full blur-3xl translate-x-32"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
              <i className="fas fa-quote-left"></i>
              <span>CUSTOMER REVIEWS</span>
              <i className="fas fa-quote-right"></i>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-oswald font-bold text-brick-900 mb-4">
              What Our <span className="text-heritage-gold">Customers Say</span>
            </h2>
            
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
              Real feedback from builders, contractors, and homeowners across Kathmandu Valley
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 - Nepali */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-heritage-gold text-sm"></i>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "eBricks bata itta kinera khub khusi bhaye. Quality ramro cha ani delivery pani time mai bhayo. Online bata order garna sajilo thiyo. Highly recommended!"
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-brick-600 to-brick-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  RG
                </div>
                <div>
                  <h4 className="font-bold text-brick-900">Ramesh Gurung</h4>
                  <p className="text-sm text-gray-600">Contractor, Lalitpur</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 - English */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(4)].map((_, i) => (
                  <i key={i} className="fas fa-star text-heritage-gold text-sm"></i>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "Excellent service! The bricks were delivered within 3 hours and the quality exceeded my expectations. The AI assistant helped me calculate exactly how many bricks I needed."
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-brick-600 to-brick-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  SS
                </div>
                <div>
                  <h4 className="font-bold text-brick-900">Suman Shrestha</h4>
                  <p className="text-sm text-gray-600">Builder, Bhaktapur</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 - Nepali */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-heritage-gold text-sm"></i>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "Ghar banauda eBricks le ghar mai pugayera deko. Price pani ramro cha. Phone garera confirm garna sajilo thiyo. Delivery team le carefully rakhera gaye."
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-brick-600 to-brick-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  PA
                </div>
                <div>
                  <h4 className="font-bold text-brick-900">Prakash Adhikari</h4>
                  <p className="text-sm text-gray-600">Homeowner, Kathmandu</p>
                </div>
              </div>
            </div>

            {/* Testimonial 4 - English */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(4)].map((_, i) => (
                  <i key={i} className="fas fa-star text-heritage-gold text-sm"></i>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "Very professional service. I ordered 10,000 bricks for my commercial project and everything was perfect. The team even helped with unloading. Will order again!"
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-brick-600 to-brick-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  AT
                </div>
                <div>
                  <h4 className="font-bold text-brick-900">Anjali Tamang</h4>
                  <p className="text-sm text-gray-600">Project Manager, Patan</p>
                </div>
              </div>
            </div>

            {/* Testimonial 5 - Nepali */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-heritage-gold text-sm"></i>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "Website ma price check garera order garyo. 2 ghanta bhitra nai delivery bhayo! Quality top class cha. Aru suppliers bhanda dherai sajilo process thiyo."
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-brick-600 to-brick-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  BK
                </div>
                <div>
                  <h4 className="font-bold text-brick-900">Binod KC</h4>
                  <p className="text-sm text-gray-600">Engineer, Kirtipur</p>
                </div>
              </div>
            </div>

            {/* Testimonial 6 - Mixed */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star text-heritage-gold text-sm"></i>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "Best brick supplier in Kathmandu! Payment options pani flexible cha - cash ra online duitai. Customer service ekdum ramro. Thank you eBricks team!"
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-brick-600 to-brick-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  NM
                </div>
                <div>
                  <h4 className="font-bold text-brick-900">Nirmala Maharjan</h4>
                  <p className="text-sm text-gray-600">Architect, Bhaktapur</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="mt-16 bg-gradient-to-r from-brick-800 to-brick-900 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-heritage-gold mb-2">4.5/5</div>
                <p className="text-brick-200">Average Rating</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-heritage-gold mb-2">50+</div>
                <p className="text-brick-200">Happy Customers</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-heritage-gold mb-2">95%</div>
                <p className="text-brick-200">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UPDATED: FAQ Section - Icons removed from questions + Contact CTA added */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
              <i className="fas fa-question-circle"></i>
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-oswald font-bold text-brick-900 mb-4">
              Common <span className="text-heritage-gold">Questions</span>
            </h2>
            <p className="text-gray-600 text-lg">Quick answers to questions you may have</p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">How do I place an order?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">You can browse our products online and submit a booking request through our website. Our team will contact you within a few hours to confirm your order details, discuss delivery schedule, and finalize the transaction. Alternatively, you can call us directly at 9851210449 to place your order over the phone.</p>
              </div>
            </details>

            {/* FAQ 2 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">What areas do you deliver to?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">We provide delivery services throughout Kathmandu Valley, including Kathmandu, Lalitpur, and Bhaktapur districts. Delivery charges may vary based on your location and the quantity ordered. Contact us for specific delivery cost estimates for your area.</p>
              </div>
            </details>

            {/* FAQ 3 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">What payment methods do you accept?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">We accept multiple payment methods for your convenience: cash payment upon delivery and online bank transactions. For large bulk orders, we can arrange advance payment options. Please discuss your preferred payment method with our team when confirming your order.</p>
              </div>
            </details>

            {/* FAQ 4 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">How long does delivery take?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">We offer rapid delivery service! Standard delivery is typically completed within 2-4 hours from order confirmation. This fast turnaround ensures you get your materials exactly when you need them, minimizing project delays.</p>
              </div>
            </details>

            {/* FAQ 5 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">Is there a minimum order quantity?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">Minimum order quantities may vary depending on the brick type and delivery location. Generally, we recommend ordering in quantities that justify delivery costs. Contact our team to discuss your specific requirements and we'll help you determine the most economical order size.</p>
              </div>
            </details>

            {/* FAQ 6 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">What if the bricks are damaged during delivery?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">We take great care in handling and transporting all our products. However, if you receive damaged bricks, please inform our delivery team immediately and document the damage with photos. We will arrange for replacement of damaged items at no additional cost as per our quality guarantee policy.</p>
              </div>
            </details>

            {/* FAQ 7 - No icon */}
            <details className="group bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="font-bold text-brick-900 text-lg">Are your bricks quality certified?</h3>
                <i className="fas fa-chevron-down text-brick-600 group-open:rotate-180 transition-transform"></i>
              </summary>
              <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                <p className="text-gray-700">Yes, all our bricks meet industry standards and comply with IS 1077:1992 and Nepal National Building Code requirements. We source only from licensed, verified manufacturers who maintain consistent quality control processes. Each batch undergoes testing for strength, durability, and dimensional accuracy.</p>
              </div>
            </details>
          </div>

          {/* ADDED: Contact CTA after FAQ */}
          <div className="mt-12 text-center bg-gradient-to-r from-brick-50 to-white p-8 md:p-10 rounded-3xl border border-brick-200 shadow-lg">
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-md mb-5">
                <i className="fas fa-headset"></i>
                <span>STILL HAVE QUESTIONS?</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-oswald font-bold text-brick-900 mb-3">
                We're Here to <span className="text-heritage-gold">Help You</span>
              </h3>
              
              <p className="text-gray-600 text-base md:text-lg mb-6 leading-relaxed">
                Can't find the answer you're looking for? Our customer support team is ready to assist you with any questions about ordering, delivery, pricing, or our products.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-heritage-gold px-8 py-4 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 group/contact w-full sm:w-auto"
                >
                  <i className="fas fa-phone"></i>
                  <span>CONTACT US</span>
                  <i className="fas fa-arrow-right transform group-hover/contact:translate-x-1 transition-transform"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;