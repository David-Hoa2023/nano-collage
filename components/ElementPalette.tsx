import React from 'react';
import { ELEMENT_PALETTE_IMAGES } from '../constants';

// FIX: Changed the event type from React.DragEvent<HTMLImageElement> to React.DragEvent<HTMLDivElement>
// because the onDragStart event handler is attached to a div element, not an img element.
const handleDragStart = (e: React.DragEvent<HTMLDivElement>, src: string) => {
  // Use a custom data type to avoid conflicts and clearly identify the data's origin.
  e.dataTransfer.setData('application/nano-collage-element', src);
  e.dataTransfer.effectAllowed = 'copy';
};

export const ElementPalette: React.FC = () => {
  return (
    <aside className="w-64 h-full bg-white shadow-lg p-4 flex-shrink-0 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Elements</h2>
      <div className="grid grid-cols-2 gap-4">
        {ELEMENT_PALETTE_IMAGES.map((image) => (
          <div 
            key={image.id} 
            className="cursor-grab p-1 border border-transparent hover:border-yellow-400 rounded-md transition-all active:cursor-grabbing"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, image.src)}
          >
            <img
              src={image.src}
              alt={`Draggable element ${image.id}`}
              className="w-full h-auto object-cover rounded-md select-none pointer-events-none"
            />
          </div>
        ))}
      </div>
    </aside>
  );
};
