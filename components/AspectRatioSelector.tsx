import React, { useState, useRef, useEffect } from 'react';
import type { AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants';

interface AspectRatioSelectorProps {
  selectedAspectRatio: AspectRatio;
  onSelectAspectRatio: (aspectRatio: AspectRatio) => void;
}

const AspectRatioIcon: React.FC<{ aspectRatioValue: string; className?: string }> = ({ aspectRatioValue, className = '' }) => {
  const [width, height] = aspectRatioValue.split('/').map(Number);
  
  // Normalize dimensions to fit within a 16x16 box for visual consistency
  const maxDim = Math.max(width, height);
  const iconWidth = (width / maxDim) * 16;
  const iconHeight = (height / maxDim) * 16;

  return (
    <div className={`flex items-center justify-center w-6 h-6 mr-2 flex-shrink-0 ${className}`}>
      <div
        className="border border-current rounded-sm"
        style={{ width: `${iconWidth}px`, height: `${iconHeight}px` }}
      ></div>
    </div>
  );
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedAspectRatio, onSelectAspectRatio }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (aspectRatio: AspectRatio) => {
    onSelectAspectRatio(aspectRatio);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
        <div className="flex items-center">
            <label id="aspect-ratio-label" className="text-sm font-medium text-gray-700 mr-2">Aspect Ratio:</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-52 pl-3 pr-2 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby="aspect-ratio-label"
            >
                <span className="flex items-center">
                    <AspectRatioIcon aspectRatioValue={selectedAspectRatio.value} className="text-gray-600"/>
                    <span className="text-sm text-gray-800">{selectedAspectRatio.name}</span>
                </span>
                <span className="flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>
        </div>

      {isOpen && (
        <ul
          className="absolute z-50 w-52 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          tabIndex={-1}
          role="listbox"
          aria-labelledby="aspect-ratio-label"
        >
          {ASPECT_RATIOS.map(ar => (
            <li
              key={ar.name}
              onClick={() => handleSelect(ar)}
              className={`flex items-center px-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-yellow-50 hover:text-yellow-900 ${selectedAspectRatio.value === ar.value ? 'bg-yellow-100 text-yellow-900' : ''}`}
              role="option"
              aria-selected={selectedAspectRatio.value === ar.value}
            >
              <AspectRatioIcon aspectRatioValue={ar.value} />
              <span className="flex-grow">{ar.name}</span>
              {selectedAspectRatio.value === ar.value && (
                <svg className="w-5 h-5 ml-2 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};