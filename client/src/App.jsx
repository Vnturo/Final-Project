import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, MapPin, CreditCard, BarChart2, ShieldCheck, ArrowRight, Package, QrCode, Home, User, LogIn, LogOut } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

export default function App() {
  // Navigation State
  const [view, setView] = useState('landing'); // landing, login, register, catalog, product, success, admin, orders
  
  // App Data State
  const [activeToken, setActiveToken] = useState(null);
  const [productData, setProductData] = useState(null);
  const [stockList, setStockList] = useState([]);
  
  // Auth State (Persist login across refreshes)
  const [user, setUser] = useState(() => {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
  });

  // Form State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', first_name: '', last_name: '', email: '', password: '' });
  const [checkoutEmail, setCheckoutEmail] = useState('');

  // --- VALIDATION HELPER ---
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  // --- AUTH ACTIONS ---

  const handleLogin = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation
    if (!loginForm.email || !loginForm.password) {
        return alert("Please fill in all fields.");
    }
    if (!validateEmail(loginForm.email)) {
        return alert("Please enter a valid email address.");
    }

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginForm)
        });
        const data = await res.json();
        
        if (res.ok) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(`Welcome back, ${data.user.firstName}!`);
            
            // Redirect based on role
            if (data.user.isAdmin) {
                loadCatalog(); // Admin might want to see products first
                setView('admin');
            } else {
                setView('catalog');
            }
        } else {
            alert(data.error || "Login Failed");
        }
    } catch (err) { alert("Network Error"); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation & Sanitization
    if (!regForm.username || !regForm.first_name || !regForm.last_name || !regForm.email || !regForm.password) {
        return alert("All fields are required.");
    }
    if (!validateEmail(regForm.email)) {
        return alert("Invalid email format.");
    }
    if (regForm.password.length < 6) {
        return alert("Password must be at least 6 characters long.");
    }
    // Basic Sanitization (Trim whitespace)
    const cleanForm = {
        username: regForm.username.trim(),
        first_name: regForm.first_name.trim(),
        last_name: regForm.last_name.trim(),
        email: regForm.email.trim(),
        password: regForm.password 
    };

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanForm)
        });
        
        if (res.ok) {
            alert("Account Created! Please Login.");
            setView('login');
        } else {
            const data = await res.json();
            alert(data.error || "Registration Failed");
        }
    } catch (err) { alert("Network Error"); }
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
      setView('landing');
  };

  // --- DATA ACTIONS ---

  const loadCatalog = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/products`);
      const data = await res.json();
      setStockList(data);
      setView('catalog');
    } catch (err) { alert("Failed to load catalog. Is Backend running?"); }
  };

  const loadOrders = async () => {
      if (!user) return alert("Please Login First");
      try {
          const res = await fetch(`${API_URL}/orders/${user.id}`);
          const data = await res.json();
          setStockList(data); // Reuse stockList state for order list to save memory
          setView('orders');
      } catch (err) { alert("Failed to load orders"); }
  };

  const loadAdmin = async () => {
      if (!user || !user.isAdmin) return alert("Access Denied: Admins Only");
      const res = await fetch(`${API_URL}/admin/products`);
      const data = await res.json();
      setStockList(data);
      setView('admin');
  };

  // --- SCAN & BUY ACTIONS ---

  const handleTestScan = async (productId) => {
    const res = await fetch(`${API_URL}/test/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
    });
    const data = await res.json();
    handleScan(data.token);
  };

  const handleScan = async (token) => {
    setActiveToken(token);
    await fetchProduct(token);
    setView('product');
  };

  const fetchProduct = async (token) => {
    try {
        const res = await fetch(`${API_URL}/scan/${token}`);
        if (!res.ok) throw new Error("Invalid Token");
        const data = await res.json();
        setProductData(data);
    } catch (err) { alert("Invalid or Expired Token"); }
  };

  useEffect(() => {
    let interval;
    if (view === 'product' && activeToken) {
      interval = setInterval(() => { fetchProduct(activeToken); }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, activeToken]);

  const handleBuy = async () => {
    // Validate guest email if not logged in
    if (!user && !validateEmail(checkoutEmail)) {
        return alert("Please enter a valid email for your receipt.");
    }

    const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productData.product.id,
          price_paid: productData.pricing.current,
          email: user ? user.email : checkoutEmail, // Use logged-in email or guest email
          user_id: user ? user.id : null            // Link order to user if logged in
        })
    });
    
    if (res.ok) setView('success');
    else {
        const err = await res.json();
        alert(`Purchase Failed: ${err.error}`);
    }
  };

  // --- VIEWS ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-8 tracking-tight">UniDeals</h1>
        <div className="w-full max-w-sm space-y-4">
            {user ? (
                <div className="bg-white p-6 rounded-2xl shadow-xl text-center border border-gray-100">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Hello, {user.firstName}!</h2>
                    <p className="text-sm text-gray-500 mb-6">{user.isAdmin ? 'Administrator' : 'Student Account'}</p>
                    
                    <div className="grid gap-3">
                        <button onClick={loadCatalog} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">Browse Store</button>
                        <button onClick={loadOrders} className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">My Orders</button>
                        {user.isAdmin && (
                            <button onClick={loadAdmin} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition">Admin Dashboard</button>
                        )}
                        <button onClick={handleLogout} className="w-full py-2 text-red-500 text-sm hover:underline mt-2">Sign Out</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <button onClick={() => setView('login')} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition flex justify-center gap-2">
                        <LogIn size={20}/> Login
                    </button>
                    <button onClick={() => setView('register')} className="w-full py-4 bg-white border border-gray-200 text-gray-800 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition">
                        Create Account
                    </button>
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 text-gray-500">or</span></div>
                    </div>
                    <button onClick={loadCatalog} className="w-full py-3 text-gray-500 font-medium hover:text-gray-900 transition">Continue as Guest</button>
                </div>
            )}
        </div>
      </div>
    );
  }

  if (view === 'login') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <button onClick={() => setView('landing')} className="text-gray-400 hover:text-gray-900 mb-6 flex items-center gap-1 text-sm"><ArrowRight className="rotate-180" size={16}/> Back</button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Welcome Back</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" placeholder="Email Address" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">Sign In</button>
                </form>
            </div>
        </div>
      );
  }

  if (view === 'register') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <button onClick={() => setView('landing')} className="text-gray-400 hover:text-gray-900 mb-6 flex items-center gap-1 text-sm"><ArrowRight className="rotate-180" size={16}/> Back</button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Create Account</h2>
                <form onSubmit={handleRegister} className="space-y-3">
                    <input placeholder="Username" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" onChange={e => setRegForm({...regForm, username: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-3">
                        <input placeholder="First Name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" onChange={e => setRegForm({...regForm, first_name: e.target.value})} required />
                        <input placeholder="Last Name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" onChange={e => setRegForm({...regForm, last_name: e.target.value})} required />
                    </div>
                    <input type="email" placeholder="Email" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" onChange={e => setRegForm({...regForm, email: e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" onChange={e => setRegForm({...regForm, password: e.target.value})} required />
                    <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg mt-2">Register</button>
                </form>
            </div>
        </div>
      );
  }

  // REUSABLE LIST VIEW (Catalog, Admin, Orders)
  if (view === 'catalog' || view === 'admin' || view === 'orders') {
    const title = view === 'orders' ? 'Order History' : view === 'admin' ? 'Admin Inventory' : 'Store Catalog';
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="font-bold text-lg text-gray-800">{title}</h1>
                    <button onClick={() => setView('landing')} className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium"><Home size={16}/> Home</button>
                </div>

                <div className="space-y-4">
                    {stockList.length === 0 && <p className="text-center text-gray-400 py-10">No items found.</p>}
                    
                    {stockList.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 transition hover:shadow-md">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                                
                                {view === 'orders' ? (
                                    // Order History View
                                    <div>
                                        <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                                        <p className="text-green-600 font-bold mt-1">Paid: £{item.final_price_paid}</p>
                                    </div>
                                ) : (
                                    // Catalog / Admin View
                                    <div>
                                        <p className="text-sm text-gray-500 mb-3">Base: £{item.base_price}</p>
                                        
                                        {view === 'admin' ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.stock_quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                Stock: {item.stock_quantity}
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleTestScan(item.id)}
                                                className="bg-black text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition"
                                            >
                                                <QrCode size={14} /> Simulate Scan
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  // VIEW: PRODUCT (Price Decay)
  if (view === 'product' && productData) {
    return (
      <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl relative">
        <div className="h-72 bg-gray-100 relative">
            <img src={productData.product.image_url} className="w-full h-full object-cover" />
            <button onClick={() => setView('catalog')} className="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded-full text-black hover:bg-white transition shadow-sm">
                <ArrowRight className="rotate-180" size={20}/>
            </button>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
            <div>
                <h1 className="text-3xl font-extrabold mb-1 text-gray-900">{productData.product.name}</h1>
                <p className="text-gray-400 text-sm mb-6">Original Price: £{productData.pricing.original}</p>
            </div>
            
            {/* ALGORITHM BOX */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-6 shadow-inner">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Current Price</p>
                        <p className="text-5xl font-black text-red-600 tracking-tighter">£{productData.pricing.current}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-red-600 text-lg font-bold">
                            <Clock size={20} /> <span>{productData.pricing.next_drop_in}s</span>
                        </div>
                        <p className="text-xs text-red-400">until price drops</p>
                    </div>
                </div>
                <div className="w-full bg-red-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full transition-all duration-1000 ease-linear" style={{ width: `${(productData.pricing.next_drop_in / 60) * 100}%` }}></div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                {!user && (
                    <input 
                        type="email" 
                        placeholder="Enter email for receipt" 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" 
                        onChange={e => setCheckoutEmail(e.target.value)} 
                    />
                )}
                <button onClick={handleBuy} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex justify-center gap-2 shadow-lg">
                    <ShoppingBag /> Buy Now
                </button>
                <p className="text-center text-xs text-gray-400">Secured by Stripe Elements</p>
            </div>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="bg-white text-green-600 p-6 rounded-full mb-6 shadow-2xl animate-bounce">
            <ShieldCheck size={64} />
        </div>
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Confirmed!</h1>
        <p className="text-green-100 text-lg mb-8 max-w-xs mx-auto">
            You secured the deal. A receipt has been sent to {user ? user.email : checkoutEmail}.
        </p>
        <button onClick={() => setView('landing')} className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:bg-green-50 transition shadow-lg">
            Done
        </button>
      </div>
    );
  }

  return null;
}