
import { GoogleGenAI, Modality, Chat, GenerateContentResponse } from "@google/genai";
import { ANALYSIS_SYSTEM_PROMPT } from "../constants";
import { AnalysisResult, Message } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Analyzes a narrative using the Tri-Lens Protocol.
 * Restores Google Search Grounding to find real-world sources.
 */
export const analyzeNarrative = async (text: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: text,
    config: {
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
    },
  });

  const resultText = response.text || '{}';
  try {
    const json: AnalysisResult = JSON.parse(resultText);
    
    // Extract real web sources from grounding metadata if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      json.groundingSources = chunks
        .filter(c => c.web)
        .map(c => ({
          title: c.web!.title || 'External Intelligence Source',
          uri: c.web!.uri
        }));
    }
    
    return json;
  } catch (e) {
    console.error("Failed to parse AI response:", resultText);
    throw new Error("Invalid intelligence report format.");
  }
};

export const getSuspectResponse = async (systemInstruction: string, history: Message[], message: string): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });
  const response = await chat.sendMessage({ message });
  return response.text || '';
};

export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
