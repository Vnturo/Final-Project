import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ShoppingBag, CreditCard } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

export default function ProductPage() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/scan/${token}`);
      if (!res.ok) throw new Error("Expired");
      const json = await res.json();
      setData(json);
    } catch (err) {
      alert("Invalid or Expired Token");
      navigate('/');
    }
  };

  useEffect(() => {
    fetchProduct();
    const interval = setInterval(fetchProduct, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const handleBuy = async () => {
    const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: data.product.id,
          price_paid: data.pricing.current,
          email: email
        })
    });
    if (res.ok) navigate('/success');
    else alert("Out of Stock!");
  };

  if (!data) return <div className="p-8 text-center">Loading Algorithm...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl relative">
        <div className="h-64 bg-gray-200 relative">
            <img src={data.product.image_url} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 flex-1 flex flex-col">
            <h1 className="text-2xl font-bold mb-2">{data.product.name}</h1>
            
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-end mb-2">
                    <p className="text-4xl font-black text-red-600">£{data.pricing.current}</p>
                    <div className="text-right flex items-center gap-1 text-red-600 font-bold">
                        <Clock size={16} /> <span>{data.pricing.next_drop_in}s</span>
                    </div>
                </div>
                <div className="w-full bg-red-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full transition-all duration-1000 ease-linear" style={{ width: `${(data.pricing.next_drop_in / 60) * 100}%` }}></div>
                </div>
            </div>

            <div className="mt-auto space-y-4">
                <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" onChange={e => setEmail(e.target.value)} />
                <button onClick={handleBuy} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center gap-2">
                    <ShoppingBag /> Buy Now
                </button>
            </div>
        </div>
    </div>
  );
}