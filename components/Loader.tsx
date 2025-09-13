
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-[99998]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      <p className="mt-4 text-gray-700 font-semibold">Generating your masterpiece...</p>
    </div>
  );
};
