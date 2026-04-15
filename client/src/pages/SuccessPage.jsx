import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Home, ShoppingBag, Loader2, XCircle, ArrowRight, Zap } from 'lucide-react';

const API_URL = "/api";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('success'); 
  const [recommendations, setRecommendations] = useState([]); 
  const hasProcessed = useRef(false);

  // Handle Upsell Click
  const handleUpsellClick = async (productId) => {
      try {
          const res = await fetch(`${API_URL}/upsell/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product_id: productId })
          });
          
          if (res.ok) {
              const data = await res.json();
              navigate(`/scan/${data.token}`);
          }
      } catch (err) {
          console.error("Upsell jump failed", err);
      }
  };

  // Fetch Recommendations Function
  const fetchRecommendations = async (id) => {
      try {
          const safeId = id || 0; 
          const res = await fetch(`${API_URL}/recommendations/${safeId}`);
          if (res.ok) {
              const data = await res.json();
              setRecommendations(data);
          }
      } catch (err) {
          console.error("Failed to load recommendations");
      }
  };

  useEffect(() => {
    const redirectStatus = searchParams.get('redirect_status');
    const paymentIntent = searchParams.get('payment_intent');
    const token = searchParams.get('token');
    const productId = searchParams.get('product_id');
    const email = searchParams.get('email');
    const userId = searchParams.get('user_id');
    
    const isUpsellPurchase = searchParams.get('is_upsell') === 'true';

    if (redirectStatus === 'requires_payment_method' || redirectStatus === 'failed') {
        setPaymentStatus('failed');
        setIsProcessing(false);
        return; 
    }

    if (redirectStatus === 'succeeded' && token && productId && !hasProcessed.current) {
        hasProcessed.current = true; 
        
        const alreadyProcessed = localStorage.getItem(`paid_${paymentIntent}`);
        if (alreadyProcessed) {
             setIsProcessing(false);
             if (!isUpsellPurchase) fetchRecommendations(productId);
             return;
        }

        fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                token: token,
                email: email,
                user_id: userId || null
            })
        }).then(async (res) => {
            if (!res.ok) {
                const errData = await res.json();
                if (errData.error === "Out of Stock") {
                    setPaymentStatus('out_of_stock'); 
                } else {
                    setPaymentStatus('failed');
                }
                setIsProcessing(false);
                return;
            }

            localStorage.setItem(`paid_${paymentIntent}`, 'true'); 
            setPaymentStatus('success');
            setIsProcessing(false);
            
            if (!isUpsellPurchase) fetchRecommendations(productId);

        }).catch(err => {
            console.error("Failed to update stock:", err);
            setPaymentStatus('failed');
            setIsProcessing(false);
        });

    } else {
        setIsProcessing(false);
        if (!isUpsellPurchase) fetchRecommendations(productId); 
    }
  }, [searchParams]);

  if (isProcessing) {
      return (
          <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-8 text-center font-sans">
              <Loader2 size={64} className="animate-spin mb-6 text-emerald-500 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              <h1 className="text-3xl font-black text-white uppercase tracking-widest animate-pulse">Securing Drop...</h1>
              <p className="text-slate-400 mt-3 font-bold tracking-wider text-sm uppercase">Please don't close this page</p>
          </div>
      );
  }

  if (paymentStatus === 'out_of_stock') {
      return (
        <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-8 text-center font-sans">
            <div className="bg-slate-800 border border-orange-500/30 text-orange-500 p-8 rounded-full mb-8 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                <ShoppingBag size={64} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest text-white drop-shadow-sm">Too Slow!</h1>
            <p className="text-slate-400 text-sm md:text-base mb-10 max-w-md font-medium leading-relaxed">
                Someone beat you to the final item by mere milliseconds! Your payment was instantly canceled. You have not been charged.
            </p>
            <Link to="/catalog" className="w-full max-w-xs bg-orange-500 text-slate-900 py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                Find Another Drop
            </Link>
        </div>
      );
  }

  if (paymentStatus === 'failed') {
      return (
        <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-8 text-center font-sans">
            <div className="bg-slate-800 border border-red-500/30 text-red-500 p-8 rounded-full mb-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                <XCircle size={64} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest text-white drop-shadow-sm">Drop Failed</h1>
            <p className="text-slate-400 text-sm md:text-base mb-10 max-w-md font-medium leading-relaxed">
                Your payment was declined or canceled. Your stock was not reserved and you have not been charged.
            </p>
            <Link to={searchParams.get('token') ? `/scan/${searchParams.get('token')}` : '/catalog'} className="w-full max-w-xs bg-red-500 text-white py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                Try Again
            </Link>
        </div>
      );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center py-10 px-6 sm:px-8 font-sans overflow-x-hidden selection:bg-emerald-500/30">
      <br></br>
      <br></br>
      {/* SUCCESS CONFIRMATION BANNER */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center mb-12">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-full mb-6 shadow-[0_0_40px_rgba(52,211,153,0.15)] animate-pulse">
              <ShieldCheck size={56} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-widest mb-4 text-center leading-tight drop-shadow-sm">
              Drop<br/>Secured
          </h1>
          <p className="text-slate-400 text-base font-bold tracking-wide mb-8 text-center">
              A receipt has been dispatched to your email.
          </p>
          
          <div className="grid grid-cols-2 gap-4 w-full mt-4">
              <Link to="/" className="w-full bg-slate-200 text-slate-900 py-5 sm:py-6 rounded-2xl font-black text-sm md:text-base uppercase tracking-widest hover:bg-white transition flex items-center justify-center gap-2 shadow-xl active:scale-95 border-2 border-slate-300">
                  <Home size={20} className="shrink-0" /> Home
              </Link>
              <Link to="/" className="w-full bg-slate-200 text-slate-900 py-5 sm:py-6 rounded-2xl font-black text-sm md:text-base uppercase tracking-widest hover:bg-white transition flex items-center justify-center gap-2 shadow-xl active:scale-95 border-2 border-slate-300">
                  <ShoppingBag size={20} className="shrink-0" /> More Drops
              </Link>
          </div>
      </div>

      {/* FLASH DEALS */}
      {recommendations.length > 0 && (
          <div className="w-full max-w-md mt-4">
              
              <div className="flex items-center gap-4 mb-8">
                  <div className="h-[2px] bg-slate-700 flex-grow"></div>
                  <span className="font-black text-lg md:text-xl uppercase tracking-widest text-emerald-400 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                      <Zap size={20} className="animate-pulse text-emerald-300" /> VIP Flash Deals
                  </span>
                  <div className="h-[2px] bg-slate-700 flex-grow"></div>
              </div>

              <div className="flex flex-col gap-8 w-full">
                  {recommendations.map(item => (
                      <div key={item.id} className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center p-6 sm:p-8 hover:border-emerald-500 transition-all duration-300 group w-full">
                          
                          <div className="w-40 h-40 sm:w-48 sm:h-48 bg-slate-200 relative overflow-hidden rounded-2xl flex items-center justify-center border border-slate-600 mb-6 shadow-inner shrink-0 mx-auto">
                              <img 
                                  src={item.image_url?.startsWith('/') ? `http://localhost:5000${item.image_url}` : item.image_url} 
                                  alt={item.name} 
                                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" 
                              />
                          </div>
                          
                          <h3 className="font-black text-white text-xl sm:text-2xl uppercase tracking-wider leading-tight text-center mb-6 w-full px-2">
                              {item.name}
                          </h3>
                          
                          <div className="mt-auto flex flex-col w-full gap-3">
                              
                              <div className="text-emerald-400 font-black text-xs md:text-sm tracking-widest bg-emerald-900/30 px-4 py-3 rounded-xl border border-emerald-500/20 uppercase text-center flex items-center justify-center">
                                  Instant 40% Off
                              </div>
                              
                              <button 
                                  onClick={() => handleUpsellClick(item.id)} 
                                  className="w-full bg-slate-700 text-white text-sm md:text-base py-4 rounded-xl font-black uppercase flex justify-center items-center gap-2 hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-md active:scale-95 border border-slate-600 hover:border-emerald-400"
                              >
                                  Unlock Deal <ArrowRight size={18} />
                              </button>

                          </div>
                          
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
}