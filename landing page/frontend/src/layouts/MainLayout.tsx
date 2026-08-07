import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useScrollToTop } from '../hooks/useScrollToTop';

export const MainLayout: React.FC = () => {
  useScrollToTop();

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 selection:bg-indigo-500 selection:text-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
