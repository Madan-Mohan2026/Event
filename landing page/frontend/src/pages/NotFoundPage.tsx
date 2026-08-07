import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#0B0F19] flex items-center justify-center">
      <div className="glass-panel p-12 rounded-3xl text-center max-w-md space-y-6 border border-slate-800">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white">404</h1>
        <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
        <p className="text-slate-400 text-sm">
          The page or event route you are searching for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};
