import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, Search } from 'lucide-react';

const API_URL = "/api";

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/catalog`)
      .then(async res => {
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || `HTTP error! status: ${res.status}`);
          }
          return res.json();
      })
      .then(data => setProducts(data))
      .catch(err => {
          console.error("Full fetch error:", err);
          alert(`Error fetching products: ${err.message}`);
      });
  }, []);

  const handleSimulateScan = async (productId) => {
    try {
        const res = await fetch(`${API_URL}/test/generate-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId })
        });
        const data = await res.json();
        navigate(`/scan/${data.token}`);
    } catch (err) {
        alert("Failed to generate token");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
        <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <Link to="/" className="text-slate-400 hover:text-white transition flex items-center gap-2 font-bold">
                    <ArrowLeft size={20} /> <span className="hidden sm:inline">Back</span>
                </Link>
                
                <h1 className="font-black tracking-widest uppercase text-emerald-400 text-xl md:text-2xl text-right animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                    Live Deal Radar
                </h1>
            </div>
            
            {/* Search Bar */}
            <div className="w-full flex justify-center mb-10 px-4 mt-2">
            <div className="relative w-[80%] sm:w-[75%] max-w-md group">
        
        <input 
            type="text" 
            placeholder=" Search active drops..." 
            className="w-full pl-14 pr-6 py-3.5 bg-slate-800/60 backdrop-blur-md border border-slate-600/50 rounded-full text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:bg-slate-800/80 placeholder-slate-400 font-bold tracking-wide text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        
    </div>
</div>
                
            <br></br>
            
            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(item => (
                        <div key={item.id} className="bg-slate-800 rounded-2xl shadow-xl border border-slate-600 flex flex-col overflow-hidden hover:border-slate-400 transition group">
                            
                            {/* Image Container */}
                            <div className="w-full aspect-square bg-slate-200 relative overflow-hidden">
                            <img 
                            src={item.image_url?.startsWith('/') ? `http://localhost:5000${item.image_url}` : item.image_url} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            alt={item.name} 
                            loading="lazy"
                            />
                            {/* Subtle gradient overlay to blend the image into the card */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none"></div>
                            </div>
                            
                            {/* DETAILS CONTAINER */}
                            <div className="flex-1 flex flex-col items-center text-center p-4">
                                <h3 className="font-black text-sm md:text-lg text-white uppercase tracking-wider leading-tight mb-1 line-clamp-2 drop-shadow-sm">
                                    {item.name}
                                </h3>
                                
                                {/* Lightened the slate color here so it doesn't fade into the background */}
                                <p className="text-xs md:text-sm font-bold text-slate-300 mb-4">
                                    Standard Price: £{item.base_price}
                                </p>
                                
                                {/* LOCATION BADGE */}
                                <div className="text-[10px] md:text-xs font-black text-emerald-300 mb-4 bg-emerald-900/60 border border-emerald-700/50 px-2 py-1.5 rounded-md w-full shadow-inner tracking-wide uppercase">
                                    📍 {['Student Union', 'Library', 'Campus Gym', 'Cafeteria'][item.id % 4]}
                                </div>          
                                
                                {/* Push button to the bottom */}
                                <div className="mt-auto w-full">
                                    <button 
                                        onClick={() => handleSimulateScan(item.id)}
                                        className="w-full bg-slate-100 text-slate-900 text-[10px] md:text-xs px-2 py-2.5 rounded-lg font-black uppercase flex justify-center items-center gap-1.5 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                                        title="For grading purposes only."
                                    >
                                        <QrCode size={14} className="shrink-0" /> 
                                        <span className="truncate">TEST: Simulate</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 md:col-span-3 text-center text-slate-400 font-bold uppercase tracking-widest py-12 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        No drops currently active.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}