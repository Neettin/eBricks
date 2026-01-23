import React, { useState, useEffect, useRef } from 'react';


import {db} from '../services/firebaseConfig'; 

// Firestore methods
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';

// Auth methods
import { onAuthStateChanged } from 'firebase/auth';
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    phone: '',
    quantity: 0,
    brickType: '',
    location: '',
    totalAmount: 0,
  });
  const hasPrompted = useRef(false);

  useEffect(() => {
    if (hasPrompted.current) return;
    hasPrompted.current = true;

    const sessionAuth = sessionStorage.getItem('adminAuth');
    if (sessionAuth === 'true') {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    const password = prompt("Enter Admin Password:");
    if (password === "admin@123") {
      setIsAuthorized(true);
      setIsLoading(false);
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      alert("Unauthorized!");
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(data);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  // Inside AdminDashboard.tsx
  const savedAuth = localStorage.getItem('adminAuth'); // Persistent check
  // CRUD: Update Status
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, "orders", id), { status: newStatus });
  };

  // CRUD: Delete Order
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this order permanently?")) {
      await deleteDoc(doc(db, "orders", id));
    }
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
      });
      setEditingOrder(null);
      alert('Order updated successfully!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthorized(false);
    window.location.href = "/";
  };

  // Simple Stats Calculation
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

  // Helper to parse location
  const parseLocation = (location: string) => {
    // Check if location contains coordinates
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

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brick-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">Authenticating...</p>
      </div>
    </div>
  );
  
  if (!isAuthorized) return null;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage all customer orders efficiently</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-brick-800 text-heritage-gold rounded-lg hover:bg-brick-900 transition-colors font-semibold"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout Admin
          </button>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">Rs. {totalRevenue.toLocaleString()}</p>
              </div>
              <i className="fas fa-wallet text-2xl text-green-500"></i>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              From {deliveredOrders} delivered orders
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Bricks to Supply</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalBricks.toLocaleString()}</p>
              </div>
              <i className="fas fa-cubes text-2xl text-blue-500"></i>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Across {orders.length - cancelledOrders} active orders
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Active Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
              </div>
              <i className="fas fa-clipboard-list text-2xl text-purple-500"></i>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">{pendingOrders} Pending</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{confirmedOrders} Confirmed</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-semibold">Order Status</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{deliveredOrders} Delivered</p>
              </div>
              <i className="fas fa-check-circle text-2xl text-orange-500"></i>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {cancelledOrders} cancelled orders
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
              <p className="text-sm text-gray-600 mt-1">Total {orders.length} orders • Updated in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                <i className="fas fa-sync-alt mr-2 text-green-500"></i>
                Live Updates
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="p-5 text-sm font-semibold uppercase">CUSTOMER DETAILS</th>
                  <th className="p-5 text-sm font-semibold uppercase">ORDER INFORMATION</th>
                  <th className="p-5 text-sm font-semibold uppercase">AMOUNT</th>
                  <th className="p-5 text-sm font-semibold uppercase">STATUS</th>
                  <th className="p-5 text-sm font-semibold uppercase">ACTIONS</th>
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
                    <td className="p-5 align-top">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-base truncate">
                            {order.customerName || order.name || 'No Name'}
                          </div>
                          <div className="text-sm text-blue-600 font-medium mt-1">
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
                    <td className="p-5 align-top">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-gray-800">
                              {order.quantity.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Units</div>
                          </div>
                          <div className="bg-gradient-to-r from-brick-600 to-brick-800 text-white px-3 py-1.5 rounded-lg">
                            <div className="text-sm font-bold">{order.brickType}</div>
                          </div>
                        </div>
                        
                        {/* Per Unit Price */}
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <div className="text-sm text-gray-600 flex justify-between items-center">
                            <span>Per Unit:</span>
                            <span className="font-bold text-green-600">Rs. {perUnitPrice}</span>
                          </div>
                        </div>
                        
                        {/* Location Section */}
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-start gap-2">
                            <div className="text-green-600 mt-0.5">
                              <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 text-sm truncate">
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
                    <td className="p-5 align-top">
                      <div className="text-3xl font-bold text-green-600">
                        Rs. {order.totalAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="space-y-3">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className={`w-full border rounded-lg p-2.5 text-sm font-bold
                            ${order.status === 'pending' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : ''}
                            ${order.status === 'confirmed' ? 'bg-blue-50 border-blue-300 text-blue-800' : ''}
                            ${order.status === 'delivered' ? 'bg-green-50 border-green-300 text-green-800' : ''}
                            ${order.status === 'cancelled' ? 'bg-red-50 border-red-300 text-red-800' : ''}
                          `}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="delivered">🚚 Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                        
                        <div className={`text-center text-xs px-2 py-1.5 rounded-full
                          ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {order.status.toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleEdit(order)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Edit Order"
                        >
                          <i className="fas fa-edit"></i>
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete Order"
                        >
                          <i className="fas fa-trash"></i>
                          <span className="text-sm font-medium">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && (
            <div className="text-center py-16">
              <i className="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h3>
              <p className="text-gray-500">All orders will appear here</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h3 className="text-2xl font-bold text-gray-800">Edit Order</h3>
                <p className="text-gray-600">Update order details</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brick Type
                    </label>
                    <select
                      value={editForm.brickType}
                      onChange={(e) => setEditForm({...editForm, brickType: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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