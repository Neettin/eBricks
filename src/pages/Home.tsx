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
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [chatMessages]);

  // Remove auto-focus to prevent automatic scrolling to AI section
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
      content: `🙏 **Namaste! eBricks ma swagat cha!** 

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

    // Add user message
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
      
      // Update quick replies based on the type of question asked
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
      
      // Set fallback quick replies on error
      setQuickReplies(["Price kati cha?", "Kun kun brick cha?", "Delivery charge?", "Call garnu"]);
      setShowQuickReplies(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Function to update quick replies based on the question type
  const updateQuickRepliesBasedOnQuestion = (question: string, response: string) => {
    const lowerQuestion = question.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // Check what type of question was asked based on keywords
    if (lowerQuestion.includes('price') || lowerQuestion.includes('kati') || lowerQuestion.includes('dam')) {
      // For price questions, suggest related questions
      setQuickReplies([
        "Delivery charge?",
        "Kun kun brick cha?",
        "Calculate 5000 bricks",
        "Book garnu"
      ]);
    } else if (lowerQuestion.includes('delivery') || lowerQuestion.includes('charge') || lowerQuestion.includes('kharcha')) {
      // For delivery questions
      setQuickReplies([
        "Price kati cha?",
        "Kun brick ramro?",
        "Book delivery",
        "Call garnu"
      ]);
    } else if (lowerQuestion.includes('kun kun') || lowerQuestion.includes('kati kati') || lowerResponse.includes('available bricks')) {
      // For brick list questions
      setQuickReplies([
        "Price kati cha?",
        "Delivery charge?",
        "Kun brick ramro?",
        "Book garnu"
      ]);
    } else if (lowerQuestion.includes('ramro') || lowerQuestion.includes('recommend') || lowerQuestion.includes('kun')) {
      // For recommendation questions
      setQuickReplies([
        "Price kati cha?",
        "Kun kun brick cha?",
        "Calculate cost",
        "Book garnu"
      ]);
    } else {
      // Default quick replies
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

  // Filter products to exclude NTB from featured section
  const featuredProducts = PRODUCTS.filter(product => product.id !== 'NTB');

  // Format message content with markdown-like styling
  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Bold text
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
      // Headers with emojis
      if (line.match(/^(🙏|📊|🚚|💎|📞|💰|🏆|⭐|⚖️|🧮|💳|⏰|🏠|🏢|🤔|📍|⚠️|🏗️)/)) {
        return <p key={index} className="font-bold text-brick-800 mb-1.5 text-sm md:text-base mt-2">{line}</p>;
      }
      // Bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('✓') || line.trim().startsWith('✅') || line.trim().startsWith('❌')) {
        return <p key={index} className="ml-3 mb-1 text-xs md:text-sm">{line}</p>;
      }
      // Regular lines
      if (line.trim()) {
        return <p key={index} className="mb-1 text-xs md:text-sm leading-relaxed">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  // Reset chat function
  const handleResetChat = () => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: `🙏 **Namaste! eBricks ma swagat cha!** 

