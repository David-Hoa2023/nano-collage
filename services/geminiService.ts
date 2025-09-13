import { GoogleGenAI, Modality } from "@google/genai";

declare var process: {
  env: {
    API_KEY: string;
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMergedImage = async (base64ImageData: string, mimeType: string, prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    // Return null if no image is found
    return null;

  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw new Error("Failed to generate image. Please check the console for details.");
  }
};

export const generatePromptFromImages = async (imageParts: { inlineData: { data: string; mimeType: string; } }[]) => {
  try {
    if (imageParts.length === 0) {
      throw new Error("No images provided to generate a prompt.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: "Analyze the following images and generate a single, cohesive prompt for an image generation model. The prompt should describe a creative scene that incorporates all the elements from the images. It should be descriptive and imaginative, similar to this example: 'A shot of a model posing next to a yellow vw beetle. She is wearing the following items. She is holding a pot plant with sunflowers. The scene is next to a beach In italy. There is a dalmation sitting next to her.'. Do not describe the layout or composition of the input images, only the content." },
          ...imageParts,
        ]
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating prompt with Gemini:", error);
    throw new Error("Failed to generate prompt. Please check the console for details.");
  }
};