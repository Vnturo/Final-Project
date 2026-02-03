import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ShieldCheck, User, LogIn, Lock, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = "http://localhost:5000/api";

export default function LandingPage() {
  const { user, login, logout } = useAuth(); // Get user state from Context
  const navigate = useNavigate();
  
  // Local state for the login form toggling
  const [showLogin, setShowLogin] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if (res.ok) {
            login(data.user); // Update global auth state
            setError('');
            setShowLogin(false);
        } else {
            setError(data.error || "Login Failed");
        }
    } catch (err) {
        setError("Network Error. Is the server running?");
    }
  };

  // 1. VIEW IF LOGGED IN
  if (user) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-blue-100 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={40} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Hello, {user.firstName}!</h2>
                <p className="text-sm text-gray-500 mb-6">{user.isAdmin ? 'Administrator Access' : 'Student Account'}</p>
                
                <div className="grid gap-3">
                    <Link to="/catalog" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg">
                        <ShoppingBag size={20} /> Browse Store
                    </Link>

                    <Link to="/orders" className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm">
                        <Package size={20} /> My Orders
                    </Link>
                    
                    {/* Only show Admin button if user is Admin */}
                    {user.isAdmin && (
                        <Link to="/admin" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg">
                            <Lock size={18} /> Admin Dashboard
                        </Link>
                    )}
                    
                    <button onClick={logout} className="w-full py-2 text-red-500 text-sm hover:underline mt-2 flex items-center justify-center gap-1">
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // 2. VIEW IF LOGIN FORM IS OPEN
  if (showLogin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300">
                <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-gray-900 mb-6 flex items-center gap-1 text-sm font-medium">
                    <ArrowRight className="rotate-180" size={16}/> Back
                </button>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Welcome Back</h2>
                <p className="text-gray-500 mb-6 text-sm">Enter your credentials to access your account.</p>
                
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            required 
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // 3. DEFAULT LANDING VIEW (Logged Out)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
            <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight mb-2">UniDeals</h1>
            <p className="text-blue-600/80 font-medium text-lg">Hyperlocal Algorithmic Commerce</p>
        </div>

        <div className="space-y-4">
            <button 
                onClick={() => setShowLogin(true)} 
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-xl hover:bg-black transition flex justify-center items-center gap-2"
            >
                <LogIn size={20}/> Login
            </button>
            
            <Link 
                to="/register" 
                className="w-full py-4 bg-white border-2 border-white text-gray-800 rounded-xl font-bold shadow-md hover:bg-gray-50 transition block"
            >
                Create Account
            </Link>
            
            <Link 
                to="/catalog" 
                className="w-full py-3 text-gray-500 font-medium hover:text-blue-600 transition flex items-center justify-center gap-1 mt-2"
            >
                Continue as Guest <ArrowRight size={14} />
            </Link>
        </div>
      </div>
    </div>
  );
}