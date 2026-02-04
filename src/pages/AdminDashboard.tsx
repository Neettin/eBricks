import  { useState, useEffect, useRef } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Firestore methods
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  Timestamp,
  getDocs
} from 'firebase/firestore';

interface Order {
  id: string;
  customerName?: string;
  name?: string;
  phone: string;
  quantity: number;
  brickType: string;
  location: string;
  totalAmount: number;
  status: string;
  createdAt: Timestamp;
}

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  createdAt: Timestamp;
  status: 'unread' | 'read' | 'replied' | 'archived';
  read: boolean;
  replied: boolean;
  source: string;
}

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, orderId: string | null}>({
    show: false,
    orderId: null
  });
  const [editForm, setEditForm] = useState({
    customerName: '',
    phone: '',
    quantity: 0,
    brickType: '',
    location: '',
    totalAmount: 0,
    status: 'pending',
  });
  
  // Mobile responsive states
  const [activeTab, setActiveTab] = useState<'orders' | 'messages'>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Always show auth modal on component mount
  useEffect(() => {
    // Clear any previous auth
    localStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminAuth');
    
    // Force sign out from Firebase
    signOut(auth).catch(() => {});
    
    setIsLoading(false);
    setShowPasswordModal(true);
  }, []);

  // Focus email input when modal opens
  useEffect(() => {
    if (showPasswordModal && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [showPasswordModal]);

  // Auth handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please enter both email and password');
      return;
    }
    
    try {
      // Clear any existing auth
      await signOut(auth);
      
      // Try to sign in with provided credentials
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      
      // Mark as authorized
      setIsAuthorized(true);
      setShowPasswordModal(false);
      setAuthError('');
      setEmailInput('');
      setPasswordInput('');
      toast.success('Login successful!');
      
    } catch (error: any) {
      setAuthError('Invalid email or password');
      setPasswordInput('');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  };

  const handleAuthCancel = () => {
    setShowPasswordModal(false);
    window.location.href = "/";
  };

  // Load orders when authorized
  useEffect(() => {
    if (!isAuthorized) return;

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const messagesQuery = query(collection(db, "contactMessages"), orderBy("createdAt", "desc"));
    
    const unsubscribeOrders = onSnapshot(ordersQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Order[];
        setOrders(data);
        setLastUpdate(new Date());
      }, 
      (error) => {
        console.error("Error loading orders:", error);
        toast.error('Error loading orders');
      }
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as ContactMessage[];
        setMessages(data);
      }, 
      (error) => {
        console.error("Error loading messages:", error);
        toast.error('Error loading messages');
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeMessages();
    };
  }, [isAuthorized]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'orders') {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        setOrders(data);
        toast.success('Orders refreshed');
      } else {
        const q = query(collection(db, "contactMessages"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContactMessage[];
        setMessages(data);
        toast.success('Messages refreshed');
      }
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error refreshing:', error);
      toast.error('Error refreshing data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // CRUD: Update Status
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      toast.success('Status updated');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  // CRUD: Delete Order
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ show: true, orderId: id });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.orderId) {
      try {
        await deleteDoc(doc(db, "orders", deleteConfirm.orderId));
        setDeleteConfirm({ show: false, orderId: null });
        toast.success('Order deleted');
      } catch (error: any) {
        console.error('Error deleting order:', error);
        toast.error('Error deleting order');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, orderId: null });
  };

  // CRUD: Edit Order
  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || order.name || '',
      phone: order.phone,
      quantity: order.quantity,
      brickType: order.brickType,
      location: order.location,
      totalAmount: order.totalAmount,
      status: order.status,
    });
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    try {
      await updateDoc(doc(db, "orders", editingOrder.id), {
        customerName: editForm.customerName,
        phone: editForm.phone,
        quantity: editForm.quantity,
        brickType: editForm.brickType,
        location: editForm.location,
        totalAmount: editForm.totalAmount,
        status: editForm.status,
      });
      setEditingOrder(null);
      toast.success('Order updated');
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Error updating order');
    }
  };

  // Message Management
  const markAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, "contactMessages", messageId), { 
        read: true,
        status: 'read'
      });
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Error marking as read');
    }
  };

  const markAsReplied = async (messageId: string) => {
    try {
      await updateDoc(doc(db, "contactMessages", messageId), { 
        replied: true,
        status: 'replied'
      });
      toast.success('Marked as replied');
    } catch (error) {
      console.error('Error marking as replied:', error);
      toast.error('Error marking as replied');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, "contactMessages", messageId));
      setSelectedMessage(null);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Error deleting message');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setShowPasswordModal(true);
    setEmailInput('');
    setPasswordInput('');
    signOut(auth).catch(() => {});
    toast.info('Logged out');
  };

  // Stats Calculation
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const totalBricks = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const unreadMessages = messages.filter(m => !m.read).length;

  // Helper to parse location
  const parseLocation = (location: string) => {
    const coordMatch = location.match(/\(([^)]+)\)/);
    if (coordMatch) {
      const coords = coordMatch[1];
      const [lat, lng] = coords.split(',').map(c => c.trim());
      return {
        display: location.replace(/\([^)]+\)/, '').trim() || 'GPS Location',
        hasCoords: true,
        lat,
        lng,
        fullCoords: coords
      };
    }
    return {
      display: location || 'Location not specified',
      hasCoords: false
    };
  };

  // Format last update time
  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Auth Modal - Always shows first
  if (showPasswordModal) {
    return (
      <>
        <ToastContainer
  position="top-center"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="colored"
  aria-label="Notification messages"
/>
        <div className="fixed inset-0 bg-gradient-to-br from-brick-900 to-brick-800 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-brick-700 to-brick-900 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lock text-3xl text-brick-800"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
              <p className="text-heritage-gold text-sm">Enter admin credentials</p>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-brick-500 focus:border-brick-500 text-base"
                    placeholder="admin@example.com"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    ref={passwordInputRef}
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-brick-500 focus:border-brick-500 text-base"
                    placeholder="Enter password"
                    autoComplete="off"
                  />
                </div>
              </div>
              
              {authError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <i className="fas fa-exclamation-circle"></i>
                  <span className="text-sm font-medium">{authError}</span>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleAuthCancel}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-brick-700 to-brick-900 text-white rounded-xl hover:from-brick-800 hover:to-brick-950 transition-all font-semibold shadow-lg text-sm"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brick-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-base font-semibold text-gray-700">Loading Admin Panel...</p>
      </div>
    </div>
  );
  
  if (!isAuthorized) return null;

  // Main Admin Dashboard Layout with Sidebar
  return (
    <>
      <ToastContainer
  position="top-center"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="colored"
  aria-label="Notification messages"
/>
      
      <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-brick-900 text-white z-40 h-14 flex items-center justify-between px-4 shadow-lg">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-heritage-gold rounded-full flex items-center justify-center">
              <i className="fas fa-brick text-brick-900"></i>
            </div>
            <span className="font-bold">Brick Admin</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-white"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>

        {/* Sidebar - Mobile Overlay */}
        {(sidebarOpen || isMobileMenuOpen) && isMobile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out' : 'relative'}
          ${(sidebarOpen || isMobileMenuOpen) ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'w-64' : 'w-64'} 
          bg-brick-900 text-white flex flex-col shadow-xl
        `}>
          {/* Logo/Sidebar Header */}
          <div className="p-4 border-b border-brick-700">
            <div className="flex items-center justify-between">
              {isMobile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-heritage-gold rounded-lg flex items-center justify-center">
                    <i className="fas fa-brick text-brick-900 text-xl"></i>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Brick Admin</h2>
                    <p className="text-xs text-brick-300">Dashboard</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-heritage-gold rounded-lg flex items-center justify-center">
                    <i className="fas fa-brick text-brick-900 text-xl"></i>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Brick Admin</h2>
                    <p className="text-xs text-brick-300">Dashboard</p>
                  </div>
                </div>
              )}
              {isMobile && (
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-brick-300 hover:text-white"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              )}
              {!isMobile && (
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-brick-300 hover:text-white"
                >
                  <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab('orders');
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-brick-800 text-heritage-gold' : 'hover:bg-brick-800 text-brick-200'}`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="fas fa-clipboard-list text-lg"></i>
              </div>
              <span className="font-medium">Orders</span>
              <span className="ml-auto bg-heritage-gold text-brick-900 text-xs px-2 py-1 rounded-full">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('messages');
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all relative ${activeTab === 'messages' ? 'bg-brick-800 text-heritage-gold' : 'hover:bg-brick-800 text-brick-200'}`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="fas fa-envelope text-lg"></i>
              </div>
              <span className="font-medium">Inquiries</span>
              {unreadMessages > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </button>
          </nav>

          {/* User Info & Logout - Desktop only */}
          {!isMobile && (
            <div className="p-4 border-t border-brick-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brick-800 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-brick-300"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{auth.currentUser?.email}</p>
                  <p className="text-xs text-brick-400">Admin</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-brick-300 hover:text-white"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}>
          <div className="p-4 md:p-6">
            {/* Mobile Tab Switcher */}
            {isMobile && (
              <div className="flex bg-white rounded-lg shadow mb-4">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 py-3 text-center font-medium ${activeTab === 'orders' ? 'bg-brick-900 text-white' : 'text-gray-700'}`}
                >
                  <div className="flex flex-col items-center">
                    <i className="fas fa-clipboard-list mb-1"></i>
                    <span className="text-xs">Orders ({orders.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex-1 py-3 text-center font-medium relative ${activeTab === 'messages' ? 'bg-brick-900 text-white' : 'text-gray-700'}`}
                >
                  <div className="flex flex-col items-center">
                    <i className="fas fa-envelope mb-1"></i>
                    <span className="text-xs">Inquiries ({messages.length})</span>
                  </div>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Header */}
            <div className="mb-4 md:mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {activeTab === 'orders' ? 'Order Management' : 'Customer Inquiries'}
                  </h1>
                  <p className="text-gray-600 text-xs md:text-sm">
                    {activeTab === 'orders' 
                      ? `${orders.length} orders • ${pendingOrders} pending • ${deliveredOrders} delivered`
                      : `${messages.length} messages • ${unreadMessages} unread`
                    }
                  </p>
                  {auth.currentUser && !isMobile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Logged in as: {auth.currentUser.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <div className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <div className="relative">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                      <span>Live • {formatLastUpdate()}</span>
                    </div>
                  )}
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Refresh"
                  >
                    <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
                    {!isMobile && (
                      <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards - Mobile optimized */}
            {activeTab === 'orders' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="bg-white p-3 md:p-4 rounded-lg shadow border-l-4 border-green-500 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="text-lg md:text-xl font-bold text-gray-900">Rs. {totalRevenue.toLocaleString()}</p>
                    </div>
                    <i className="fas fa-wallet text-green-500"></i>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {deliveredOrders} delivered
                  </div>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-lg shadow border-l-4 border-blue-500 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Bricks</p>
                      <p className="text-lg md:text-xl font-bold text-gray-900">{totalBricks.toLocaleString()}</p>
                    </div>
                    <i className="fas fa-cubes text-blue-500"></i>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {orders.length - cancelledOrders} orders
                  </div>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-lg shadow border-l-4 border-orange-500 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Active</p>
                      <p className="text-lg md:text-xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                    <i className="fas fa-clipboard-list text-orange-500"></i>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded">{pendingOrders} P</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">{confirmedOrders} C</span>
                  </div>
                </div>

                <div className="bg-white p-3 md:p-4 rounded-lg shadow border-l-4 border-red-500 col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Delivered</p>
                      <p className="text-lg md:text-xl font-bold text-gray-900">{deliveredOrders}</p>
                    </div>
                    <i className="fas fa-check-circle text-red-500"></i>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {cancelledOrders} cancelled
                  </div>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="bg-white shadow rounded-xl md:rounded-3xl overflow-hidden">
              {/* Orders Tab Content */}
              {activeTab === 'orders' && (
                <>
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">All Orders</h2>
                    <p className="text-gray-600 text-xs">Manage customer orders</p>
                  </div>
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">No Orders Yet</h3>
                      <p className="text-gray-500 text-sm">All orders will appear here</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {orders.map(order => {
                        const locationInfo = parseLocation(order.location);
                        const perUnitPrice = order.quantity > 0 
                          ? (order.totalAmount / order.quantity).toFixed(2)
                          : '0.00';
                        
                        return (
                          <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="space-y-3">
                              {/* Customer Info */}
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-user"></i>
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 text-sm">
                                      {order.customerName || order.name || 'No Name'}
                                    </div>
                                    <div className="text-xs text-blue-600 font-medium">
                                      <i className="fas fa-phone-alt mr-1"></i>
                                      {order.phone}
                                    </div>
                                  </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status === 'on_the_way' ? 'ON WAY' : order.status.charAt(0).toUpperCase()}
                                </div>
                              </div>

                              {/* Order Date */}
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <i className="fas fa-calendar"></i>
                                  <span>{order.createdAt?.toDate().toLocaleDateString('en-NP')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <i className="fas fa-clock"></i>
                                  <span>{order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>

                              {/* Order Details */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-gray-50 p-2 rounded-lg">
                                  <p className="text-xs text-gray-500">Quantity</p>
                                  <p className="text-sm font-bold text-gray-800">{order.quantity.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg">
                                  <p className="text-xs text-gray-500">Type</p>
                                  <p className="text-sm font-bold text-brick-800 truncate">{order.brickType}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg">
                                  <p className="text-xs text-gray-500">Unit Price</p>
                                  <p className="text-sm font-bold text-gray-800">Rs. {perUnitPrice}</p>
                                </div>
                              </div>

                              {/* Location */}
                              <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <div className="text-green-600 mt-0.5">
                                    <i className="fas fa-map-marker-alt text-sm"></i>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800 text-xs truncate">
                                      {locationInfo.display}
                                    </div>
                                    {locationInfo.hasCoords && (
                                      <a 
                                        href={`https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-0.5"
                                      >
                                        <i className="fas fa-external-link-alt text-xs"></i>
                                        View on Maps
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-xs text-gray-500">Total Amount</p>
                                    <p className="text-lg font-bold text-green-600">Rs. {order.totalAmount?.toLocaleString()}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleEdit(order)}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteClick(order.id)}
                                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Status Selector */}
                              <select 
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                className={`w-full border rounded-lg p-2 text-xs font-bold
                                  ${order.status === 'pending' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : ''}
                                  ${order.status === 'confirmed' ? 'bg-blue-50 border-blue-300 text-blue-800' : ''}
                                  ${order.status === 'on_the_way' ? 'bg-orange-50 border-orange-300 text-orange-800' : ''}
                                  ${order.status === 'delivered' ? 'bg-green-50 border-green-300 text-green-800' : ''}
                                  ${order.status === 'cancelled' ? 'bg-red-50 border-red-300 text-red-800' : ''}
                                `}
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="confirmed">✅ Confirmed</option>
                                <option value="on_the_way">🚚 On the Way</option>
                                <option value="delivered">📦 Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Messages Tab Content */}
              {activeTab === 'messages' && (
                <>
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Customer Inquiries</h2>
                    <p className="text-gray-600 text-xs">Manage contact form messages</p>
                  </div>
                  
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-envelope-open-text text-4xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">No Messages Yet</h3>
                      <p className="text-gray-500 text-sm">Contact form messages will appear here</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {messages.map(message => (
                        <div 
                          key={message.id} 
                          className={`p-4 hover:bg-gray-50 transition-colors ${!message.read ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            setSelectedMessage(message);
                            if (!message.read) markAsRead(message.id);
                          }}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!message.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                  <i className="fas fa-user text-sm"></i>
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{message.name}</h3>
                                  <div className="text-xs text-gray-600">
                                    <i className="fas fa-phone mr-1"></i>
                                    {message.phone}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  message.status === 'unread' ? 'bg-red-100 text-red-800' : 
                                  message.status === 'read' ? 'bg-blue-100 text-blue-800' : 
                                  message.status === 'replied' ? 'bg-green-100 text-green-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {message.status.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  {message.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm mb-1 truncate">{message.subject}</h4>
                              <p className="text-gray-600 text-xs line-clamp-2">{message.message}</p>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                              <div className="text-xs text-gray-500">
                                {message.createdAt?.toDate().toLocaleDateString()}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${message.phone}`);
                                  }}
                                  className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                                  title="Call"
                                >
                                  <i className="fas fa-phone"></i>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsReplied(message.id);
                                  }}
                                  className={`p-1.5 rounded text-xs ${
                                    message.replied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  }`}
                                  title={message.replied ? "Replied" : "Reply"}
                                >
                                  <i className={`fas ${message.replied ? 'fa-check' : 'fa-reply'}`}></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Order?</h3>
              <p className="text-gray-600 text-sm">This action cannot be undone.</p>
            </div>
            
            <div className="p-5 border-t flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b">
              <h3 className="text-xl font-bold text-gray-800">Edit Order</h3>
              <p className="text-gray-600 text-sm">Update order details</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brick Type
                  </label>
                  <select
                    value={editForm.brickType}
                    onChange={(e) => setEditForm({...editForm, brickType: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Red Brick">Red Brick</option>
                    <option value="Hollow Brick">Hollow Brick</option>
                    <option value="Cement Brick">Cement Brick</option>
                    <option value="Fly Ash Brick">Fly Ash Brick</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount (Rs.)
                </label>
                <input
                  type="number"
                  value={editForm.totalAmount}
                  onChange={(e) => setEditForm({...editForm, totalAmount: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="on_the_way">🚚 On the Way</option>
                  <option value="delivered">📦 Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="p-5 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrder}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                Update Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Message Details</h3>
                <p className="text-gray-600 text-sm">From: {selectedMessage.name}</p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="font-semibold text-sm">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Phone</label>
                  <p className="font-semibold text-sm">{selectedMessage.phone}</p>
                </div>
                {selectedMessage.email && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="font-semibold text-sm">{selectedMessage.email}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Date</label>
                  <p className="font-semibold text-sm">{selectedMessage.createdAt?.toDate().toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">Subject</label>
                <p className="font-semibold">{selectedMessage.subject}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">Message</label>
                <div className="bg-gray-50 p-3 rounded-lg mt-1">
                  <p className="text-sm whitespace-pre-line">{selectedMessage.message}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                <a
                  href={`tel:${selectedMessage.phone}`}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-semibold text-sm flex items-center justify-center gap-1"
                >
                  <i className="fas fa-phone"></i> Call
                </a>
                <a
                  href={`https://wa.me/${selectedMessage.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-center font-semibold text-sm flex items-center justify-center gap-1"
                >
                  <i className="fab fa-whatsapp"></i> WhatsApp
                </a>
                <button
                  onClick={() => {
                    markAsReplied(selectedMessage.id);
                    setSelectedMessage(null);
                  }}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1 ${
                    selectedMessage.replied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  <i className={`fas ${selectedMessage.replied ? 'fa-check' : 'fa-reply'}`}></i>
                  {selectedMessage.replied ? 'Replied' : 'Reply'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this message?')) {
                      deleteMessage(selectedMessage.id);
                    }
                  }}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm flex items-center justify-center gap-1"
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;