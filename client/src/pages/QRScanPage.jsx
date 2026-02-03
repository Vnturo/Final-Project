import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from "react-qr-code";

const API_URL = "http://localhost:5000/api";

export default function QRScanPage() {
    const { productId } = useParams();
    const [qrData, setQrData] = useState(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-500">Loading...</div>;
    if (!qrData || !product) return <div className="min-h-screen flex items-center justify-center text-red-500">Error Loading Poster</div>;

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            
            {/* POSTER CARD */}
            <div className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                
                {/* LEFT: Product Image (Strict 500px Limit) */}
                <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-6">
                    <img 
                        src={product.image_url} 
                        alt="Product" 
                        // STRICT CONSTRAINT: Never wider or taller than 500px
                        className="w-auto h-auto max-w-[500px] max-h-[500px] object-contain shadow-lg rounded-lg bg-white"
                    />
                </div>

                {/* RIGHT: QR Code */}
                <div className="md:w-1/2 bg-white flex flex-col items-center justify-center p-10 text-center border-l border-gray-100">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-lg text-blue-600 font-medium mb-8">Scan for Student Discount</p>

                    <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-blue-50 mb-6 transform hover:scale-105 transition duration-300">
                        <QRCode value={qrData.scanUrl} size={200} />
                    </div>
                    
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                        Scan Now
                    </h2>
                    
                    {/* Debug Link */}
                    <a 
                        href={qrData.scanUrl} 
                        target="_blank"
                        rel="noreferrer"
                        className="mt-8 text-xs text-gray-300 hover:text-blue-500 transition underline"
                    >
                        (Click to test)
                    </a>
                </div>
            </div>
        </div>
    );
}