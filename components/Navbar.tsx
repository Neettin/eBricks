import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../src/services/firebaseConfig'; 
import { signOut, User } from 'firebase/auth';
import ebricksLogo from '../src/assets/images/ebricks-logo.png'; 

interface NavbarProps {
  user: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [logoRotate, setLogoRotate] = useState(false);
  const [textGlow, setTextGlow] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: 'fas fa-home' },
    { name: 'Products', path: '/products', icon: 'fas fa-box' },
    { name: 'Booking', path: '/booking', icon: 'fas fa-shopping-cart' },
    { name: 'Gallery', path: '/gallery', icon: 'fas fa-images' },
    { name: 'Contact', path: '/contact', icon: 'fas fa-phone' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    
    // Auto rotate text effect
    const interval = setInterval(() => {
      setTextGlow(prev => !prev);
    }, 2000);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      setIsProfileDropdownOpen(false);
      navigate('/login'); 
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const isLoginPage = location.pathname === '/login';
  const isUserVerified = user?.emailVerified || user?.providerData[0]?.providerId === 'google.com';

  return (
    <>
      <style>
        {`
          @keyframes floatText {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
            100% { transform: translateY(0px); }
          }
          @keyframes rotate3D {
            0% { transform: perspective(400px) rotateY(0deg); }
            50% { transform: perspective(400px) rotateY(5deg); }
            100% { transform: perspective(400px) rotateY(0deg); }
          }
          @keyframes glowPulse {
            0% { text-shadow: 0 0 2px rgba(180, 83, 9, 0.3); }
            50% { text-shadow: 0 0 15px rgba(245, 158, 11, 0.7); }
            100% { text-shadow: 0 0 2px rgba(180, 83, 9, 0.3); }
          }
          @keyframes letterPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); color: #B45309; }
            100% { transform: scale(1); }
          }
          @keyframes slideInFromLeft {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes rotateIcon {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-floatText {
            animation: floatText 3s ease-in-out infinite;
          }
          .animate-rotate3D {
            animation: rotate3D 5s ease-in-out infinite;
          }
          .animate-glowPulse {
            animation: glowPulse 2s ease-in-out infinite;
          }
          .animate-letterPop {
            animation: letterPop 1.5s ease-in-out;
          }
          .animate-slideInFromLeft {
            animation: slideInFromLeft 0.5s ease-out;
          }
          .hover-rotate-icon:hover i {
            animation: rotateIcon 0.6s ease-in-out;
          }
          .nav-link {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          .nav-link i {
            transition: transform 0.3s ease;
          }
          .nav-link:hover i {
            transform: scale(1.2) rotate(10deg);
          }
          .nav-link::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #B45309, #F59E0B);
            transition: width 0.3s ease;
          }
          .nav-link:hover::before {
            width: 70%;
          }
          .nav-link.active i {
            animation: rotateIcon 0.8s ease;
          }
          .logo-letter {
            display: inline-block;
            transition: all 0.3s ease;
          }
          .logo-letter:hover {
            animation: letterPop 0.5s ease;
          }
          .glass-effect {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
          }
          .mobile-menu-item {
            transition: all 0.3s ease;
          }
          .mobile-menu-item:hover {
            transform: translateX(8px);
            background: linear-gradient(90deg, rgba(180, 83, 9, 0.1), transparent);
          }
        `}
      </style>

      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass shadow-2xl border-b-2 border-heritage-gold/40 bg-white/95 backdrop-blur-lg' 
          : 'glass shadow-xl border-b-2 border-heritage-gold/30 bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            
            {/* Logo Section with Enhanced Animations */}
            <Link 
              to="/" 
              className="flex-shrink-0 flex items-center gap-2 sm:gap-3 group"
              onMouseEnter={() => setLogoRotate(true)}
              onMouseLeave={() => setLogoRotate(false)}
            >
              <div className="relative">
                <div className={`bg-white w-10 h-10 sm:w-14 sm:h-14 rounded-xl transform transition-all duration-700 shadow-lg border border-heritage-gold/50 flex items-center justify-center p-1 sm:p-1.5
                  ${logoRotate ? 'rotate-180 scale-110' : 'group-hover:rotate-12'}`}>
                  <img 
                    src={ebricksLogo} 
                    alt="eBricks Nepal Logo" 
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-125"
                  />
                </div>
                <div className={`absolute -bottom-1 -right-1 bg-construction-yellow w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white 
                  ${logoRotate ? 'animate-ping' : ''}`}>
                </div>
                {/* Rotating ring */}
                <div className="absolute -inset-1 rounded-xl border-2 border-dashed border-heritage-gold/30 
                  animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              
              <div className="hidden sm:block">
                <div className="flex items-baseline">
                  <span className="text-2xl font-oswald font-bold tracking-tight leading-none block overflow-hidden">
                    <span className="logo-letter text-brick-900 inline-block hover:text-heritage-gold transition-colors duration-300">𝓮</span>
                    <span className="logo-letter bg-gradient-to-r from-heritage-gold to-yellow-600 bg-clip-text text-transparent inline-block 
                      animate-floatText" style={{animationDelay: '0.2s'}}>B</span>
                    <span className="logo-letter bg-gradient-to-r from-heritage-gold to-yellow-600 bg-clip-text text-transparent inline-block 
                      animate-floatText" style={{animationDelay: '0.3s'}}>r</span>
                    <span className="logo-letter bg-gradient-to-r from-heritage-gold to-yellow-600 bg-clip-text text-transparent inline-block 
                      animate-floatText" style={{animationDelay: '0.4s'}}>i</span>
                    <span className="logo-letter bg-gradient-to-r from-heritage-gold to-yellow-600 bg-clip-text text-transparent inline-block 
                      animate-floatText" style={{animationDelay: '0.5s'}}>c</span>
                    <span className="logo-letter bg-gradient-to-r from-heritage-gold to-yellow-600 bg-clip-text text-transparent inline-block 
                      animate-floatText" style={{animationDelay: '0.6s'}}>k</span>
                    <span className="logo-letter bg-gradient-to-r from-heritage-gold to-yellow-600 bg-clip-text text-transparent inline-block 
                      animate-floatText" style={{animationDelay: '0.7s'}}>s</span>
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-brick-900 font-mukta block transition-all duration-500
                  ${textGlow ? 'animate-glowPulse tracking-[0.25em]' : ''}`}>
                  The Golden Standard
                </span>
              </div>
              
              <div className="sm:hidden">
                <span className="text-xl font-oswald font-bold tracking-tight leading-none block">
                  <span className="text-brick-900 animate-pulse-subtle">𝓮</span>
                  <span className="text-heritage-gold animate-floatText inline-block">Bricks</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with Enhanced Hover Effects */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`
                    nav-link px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 
                    flex items-center gap-2 hover-rotate-icon
                    ${location.pathname === link.path 
                      ? 'text-brick-700 bg-brick-50 shadow-sm active' 
                      : 'text-heritage-wood hover:text-brick-600 hover:bg-gray-50'
                    }
                    animate-slideInFromLeft
                  `}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <i className={`${link.icon} text-sm transition-all duration-300 
                    ${location.pathname === link.path ? 'text-brick-700' : 'text-brick-400'}`}></i>
                  <span className="relative">
                    {link.name}
                    {location.pathname === link.path && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-heritage-gold to-brick-600 rounded-full"></span>
                    )}
                  </span>
                </Link>
              ))}

              <div className="ml-6 pl-6 border-l border-gray-200 flex items-center gap-4">
                {user ? (
                  <div className="relative flex items-center gap-4" ref={profileDropdownRef}>
                    <Link
                      to="/booking"
                      className="group bg-brick-800 text-heritage-gold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold 
                        hover:bg-brick-900 transition-all duration-500 shadow-lg border border-heritage-gold/30 
                        flex items-center gap-2 text-xs sm:text-sm hover:shadow-xl hover:scale-105 active:scale-95
                        relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                        -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                      <i className="fas fa-plus-circle group-hover:rotate-180 transition-transform duration-500"></i>
                      <span className="hidden sm:inline relative">NEW ORDER</span>
                      <span className="sm:hidden relative">ORDER</span>
                    </Link>

                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-2 sm:pr-3 rounded-full 
                        hover:bg-gray-50 transition-all duration-300 border border-gray-100 bg-white shadow-sm 
                        group relative"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brick-700 to-brick-900 
                          text-heritage-gold flex items-center justify-center font-bold text-sm shadow-inner 
                          border border-heritage-gold/20 group-hover:scale-110 transition-transform duration-300
                          group-hover:rotate-12">
                          {getUserInitials()}
                        </div>
                        {isUserVerified ? (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full 
                            border-2 border-white flex items-center justify-center animate-pulse">
                            <i className="fas fa-check text-[6px] sm:text-[8px] text-white"></i>
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full 
                            border-2 border-white flex items-center justify-center animate-bounce">
                            <i className="fas fa-exclamation text-[6px] sm:text-[8px] text-white"></i>
                          </div>
                        )}
                      </div>
                      <i className={`fas fa-chevron-down text-[10px] text-gray-400 transition-all duration-500 
                        ${isProfileDropdownOpen ? 'rotate-180 translate-y-0.5' : ''} group-hover:text-brick-600`}></i>
                    </button>

                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl 
                        border border-heritage-gold/10 py-2 overflow-hidden animate-slideDown origin-top-right">
                        <div className="px-5 py-4 bg-gradient-to-r from-brick-50 via-brick-100/50 to-transparent border-b border-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-heritage-gold uppercase tracking-widest mb-1 
                                animate-pulse">My Profile</p>
                              <p className="text-sm font-black text-brick-900 truncate group-hover:tracking-wider 
                                transition-all duration-300">{getUserDisplayName()}</p>
                              <p className="text-[11px] text-gray-500 truncate font-medium">{user.email}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold transform hover:scale-105 
                              transition-transform duration-300 ${
                              isUserVerified 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse'
                            }`}>
                              {isUserVerified ? '✅ Verified' : '⚠️ Not Verified'}
                            </div>
                          </div>
                        </div>

                        <div className="py-2">
                          <Link
                            to="/my-orders"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-heritage-wood hover:bg-brick-50 
                              hover:text-brick-800 transition-all duration-300 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center 
                              group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-110 
                              group-hover:rotate-6">
                              <i className="fas fa-receipt text-brick-600 text-sm group-hover:scale-110 
                                transition-transform duration-300"></i>
                            </div>
                            <span className="font-bold text-sm group-hover:translate-x-1 transition-transform duration-300">
                              My Orders
                            </span>
                          </Link>
                          
                          {!isUserVerified && user?.providerData[0]?.providerId === 'password' && (
                            <Link
                              to="/login"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-yellow-700 hover:bg-yellow-50 
                                transition-all duration-300 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center 
                                group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-110 
                                group-hover:rotate-12">
                                <i className="fas fa-envelope text-yellow-600 text-sm group-hover:scale-110 
                                  transition-transform duration-300"></i>
                              </div>
                              <span className="font-bold text-sm group-hover:translate-x-1 transition-transform duration-300">
                                Verify Email
                              </span>
                            </Link>
                          )}
                          
                          <div className="border-t border-gray-100 my-1 mx-5"></div>
                          
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 
                              transition-all duration-300 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50/50 flex items-center justify-center 
                              group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-110 
                              group-hover:-rotate-12">
                              <i className="fas fa-power-off text-red-500 text-sm group-hover:scale-110 
                                transition-transform duration-300"></i>
                            </div>
                            <span className="font-bold text-sm group-hover:translate-x-1 transition-transform duration-300">
                              Logout
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !isLoginPage && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Link
                        to="/login"
                        className="group bg-white text-brick-700 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold 
                          hover:bg-gray-50 transition-all duration-500 shadow-lg border border-gray-200 
                          flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:shadow-xl hover:scale-105 
                          active:scale-95 relative overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-brick-50 via-brick-100/50 to-brick-50 
                          -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                        <i className="fas fa-user-circle text-sm sm:text-lg text-brick-600 
                          group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"></i>
                        <span className="hidden sm:inline relative">SIGN IN</span>
                        <span className="sm:hidden relative">LOGIN</span>
                      </Link>
                      
                      <Link
                        to="/booking"
                        className="group bg-brick-800 text-heritage-gold px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold 
                          hover:bg-brick-900 transition-all duration-500 shadow-xl border border-heritage-gold/30 
                          flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:shadow-2xl hover:scale-105 
                          active:scale-95 relative overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                          -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                        <i className="fas fa-shopping-cart text-sm sm:text-lg group-hover:scale-110 
                          group-hover:-rotate-12 transition-all duration-300"></i>
                        <span className="hidden sm:inline relative">BOOK NOW</span>
                        <span className="sm:hidden relative">BOOK</span>
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Tablet Navigation with Animations */}
            <div className="hidden md:flex lg:hidden items-center gap-2">
              {user ? (
                <>
                  <Link
                    to="/booking"
                    className="group bg-brick-800 text-heritage-gold px-3 py-2 rounded-xl font-bold 
                      hover:bg-brick-900 transition-all duration-500 shadow-lg border border-heritage-gold/30 
                      flex items-center gap-1 text-xs relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                      -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <i className="fas fa-plus-circle group-hover:rotate-180 transition-transform duration-500"></i>
                    ORDER
                  </Link>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-50 transition-all 
                      duration-300 border border-gray-100 bg-white shadow-sm group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brick-700 to-brick-900 
                        text-heritage-gold flex items-center justify-center font-bold text-xs shadow-inner 
                        border border-heritage-gold/20 group-hover:scale-110 transition-transform duration-300
                        group-hover:rotate-12">
                        {getUserInitials()}
                      </div>
                      {isUserVerified ? (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white 
                          animate-pulse"></div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white 
                          animate-bounce"></div>
                      )}
                    </div>
                  </button>
                </>
              ) : (
                !isLoginPage && (
                  <>
                    <Link
                      to="/login"
                      className="group bg-white text-brick-700 px-3 py-2 rounded-xl font-bold hover:bg-gray-50 
                        transition-all duration-500 shadow-lg border border-gray-200 flex items-center gap-1 text-xs 
                        relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-brick-50 via-brick-100/50 to-brick-50 
                        -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                      <i className="fas fa-user-circle text-sm text-brick-600 group-hover:scale-110 
                        group-hover:rotate-12 transition-all duration-300"></i>
                      LOGIN
                    </Link>
                    <Link
                      to="/booking"
                      className="group bg-brick-800 text-heritage-gold px-3 py-2 rounded-xl font-bold 
                        hover:bg-brick-900 transition-all duration-500 shadow-xl border border-heritage-gold/30 
                        flex items-center gap-1 text-xs relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                        -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                      <i className="fas fa-shopping-cart text-sm group-hover:scale-110 group-hover:-rotate-12 
                        transition-all duration-300"></i>
                      BOOK
                    </Link>
                  </>
                )
              )}
            </div>

            {/* Mobile menu button with animation */}
            <div className="flex md:hidden items-center">
              {!isLoginPage && !user && (
                <Link
                  to="/booking"
                  className="group bg-brick-800 text-heritage-gold px-3 py-2 rounded-xl font-bold 
                    hover:bg-brick-900 transition-all duration-500 shadow-xl border border-heritage-gold/30 
                    flex items-center gap-1 text-xs mr-2 relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                    -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <i className="fas fa-shopping-cart group-hover:scale-110 transition-transform duration-300"></i>
                  BOOK
                </Link>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-heritage-wood hover:text-brick-600 p-2 transition-all duration-300 
                  hover:rotate-90 active:scale-95"
                aria-label="Toggle menu"
              >
                <i className={`fas ${isOpen ? 'fa-times rotate-90' : 'fa-bars-staggered'} 
                  text-xl transition-all duration-500 hover:scale-110`}></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu with Enhanced Animations */}
      {isOpen && (
        <div className="md:hidden glass border-t-2 border-heritage-gold/20 animate-slideDown overflow-hidden 
          fixed inset-x-0 top-16 bg-white/95 backdrop-blur-lg z-40 max-h-[calc(100vh-4rem)] overflow-y-auto
          shadow-2xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            
            {/* User Profile Card - Mobile with animations */}
            {user && (
              <div className="px-4 py-4 bg-gradient-to-br from-brick-800 to-brick-900 rounded-2xl mb-4 
                border border-heritage-gold/30 shadow-lg transform transition-all duration-500 
                hover:scale-105 animate-slideInFromLeft">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="w-12 h-12 rounded-full bg-heritage-gold text-brick-900 
                      flex items-center justify-center font-black text-lg shadow-xl border-2 border-white/20
                      group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                      {getUserInitials()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white 
                      flex items-center justify-center transition-all duration-500 group-hover:scale-125 ${
                      isUserVerified ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-bounce'
                    }`}>
                      <i className={`fas text-[8px] text-white ${
                        isUserVerified ? 'fa-check' : 'fa-exclamation'
                      }`}></i>
                    </div>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-base font-black text-white truncate leading-tight 
                      animate-floatText">{getUserDisplayName()}</p>
                    <p className="text-xs text-heritage-gold/80 font-medium truncate">{user.email}</p>
                    <div className={`mt-1 px-2 py-1 rounded-full text-xs font-bold inline-block 
                      transform transition-all duration-300 hover:scale-105 ${
                      isUserVerified 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                    }`}>
                      {isUserVerified ? '✅ Verified Account' : '⚠️ Verify Your Email'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mobile Navigation Links with staggered animations */}
            <div className="space-y-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    mobile-menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold 
                    transition-all duration-300 hover-rotate-icon
                    ${location.pathname === link.path 
                      ? 'bg-brick-800 text-heritage-gold border border-heritage-gold/30 shadow-md' 
                      : 'bg-white text-heritage-wood border border-gray-100 hover:bg-gray-50'
                    }
                    animate-slideInFromLeft
                  `}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <i className={`${link.icon} transition-all duration-300 group-hover:scale-125 
                    ${location.pathname === link.path 
                      ? 'text-heritage-gold animate-pulse' 
                      : 'text-brick-600'}`}>
                  </i>
                  <span className="flex-1">{link.name}</span>
                  <i className="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-100 
                    -translate-x-2 group-hover:translate-x-0 transition-all duration-300"></i>
                </Link>
              ))}
            </div>

            {/* Additional mobile menu items with animations */}
            {user && (
              <div className="space-y-1 animate-slideInFromLeft" style={{animationDelay: '0.5s'}}>
                <Link
                  to="/my-orders"
                  onClick={() => setIsOpen(false)}
                  className="mobile-menu-item flex items-center gap-3 px-4 py-3 text-base font-bold 
                    rounded-xl bg-white border border-gray-100 text-heritage-wood shadow-sm
                    hover:bg-brick-50 hover:border-brick-200 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center 
                    group-hover:bg-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <i className="fas fa-receipt text-brick-600 group-hover:scale-110 transition-transform duration-300"></i>
                  </div>
                  <span className="flex-1 group-hover:translate-x-1 transition-transform duration-300">
                    My Orders History
                  </span>
                </Link>
                
                {!isUserVerified && user?.providerData[0]?.providerId === 'password' && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="mobile-menu-item flex items-center gap-3 px-4 py-3 text-base font-bold 
                      rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-700 shadow-sm
                      hover:bg-yellow-100 hover:border-yellow-200 transition-all duration-300 group
                      animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center 
                      group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <i className="fas fa-envelope text-yellow-600 group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                    <span className="flex-1 group-hover:translate-x-1 transition-transform duration-300">
                      Verify Email Now
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Action buttons with animations */}
            <div className="pt-4 flex flex-col gap-3">
              <Link
                to="/booking"
                onClick={() => setIsOpen(false)}
                className="group relative w-full bg-brick-800 text-heritage-gold py-4 rounded-2xl 
                  font-black flex justify-center items-center gap-2 shadow-2xl border border-heritage-gold/30 
                  uppercase tracking-wider text-sm overflow-hidden transform hover:scale-105 
                  transition-all duration-500"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                  -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <i className="fas fa-shopping-cart group-hover:scale-125 group-hover:-rotate-12 
                  transition-all duration-500"></i>
                <span className="relative">Book Bricks Now</span>
              </Link>
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="group w-full bg-red-50 text-red-600 py-3 rounded-2xl font-bold 
                    flex justify-center items-center gap-2 border border-red-100 text-sm
                    hover:bg-red-100 hover:border-red-200 transition-all duration-500
                    hover:scale-105 active:scale-95"
                >
                  <i className="fas fa-power-off group-hover:rotate-12 group-hover:scale-110 
                    transition-all duration-500"></i> 
                  <span>LOGOUT</span>
                </button>
              ) : (
                !isLoginPage && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="group relative w-full bg-white text-brick-700 py-4 rounded-2xl 
                      font-black flex justify-center items-center gap-2 shadow-xl border border-gray-200 
                      uppercase tracking-wider text-sm overflow-hidden hover:bg-gray-50 
                      transition-all duration-500 hover:scale-105 active:scale-95"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-brick-50 via-brick-100/50 to-brick-50 
                      -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    <i className="fas fa-user-circle text-xl text-brick-600 group-hover:scale-110 
                      group-hover:rotate-12 transition-all duration-500"></i>
                    <span className="relative">SIGN IN</span>
                  </Link>
                )
              )}
            </div>

            {/* Mobile footer note with animation */}
            <div className="pt-4 text-center text-xs text-gray-500 border-t border-gray-200 mt-4
              animate-fadeIn">
              <p className="hover:tracking-wider transition-all duration-300">𝓮Bricks • Quality Construction Materials</p>
              <p className="text-[10px] text-heritage-gold mt-1 animate-pulse-subtle">The Golden Standard of Nepal</p>
            </div>
          </div>
        </div>
      )}

      {/* Add custom keyframes for missing animations */}
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .animate-slideDown {
            animation: slideDown 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease;
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 2s ease-in-out infinite;
          }
          .hover-rotate-icon:hover i {
            transform: rotate(360deg);
          }
        `}
      </style>
    </>
  );
};

export default Navbar;