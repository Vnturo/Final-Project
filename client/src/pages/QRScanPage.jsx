import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from "react-qr-code";
import { Play, Pause, ExternalLink } from 'lucide-react'; 

const API_URL = "/api";

export default function QRScanPage() {
    const { productId } = useParams();
    const [qrData, setQrData] = useState(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(true);

    // Initial Generator
    useEffect(() => {
        const generatePoster = async () => {
            try {
                const genRes = await fetch(`${API_URL}/admin/generate-qr`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId, location_tag: "Digital_Poster_Wall" })
                });
                const genJson = await genRes.json();
                
                if (genJson.success) {
                    setQrData(genJson);
                    const prodRes = await fetch(`${API_URL}/scan/${genJson.token}`);
                    const prodJson = await prodRes.json();
                    setProduct(prodJson.product);
                }
            } catch (err) {
                console.error("Poster Error:", err);
            } finally {
                setLoading(false);
            }
        };
        generatePoster();
    }, [productId]);

    // Toggle Session Function
    const toggleSession = async () => {
        const newState = !isActive;
        try {
            await fetch(`${API_URL}/admin/toggle-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: qrData.token, is_active: newState })
            });
            setIsActive(newState);
        } catch (err) {
            alert("Failed to toggle session");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-emerald-500 font-black tracking-widest uppercase animate-pulse">Initializing Drop...</div>;
    if (!qrData || !product) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-500 font-black tracking-widest uppercase">Error Loading Poster</div>;

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 font-sans">
            
            {/* POSTER CARD */}
            <div className={`max-w-5xl w-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col md:flex-row transition-all duration-700 ${isActive ? 'opacity-100 drop-shadow-[0_0_30px_rgba(52,211,153,0.15)]' : 'opacity-90 grayscale-[30%]'}`}>
                
                {/* LEFT: Product Image */}
                <div className="md:w-1/2 bg-slate-200 flex items-center justify-center p-8 relative overflow-hidden">
                    <img 
                        src={product.image_url?.startsWith('/') ? `http://localhost:5000${product.image_url}` : product.image_url} 
                        alt={product.name} 
                        className="w-full h-full max-h-[450px] object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                    />
                    {/* Paused Overlay */}
                    {!isActive && (
                        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-md z-10">
                            <h2 className="text-red-500 font-black text-4xl md:text-5xl uppercase tracking-widest border-4 border-red-500 p-4 transform -rotate-12 shadow-2xl bg-slate-900/50">
                                PAUSED
                            </h2>
                        </div>
                    )}
                </div>

                {/* RIGHT: QR Code & Info */}
                <div className="md:w-1/2 bg-slate-800 flex flex-col items-center justify-center p-8 md:p-12 text-center border-t md:border-t-0 md:border-l border-slate-700 relative">
                    
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase tracking-wider leading-tight drop-shadow-sm">
                        {product.name}
                    </h1>
                    
                    <p className={`text-sm md:text-base font-black mb-8 uppercase tracking-widest ${isActive ? 'text-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-slate-500'}`}>
                        {isActive ? "Scan for Active Drop" : "Drop Suspended"}
                    </p>

                    {/* QR Code Container - white for camera scanners */}
                    <div className={`bg-white p-5 rounded-2xl shadow-xl border-4 ${isActive ? 'border-emerald-500/30' : 'border-slate-600'} mb-6 transform transition duration-500`}>
                        <div className={isActive ? "" : "blur-md pointer-events-none opacity-30"}>
                            <QRCode value={qrData.scanUrl} size={200} level="H" />
                        </div>
                    </div>
                    
                    {/* TEST LINK */}
                    <a 
                        href={qrData.scanUrl} 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition py-3 px-6 rounded-xl hover:bg-slate-700 mb-8 border border-transparent hover:border-slate-600 shadow-sm"
                        title="Click to open student view"
                    >
                        <ExternalLink size={16} /> Test Student View
                    </a>

                    {/* ADMIN CONTROL BUTTON */}
                    <div className="w-full pt-6 border-t border-slate-700 mt-auto">
                        <button 
                            onClick={toggleSession}
                            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md transition-all transform active:scale-95 ${
                                isActive 
                                ? "bg-slate-900 text-red-500 hover:bg-red-500 hover:text-white border border-red-900/50" 
                                : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-pulse"
                            }`}
                        >
                            {isActive ? (
                                <><Pause size={18} /> Suspend Drop</>
                            ) : (
                                <><Play size={18} /> Resume Drop</>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}