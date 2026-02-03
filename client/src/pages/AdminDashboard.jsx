import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, LogOut, Plus, Trash2, Save, Edit2, X, Lock, QrCode } from 'lucide-react'; 

const API_URL = "http://localhost:5000/api";

export default function AdminDashboard() {
  // --- STATE MANAGEMENT ---
  const [stockList, setStockList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  
  // Form State
  const [formProduct, setFormProduct] = useState({ 
      name: '', base_price: '', stock_quantity: '', image_url: '',
      decay_rate_percent: '', decay_interval_minutes: '', minimum_floor_price: '' 
  });

  // --- API HELPERS ---
  const loadAdmin = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/products`);
        const data = await res.json();
        setStockList(data);
      } catch (err) {
        console.error("Failed to load inventory");
      }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const parseProductPayload = (product) => {
      return {
          ...product,
          base_price: parseFloat(product.base_price),
          stock_quantity: parseInt(product.stock_quantity, 10),
          decay_rate_percent: parseFloat(product.decay_rate_percent),
          decay_interval_minutes: parseFloat(product.decay_interval_minutes), 
          minimum_floor_price: parseFloat(product.minimum_floor_price)
      };
  };

  // --- ACTIONS ---

  const handleAddProduct = async (e) => {
      e.preventDefault();
      try {
          const payload = parseProductPayload(formProduct);
          const res = await fetch(`${API_URL}/admin/products`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (res.ok) {
              alert("Product Added!");
              setShowAddForm(false);
              setFormProduct({ name: '', base_price: '', stock_quantity: '', image_url: '', decay_rate_percent: '', decay_interval_minutes: '', minimum_floor_price: '' });
              loadAdmin(); 
          } else {
              const err = await res.json();
              alert(err.error);
          }
      } catch (err) { alert("Failed to add product"); }
  };

  const handleDeleteProduct = async (id) => {
      if (!confirm("Are you sure? This cannot be undone.")) return;
      try {
          const res = await fetch(`${API_URL}/admin/products/${id}`, { method: 'DELETE' });
          if (res.ok) loadAdmin();
      } catch (err) { alert("Delete failed"); }
  };

  const startEditing = (item) => {
      setEditingId(item.id);
      setFormProduct({
          name: item.name,
          base_price: item.base_price,
          stock_quantity: item.stock_quantity,
          image_url: item.image_url,
          decay_rate_percent: item.decay_rate_percent,
          decay_interval_minutes: item.decay_interval_minutes,
          minimum_floor_price: item.minimum_floor_price
      });
  };

  const saveProductChanges = async (id) => {
      try {
          const payload = parseProductPayload(formProduct);
          const res = await fetch(`${API_URL}/admin/products/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (res.ok) {
              alert("Updated Successfully");
              setEditingId(null);
              setFormProduct({});
              loadAdmin();
          } else {
              const err = await res.json();
              alert(err.error);
          }
      } catch (err) { alert("Update failed"); }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
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
                <LogOut size={16} /> Exit
            </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider">Total Products</h3>
                <p className="text-3xl font-bold mt-2">{stockList.length}</p>
            </div>
        </div>

        {/* ADD PRODUCT FORM */}
        <div className="mb-6">
            {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold">
                    <Plus size={18} /> Add New Product
                </button>
            ) : (
                <form onSubmit={handleAddProduct} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 space-y-4 shadow-lg animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-blue-400">Add New Product</h3>
                        <button type="button" onClick={() => setShowAddForm(false)} className="text-sm text-gray-400 hover:text-white"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Name" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, name: e.target.value})} required />
                        <input placeholder="Price (£)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, base_price: e.target.value})} required />
                        <input placeholder="Stock" type="number" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, stock_quantity: e.target.value})} required />
                        <input placeholder="Image URL" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, image_url: e.target.value})} required />
                    </div>
                    <h4 className="text-sm text-gray-400 uppercase font-bold mt-2">Pricing Algorithm Settings</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <input placeholder="Decay % (e.g. 5)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, decay_rate_percent: e.target.value})} />
                        <input placeholder="Interval (Mins)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, decay_interval_minutes: e.target.value})} />
                        <input placeholder="Min Price (£)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none" onChange={e => setFormProduct({...formProduct, minimum_floor_price: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold shadow-lg">Save Product</button>
                </form>
            )}
        </div>

        {/* INVENTORY TABLE */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                    <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Image</th>
                        <th className="p-4">Product Name</th>
                        <th className="p-4">Price (£)</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Algorithm Rules</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {stockList.map((item) => {
                        const isEditing = editingId === item.id;
                        return (
                            <tr key={item.id} className="hover:bg-gray-700/50 transition">
                                <td className="p-4 text-gray-500 font-mono text-xs">#{item.id}</td>
                                
                                {/* IMAGE COLUMN */}
                                <td className="p-4">
                                    {isEditing ? (
                                        <input 
                                            className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-white text-xs" 
                                            placeholder="Image URL"
                                            defaultValue={item.image_url}
                                            onChange={(e) => setFormProduct({...formProduct, image_url: e.target.value})}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden">
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </td>

                                {/* NAME COLUMN */}
                                <td className="p-4 font-bold text-white min-w-[150px]">
                                    {isEditing ? (
                                        <input 
                                            className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-white" 
                                            defaultValue={item.name}
                                            onChange={(e) => setFormProduct({...formProduct, name: e.target.value})}
                                        />
                                    ) : item.name}
                                </td>

                                {/* PRICE COLUMN */}
                                <td className="p-4 text-gray-300">
                                    {isEditing ? (
                                        <input 
                                            type="number" step="0.01"
                                            className="w-20 p-1 bg-gray-900 border border-gray-600 rounded text-white" 
                                            defaultValue={item.base_price}
                                            onChange={(e) => setFormProduct({...formProduct, base_price: e.target.value})}
                                        />
                                    ) : `£${item.base_price}`}
                                </td>

                                {/* STOCK COLUMN */}
                                <td className="p-4">
                                    {isEditing ? (
                                        <input 
                                            type="number" 
                                            className="w-16 p-1 bg-gray-900 border border-gray-600 rounded text-white" 
                                            defaultValue={item.stock_quantity}
                                            onChange={(e) => setFormProduct({...formProduct, stock_quantity: e.target.value})}
                                        />
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.stock_quantity < 5 ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                                            {item.stock_quantity}
                                        </span>
                                    )}
                                </td>

                                {/* ALGORITHM RULES */}
                                <td className="p-4 text-xs text-blue-300 min-w-[200px]">
                                    {isEditing ? (
                                        <div className="flex gap-1">
                                            <input placeholder="%" type="number" step="0.01" className="w-12 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.decay_rate_percent} onChange={(e) => setFormProduct({...formProduct, decay_rate_percent: e.target.value})} />
                                            <input placeholder="Mins" type="number" step="0.01" className="w-12 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.decay_interval_minutes} onChange={(e) => setFormProduct({...formProduct, decay_interval_minutes: e.target.value})} />
                                            <input placeholder="£Min" type="number" step="0.01" className="w-12 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.minimum_floor_price} onChange={(e) => setFormProduct({...formProduct, minimum_floor_price: e.target.value})} />
                                        </div>
                                    ) : (
                                        <span>
                                            Drops {item.decay_rate_percent}% every {(item.decay_interval_minutes * 60).toFixed(0)}s (Min: £{item.minimum_floor_price})
                                        </span>
                                    )}
                                </td>

                                {/* ACTIONS COLUMN - FIXED */}
<td className="p-4 text-right flex justify-end gap-2">
    {isEditing ? (
        /* 1. EDIT MODE: Show Save & Cancel */
        <>
            <button 
                onClick={() => saveProductChanges(item.id)} 
                className="text-green-400 hover:text-green-300 p-2 rounded hover:bg-green-500/10 transition" 
                title="Save"
            >
                <Save size={18} />
            </button>
            <button 
                onClick={() => {setEditingId(null); setFormProduct({});}} 
                className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 transition" 
                title="Cancel"
            >
                <X size={18} />
            </button>
        </>
    ) : (
        /* 2. VIEW MODE: Show Poster Link, Edit, & Delete */
        <>
            {/* NEW: THIS OPENS THE POSTER PAGE */}
            <Link 
                to={`/admin/poster/${item.id}`} 
                target="_blank"
                className="text-purple-400 hover:text-purple-300 p-2 rounded hover:bg-purple-500/10 transition" 
                title="Open Poster"
            >
                <QrCode size={18} />
            </Link>
            
            <button 
                onClick={() => startEditing(item)} 
                className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-blue-500/10 transition" 
                title="Edit"
            >
                <Edit2 size={18} />
            </button>
            <button 
                onClick={() => handleDeleteProduct(item.id)} 
                className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition" 
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </>
    )}
</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}