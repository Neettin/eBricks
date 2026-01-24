import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  createdAt: any;
  location: string;
  brickType: string;
  quantity: number;
}

// CSS animation styles
const slideUpAnimation = `
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}
`;

// Add CSS to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = slideUpAnimation;
  document.head.appendChild(style);
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mobileLocationPopup, setMobileLocationPopup] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLocationHover = (e: React.MouseEvent, location: string) => {
    setHoveredLocation(location);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMobileLocationClick = (e: React.MouseEvent | React.TouchEvent, location: string) => {
    // For touch events, prevent default behavior
    if ('touches' in e) {
      e.preventDefault();
    }
    
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    
    setMobileLocationPopup(location);
    setTooltipPosition({ x: clientX, y: clientY });
  };

  const closeMobilePopup = () => {
    setMobileLocationPopup(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brick-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 text-xs md:text-sm mt-1">Your order history at a glance</p>
          </div>
          <Link 
            to="/" 
            className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg shadow hover:shadow-md transition-all text-sm md:text-base"
          >
            ← Back Home
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl md:rounded-2xl shadow p-8 md:p-12 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-brick-100 to-brick-200 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box-open text-xl md:text-2xl text-brick-400"></i>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-500 text-sm md:text-base mb-6">Start your brick order journey today</p>
            <Link 
              to="/booking" 
              className="bg-gradient-to-r from-brick-700 to-brick-800 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-bold inline-block hover:shadow-lg text-sm md:text-base"
            >
              Place First Order
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-8 gap-4 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-brick-900 to-brick-800 text-white text-xs md:text-sm font-bold uppercase tracking-wider">
              <div className="col-span-2">Order Details</div>
              <div>Amount</div>
              <div>Qty</div>
              <div>Unit Price</div>
              <div>Brick Type</div>
              <div className="col-span-2">Location</div>
              <div>Status</div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden px-4 py-3 bg-gradient-to-r from-brick-900 to-brick-800 text-white">
              <h3 className="text-sm font-bold">My Orders ({orders.length})</h3>
            </div>

            {/* Orders List */}
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const orderDate = order.createdAt?.toDate();
                const total = Number(order.totalAmount) || 0;
                const qty = Number(order.quantity) || 0;
                const unitPrice = qty > 0 ? (total / qty).toFixed(2) : "0.00";
                
                return (
                  <React.Fragment key={order.id}>
                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-8 gap-4 px-4 md:px-6 py-4 md:py-5 hover:bg-gray-50 transition-colors">
                      {/* Order Details - Span 2 columns */}
                      <div className="col-span-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brick-600 to-brick-800 text-white flex items-center justify-center text-xs font-bold">
                            B
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">Order #{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">
                              {orderDate ? orderDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex flex-col justify-center">
                        <p className="text-lg font-bold text-brick-900">Rs. {total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>

                      {/* Quantity */}
                      <div className="flex flex-col justify-center">
                        <p className="text-lg font-bold text-gray-900">{qty.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Units</p>
                      </div>

                      {/* Unit Price */}
                      <div className="flex flex-col justify-center">
                        <p className="text-md font-bold text-green-600">Rs. {unitPrice}</p>
                        <p className="text-xs text-gray-500">Per unit</p>
                      </div>

                      {/* Brick Type */}
                      <div className="flex items-center">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-brick-50 to-brick-100 text-brick-800 rounded-lg text-sm font-bold whitespace-nowrap">
                          {order.brickType || 'Standard'}
                        </div>
                      </div>

                      {/* Location - Span 2 columns with better visibility */}
                      <div className="col-span-2 min-w-0 relative group">
                        <div 
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onMouseEnter={(e) => handleLocationHover(e, order.location || 'No location')}
                          onMouseLeave={() => setHoveredLocation(null)}
                        >
                          <div className="text-brick-600">
                            <i className="fas fa-map-marker-alt"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800 line-clamp-2" style={{ WebkitLineClamp: 2 }}>
                              {order.location || 'Location not specified'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <i className="fas fa-truck"></i>
                              <span>Delivery address</span>
                            </div>
                          </div>
                          <i className="fas fa-info-circle text-gray-400 text-xs ml-2"></i>
                        </div>
                      </div>

                      {/* Status - Updated with on_the_way */}
                      <div className="flex items-center">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'on_the_way' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'on_the_way' ? 'ON THE WAY' : order.status?.toUpperCase() || 'PENDING'}
                        </div>
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden p-4 hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <div className="space-y-4">
                        {/* Header Row */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brick-600 to-brick-800 text-white flex items-center justify-center text-sm font-bold">
                              B
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-gray-500">
                                {orderDate ? orderDate.toLocaleDateString('en-US', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'on_the_way' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'on_the_way' ? 'ON THE WAY' : order.status?.toUpperCase() || 'PENDING'}
                          </div>
                        </div>

                        {/* Brick Type and Location */}
                        <div className="flex items-center justify-between">
                          <div className="px-3 py-1.5 bg-gradient-to-r from-brick-50 to-brick-100 text-brick-800 rounded-lg text-sm font-bold">
                            {order.brickType || 'Standard'}
                          </div>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-blue-600 text-sm active:opacity-70"
                            onClick={(e) => handleMobileLocationClick(e, order.location || 'No location')}
                            onTouchStart={(e) => handleMobileLocationClick(e, order.location || 'No location')}
                          >
                            <i className="fas fa-map-marker-alt text-xs"></i>
                            <span>View Location</span>
                          </button>
                        </div>

                        {/* Quantity and Amount Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="text-lg font-bold text-gray-900">{qty.toLocaleString()} Units</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-lg font-bold text-brick-900">Rs. {total.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-600">Unit Price</p>
                              <p className="text-md font-bold text-green-600">Rs. {unitPrice}</p>
                            </div>
                            {order.status === 'on_the_way' && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <i className="fas fa-truck-moving"></i>
                                <span className="text-xs font-bold">On the way!</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Message for Mobile */}
                        {order.status === 'on_the_way' && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 animate-pulse">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-truck text-orange-600"></i>
                              <div>
                                <p className="text-sm font-bold text-orange-800">Bricks are on the way!</p>
                                <p className="text-xs text-orange-700">Will reach in few minutes</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Desktop Location Tooltip */}
        {hoveredLocation && (
          <div 
            className="hidden md:block fixed z-50 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl max-w-xs md:max-w-sm"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y + 10}px`,
            }}
          >
            <div className="font-bold text-xs text-gray-300 mb-1">Full Location:</div>
            <div className="whitespace-pre-wrap break-words text-xs md:text-sm">{hoveredLocation}</div>
            <div className="absolute w-3 h-3 bg-gray-900 transform rotate-45 -top-1 -left-1"></div>
          </div>
        )}

        {/* Mobile Location Popup */}
        {mobileLocationPopup && (
          <>
            {/* Overlay */}
            <div 
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeMobilePopup}
            />
            
            {/* Popup */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slideUp">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Delivery Location</h3>
                  <button 
                    onClick={closeMobilePopup}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                {/* Content */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Full Delivery Address:</p>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg text-sm">
                        {mobileLocationPopup}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <i className="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                      <p className="text-xs text-yellow-800">
                        This is the exact location where your bricks will be delivered. Make sure the area is accessible for trucks.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={closeMobilePopup}
                  className="w-full py-3 bg-gradient-to-r from-brick-700 to-brick-800 text-white font-bold rounded-lg active:scale-95 transition-transform"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;