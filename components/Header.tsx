
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-4 bg-white shadow-md">
      <div className="container mx-auto flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-400 rounded-full"></div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">NANO COLLAGE</h1>
      </div>
    </header>
  );
};
