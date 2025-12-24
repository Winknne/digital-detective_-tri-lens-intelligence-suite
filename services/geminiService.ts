import { GoogleGenAI, Modality, Chat, GenerateContentResponse } from "@google/genai";
import { ANALYSIS_SYSTEM_PROMPT } from "../constants";
import { AnalysisResult, Message } from "../types";

// 确保您的 API KEY 环境变量名称正确
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * 辅助函数：从混合文本中提取第一个有效的 JSON 对象字符串
 * 这能防止 AI 在 JSON 前后输出 "Here is the analysis:" 之类的废话导致解析失败
 */
function extractJSON(text: string): string {
  try {
    // 1. 尝试直接解析
    JSON.parse(text);
    return text;
  } catch (e) {
    // 2. 如果直接解析失败，使用正则寻找最外层的 {}
    // 匹配第一个 { 开始，到最后一个 } 结束的内容
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    // 3. 找不到则抛出错误
    throw new Error("No JSON object found in response");
  }
}

/**
 * Analyzes a narrative using the Tri-Lens Protocol.
 * Restores Google Search Grounding to find real-world sources.
 */
export const analyzeNarrative = async (text: string): Promise<AnalysisResult> => {
  const ai = getAI();
  
  // [修改点] 这里已更新为您指定的 gemini-2.0-flash
  const modelName = "gemini-2.0-flash"; 

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

    // [核心修复] 注意这里移除了括号，直接访问 text 属性
    // 如果 SDK 返回 undefined，兜底为 '{}'
    const resultText = response.text || '{}';
    
    // 清洗和提取 JSON
    const cleanJsonText = extractJSON(resultText);

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
    console.error("AI Analysis Failed. Error:", e);
    // 抛出通用错误供前端展示
    throw new Error("Invalid intelligence report format.");
  }
};

export const getSuspectResponse = async (systemInstruction: string, history: Message[], message: string): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-2.0-flash', // [修改点] 保持模型一致
    config: { systemInstruction },
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }))
  });
  const response = await chat.sendMessage({ message });
  // [核心修复] 这里同样改为直接访问属性
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