Ma hajur ko brick-related sabai questions ko answer dinchu:

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

      {/* Hero Section */}
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
              <Link to="/booking" className="bg-gradient-to-r from-brick-700 to-brick-900 hover:from-brick-800 hover:to-brick-950 text-heritage-gold px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
                <div className="flex items-center gap-3">
                  <span>Book My Bricks</span>
                  <i className="fas fa-arrow-right transform group-hover/btn:translate-x-1 transition-transform"></i>
                </div>
              </Link>
              <Link to="/products" className="bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all group/btn2">
                <div className="flex items-center gap-3">
                  <span>Check Prices</span>
                  <i className="fas fa-arrow-right transform group-hover/btn2:translate-x-1 transition-transform"></i>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bricks Section */}
      <section className="py-16 md:py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-4xl md:text-5xl font-oswald font-bold text-brick-900 uppercase">Premium Selection</h2>
            <div className="h-1.5 w-24 bg-heritage-gold rounded-full mt-4"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-12">
            {featuredProducts && featuredProducts.map(product => {
                const imageUrl = getProductImage(product.id, product.image);
                return (
                  <div key={product.id} className="group bg-gray-50 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500">
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
                          <span>BOOK THIS</span>
                          <i className="fas fa-arrow-right transform group-hover/btn5:translate-x-1 transition-transform"></i>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
            })}
          </div>

          {/* Complete Product Catalog Section */}
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
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

      {/* Cute & Attractive AI Assistant Section - Integrated in Homepage */}
      <section id="ai-assistant" className="py-12 md:py-20 bg-gradient-to-br from-brick-50 via-white to-heritage-gold/5 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-brick-500/10 to-heritage-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-brick-500/10 to-heritage-gold/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          {/* Section Header - Cute Design */}
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-600 to-brick-700 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
              <i className="fas fa-magic animate-pulse"></i>
              <span>SMART BRICK ASSISTANT</span>
              <i className="fas fa-star text-heritage-gold animate-spin" style={{ animationDuration: '2s' }}></i>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-oswald font-bold text-brick-900 mb-4">
              Ask Me <span className="text-heritage-gold">Anything</span> About Bricks!
            </h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto font-mukta">
              Get instant, intelligent answers about prices, delivery, quality, and recommendations
            </p>
          </div>

          {/* Main AI Assistant Container - Cute Card Design */}
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-brick-200 hover:border-brick-300 transition-all duration-300">
            {/* Chat Header - Cute Design with eBricks Logo */}
            <div className="bg-gradient-to-r from-brick-600 via-brick-700 to-brick-800 p-4 md:p-6 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-heritage-gold/10 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-heritage-gold/10 rounded-full translate-x-12 translate-y-12"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg p-1.5">
                      <img 
                        src={ebricksLogo} 
                        alt="eBricks Nepal Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white text-lg md:text-xl">eBricks AI Assistant</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-heritage-gold text-sm md:text-base font-medium">Online • Ready to help</span>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetChat}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group/refresh"
                    title="Reset chat"
                  >
                    <i className="fas fa-redo text-white group-hover/refresh:rotate-180 transition-transform"></i>
                  </button>
                  
                  <a 
                    href="tel:9851210449"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-heritage-gold hover:bg-yellow-500 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
                    title="Call for help"
                  >
                    <i className="fas fa-phone-alt text-white"></i>
                  </a>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6 p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white">
              {/* Left Side - Chat Messages */}
              <div className="lg:col-span-2">
                <div 
                  ref={chatContainerRef}
                  className="h-[400px] md:h-[450px] rounded-2xl overflow-y-auto p-4 bg-white border border-gray-200 shadow-inner"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.05) 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                  }}
                >
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-brick-600 to-brick-500 text-white rounded-br-none shadow-lg'
                            : 'bg-gradient-to-r from-gray-50 to-white text-gray-800 border border-gray-100 rounded-bl-none shadow-md'
                        }`}
                      >
                        {message.type === 'bot' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center border border-brick-200">
                              <img 
                                src={ebricksLogo} 
                                alt="eBricks AI" 
                                className="w-5 h-5 object-contain"
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">eBricks AI</span>
                          </div>
                        )}
                        <div className="text-sm md:text-base font-mukta leading-relaxed">
                          {formatMessage(message.content)}
                        </div>
                        <div className={`text-[10px] mt-2 ${message.type === 'user' ? 'text-heritage-gold/80' : 'text-gray-400'} flex justify-end`}>
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
                          <span className="text-xs text-gray-500 font-medium">eBricks AI</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-brick-500 rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-brick-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-3 h-3 bg-brick-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Replies - Cute Design */}
                {showQuickReplies && !isAiLoading && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-brick-50 to-heritage-gold/5 rounded-2xl border border-brick-100">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-bolt text-heritage-gold"></i>
                      <p className="text-sm font-semibold text-brick-700">Quick questions to try:</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickReply(reply)}
                          className="px-4 py-3 bg-white hover:bg-gradient-to-r hover:from-brick-50 hover:to-brick-100 active:scale-95 text-brick-700 rounded-xl text-sm font-medium transition-all duration-200 border border-brick-200 hover:border-brick-300 hover:shadow-md group/quick"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <i className={`fas ${
                              reply.includes('Price') ? 'fa-tag' : 
                              reply.includes('brick cha') ? 'fa-bricks' : 
                              reply.includes('Delivery') ? 'fa-truck' : 
                              reply.includes('Book') ? 'fa-shopping-cart' :
                              reply.includes('Calculate') ? 'fa-calculator' :
                              reply.includes('Call') ? 'fa-phone-alt' :
                              'fa-question'
                            } text-brick-500 group-hover/quick:scale-110 transition-transform`}></i>
                            <span>{reply}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area - Cute Design */}
                <div className="mt-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={handleInputFocus}
                        placeholder="Ask anything about bricks, prices, delivery, quality..."
                        className="w-full bg-white border-2 border-gray-300 focus:border-brick-400 rounded-xl px-4 py-3 pr-14 resize-none focus:outline-none transition-all text-gray-800 placeholder-gray-400 text-base focus:ring-2 focus:ring-brick-500/20 shadow-inner"
                        rows={1}
                        style={{ minHeight: '56px', maxHeight: '120px' }}
                      />
                      <button
                        onClick={() => handleAiAsk()}
                        disabled={isAiLoading || !aiPrompt.trim()}
                        className="absolute right-2 bottom-2 w-12 h-12 bg-gradient-to-r from-brick-600 to-brick-500 hover:from-brick-700 hover:to-brick-600 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {isAiLoading ? (
                          <i className="fas fa-circle-notch fa-spin"></i>
                        ) : (
                          <i className="fas fa-paper-plane"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Features & Info */}
              <div className="lg:col-span-1 mt-6 lg:mt-0">
                <div className="bg-gradient-to-b from-brick-50 to-white rounded-2xl p-5 md:p-6 border border-brick-100 shadow-md h-full">
                  <h4 className="text-lg font-bold text-brick-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-star text-heritage-gold"></i>
                    Why Use Our AI Assistant?
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-bolt text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800">Instant Responses</h5>
                        <p className="text-sm text-gray-600">Get answers in seconds, 24/7</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-language text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800">Bilingual Support</h5>
                        <p className="text-sm text-gray-600">Chat in Nepali or English</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-calculator text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800">Smart Calculations</h5>
                        <p className="text-sm text-gray-600">Estimate costs & brick quantities</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brick-100 to-brick-50 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-award text-brick-600"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-brick-800">Expert Advice</h5>
                        <p className="text-sm text-gray-600">Professional recommendations</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-brick-200">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brick-700 to-brick-800 text-white px-4 py-2 rounded-full text-sm font-bold">
                        <i className="fas fa-phone-alt"></i>
                        <span>Need Human Help?</span>
                      </div>
                      <a 
                        href="tel:9851210449"
                        className="block mt-2 text-lg font-bold text-brick-700 hover:text-brick-900 transition-colors"
                      >
                        9851210449
                      </a>
                      <p className="text-sm text-gray-500 mt-1">(Sachin - Owner)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;  