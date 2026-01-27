import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">UniDeals</h1>
            <p className="text-blue-600/80 mt-2 font-medium">Hyperlocal Algorithmic Commerce</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 space-y-6">
            <Link to="/catalog" className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg group">
                <div className="flex items-center gap-4">
                    <ShoppingBag className="group-hover:scale-110 transition" />
                    <div className="text-left">
                        <span className="block font-bold">Browse Catalog</span>
                        <span className="text-xs text-blue-200">Simulate Student View</span>
                    </div>
                </div>
                <ArrowRight />
            </Link>

            <Link to="/admin/login" className="w-full flex items-center justify-between p-4 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition border border-gray-200">
                <div className="flex items-center gap-4">
                    <ShieldCheck className="text-gray-400" />
                    <div className="text-left">
                        <span className="block font-bold">Admin Portal</span>
                        <span className="text-xs text-gray-400">Staff Access Only</span>
                    </div>
                </div>
                <ArrowRight className="text-gray-300" />
            </Link>
        </div>
      </div>
    </div>
  );
}