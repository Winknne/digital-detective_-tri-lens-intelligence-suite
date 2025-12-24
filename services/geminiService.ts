import { GoogleGenAI, Modality, Chat, GenerateContentResponse } from "@google/genai";
import { ANALYSIS_SYSTEM_PROMPT } from "../constants";
import { AnalysisResult, Message } from "../types";

// 确保您的 API KEY 环境变量名称正确
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Analyzes a narrative using the Tri-Lens Protocol.
 * Restores Google Search Grounding to find real-world sources.
 */
export const analyzeNarrative = async (text: string): Promise<AnalysisResult> => {
  const ai = getAI();
  
  // 1. 修改模型名称为当前可用的稳定版本 (推荐 gemini-1.5-flash 或 gemini-2.0-flash)
  const modelName = "gemini-1.5-flash"; 

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: text,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      },
    });

    // 获取文本 (根据 SDK 版本，有时是属性有时是方法，这里做个兼容处理)
    // @ts-ignore
    const resultText = (typeof response.text === 'function' ? response.text() : response.text) || '{}';

    // 🔍【核弹级修复】不依赖 replace，而是直接截取第一个 '{' 和最后一个 '}' 之间的内容
    // 这能解决 99% 的 "Invalid intelligence report format" 错误
    const firstOpen = resultText.indexOf('{');
    const lastClose = resultText.lastIndexOf('}');

    if (firstOpen === -1 || lastClose === -1) {
       console.error("AI Response (No JSON found):", resultText);
       throw new Error("No JSON structure found in AI response.");
    }

    const cleanJsonText = resultText.substring(firstOpen, lastClose + 1);
    const json: AnalysisResult = JSON.parse(cleanJsonText);
    
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
    // 在控制台打印详细错误，方便调试
    console.error("AI Analysis Failed. Detail:", e);
    throw new Error("Invalid intelligence report format.");
  }
};

export const getSuspectResponse = async (systemInstruction: string, history: Message[], message: string): Promise<string> => {
  const ai = getAI();
  // 3. 同样修改这里的模型名称
  const chat = ai.chats.create({
    model: 'gemini-1.5-flash', 
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
