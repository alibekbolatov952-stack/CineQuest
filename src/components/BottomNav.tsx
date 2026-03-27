import React from 'react';
import { Home, Play } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Play, path: '/popular', label: 'Discover' },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0502]/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 md:hidden">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "relative p-2 transition-all duration-300",
                  isActive ? "text-[#ff4e00]" : "text-white/40 hover:text-white"
                )}
              >
                <item.icon size={24} strokeWidth={isActive ? 3 : 2} />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
