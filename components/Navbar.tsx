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

  const navLinks = [
    { name: 'Home', path: '/', icon: 'fas fa-home' },
    { name: 'Products', path: '/products', icon: 'fas fa-box' },
    { name: 'Booking', path: '/booking', icon: 'fas fa-shopping-cart' },
    { name: 'Gallery', path: '/gallery', icon: 'fas fa-images' },
    { name: 'Contact', path: '/contact', icon: 'fas fa-phone' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Check if user is verified (Google users are automatically verified)
  const isUserVerified = user?.emailVerified || user?.providerData[0]?.providerId === 'google.com';

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'glass shadow-2xl border-b-2 border-heritage-gold/40 bg-white/95 backdrop-blur-lg' 
        : 'glass shadow-xl border-b-2 border-heritage-gold/30 bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="bg-white w-10 h-10 sm:w-14 sm:h-14 rounded-xl transform group-hover:rotate-12 transition-all duration-300 shadow-lg border border-heritage-gold/50 flex items-center justify-center p-1 sm:p-1.5">
                  <img 
                    src={ebricksLogo} 
                    alt="eBricks Nepal Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-construction-yellow w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-oswald font-bold tracking-tight leading-none block">
                  <span className="text-brick-900">𝓮</span>
                  <span className="text-heritage-gold">Bricks</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brick-900 font-mukta">The Golden Standard</span>
              </div>
              <div className="sm:hidden">
                <span className="text-xl font-oswald font-bold tracking-tight leading-none block">
                  <span className="text-brick-900">𝓮</span>
                  <span className="text-heritage-gold">Bricks</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  location.pathname === link.path 
                  ? 'text-brick-700 bg-brick-50 shadow-sm' 
                  : 'text-heritage-wood hover:text-brick-600 hover:bg-gray-50'
                }`}
              >
                <i className={`${link.icon} text-sm`}></i>
                {link.name}
              </Link>
            ))}

            <div className="ml-6 pl-6 border-l border-gray-200 flex items-center gap-4">
              {user ? (
                <div className="relative flex items-center gap-4" ref={profileDropdownRef}>
                  <Link
                    to="/booking"
                    className="bg-brick-800 text-heritage-gold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-lg border border-heritage-gold/30 flex items-center gap-2 text-xs sm:text-sm hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-plus-circle"></i>
                    <span className="hidden sm:inline">NEW ORDER</span>
                    <span className="sm:hidden">ORDER</span>
                  </Link>

                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-2 sm:pr-3 rounded-full hover:bg-gray-50 transition-all border border-gray-100 bg-white shadow-sm group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brick-700 to-brick-900 text-heritage-gold flex items-center justify-center font-bold text-sm shadow-inner border border-heritage-gold/20">
                        {getUserInitials()}
                      </div>
                      {/* Verification Status Badge */}
                      {isUserVerified ? (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <i className="fas fa-check text-[6px] sm:text-[8px] text-white"></i>
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                          <i className="fas fa-exclamation text-[6px] sm:text-[8px] text-white"></i>
                        </div>
                      )}
                    </div>
                    <i className={`fas fa-chevron-down text-[10px] text-gray-400 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-heritage-gold/10 py-2 overflow-hidden animate-fadeIn transform origin-top-right">
                      <div className="px-5 py-4 bg-gradient-to-r from-brick-50 to-transparent border-b border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-heritage-gold uppercase tracking-widest mb-1">My Profile</p>
                            <p className="text-sm font-black text-brick-900 truncate">{getUserDisplayName()}</p>
                            <p className="text-[11px] text-gray-500 truncate font-medium">{user.email}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isUserVerified 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700 animate-pulse'
                          }`}>
                            {isUserVerified ? '✅ Verified' : '⚠️ Not Verified'}
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/my-orders"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-heritage-wood hover:bg-brick-50 hover:text-brick-800 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white shadow-sm transition-all">
                            <i className="fas fa-receipt text-brick-600 text-sm"></i>
                          </div>
                          <span className="font-bold text-sm">My Orders</span>
                        </Link>
                        
                        {!isUserVerified && user?.providerData[0]?.providerId === 'password' && (
                          <Link
                            to="/login"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-yellow-700 hover:bg-yellow-50 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center group-hover:bg-white shadow-sm transition-all">
                              <i className="fas fa-envelope text-yellow-600 text-sm"></i>
                            </div>
                            <span className="font-bold text-sm">Verify Email</span>
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100 my-1 mx-5"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50/50 flex items-center justify-center group-hover:bg-white shadow-sm transition-all">
                            <i className="fas fa-power-off text-red-500 text-sm"></i>
                          </div>
                          <span className="font-bold text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                !isLoginPage && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* SIGN IN Button */}
                    <Link
                      to="/login"
                      className="bg-white text-brick-700 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-user-circle text-sm sm:text-lg text-brick-600"></i>
                      <span className="hidden sm:inline">SIGN IN</span>
                      <span className="sm:hidden">LOGIN</span>
                    </Link>
                    
                    {/* BOOK NOW Button */}
                    <Link
                      to="/booking"
                      className="bg-brick-800 text-heritage-gold px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-xl border border-heritage-gold/30 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-shopping-cart text-sm sm:text-lg"></i>
                      <span className="hidden sm:inline">BOOK NOW</span>
                      <span className="sm:hidden">BOOK</span>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Tablet Navigation (hidden on mobile, shown on tablet) */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/booking"
                  className="bg-brick-800 text-heritage-gold px-3 py-2 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-lg border border-heritage-gold/30 flex items-center gap-1 text-xs"
                >
                  <i className="fas fa-plus-circle"></i>
                  ORDER
                </Link>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-50 transition-all border border-gray-100 bg-white shadow-sm"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brick-700 to-brick-900 text-heritage-gold flex items-center justify-center font-bold text-xs shadow-inner border border-heritage-gold/20">
                      {getUserInitials()}
                    </div>
                    {isUserVerified ? (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </button>
              </>
            ) : (
              !isLoginPage && (
                <>
                  <Link
                    to="/login"
                    className="bg-white text-brick-700 px-3 py-2 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center gap-1 text-xs"
                  >
                    <i className="fas fa-user-circle text-sm text-brick-600"></i>
                    LOGIN
                  </Link>
                  <Link
                    to="/booking"
                    className="bg-brick-800 text-heritage-gold px-3 py-2 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-xl border border-heritage-gold/30 flex items-center gap-1 text-xs"
                  >
                    <i className="fas fa-shopping-cart text-sm"></i>
                    BOOK
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            {!isLoginPage && !user && (
              <Link
                to="/booking"
                className="bg-brick-800 text-heritage-gold px-3 py-2 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-xl border border-heritage-gold/30 flex items-center gap-1 text-xs mr-2"
              >
                <i className="fas fa-shopping-cart"></i>
                BOOK
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-heritage-wood hover:text-brick-600 p-2 transition-colors"
              aria-label="Toggle menu"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars-staggered'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t-2 border-heritage-gold/20 animate-slideDown overflow-hidden fixed inset-x-0 top-16 bg-white/95 backdrop-blur-lg z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {user && (
              <div className="px-4 py-4 bg-gradient-to-br from-brick-800 to-brick-900 rounded-2xl mb-4 border border-heritage-gold/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-heritage-gold text-brick-900 flex items-center justify-center font-black text-lg shadow-xl border-2 border-white/20">
                      {getUserInitials()}
                    </div>
                    {/* Mobile verification badge */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                      isUserVerified ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`}>
                      <i className={`fas text-[8px] text-white ${
                        isUserVerified ? 'fa-check' : 'fa-exclamation'
                      }`}></i>
                    </div>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-base font-black text-white truncate leading-tight">{getUserDisplayName()}</p>
                    <p className="text-xs text-heritage-gold/80 font-medium truncate">{user.email}</p>
                    <div className={`mt-1 px-2 py-1 rounded-full text-xs font-bold inline-block ${
                      isUserVerified 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {isUserVerified ? '✅ Verified Account' : '⚠️ Verify Your Email'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mobile Navigation Links with Icons */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === link.path 
                    ? 'bg-brick-800 text-heritage-gold border border-heritage-gold/30 shadow-md' 
                    : 'bg-white text-heritage-wood border border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <i className={`${link.icon} ${location.pathname === link.path ? 'text-heritage-gold' : 'text-brick-600'}`}></i>
                  {link.name}
                </Link>
              ))}
            </div>

            {user && (
              <>
                <Link
                  to="/my-orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-bold rounded-xl bg-white border border-gray-100 text-heritage-wood shadow-sm mt-2"
                >
                  <i className="fas fa-receipt text-brick-600"></i>
                  My Orders History
                </Link>
                
                {!isUserVerified && user?.providerData[0]?.providerId === 'password' && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-bold rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-700 shadow-sm"
                  >
                    <i className="fas fa-envelope text-yellow-600"></i>
                    Verify Email Now
                  </Link>
                )}
              </>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <Link
                to="/booking"
                onClick={() => setIsOpen(false)}
                className="w-full bg-brick-800 text-heritage-gold py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-2xl border border-heritage-gold/30 uppercase tracking-wider text-sm"
              >
                <i className="fas fa-shopping-cart"></i>
                Book Bricks Now
              </Link>
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 border border-red-100 text-sm"
                >
                  <i className="fas fa-power-off"></i> LOGOUT
                </button>
              ) : (
                !isLoginPage && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-white text-brick-700 py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-xl border border-gray-200 uppercase tracking-wider text-sm hover:bg-gray-50"
                  >
                    <i className="fas fa-user-circle text-xl text-brick-600"></i> SIGN IN
                  </Link>
                )
              )}
            </div>

            {/* Mobile footer note */}
            <div className="pt-4 text-center text-xs text-gray-500 border-t border-gray-200 mt-4">
              <p>eBricks • Quality Construction Materials</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;