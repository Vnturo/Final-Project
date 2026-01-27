import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Home } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-8 text-white text-center">
      <div className="bg-white text-green-500 p-6 rounded-full mb-6 shadow-2xl animate-bounce">
          <ShieldCheck size={64} />
      </div>
      <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Order Confirmed</h1>
      <p className="text-green-100 text-lg mb-8 max-w-md">
          You successfully snagged the deal! A receipt has been sent to your email.
      </p>
      <Link 
          to="/"
          className="bg-white text-green-600 px-8 py-3 rounded-xl font-bold hover:bg-green-50 transition shadow-lg flex items-center gap-2"
      >
          <Home size={18} /> Back Home
      </Link>
    </div>
  );
}