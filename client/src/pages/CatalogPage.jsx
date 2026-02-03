import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Home, ArrowLeft, Search } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Added State for Search
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/admin/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => alert("Backend Error"));
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

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <ArrowLeft size={20} /> Back
                </Link>
                <h1 className="font-bold text-xl">Live Catalog</h1>
            </div>

            {/* Search Bar (New Feature) */}
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Product List */}
            <div className="space-y-4">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 transition hover:shadow-md">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">Base Price: £{item.base_price}</p>
                                <button 
                                    onClick={() => handleSimulateScan(item.id)}
                                    className="bg-black text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition"
                                >
                                    <QrCode size={14} /> Simulate Scan
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-8">
                        No products found.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}