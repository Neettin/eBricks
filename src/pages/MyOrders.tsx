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

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brick-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 text-sm mt-1">Your order history at a glance</p>
          </div>
          <Link 
            to="/" 
            className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg shadow hover:shadow-md transition-all"
          >
            ← Back Home
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brick-100 to-brick-200 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box-open text-2xl text-brick-400"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start your brick order journey today</p>
            <Link 
              to="/booking" 
              className="bg-gradient-to-r from-brick-700 to-brick-800 text-white px-6 py-3 rounded-lg font-bold inline-block hover:shadow-lg"
            >
              Place First Order
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Table Header - Adjusted column widths */}
            <div className="grid grid-cols-8 gap-4 px-6 py-4 bg-gradient-to-r from-brick-900 to-brick-800 text-white text-sm font-bold uppercase tracking-wider">
              <div className="col-span-2">Order Details</div>
              <div>Amount</div>
              <div>Qty</div>
              <div>Unit Price</div>
              <div>Brick Type</div>
              <div className="col-span-2">Location</div>
              <div>Status</div>
            </div>

            {/* Orders List */}
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const orderDate = order.createdAt?.toDate();
                const total = Number(order.totalAmount) || 0;
                const qty = Number(order.quantity) || 0;
                const unitPrice = qty > 0 ? (total / qty).toFixed(2) : "0.00";
                
                return (
                  <div key={order.id} className="grid grid-cols-8 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors">
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

                    {/* Status */}
                    <div className="flex items-center">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status?.toUpperCase() || 'PENDING'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Location Tooltip */}
        {hoveredLocation && (
          <div 
            className="fixed z-50 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl max-w-sm"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y + 10}px`,
            }}
          >
            <div className="font-bold text-xs text-gray-300 mb-1">Full Location:</div>
            <div className="whitespace-pre-wrap break-words">{hoveredLocation}</div>
            <div className="absolute w-3 h-3 bg-gray-900 transform rotate-45 -top-1 -left-1"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;