import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebaseConfig'; 

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

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
  const hasCheckedAuth = useRef(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const sessionAuth = sessionStorage.getItem('adminAuth');
    if (sessionAuth === 'true') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // Show custom password modal instead of browser prompt
    setShowPasswordModal(true);
    setIsLoading(false);
  }, []);

  // Focus password input when modal opens
  useEffect(() => {
    if (showPasswordModal && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [showPasswordModal]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordInput === "admin@123") {
      setIsAuthorized(true);
      setShowPasswordModal(false);
      sessionStorage.setItem('adminAuth', 'true');
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPasswordInput('');
      passwordInputRef.current?.focus();
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (!isAuthorized) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(data);
      setLastUpdate(new Date());
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // CRUD: Update Status
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, "orders", id), { status: newStatus });
  };

  // CRUD: Delete Order with custom confirmation
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ show: true, orderId: id });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.orderId) {
      try {
        await deleteDoc(doc(db, "orders", deleteConfirm.orderId));
        setDeleteConfirm({ show: false, orderId: null });
      } catch (error) {
        console.error('Error deleting order:', error);
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
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthorized(false);
    window.location.href = "/";
  };

  // Simple Stats Calculation - Updated to include "on the way"
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const totalBricks = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const onTheWayOrders = orders.filter(o => o.status === 'on_the_way').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

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

  // Password Modal
  if (showPasswordModal) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-brick-900 to-brick-800 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-brick-700 to-brick-900 p-6 md:p-8 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-3xl md:text-4xl text-brick-800"></i>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Admin Access</h2>
            <p className="text-heritage-gold text-sm md:text-base">Enter password to continue</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="p-6 md:p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Admin Password
              </label>
              <input
                ref={passwordInputRef}
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                className="w-full p-3 md:p-4 border-2 rounded-xl focus:ring-2 focus:ring-brick-500 focus:border-brick-500 text-base md:text-lg"
                placeholder="Enter password"
                autoComplete="off"
              />
              {passwordError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <i className="fas fa-exclamation-circle"></i>
                  <span className="text-sm font-medium">{passwordError}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePasswordCancel}
                className="flex-1 px-4 py-3 md:px-6 md:py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-brick-700 to-brick-900 text-white rounded-xl hover:from-brick-800 hover:to-brick-950 transition-all font-semibold shadow-lg text-sm md:text-base"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Access
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-brick-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-base md:text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    </div>
  );
  
  if (!isAuthorized) return null;

  return (
    <div className="p-3 md:p-6 lg:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Logout - Mobile Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage all customer orders efficiently</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-brick-800 text-heritage-gold rounded-lg hover:bg-brick-900 transition-colors font-semibold text-sm md:text-base w-full md:w-auto justify-center"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        {/* Enhanced Stats Grid - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-l-4 border-green-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Total Revenue</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">Rs. {totalRevenue.toLocaleString()}</p>
              </div>
              <i className="fas fa-wallet text-lg md:text-xl lg:text-2xl text-green-500"></i>
            </div>
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
              From {deliveredOrders} delivered orders
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-l-4 border-blue-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Bricks to Supply</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{totalBricks.toLocaleString()}</p>
              </div>
              <i className="fas fa-cubes text-lg md:text-xl lg:text-2xl text-blue-500"></i>
            </div>
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
              Across {orders.length - cancelledOrders} active orders
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-l-4 border-purple-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Active Orders</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
              </div>
              <i className="fas fa-clipboard-list text-lg md:text-xl lg:text-2xl text-purple-500"></i>
            </div>
            <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">{pendingOrders} Pending</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{confirmedOrders} Confirmed</span>
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">{onTheWayOrders} On Way</span>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-l-4 border-orange-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">On the Way</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{onTheWayOrders}</p>
              </div>
              <i className="fas fa-truck text-lg md:text-xl lg:text-2xl text-orange-500"></i>
            </div>
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
              Bricks being delivered
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-l-4 border-red-500 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 font-semibold">Delivered</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{deliveredOrders}</p>
              </div>
              <i className="fas fa-check-circle text-lg md:text-xl lg:text-2xl text-red-500"></i>
            </div>
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
              {cancelledOrders} cancelled orders
            </div>
          </div>
        </div>

        {/* Orders Table - Mobile Responsive */}
        <div className="bg-white shadow-xl rounded-xl md:rounded-3xl overflow-hidden">
          <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
            <div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Order Management</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Total {orders.length} orders • Updated in real-time</p>
            </div>
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <div className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2 py-1 md:px-3 md:py-1.5 rounded-lg flex items-center gap-1 md:gap-2">
                <div className="relative">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
                <span>Live • {formatLastUpdate()}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                title="Refresh orders"
              >
                <i className={`fas fa-sync-alt text-xs md:text-sm ${isRefreshing ? 'animate-spin' : ''}`}></i>
                <span className="text-xs md:text-sm font-medium">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
            </div>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="p-4 md:p-5 text-xs md:text-sm font-semibold uppercase">CUSTOMER DETAILS</th>
                  <th className="p-4 md:p-5 text-xs md:text-sm font-semibold uppercase">ORDER INFORMATION</th>
                  <th className="p-4 md:p-5 text-xs md:text-sm font-semibold uppercase">AMOUNT</th>
                  <th className="p-4 md:p-5 text-xs md:text-sm font-semibold uppercase">STATUS</th>
                  <th className="p-4 md:p-5 text-xs md:text-sm font-semibold uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => {
                  const locationInfo = parseLocation(order.location);
                  const perUnitPrice = order.quantity > 0 
                    ? (order.totalAmount / order.quantity).toFixed(2)
                    : '0.00';
                  
                  return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 md:p-5 align-top">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user text-sm md:text-base"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-sm md:text-base truncate">
                            {order.customerName || order.name || 'No Name'}
                          </div>
                          <div className="text-xs md:text-sm text-blue-600 font-medium mt-1">
                            <i className="fas fa-phone-alt mr-1"></i>
                            {order.phone}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-calendar"></i>
                              <span>{order.createdAt?.toDate().toLocaleDateString('en-NP')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <i className="fas fa-clock"></i>
                              <span>{order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 align-top">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xl md:text-2xl font-bold text-gray-800">
                              {order.quantity.toLocaleString()}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">Units</div>
                          </div>
                          <div className="bg-gradient-to-r from-brick-600 to-brick-800 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg">
                            <div className="text-xs md:text-sm font-bold">{order.brickType}</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="text-xs md:text-sm text-gray-600 flex justify-between items-center">
                            <span>Per Unit:</span>
                            <span className="font-bold text-green-600">Rs. {perUnitPrice}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-2 md:p-3 rounded-lg border">
                          <div className="flex items-start gap-2">
                            <div className="text-green-600 mt-0.5">
                              <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 text-xs md:text-sm truncate">
                                {locationInfo.display}
                              </div>
                              {locationInfo.hasCoords && (
                                <div className="mt-1">
                                  <div className="text-xs text-gray-600 truncate">
                                    Coordinates: {locationInfo.fullCoords}
                                  </div>
                                  <a 
                                    href={`https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-0.5"
                                  >
                                    <i className="fas fa-external-link-alt text-xs"></i>
                                    View on Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 align-top">
                      <div className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                        Rs. {order.totalAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 md:p-5 align-top">
                      <div className="space-y-3">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className={`w-full border rounded-lg p-2 md:p-2.5 text-xs md:text-sm font-bold
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
                        
                        <div className={`text-center text-xs px-2 py-1.5 rounded-full
                          ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'on_the_way' ? 'bg-orange-100 text-orange-800' : ''}
                          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {order.status === 'on_the_way' ? 'ON THE WAY' : order.status.toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 align-top">
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleEdit(order)}
                          className="w-full flex items-center justify-center gap-1 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm"
                          title="Edit Order"
                        >
                          <i className="fas fa-edit text-xs md:text-sm"></i>
                          <span className="font-medium">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(order.id)}
                          className="w-full flex items-center justify-center gap-1 md:gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm"
                          title="Delete Order"
                        >
                          <i className="fas fa-trash text-xs md:text-sm"></i>
                          <span className="font-medium">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards View */}
          <div className="md:hidden">
            {orders.map(order => {
              const locationInfo = parseLocation(order.location);
              const perUnitPrice = order.quantity > 0 
                ? (order.totalAmount / order.quantity).toFixed(2)
                : '0.00';
              
              return (
                <div key={order.id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="space-y-4">
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
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'on_the_way' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'on_the_way' ? 'ON THE WAY' : order.status.toUpperCase()}
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="text-lg font-bold text-gray-800">{order.quantity.toLocaleString()} Units</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Brick Type</p>
                        <p className="text-lg font-bold text-brick-800">{order.brickType}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <div className="text-green-600 mt-0.5">
                          <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">
                            {locationInfo.display}
                          </div>
                          {locationInfo.hasCoords && (
                            <a 
                              href={`https://www.google.com/maps?q=${locationInfo.lat},${locationInfo.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1"
                            >
                              <i className="fas fa-external-link-alt text-xs"></i>
                              View on Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-xl font-bold text-green-600">Rs. {order.totalAmount?.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Unit Price</p>
                        <p className="text-lg font-bold text-gray-800">Rs. {perUnitPrice}</p>
                      </div>
                    </div>

                    {/* Status Selector and Actions */}
                    <div className="space-y-3">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className={`w-full border rounded-lg p-3 text-sm font-bold
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

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(order)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <i className="fas fa-edit"></i>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(order.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <i className="fas fa-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {orders.length === 0 && (
            <div className="text-center py-12 md:py-16">
              <i className="fas fa-clipboard-list text-4xl md:text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h3>
              <p className="text-gray-500 text-sm md:text-base">All orders will appear here</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal - Mobile Responsive */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md mx-4">
              <div className="p-5 md:p-6 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-2xl md:text-3xl text-red-600"></i>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Delete Order?</h3>
                <p className="text-gray-600 text-sm md:text-base">Are you sure you want to delete this order? This action cannot be undone.</p>
              </div>
              
              <div className="p-5 md:p-6 border-t flex gap-3 md:gap-4">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm md:text-base"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Mobile Responsive */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md my-4 max-h-[90vh] overflow-y-auto">
              <div className="p-5 md:p-6 border-b">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">Edit Order</h3>
                <p className="text-gray-600 text-sm md:text-base">Update order details</p>
              </div>
              
              <div className="p-5 md:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brick Type
                    </label>
                    <select
                      value={editForm.brickType}
                      onChange={(e) => setEditForm({...editForm, brickType: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  />
                </div>

                {/* Status field in edit form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="on_the_way">🚚 On the Way</option>
                    <option value="delivered">📦 Delivered</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="p-5 md:p-6 border-t flex justify-end gap-3 md:gap-4">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2.5 md:px-6 md:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className="px-4 py-2.5 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm md:text-base"
                >
                  Update Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;