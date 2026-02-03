import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Home, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = "http://localhost:5000/api";

export default function OrdersPage() {
  const { user } = useAuth(); // Get logged in user
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if we have a user
    if (user && user.id) {
        fetch(`${API_URL}/orders/${user.id}`)
          .then(res => res.json())
          .then(data => {
              setOrders(data);
              setLoading(false);
          })
          .catch(err => {
              console.error("Failed to load orders", err);
              setLoading(false);
          });
    } else {
        setLoading(false);
    }
  }, [user]);

  // If not logged in
  if (!user) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
              <p className="text-gray-500 mb-4">Please log in to view your orders.</p>
              <Link to="/" className="text-blue-600 font-bold hover:underline">Go to Login</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link to="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition">
                    <ArrowLeft size={20} /> Back
                </Link>
                <h1 className="font-bold text-2xl flex items-center gap-2">
                    <Package className="text-blue-600" /> My Orders
                </h1>
            </div>

            {/* Loading State */}
            {loading && <div className="text-center py-8 text-gray-400">Loading history...</div>}

            {/* Empty State */}
            {!loading && orders.length === 0 && (
                <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="text-gray-400" size={32} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven't snagged any deals yet.</p>
                    <Link to="/catalog" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-bold">
                        Browse Store
                    </Link>
                </div>
            )}

            {/* Order List */}
            <div className="h-40 w-full object-cover">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-5 items-center transition hover:shadow-md">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={order.image_url} alt={order.name} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Order Details */}
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg text-gray-900">{order.name}</h3>
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    #{order.id}
                                </span>
                            </div>
                            
                            <div className="text-sm text-gray-500 flex items-center gap-4 mb-2">
                                <span className="flex items-center gap-1">
                                    <Clock size={14}/> {new Date(order.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg text-sm">
                                    Paid: £{order.final_price_paid}
                                </span>
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    ● Completed
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}