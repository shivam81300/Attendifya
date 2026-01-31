
import React from 'react';
import { AppRoute } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate, title }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0 shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-calendar-check"></i>
          {title}
        </h1>
        <button 
          onClick={() => onNavigate(AppRoute.SETTINGS)}
          className="p-2 hover:bg-indigo-700 rounded-full transition-colors"
        >
          <i className="fas fa-cog"></i>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 bg-gray-50">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 shadow-lg z-10">
        <NavButton 
          icon="fa-home" 
          label="Home" 
          active={activeRoute === AppRoute.HOME} 
          onClick={() => onNavigate(AppRoute.HOME)} 
        />
        <NavButton 
          icon="fa-chart-pie" 
          label="Analytics" 
          active={activeRoute === AppRoute.ANALYTICS} 
          onClick={() => onNavigate(AppRoute.ANALYTICS)} 
        />
        <NavButton 
          icon="fa-robot" 
          label="AI Chat" 
          active={activeRoute === AppRoute.AI_CHAT} 
          onClick={() => onNavigate(AppRoute.AI_CHAT)} 
        />
        <NavButton 
          icon="fa-graduation-cap" 
          label="Stats" 
          active={activeRoute === AppRoute.DETAILS} 
          onClick={() => onNavigate(AppRoute.DETAILS)} 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center p-2 rounded-lg transition-all ${active ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <i className={`fas ${icon} text-lg mb-1`}></i>
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;
