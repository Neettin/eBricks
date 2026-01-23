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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Booking', path: '/booking'},
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
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

  return (
    <nav className="sticky top-0 z-50 glass shadow-xl border-b-2 border-heritage-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section with your eBricks logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative">
                <div className="bg-white w-14 h-14 rounded-xl transform group-hover:rotate-12 transition-all duration-300 shadow-lg border border-heritage-gold/50 flex items-center justify-center p-1.5">
                  <img 
                    src={ebricksLogo} 
                    alt="eBricks Nepal Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-construction-yellow w-4 h-4 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <span className="text-2xl font-oswald font-bold tracking-tight leading-none block">
                  <span className="text-brick-900">𝓮</span>
                  <span className="text-heritage-gold">Bricks</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brick-900 font-mukta">The Golden Standard</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 ${
                  location.pathname === link.path 
                  ? 'text-brick-700 bg-brick-50' 
                  : 'text-heritage-wood hover:text-brick-600 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="ml-6 pl-6 border-l border-gray-200 flex items-center gap-4">
              {user ? (
                <div className="relative flex items-center gap-4" ref={profileDropdownRef}>
                  <Link
                    to="/booking"
                    className="bg-brick-800 text-heritage-gold px-5 py-2.5 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-lg border border-heritage-gold/30 flex items-center gap-2 text-sm"
                  >
                    <i className="fas fa-plus-circle"></i>
                    NEW ORDER
                  </Link>

                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-gray-50 transition-all border border-gray-100 bg-white shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brick-700 to-brick-900 text-heritage-gold flex items-center justify-center font-bold text-sm shadow-inner border border-heritage-gold/20">
                      {getUserInitials()}
                    </div>
                    <i className={`fas fa-chevron-down text-[10px] text-gray-400 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-heritage-gold/10 py-2 overflow-hidden animate-fadeIn transform origin-top-right">
                      <div className="px-5 py-4 bg-gradient-to-r from-brick-50 to-transparent border-b border-gray-100">
                        <p className="text-xs font-bold text-heritage-gold uppercase tracking-widest mb-1">My Profile</p>
                        <p className="text-sm font-black text-brick-900 truncate">{getUserDisplayName()}</p>
                        <p className="text-[11px] text-gray-500 truncate font-medium">{user.email}</p>
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
                          <span className="font-bold text-sm">My Bricks Orders</span>
                        </Link>
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
                  <div className="flex items-center gap-3">
                    {/* SIGN IN - White background with brick color text */}
                    <Link
                      to="/login"
                      className="bg-white text-brick-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center gap-2 text-sm hover:shadow-xl"
                    >
                      <i className="fas fa-user-circle text-lg text-brick-600"></i>
                      SIGN IN
                    </Link>
                    
                    {/* BOOK NOW - Brick background with gold text */}
                    <Link
                      to="/booking"
                      className="bg-brick-800 text-heritage-gold px-6 py-2.5 rounded-xl font-bold hover:bg-brick-900 transition-all shadow-xl border border-heritage-gold/30 flex items-center gap-2 text-sm hover:shadow-2xl"
                    >
                      <i className="fas fa-shopping-cart text-lg"></i>
                      BOOK NOW
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-heritage-wood hover:text-brick-600 p-2 transition-colors"
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars-staggered'} text-2xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t-2 border-heritage-gold/20 animate-slideDown overflow-hidden">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {user && (
              <div className="px-5 py-5 bg-gradient-to-br from-brick-800 to-brick-900 rounded-2xl mb-4 border border-heritage-gold/30 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-heritage-gold text-brick-900 flex items-center justify-center font-black text-xl shadow-xl border-2 border-white/20">
                    {getUserInitials()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-lg font-black text-white truncate leading-tight">{getUserDisplayName()}</p>
                    <p className="text-xs text-heritage-gold/80 font-medium truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-center px-4 py-4 text-sm font-bold rounded-xl transition-all border ${
                    location.pathname === link.path 
                    ? 'bg-brick-800 text-heritage-gold border-heritage-gold/30 shadow-md' 
                    : 'bg-white text-heritage-wood border-gray-100'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {user && (
              <Link
                to="/my-orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-base font-bold rounded-2xl bg-white border border-gray-100 text-heritage-wood shadow-sm"
              >
                <i className="fas fa-receipt text-brick-600"></i>
                My Orders History
              </Link>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <Link
                to="/booking"
                onClick={() => setIsOpen(false)}
                className="w-full bg-brick-800 text-heritage-gold py-5 rounded-2xl font-black flex justify-center items-center gap-2 shadow-2xl border border-heritage-gold/30 uppercase tracking-widest"
              >
                <i className="fas fa-shopping-cart"></i>
                Book Bricks Now
              </Link>
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex justify-center items-center gap-2 border border-red-100"
                >
                  <i className="fas fa-power-off"></i> LOGOUT SESSION
                </button>
              ) : (
                !isLoginPage && (
                  /* Mobile SIGN IN - Different style from BOOK NOW */
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-white text-brick-700 py-5 rounded-2xl font-black flex justify-center items-center gap-2 shadow-xl border border-gray-200 uppercase tracking-widest hover:bg-gray-50"
                  >
                    <i className="fas fa-user-circle text-xl text-brick-600"></i> SIGN IN
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;