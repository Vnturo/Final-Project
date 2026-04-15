import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = "/api";

export default function OrdersPage() {
  const { user } = useAuth(); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  // UNAUTHORIZED STATE
  if (!user) {
      return (
          <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-8 text-center font-sans">
              <ShieldCheck size={64} className="text-slate-600 mb-6" />
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-widest mb-4">Access Denied</h1>
              <p className="text-slate-400 font-bold tracking-wider text-sm uppercase mb-8">Please log in to view your secured drops.</p>
              <Link to="/" className="bg-emerald-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95">
                  Go to Login
              </Link>
          </div>
      );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center py-10 px-4 md:px-8 font-sans overflow-x-hidden selection:bg-emerald-500/30">
        
        <div className="w-full max-w-3xl">
            
            {/* HEADER */}
            <div className="flex items-center justify-between pt-2">
                            <Link to="/" className="text-slate-400 hover:text-white transition flex items-center gap-2 font-bold">
                                <ArrowLeft size={20} /> <span className="hidden sm:inline">Back</span>
                            </Link>
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-widest flex items-center gap-3 drop-shadow-sm">
                    <Package className="text-emerald-400" size={32} /> Secured Drops
                </h1>
            </div>

            {/* LOADING STATE */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Zap size={48} className="animate-pulse text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                    <p className="text-slate-400 font-bold tracking-widest text-sm uppercase animate-pulse">Retrieving History...</p>
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && orders.length === 0 && (
                <div className="bg-slate-800 p-10 md:p-16 rounded-3xl text-center shadow-2xl border border-slate-700 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
                        <Package className="text-slate-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">No Drops Yet</h2>
                    <p className="text-slate-400 font-medium mb-10 max-w-sm leading-relaxed">
                        Your vault is empty. You haven't snagged any exclusive student deals yet.
                    </p>
                    <Link to="/catalog" className="w-full sm:w-auto bg-emerald-500 text-slate-900 px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95 flex items-center justify-center gap-2">
                        Hunt For Drops
                    </Link>
                </div>
            )}

            {/* ORDER LIST */}
            <div className="flex flex-col gap-6 w-full">
                {orders.map((order) => (
                    <div key={order.id} className="bg-slate-800 p-4 md:p-5 rounded-3xl shadow-xl border border-slate-700 flex flex-col sm:flex-row gap-5 md:gap-6 items-center sm:items-stretch hover:border-emerald-500/50 transition-colors group">
                        
                        {/* UNIFORM PRODUCT IMAGE */}
                        {/* Constrained to a perfect square max 500x500 */}
                        <div className="w-full sm:w-36 md:w-48 aspect-square max-w-[500px] max-h-[500px] bg-slate-200 rounded-2xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-600 shadow-inner mx-auto sm:mx-0">
                            <img 
                                src={order.image_url?.startsWith('/') ? `http://localhost:5000${order.image_url}` : order.image_url} 
                                alt={order.name} 
                                className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" 
                            />
                        </div>
                        
                        {/* ORDER DETAILS */}
                        <div className="flex-1 flex flex-col justify-center w-full min-w-0">
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-wider leading-tight truncate">
                                    {order.name}
                                </h3>
                                {/* Order ID Badge */}
                                <span className="w-fit text-[14px] md:text-xs font-black tracking-widest text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg uppercase shrink-0">
                                    ORDER #{order.id}
                                </span>
                            </div>
                            
                            {/* Date */}
                            <div className="text-xs md:text-sm text-slate-400 font-bold flex items-center gap-2 mb-6 uppercase tracking-wider">
                                <Clock size={16} className="text-slate-500"/> 
                                {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>

                            {/* Status & Price Row pushed to bottom */}
                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700 w-full">
                                <span className="text-emerald-400 font-black text-xl md:text-2xl tracking-tighter drop-shadow-sm">
                                    £{order.final_price_paid}
                                </span>
                                
                                <span className="text-[14px] md:text-xs text-emerald-400 font-black tracking-widest uppercase flex items-center gap-2 bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 
                                    Secured
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