import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert("Account Created Successfully! Please Login.");
            navigate('/'); // Redirect to Landing Page to login
        } else {
            const data = await res.json();
            setError(data.error || "Registration Failed. Please try again.");
        }
    } catch (err) {
        setError("Network Error. Is the server running?");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="mb-6">
            <Link to="/" className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-sm font-medium mb-4 transition">
                <ArrowLeft size={16}/> Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="text-blue-600" /> Create Account
            </h1>
            <p className="text-gray-500 mt-2">Join UniDeals to access exclusive algorithmic discounts.</p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm mb-6">
                {error}
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <input 
                    placeholder="Username" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <input 
                    placeholder="First Name" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    required
                />
                <input 
                    placeholder="Last Name" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    required
                />
            </div>

            <div>
                <input 
                    type="email" 
                    placeholder="Student Email" 
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

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex justify-center gap-2 disabled:opacity-50"
            >
                {loading ? 'Creating...' : 'Register Now'}
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/" className="text-blue-600 font-bold hover:underline">Log in here</Link>
        </div>
      </div>
    </div>
  );
}