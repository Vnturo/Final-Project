import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, ShoppingBag, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Use your Publishable Key here
const stripePromise = loadStripe('pk_test_51SlcYWCLODUQYR2AfmodBYwR5mUrYsszLmC2zW93TY03UmrGXCqu0kBHQMyUYMECiyebO3RQke4j367RFxPn84ki004gDt1Lr8'); // STRIPE PUBLIC KEY CHANGE TO YOUR OWN
const API_URL = "/api";

export default function ProductPage() {
  const { token } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [targetTime, setTargetTime] = useState(null);

  // STRIPE STATES
  const [clientSecret, setClientSecret] = useState('');
  const [lockedPrice, setLockedPrice] = useState(null);

  useEffect(() => {
    if (user && user.email) setEmail(user.email);
  }, [user]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/scan/${token}`);
      if (!res.ok) throw new Error("Expired");
      
      const json = await res.json();
      setData(json);

      // NEW TIMER LOGIC
      const isUpsellDeal = json.meta && json.meta.location === 'Post-Purchase Upsell';
      
      if (isUpsellDeal && json.pricing.expires_at) {
          // If it's a flash deal, count down to the token's death!
          setTargetTime(new Date(json.pricing.expires_at));
      } else if (json.pricing && json.pricing.next_drop_at) {
          // Otherwise, count down to the next price drop
          setTargetTime(new Date(json.pricing.next_drop_at));
      }
    } catch (err) {
      if (!data) {
          alert("Token Expired or Invalid");
          navigate('/catalog');
      }
    }
  };

  useEffect(() => { fetchProduct(); }, [token]);

  useEffect(() => {
      const intervalId = setInterval(() => { fetchProduct(); }, 10000); 
      return () => clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
      if (!data || !targetTime) return;

      const timerId = setInterval(() => {
          const now = new Date();
          const difference = targetTime - now; 
          const secondsRemaining = Math.ceil(difference / 1000);

          if (secondsRemaining <= 0) {
              clearInterval(timerId);
              setTimeout(() => fetchProduct(), 1000);
              setTimeLeft(0);
          } else {
              setTimeLeft(secondsRemaining);
          }
      }, 500);

      return () => clearInterval(timerId);
  }, [data, targetTime]); 

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleInitializePayment = async () => {
    if (!user && !email) {
        alert("Please enter an email address to receive your receipt.");
        return;
    }

    const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: data.product.id, token: token })
    });

    if (res.ok) {
        const intentData = await res.json();
        setClientSecret(intentData.clientSecret);
        setLockedPrice(intentData.lockedPrice);
    } else {
        const err = await res.json();
        alert(err.error || "Failed to initialize payment.");
    }
  };

  const handlePaymentSuccess = async () => {
    const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: data.product.id,
          token: token, 
          email: user ? user.email : email, 
          user_id: user ? user.id : null 
        })
    });
    
    if (res.ok) {
        navigate(`/success?product_id=${data.product.id}&is_upsell=${isUpsell}`);
    } else {
        const errData = await res.json();
        alert(`Order Failed: ${errData.error}. You will be refunded.`);
        fetchProduct(); 
    }
  };

  if (!data) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-emerald-500 font-black tracking-widest uppercase animate-pulse">Loading Drop...</div>
  );

  // UI FLAG FOR STYLING
  const isUpsell = data?.meta?.location === 'Post-Purchase Upsell';
  const isFloor = data?.pricing?.is_floor;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 md:p-4 font-sans selection:bg-emerald-500/30">
        <div className="w-full max-w-md bg-slate-800 md:rounded-[2.5rem] shadow-2xl overflow-y-auto overflow-x-hidden relative flex flex-col h-screen md:h-auto md:max-h-[95vh] border-0 md:border border-slate-700">
            
            {/* HEADER BUTTONS */}
            <div className="absolute top-0 left-0 w-full p-6 z-20 pointer-events-none flex justify-between items-center">
                
                {/* Back to Catalog */}
                <Link to="/catalog" className="text-slate-400 hover:text-white transition flex items-center gap-2 font-bold pointer-events-auto group drop-shadow-md">
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </Link>

            </div>

            {/* PRODUCT IMAGE AREA */}
            <div className="w-full bg-slate-200 relative shrink-0 flex justify-center items-center pt-24 pb-12 rounded-b-[2.5rem] shadow-inner">
                <img 
                    src={data.product.image_url?.startsWith('/') ? `http://localhost:5000${data.product.image_url}` : data.product.image_url} 
                    alt={data.product.name} 
                    className="object-contain max-h-[35vh] drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
                />
            </div>

            {/* PRODUCT DETAILS AREA */}
            <div className="flex-grow bg-slate-800 rounded-t-[2.5rem] -mt-8 relative z-10 flex flex-col px-6 md:px-8 pt-10 pb-6 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] border-t border-slate-700">
                
                <div className="text-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-tight mb-2 drop-shadow-sm">
                        {data.product.name}
                    </h1>
                    <div className="flex flex-col items-center justify-center -space-y-2 mt-2">
                        <span className="text-slate-500 text-lg font-bold line-through decoration-red-500/50 decoration-2 uppercase tracking-widest">
                            Base: £{data.pricing.original}
                        </span>
                        {/* MASSIVE PRICE DISPLAY */}
                        <span className="text-7xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            £{data.pricing.current}
                        </span>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <p className="text-sm font-medium text-slate-400 leading-relaxed px-2 line-clamp-3">
                        {data.product.description || "Limited time student deal. Grab this exclusive offer before the timer runs out."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {/* STOCK COUNTER */}
                    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border ${data.product.stock < 5 ? 'border-red-900/50' : 'border-slate-700'}`}>
                        <div className={`text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 ${data.product.stock < 5 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                           {data.product.stock < 5 ? <AlertCircle size={14}/> : <CheckCircle size={14}/>} Stock Level
                        </div>
                        <span className="text-3xl font-black text-white">{data.product.stock}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Remaining</span>
                    </div>

                    {/* DYNAMIC TIMER UI */}
                    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${isUpsell ? 'bg-orange-900/20 border-orange-700/50' : isFloor ? 'bg-blue-900/20 border-blue-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
                        <div className={`text-[9px] md:text-[10px] font-black mb-1 flex items-center gap-1 uppercase tracking-widest text-center ${isUpsell ? 'text-orange-400' : isFloor ? 'text-blue-400' : 'text-red-400'}`}>
                            <Clock size={12} className={!isFloor && !isUpsell ? "animate-pulse" : ""} /> 
                            {isUpsell ? 'Flash Ends In' : isFloor ? 'Lowest Price Ends' : 'Next Drop In'}
                        </div>
                        <span className={`text-3xl font-mono font-black ${isUpsell ? 'text-orange-400' : isFloor ? 'text-blue-400' : 'text-red-400'}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <div className={`w-3/4 h-1.5 rounded-full mt-2 overflow-hidden ${isUpsell ? 'bg-orange-900' : isFloor ? 'bg-blue-900' : 'bg-red-900'}`}>
                            <div className={`h-full transition-all duration-1000 ${isUpsell ? 'bg-orange-500' : isFloor ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${(timeLeft / 60) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* CHECKOUT SECTION */}
                <div className="mt-auto">
                    {!user && !clientSecret && (
                        <div className="mb-4 flex justify-center">
                            <input 
                                type="email" 
                                placeholder="Enter email for receipt" 
                                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-center text-white text-sm font-medium tracking-wide focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition placeholder-slate-500 shadow-inner" 
                                value={email}
                                onChange={e => setEmail(e.target.value)} 
                            />
                        </div>
                    )}

                    {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 mb-2">
                            <CheckoutForm 
                            onSuccess={handlePaymentSuccess} 
                            lockedPrice={lockedPrice} 
                            returnUrl={`${window.location.origin}/success?token=${token}&product_id=${data.product.id}&email=${email}&user_id=${user ? user.id : ''}&is_upsell=${isUpsell}`}
                            />
                        </div>
                    </Elements>
                    ) : (
                        /* BUY BUTTON */
                        <button 
                            onClick={handleInitializePayment} 
                            disabled={data.product.stock <= 0}
                            className="w-full bg-emerald-500 text-slate-900 py-6 rounded-2xl font-black text-2xl uppercase tracking-widest hover:bg-emerald-400 transition-all flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] hover:scale-[1.02] active:scale-95 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none disabled:transform-none"
                        >
                            {data.product.stock > 0 ? <>Buy Now <ShoppingBag size={24} className="animate-bounce" /></> : "SOLD OUT"}
                        </button>
                    )}

                    <div className="flex justify-center items-center gap-2 mt-5 text-slate-500">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Secure Stripe Checkout</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}