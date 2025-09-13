import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CollageImage } from '../types';

interface ImageItemProps {
  image: CollageImage;
  isSelected: boolean;
  onSelect: (id: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onMove: (id: string, delta: { x: number; y: number }) => void;
  onResize: (id: string, updates: { width: number; height: number; }) => void;
  onDelete: (id: string) => void;
  onInteractionEnd: () => void;
}

export const ImageItem: React.FC<ImageItemProps> = ({ image, isSelected, onSelect, onMove, onResize, onDelete, onInteractionEnd }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartSize = useRef({ width: 0, height: 0 });

  const handlePointerDownDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    itemRef.current?.setPointerCapture(e.pointerId);
    onSelect(image.id, e);
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizeHandleRef.current?.setPointerCapture(e.pointerId);
    onSelect(image.id, e);
    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    if (itemRef.current) {
        elementStartSize.current = { width: itemRef.current.offsetWidth, height: itemRef.current.offsetHeight };
    }
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (isDragging) {
      onMove(image.id, { x: dx, y: dy });
    }
    if (isResizing) {
      const newWidth = elementStartSize.current.width + dx;
      const newHeight = elementStartSize.current.height + dy;

      if (newWidth >= 50 && newHeight >= 50) {
        onResize(image.id, { width: newWidth, height: newHeight });
      }
    }
  }, [isDragging, isResizing, image.id, onMove, onResize]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (itemRef.current?.hasPointerCapture(e.pointerId)) {
      itemRef.current.releasePointerCapture(e.pointerId);
    }
    if (resizeHandleRef.current?.hasPointerCapture(e.pointerId)) {
        resizeHandleRef.current.releasePointerCapture(e.pointerId);
    }
    
    if (isDragging || isResizing) {
      onInteractionEnd();
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, isResizing, onInteractionEnd]);
  
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={itemRef}
      className={`absolute select-none ${isSelected ? 'outline outline-2 outline-yellow-500 outline-offset-2' : ''}`}
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        height: image.height,
        zIndex: image.zIndex,
        backgroundImage: `url(${image.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDownDrag}
      onClick={(e) => e.stopPropagation()}
    >
      {isSelected && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-3 -right-3 w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
            aria-label="Delete image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div 
            ref={resizeHandleRef}
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-yellow-500 border-2 border-white rounded-full cursor-se-resize z-10"
            onPointerDown={handlePointerDownResize}
          />
        </>
      )}
    </div>
  );
};