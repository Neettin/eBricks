import React, { useEffect, useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './src/services/firebaseConfig';

// Components
import SplashAnimation from './components/SplashAnimation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './src/pages/Home';
import Booking from './src/pages/Booking';
import Products from './src/pages/Products';
import Gallery from './src/pages/Gallery';
import Contact from './src/pages/Contact';
import AuthPage from './src/pages/AuthPage';
import MyOrders from './src/pages/MyOrders';
import AdminDashboard from './src/pages/AdminDashboard';
import AuthRedirectPage from './src/pages/AuthRedirectPage';

const AppContent: React.FC<{ user: User | null }> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login';

  // --- SESSION TIMEOUT LOGIC ---
  useEffect(() => {
    if (!user) return;

    let timeout: any;

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(async () => {
        try {
          await signOut(auth);
          navigate('/');
          alert("Your session has expired due to inactivity. Please log in again.");
        } catch (error) {
          console.error("Logout error during timeout:", error);
        }
      }, 900000); // 15 minutes
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event =>
      document.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      activityEvents.forEach(event =>
        document.removeEventListener(event, resetTimer)
      );
      if (timeout) clearTimeout(timeout);
    };
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <div className="fixed inset-0 pointer-events-none mandala-bg z-0 opacity-10"></div>

      <Navbar user={user} />

      <main className="flex-grow relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />

          {/* Firebase Auth Redirect */}
          <Route path="/__/auth/action" element={<AuthRedirectPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Login */}
          <Route
            path="/login"
            element={!user ? <AuthPage /> : <Navigate to="/" replace />}
          />

          {/* Protected Routes */}
          <Route
            path="/booking"
            element={user ? <Booking /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/my-orders"
            element={user ? <MyOrders /> : <Navigate to="/login" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {!isAuthPage && (
        <a
          href="https://wa.me/9824589706"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:bg-green-600 transition-all hover:scale-110 active:scale-95 group border-4 border-white"
        >
          <i className="fab fa-whatsapp text-3xl"></i>
          <span className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
            Chat with Sachin
          </span>
        </a>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-brick-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-heritage-gold"></div>
      </div>
    );
  }

  if (showSplash) {
    return <SplashAnimation onComplete={handleSplashComplete} />;
  }

  return (
    <Router>
      <ScrollToTop />
      <AppContent user={user} />
    </Router>
  );
};

export default App;
