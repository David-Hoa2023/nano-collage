import type { AspectRatio } from './types';

export const ASPECT_RATIOS: AspectRatio[] = [
  { name: '1:1 (Square)', value: '1/1', className: 'aspect-square' },
  { name: '16:9 (Widescreen)', value: '16/9', className: 'aspect-[16/9]' },
  { name: '9:16 (Social Story)', value: '9/16', className: 'aspect-[9/16]' },
  { name: '4:3 (Classic)', value: '4/3', className: 'aspect-[4/3]' },
  { name: '3:4 (Traditional)', value: '3/4', className: 'aspect-[3/4]' },
];

export const PROMPT_IDEA = `A shot of a model posing next to a yellow vw beetle. She is wearing the following items. She is holding a pot plant with sunflowers. The scene is next to a beach In italy. There is a dalmation sitting next to her.`;

export const USAGE_TIPS = [
  "Press 'Ctrl+Z' or 'Cmd+Z' to undo your last action on the canvas.",
  "Select an image and press 'Delete' or 'Backspace' to remove it.",
  "Hold 'Shift' while clicking to select multiple images.",
  "Click an image to bring it to the front layer.",
  "You can upload or drag & drop multiple images at once.",
  "Drag the corner of a selected image to resize it.",
];

// FIX: Added ELEMENT_PALETTE_IMAGES to fix an import error in the unused ElementPalette component.
export const ELEMENT_PALETTE_IMAGES: { id: string; src: string }[] = [];