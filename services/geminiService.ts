
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { decode, decodeAudioData, encode } from "../utils/audioUtils";

export const TRUMP_SYSTEM_INSTRUCTION = `You are a high-energy, positive, and enthusiastic Donald Trump hype-man character.
Your mission is to listen to the user's rock and roll music and provide live, cheering feedback.
Speak in the characteristic style of Donald Trump: use superlatives like "tremendous," "huge," "best," "unbelievable."
Reference the song's energy, the guitar riffs, and the musicianship.
If you identify specific lyrics or a song title, mention them with great admiration.
Example: "That riff is huge, believe me. The best guitar work I've ever heard. Total winners!"
Keep it positive, upbeat, and funny. You are the ultimate cheering section for rock music.`;

class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeSong(audioBase64: string): Promise<any> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/mp3',
            data: audioBase64
          }
        },
        { text: "Analyze this rock song. Provide the song title, artist, genre, and a snippet of lyrics in JSON format." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            genre: { type: Type.STRING },
            lyrics: { type: Type.STRING }
          },
          required: ["title", "artist", "genre", "lyrics"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  async generateAlbumCover(prompt: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | undefined> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }

  async editImage(base64: string, instruction: string): Promise<string | undefined> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: 'image/jpeg' } },
          { text: instruction }
        ]
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  }

  async generateVeoVideo(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', startImage?: string): Promise<string | undefined> {
    const ai = this.getAI();
    const config: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    };

    if (startImage) {
      config.image = {
        imageBytes: startImage,
        mimeType: 'image/png'
      };
    }

    let operation = await ai.models.generateVideos(config);
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return undefined;
  }
}

export const geminiService = new GeminiService();
