import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Package, LogOut, Plus } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

export default function AdminDashboard() {
  const [stockList, setStockList] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/admin/products`)
      .then(res => res.json())
      .then(data => setStockList(data))
      .catch(err => console.error("Failed to load inventory"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BarChart2 className="text-blue-500" />
                    Live Inventory
                </h1>
                <p className="text-gray-400 mt-1">Real-time database monitoring</p>
            </div>
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                <LogOut size={16} /> Logout
            </Link>
        </div>

        {/* Stats Row (Optional Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider">Total Products</h3>
                <p className="text-3xl font-bold mt-2">{stockList.length}</p>
            </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                <h2 className="font-bold text-white">Product Database</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition">
                    <Plus size={14} /> Add Product
                </button>
            </div>
            <table className="w-full text-left">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                    <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Product Name</th>
                        <th className="p-4">Base Price</th>
                        <th className="p-4">Stock Level</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {stockList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-700/50 transition">
                            <td className="p-4 text-gray-500 font-mono text-xs">#{item.id}</td>
                            <td className="p-4 font-bold flex items-center gap-3 text-white">
                                <div className="w-8 h-8 bg-gray-700 rounded-md overflow-hidden">
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                {item.name}
                            </td>
                            <td className="p-4 text-gray-300">£{item.base_price}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.stock_quantity < 10 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                    {item.stock_quantity} units
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="text-xs text-green-400">● Active</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}