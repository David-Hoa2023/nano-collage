import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { CollageImage, AspectRatio } from './types';
import { ASPECT_RATIOS, PROMPT_IDEA, USAGE_TIPS } from './constants';
import { generateMergedImage, generatePromptFromImages } from './services/geminiService';
import { Header } from './components/Header';
import { ImageItem } from './components/ImageItem';
import { Loader } from './components/Loader';
import { Modal } from './components/Modal';
import { AspectRatioSelector } from './components/AspectRatioSelector';

declare const html2canvas: any;

const DiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <path d="M16 8h.01"></path>
    <path d="M8 8h.01"></path>
    <path d="M12 12h.01"></path>
    <path d="M16 16h.01"></path>
    <path d="M8 16h.01"></path>
  </svg>
);


const App: React.FC = () => {
  const [images, setImages] = useState<CollageImage[]>([]);
  const [history, setHistory] = useState<CollageImage[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const nextZIndex = useRef(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const recordHistory = useCallback((imagesToRecord: CollageImage[]) => {
    if (JSON.stringify(imagesToRecord) === JSON.stringify(history[historyIndex])) {
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imagesToRecord);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    // This effect runs when the history state changes (e.g., on undo, redo, or a new action).
    // It keeps the live `images` state synchronized with the current point in history.
    // A missing dependency here was causing actions like deletion to be reverted.
    setImages(history[historyIndex]);
  }, [history, historyIndex]);

  const handleSelectImage = useCallback((id: string, e: React.MouseEvent | React.PointerEvent) => {
    // Bring clicked image to the front - this is a discrete, undoable action
    const newImages = images.map(img =>
      img.id === id ? { ...img, zIndex: nextZIndex.current++ } : img
    );
    setImages(newImages);
    recordHistory(newImages);
  
    const isSelected = selectedImageIds.includes(id);

    // On pointerdown, we prepare for a drag by capturing the initial positions
    // of all images that will be part of the drag group.
    if (e.type === 'pointerdown') {
        let idsToDrag: string[] = [];

        if (!e.shiftKey) {
            idsToDrag = isSelected ? selectedImageIds : [id];
        } else {
            idsToDrag = isSelected 
                ? selectedImageIds.filter(sid => sid !== id) 
                : [...selectedImageIds, id];
        }
        
        const newDragPositions = new Map<string, { x: number, y: number }>();
        newImages.forEach(img => { // Use newImages to get correct positions
            if (idsToDrag.includes(img.id)) {
                newDragPositions.set(img.id, { x: img.x, y: img.y });
            }
        });
        dragStartPositions.current = newDragPositions;
    }

    if (e.shiftKey) {
        setSelectedImageIds(prev => 
            prev.includes(id) 
                ? prev.filter(sid => sid !== id) 
                : [...prev, id]
        );
    } else if (!isSelected) {
        setSelectedImageIds([id]);
    }
  }, [images, selectedImageIds, recordHistory]);

  const deselectImage = useCallback(() => {
    setSelectedImageIds([]);
  }, []);

  const addImageToCanvas = useCallback((file: File, position?: {x: number, y: number}) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();

        const x = position ? position.x : canvasRect.width / 2;
        const y = position ? position.y : canvasRect.height / 2;
        
        const defaultWidth = 250;
        const aspectRatio = img.width / img.height;
        const newImage: CollageImage = {
          id: `${Date.now()}-${Math.random()}`,
          src,
          x: x - defaultWidth / 2,
          y: y - (defaultWidth / aspectRatio) / 2,
          width: defaultWidth,
          height: defaultWidth / aspectRatio,
          zIndex: nextZIndex.current++,
        };
        const newImages = [...images, newImage];
        setImages(newImages);
        recordHistory(newImages);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [images, recordHistory]);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    deselectImage();

    const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length > 0 && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;
      files.forEach(file => addImageToCanvas(file, { x, y }));
    }
  }, [deselectImage, addImageToCanvas]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    deselectImage();
    const files = event.target.files ? Array.from(event.target.files).filter(file => file.type.startsWith('image/')) : [];
    if (files.length > 0) {
        files.forEach(file => addImageToCanvas(file));
    }
    if (event.target) {
        event.target.value = "";
    }
  };
  
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleResizeImage = useCallback((id: string, updates: { width: number; height: number; }) => {
    setImages(prev => prev.map(img => (img.id === id ? { ...img, ...updates } : img)));
  }, []);

  const handleMoveImage = useCallback((draggedId: string, delta: { x: number; y: number }) => {
    setImages(prevImages =>
      prevImages.map(img => {
        if (dragStartPositions.current.has(img.id)) {
          const startPos = dragStartPositions.current.get(img.id)!;
          return {
            ...img,
            x: startPos.x + delta.x,
            y: startPos.y + delta.y,
          };
        }
        return img;
      })
    );
  }, []);

  const handleInteractionEnd = useCallback(() => {
    // Since handleMove/Resize use functional updates, the `images` state
    // in this scope can be stale. We use the functional update form of setImages 
    // to get the latest state before recording it to history.
    setImages(currentImages => {
        recordHistory(currentImages);
        return currentImages;
    });
  }, [recordHistory]);

  const handleDeleteImage = useCallback((id: string) => {
    setImages(currentImages => {
      const newImages = currentImages.filter(img => img.id !== id);
      recordHistory(newImages);
      return newImages;
    });
    setSelectedImageIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [recordHistory]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (historyIndex > 0) {
          setHistoryIndex(prevIndex => prevIndex - 1);
          setSelectedImageIds([]);
        }
        return;
      }
      
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImageIds.length > 0) {
        const newImages = images.filter(img => !selectedImageIds.includes(img.id));
        setImages(newImages);
        recordHistory(newImages);
        setSelectedImageIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIds, images, recordHistory, historyIndex]);

  const captureCanvas = async (): Promise<{ base64: string; mimeType: string; } | null> => {
    if (!canvasRef.current) return null;
    deselectImage();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: '#ffffff',
      scale: 1,
    });
    const dataUrl = canvas.toDataURL('image/png');
    const mimeType = dataUrl.split(';')[0].split(':')[1];
    const base64 = dataUrl.split(',')[1];
    return { base64, mimeType };
  }

  const handleSaveCollage = async () => {
    const capture = await captureCanvas();
    if (!capture) return;

    const link = document.createElement('a');
    link.href = `data:${capture.mimeType};base64,${capture.base64}`;
    link.download = 'nano-collage.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim() || images.length === 0) {
      alert("Please add at least one image and a prompt to generate.");
      return;
    }
    setIsLoading(true);
    const capture = await captureCanvas();
    if (!capture) {
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await generateMergedImage(capture.base64, capture.mimeType, prompt);
      if (result) {
        setGeneratedImage(result);
      } else {
        alert("Gemini did not return an image. Please try a different prompt.");
      }
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRandomPrompt = async () => {
    if (images.length === 0) {
      alert("Please add some images to the canvas first.");
      return;
    }
    setIsGeneratingPrompt(true);
    try {
      const imageParts = images.map(image => {
        const [header, base64Data] = image.src.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        };
      });

      const newPrompt = await generatePromptFromImages(imageParts);
      setPrompt(newPrompt);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-start p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="w-full max-w-7xl bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
            <AspectRatioSelector
              selectedAspectRatio={selectedAspectRatio}
              onSelectAspectRatio={setSelectedAspectRatio}
            />
            <div className="flex flex-wrap gap-2 justify-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    multiple
                    accept="image/*"
                    className="hidden"
                    aria-hidden="true"
                />
                <button 
                    onClick={handleUploadButtonClick} 
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                >
                    Upload Image
                </button>
                <button onClick={() => setShowTips(true)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">Tips &amp; Tricks</button>
                <button onClick={handleSaveCollage} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">Save Collage</button>
            </div>
        </div>

        <div className={`w-full max-w-7xl shadow-lg ${selectedAspectRatio.className}`}>
          <div
            ref={canvasRef}
            className={`w-full h-full bg-white relative overflow-hidden transition-all duration-200 ${isDraggingOver ? 'outline-dashed outline-4 outline-yellow-400 -outline-offset-8 bg-yellow-50' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={deselectImage}
          >
            {images.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400 p-4 pointer-events-none">
                {isDraggingOver ? (
                    <p className="text-lg font-semibold text-yellow-600">Drop images here</p>
                ) : (
                    <p>Drag &amp; drop images or click 'Upload Image' to get started</p>
                )}
              </div>
            )}
            {images.map(img => (
              <ImageItem
                key={img.id}
                image={img}
                isSelected={selectedImageIds.includes(img.id)}
                onSelect={handleSelectImage}
                onMove={handleMoveImage}
                onResize={handleResizeImage}
                onDelete={handleDeleteImage}
                onInteractionEnd={handleInteractionEnd}
              />
            ))}
            {isLoading && <Loader />}
          </div>
        </div>
        
        <div className="w-full max-w-7xl bg-white p-4 rounded-lg shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <label htmlFor="prompt" className="block text-md font-semibold text-gray-800">
                    Gemini Prompt
                </label>
                <button
                    onClick={handleGenerateRandomPrompt}
                    disabled={isGeneratingPrompt || images.length === 0}
                    className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate a creative prompt based on the images on the canvas"
                >
                    {isGeneratingPrompt ? (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <DiceIcon className="w-4 h-4 text-gray-600" />
                    )}
                    <span>Generate Idea</span>
                </button>
            </div>
          <p className="text-sm text-gray-500">Describe how to merge the elements above into a new image, or generate an idea from them.</p>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A photorealistic image of a person holding the handbag..."
            className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
          />
          <button 
            onClick={handleGenerate} 
            disabled={isLoading || isGeneratingPrompt}
            className="w-full px-6 py-3 text-md font-bold text-gray-800 bg-yellow-400 rounded-md hover:bg-yellow-500 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Generate & Merge Elements
          </button>
        </div>

        <div className="w-full max-w-7xl -mt-4 pb-4 text-xs text-gray-500">
          Created By <a href="https://x.com/MrDavids1" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 hover:text-yellow-600 hover:underline transition-colors">@mrdavids1</a>
        </div>
      </main>

      <Modal isOpen={showTips} onClose={() => setShowTips(false)} title="Tips & Tricks">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">What is Nano Collage?</h3>
                <p className="text-gray-600 leading-relaxed">
                    Nano Collage is a method that allows you to drag and drop elements onto a canvas and then use a prompt to merge them into a consistent final image.
                </p>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Usage Tips</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {USAGE_TIPS.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-2">Prompt Idea</h3>
                <p className="text-gray-600 italic leading-relaxed">{PROMPT_IDEA}</p>
            </div>
        </div>
      </Modal>

      <Modal isOpen={!!generatedImage} onClose={() => setGeneratedImage(null)} title="Generated Image">
        {generatedImage && (
            <div className="space-y-4">
                <img src={generatedImage} alt="AI generated collage" className="w-full h-auto rounded-md shadow-md" />
                 <a 
                    href={generatedImage} 
                    download="nano-collage-generated.png" 
                    className="block w-full text-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                >
                    Download Image
                </a>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default App;