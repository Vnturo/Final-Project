import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, LogOut, Plus, Trash2, Save, Edit2, X, QrCode, ChevronLeft, ChevronRight, Users, Package, Shield, ShoppingBag, Clock, Receipt, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const API_URL = "/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory'); 
  const [stockList, setStockList] = useState([]);
  const [userList, setUserList] = useState([]);
  
  const [selectedUserOrders, setSelectedUserOrders] = useState(null); 
  const [viewingUserName, setViewingUserName] = useState(""); 
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [editingUserId, setEditingUserId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Make separate state for product form and user form to avoid confusion
  const [formProduct, setFormProduct] = useState({ 
      name: '', base_price: '', stock_quantity: '', image_url: '',
      decay_rate_percent: '', decay_interval_minutes: '', minimum_floor_price: '', flash_duration_minutes: '' 
  });
  const [imageFile, setImageFile] = useState(null);
  const [formUser, setFormUser] = useState({
      username: '', first_name: '', last_name: '', email: '', is_admin: 0, new_password: ''
  });

  const loadData = async () => {
      try {
        const resProd = await fetch(`${API_URL}/admin/products`);
        setStockList(await resProd.json());
        
        const resUser = await fetch(`${API_URL}/admin/users`);
        setUserList(await resUser.json());
      } catch (err) { console.error("Failed to load data"); }
  };

  useEffect(() => { loadData(); }, []);

  const viewUserOrders = async (user) => {
      try {
          const res = await fetch(`${API_URL}/orders/${user.id}`);
          const orders = await res.json();
          setViewingUserName(`${user.first_name} ${user.last_name}`);
          setSelectedUserOrders(orders); 
      } catch (err) {
          alert("Could not fetch orders.");
      }
  };

  const currentList = activeTab === 'inventory' ? stockList : userList;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = currentList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentList.length / itemsPerPage);

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  // Product Management Functions
  const parseProductPayload = (product) => ({
      ...product,
      base_price: parseFloat(product.base_price),
      stock_quantity: parseInt(product.stock_quantity, 10),
      decay_rate_percent: parseFloat(product.decay_rate_percent),
      decay_interval_minutes: parseFloat(product.decay_interval_minutes), 
      minimum_floor_price: parseFloat(product.minimum_floor_price),
      flash_duration_minutes: parseInt(product.flash_duration_minutes, 10) || 5
  });

  const handleAddProduct = async (e) => {
      e.preventDefault();
      try {
          // Created a FormData object to handle both text fields and the file upload
          const formData = new FormData();
          formData.append('name', formProduct.name);
          formData.append('base_price', formProduct.base_price);
          formData.append('stock_quantity', formProduct.stock_quantity);
          formData.append('decay_rate_percent', formProduct.decay_rate_percent || 0);
          formData.append('decay_interval_minutes', formProduct.decay_interval_minutes || 1);
          formData.append('minimum_floor_price', formProduct.minimum_floor_price || formProduct.base_price);
          formData.append('flash_duration_minutes', formProduct.flash_duration_minutes || 5);
          
          // Attached the physical file
          if (imageFile) {
              formData.append('image', imageFile); 
          }

          // Send to server
          const res = await fetch(`${API_URL}/admin/products`, { 
              method: 'POST', 
              body: formData 
          });

          if (res.ok) { 
              setShowAddForm(false); 
              setFormProduct({}); 
              setImageFile(null); // Reset the file
              loadData(); 
          } else {
              alert("Server rejected the product.");
          }
      } catch (err) { 
          alert("Failed to connect to server."); 
      }
  };

  const saveProductChanges = async (id) => {
      try {
          const res = await fetch(`${API_URL}/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parseProductPayload(formProduct)) });
          if (res.ok) { setEditingId(null); setFormProduct({}); loadData(); }
      } catch (err) { alert("Failed"); }
  };

  const handleDeleteProduct = async (id) => {
      if (confirm("Delete product?")) { await fetch(`${API_URL}/admin/products/${id}`, { method: 'DELETE' }); loadData(); }
  };

  const toggleVisibility = async (id, currentStatus) => {
    try {
        const res = await fetch(`${API_URL}/admin/products/${id}/toggle-visibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public: !currentStatus })
        });
        if (res.ok) loadData(); // Reload the table to show the new status
    } catch (err) { alert("Failed to toggle"); }
};

  const startEditingProduct = (item) => { setEditingId(item.id); setFormProduct({ ...item }); };

  const saveUserChanges = async (id) => {
      try {
          const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formUser) });
          if (res.ok) { alert("User Updated"); setEditingUserId(null); setFormUser({}); loadData(); }
      } catch (err) { alert("Failed"); }
  };

  const handleDeleteUser = async (id) => {
    if (confirm("Delete User?")) { await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE' }); loadData(); }
  };

  const startEditingUser = (user) => { setEditingUserId(user.id); setFormUser({ ...user, new_password: '' }); };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans relative">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                <Link to="/" className="text-slate-400 hover:text-white transition flex items-center gap-2 font-bold">
                <ArrowLeft size={20} /> <span className="hidden sm:inline">Back</span>
            </Link>
                    <BarChart2 className="text-blue-500" /> Admin Dashboard
                </h1>
                <p className="text-gray-400 mt-1">Manage Products & Users</p>
            </div>
            
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-700 pb-1">
            <button onClick={() => { setActiveTab('inventory'); setCurrentPage(1); }} className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition ${activeTab === 'inventory' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>
                <Package size={20} /> Inventory
            </button>
            <button onClick={() => { setActiveTab('users'); setCurrentPage(1); }} className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition ${activeTab === 'users' ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}>
                <Users size={20} /> User Management
            </button>
        </div>

        {activeTab === 'inventory' && (
            <>
                <div className="mb-6">
                    {!showAddForm ? (
                        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold"><Plus size={18} /> Add Product</button>
                    ) : (
                        <form onSubmit={handleAddProduct} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 space-y-4 shadow-lg animate-in fade-in zoom-in duration-300">
                             <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg text-blue-400">Add New Product</h3><button type="button" onClick={() => setShowAddForm(false)} className="text-sm text-gray-400 hover:text-white"><X size={18}/></button></div>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Name" className="p-3 bg-gray-700 rounded text-white border border-gray-600 outline-none" onChange={e => setFormProduct({...formProduct, name: e.target.value})} required />
                                <input placeholder="Price" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 outline-none" onChange={e => setFormProduct({...formProduct, base_price: e.target.value})} required />
                                <input placeholder="Stock" type="number" className="p-3 bg-gray-700 rounded text-white border border-gray-600 outline-none" onChange={e => setFormProduct({...formProduct, stock_quantity: e.target.value})} required />
                                <input type="file" accept="image/*" className="p-3 bg-gray-700 rounded text-gray-400 border border-gray-600 outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition" onChange={e => setImageFile(e.target.files[0])} required />
                            </div>
                            <div className="grid grid-cols-4 gap-4 mt-2">
                                <input placeholder="Decay % (e.g. 5)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 outline-none" onChange={e => setFormProduct({...formProduct, decay_rate_percent: e.target.value})} />
                                <input placeholder="Interval (Mins)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 outline-none" onChange={e => setFormProduct({...formProduct, decay_interval_minutes: e.target.value})} />
                                <input placeholder="Min Price (£)" type="number" step="0.01" className="p-3 bg-gray-700 rounded text-white border border-gray-600 outline-none" onChange={e => setFormProduct({...formProduct, minimum_floor_price: e.target.value})} />
                                <input placeholder="Flash Time (Mins)" type="number" className="p-3 bg-gray-700 rounded text-white border border-orange-500/50 outline-none" onChange={e => setFormProduct({...formProduct, flash_duration_minutes: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold mt-4">Save Product</button>
                        </form>
                    )}
                </div>

                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl overflow-x-auto">
                    <table className="w-full text-left min-w-[1300px]">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Image</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4">Decay %</th>
                                <th className="p-4">Interval (Min)</th>
                                <th className="p-4">Min Price</th>
                                <th className="p-4 text-orange-400">Flash Time</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {currentItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-700/50 transition">
                                    <td className="p-4 text-gray-500 font-mono text-xs">#{item.id}</td>
                                    
                                    <td className="p-4">{editingId === item.id ? <input className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-white text-xs" defaultValue={item.image_url} onChange={(e) => setFormProduct({...formProduct, image_url: e.target.value})} /> : <div className="w-[50px] h-[50px] bg-gray-700 rounded-lg overflow-hidden shrink-0 border border-gray-600"><img src={item.image_url?.startsWith('/') ? `http://localhost:5000${item.image_url}` : item.image_url} alt="" className="w-full h-full object-cover" /></div>}</td>
                                    
                                    <td className="p-4 font-bold text-white">{editingId === item.id ? <input className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.name} onChange={(e) => setFormProduct({...formProduct, name: e.target.value})} /> : item.name}</td>
                                    
                                    <td className="p-4 text-gray-300">{editingId === item.id ? <input type="number" step="0.01" className="w-20 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.base_price} onChange={(e) => setFormProduct({...formProduct, base_price: e.target.value})} /> : `£${item.base_price}`}</td>
                                    
                                    <td className="p-4">{editingId === item.id ? <input type="number" className="w-16 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.stock_quantity} onChange={(e) => setFormProduct({...formProduct, stock_quantity: e.target.value})} /> : item.stock_quantity}</td>

                                    <td className="p-4 text-gray-400 text-sm">
                                        {editingId === item.id ? <input type="number" step="0.01" className="w-16 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.decay_rate_percent} onChange={(e) => setFormProduct({...formProduct, decay_rate_percent: e.target.value})} /> : `${item.decay_rate_percent}%`}
                                    </td>
                                    
                                    <td className="p-4 text-gray-400 text-sm">
                                        {editingId === item.id ? <input type="number" step="0.01" className="w-16 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.decay_interval_minutes} onChange={(e) => setFormProduct({...formProduct, decay_interval_minutes: e.target.value})} /> : `${item.decay_interval_minutes}m`}
                                    </td>
                                    
                                    <td className="p-4 text-gray-400 text-sm font-bold">
                                        {editingId === item.id ? <input type="number" step="0.01" className="w-20 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={item.minimum_floor_price} onChange={(e) => setFormProduct({...formProduct, minimum_floor_price: e.target.value})} /> : `£${item.minimum_floor_price}`}
                                    </td>

                                    {/* NEW EDITABLE COLUMN FOR FLASH DEAL TIME */}
                                    <td className="p-4 text-orange-400 text-sm font-bold bg-orange-900/10">
                                        {editingId === item.id ? <input type="number" className="w-16 p-1 bg-gray-900 border border-orange-600 rounded text-white" defaultValue={item.flash_duration_minutes || 5} onChange={(e) => setFormProduct({...formProduct, flash_duration_minutes: e.target.value})} /> : `${item.flash_duration_minutes || 5}m`}
                                    </td>

                                    <td className="p-4 text-right flex justify-end gap-2">
                                    {editingId === item.id ? (
                                    <><button onClick={() => saveProductChanges(item.id)} className="text-green-400 p-2 hover:bg-green-400/10 rounded"><Save size={18}/></button><button onClick={() => setEditingId(null)} className="text-gray-400 p-2 hover:bg-gray-400/10 rounded"><X size={18}/></button></>
                                    ) : (
                                    <>
                                    <button 
                                    onClick={() => toggleVisibility(item.id, item.is_public)} 
                                    className={`p-2 rounded transition ${item.is_public ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-600 hover:bg-gray-600/10'}`}
                                    title={item.is_public ? "Visible on Radar" : "Hidden from Radar"}>
                                    {item.is_public ? <Eye size={18}/> : <EyeOff size={18}/>}
                                    </button>
            
                                    <Link to={`/admin/poster/${item.id}`} target="_blank" className="text-purple-400 p-2 hover:bg-purple-400/10 rounded"><QrCode size={18}/></Link>
                                    <button onClick={() => startEditingProduct(item)} className="text-blue-400 p-2 hover:bg-blue-400/10 rounded"><Edit2 size={18}/></button>
                                    <button onClick={() => handleDeleteProduct(item.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded"><Trash2 size={18}/></button>
        </>
    )}
</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                        <tr><th className="p-4">ID</th><th className="p-4">Username</th><th className="p-4">Full Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Set Password</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {currentItems.map((usr) => (
                            <tr key={usr.id} className="hover:bg-gray-700/50 transition">
                                <td className="p-4 text-gray-500 font-mono text-xs">#{usr.id}</td>
                                <td className="p-4 font-bold text-white">{editingUserId === usr.id ? <input className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={usr.username} onChange={(e) => setFormUser({...formUser, username: e.target.value})} /> : usr.username}</td>
                                <td className="p-4 text-gray-300">{editingUserId === usr.id ? <div className="flex gap-1"><input className="w-24 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={usr.first_name} onChange={(e) => setFormUser({...formUser, first_name: e.target.value})} /><input className="w-24 p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={usr.last_name} onChange={(e) => setFormUser({...formUser, last_name: e.target.value})} /></div> : `${usr.first_name} ${usr.last_name}`}</td>
                                <td className="p-4 text-gray-300">{editingUserId === usr.id ? <input className="w-full p-1 bg-gray-900 border border-gray-600 rounded text-white" defaultValue={usr.email} onChange={(e) => setFormUser({...formUser, email: e.target.value})} /> : usr.email}</td>
                                <td className="p-4">{editingUserId === usr.id ? <select className="bg-gray-900 text-white p-1 rounded border border-gray-600" defaultValue={usr.is_admin} onChange={(e) => setFormUser({...formUser, is_admin: e.target.value})}><option value="0">Student</option><option value="1">Admin</option></select> : (usr.is_admin === 1 ? <span className="text-purple-400 font-bold text-xs">Admin</span> : <span className="text-gray-500 text-xs">Student</span>)}</td>
                                <td className="p-4">{editingUserId === usr.id ? <input type="text" placeholder="New Pass" className="w-full p-1 bg-gray-900 border border-red-900/50 rounded text-red-100" onChange={(e) => setFormUser({...formUser, new_password: e.target.value})} /> : <span className="text-gray-600 text-xs">••••</span>}</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {editingUserId === usr.id ? (
                                        <><button onClick={() => saveUserChanges(usr.id)} className="text-green-400 p-2"><Save size={18}/></button><button onClick={() => setEditingUserId(null)} className="text-gray-400 p-2"><X size={18}/></button></>
                                    ) : (
                                        <>
                                            <button onClick={() => viewUserOrders(usr)} className="text-yellow-400 hover:text-yellow-300 p-2 rounded hover:bg-yellow-500/10 transition" title="View Orders"><ShoppingBag size={18}/></button>
                                            <button onClick={() => startEditingUser(usr)} className="text-blue-400 p-2"><Edit2 size={18}/></button>
                                            <button onClick={() => handleDeleteUser(usr.id)} className="text-red-500 p-2"><Trash2 size={18}/></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* PAGINATION */}
        <div className="p-4 flex justify-between items-center bg-gray-900 border-t border-gray-800 mt-4 rounded-xl">
            <span className="text-sm text-gray-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages > 0 ? totalPages : 1}</span></span>
            <div className="flex gap-2"><button onClick={prevPage} disabled={currentPage === 1} className="p-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50 text-white"><ChevronLeft size={20} /></button><button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0} className="p-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50 text-white"><ChevronRight size={20} /></button></div>
        </div>

      </div>

      {/* ORDER HISTORY MODAL */}
      {selectedUserOrders && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <ShoppingBag className="text-yellow-400" /> Order History
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Customer: <span className="text-white font-bold">{viewingUserName}</span></p>
                    </div>
                    <button onClick={() => setSelectedUserOrders(null)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {selectedUserOrders.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No orders found for this user.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-400 uppercase">Total Orders</p>
                                    <p className="text-2xl font-bold text-white">{selectedUserOrders.length}</p>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-400 uppercase">Total Spent</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        £{selectedUserOrders.reduce((sum, o) => sum + parseFloat(o.final_price_paid), 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {selectedUserOrders.map((order) => (
                                <div key={order.id} className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700 hover:bg-gray-800 transition">
                                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={order.image_url} alt="" className="w-full h-full object-contain p-1" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-white">{order.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <Clock size={12} /> {new Date(order.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-400 text-lg">£{order.final_price_paid}</p>
                                        <span className="text-[10px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded uppercase tracking-wider">Paid</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}