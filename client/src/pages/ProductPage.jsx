import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, ShoppingBag, ArrowLeft, User, Tag, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = "http://localhost:5000/api";

export default function ProductPage() {
  const { token } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(0); 

  useEffect(() => {
    if (user && user.email) setEmail(user.email);
  }, [user]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/scan/${token}`);
      if (!res.ok) throw new Error("Expired");
      
      const json = await res.json();
      setData(json);

      if (json.pricing && json.pricing.next_drop_in) {
          setTimeLeft(Math.floor(json.pricing.next_drop_in));
      }
    } catch (err) {
      alert("Token Expired or Invalid");
      navigate('/catalog');
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [token]);

  useEffect(() => {
      if (!data || timeLeft <= 0) return;

      const timerId = setInterval(() => {
          setTimeLeft((prevSeconds) => {
              if (prevSeconds <= 1) {
                  clearInterval(timerId);
                  setTimeout(() => {
                      fetchProduct();
                  }, 1500);
                  return 0;
              }
              return prevSeconds - 1; 
          });
      }, 1000);

      return () => clearInterval(timerId);
  }, [data, timeLeft]); 

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleBuy = async () => {
    if (!user && !email) {
        alert("Please enter an email address to receive your receipt.");
        return;
    }

    const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: data.product.id,
          price_paid: data.pricing.current,
          email: email, 
          user_id: user ? user.id : null 
        })
    });

    if (res.ok) navigate('/success');
    else alert("Purchase Failed (Out of Stock?)");
  };

  if (!data) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
          Loading Deal...
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            
            {/* MOBILE OPTIMIZED IMAGE */}
            {/* h-72 (288px) is the sweet spot for phones. w-full fills width. */}
            <div className="h-72 w-full bg-gray-200 relative shrink-0">
                <img 
                    src={data.product.image_url} 
                    className="w-full h-full object-cover" 
                    alt={data.product.name} 
                />
                <Link to="/catalog" className="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded-full text-black hover:bg-white transition shadow-sm z-10">
                    <ArrowLeft size={18}/>
                </Link>
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm z-10">
                   <Tag size={12}/> {data.meta?.location || "Campus Store"}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-6 flex flex-col flex-grow overflow-y-auto">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{data.product.name}</h1>
                    <div className="text-right">
                        <p className="text-gray-400 text-xs line-through">£{data.pricing.original}</p>
                        <p className="text-xl font-bold text-gray-900">£{data.pricing.current}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-green-600 font-bold mb-4">
                    <CheckCircle size={14} /> 
                    <span>{data.product.stock} in stock</span>
                </div>
                
                {/* Timer Box */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 shadow-inner relative overflow-hidden shrink-0">
                    <div className="flex justify-between items-center mb-2 relative z-10">
                        <div>
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Price Drops In</p>
                            <p className="text-3xl font-mono font-black text-red-600 tracking-tighter">
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                        <div className="text-right">
                            <Clock size={24} className="text-red-200 animate-pulse" /> 
                        </div>
                    </div>
                    <div className="w-full bg-red-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-red-600 h-full transition-all duration-1000 ease-linear" 
                            style={{ width: `${(timeLeft / 60) * 100}%` }} 
                        ></div>
                    </div>
                </div>

                {/* Checkout Section (Always at bottom) */}
                <div className="mt-auto space-y-3 pt-2">
                    {user ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-800 rounded-xl text-xs font-medium">
                            <User size={16} />
                            <span>Logged in as <b>{user.firstName}</b></span>
                        </div>
                    ) : (
                        <input 
                            type="email" 
                            placeholder="Email for receipt..." 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition" 
                            value={email}
                            onChange={e => setEmail(e.target.value)} 
                        />
                    )}

                    <button 
                        onClick={handleBuy} 
                        className="w-full bg-black text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex justify-center items-center gap-2 shadow-lg"
                    >
                        <ShoppingBag size={20} /> Buy Now
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}