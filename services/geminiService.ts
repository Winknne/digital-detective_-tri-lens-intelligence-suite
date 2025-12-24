import { GoogleGenAI, Modality, Chat, GenerateContentResponse } from "@google/genai";
import { ANALYSIS_SYSTEM_PROMPT } from "../constants";
import { AnalysisResult, Message } from "../types";

// 确保您的 API KEY 环境变量名称正确
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * [核心修复] 智能 JSON 提取器
 * 使用堆栈计数法，精确截取第一个完整的 JSON 对象，忽略前后任何废话。
 * 解决了正则匹配无法处理结尾包含 "}" 的文本的问题。
 */
function extractJSON(text: string): string {
  // 1. 找到第一个 "{"
  const firstOpen = text.indexOf('{');
  if (firstOpen === -1) {
    throw new Error("No JSON object found in response");
  }

  // 2. 开始遍历，寻找匹配的闭合 "}"
  let balance = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = firstOpen; i < text.length; i++) {
    const char = text[i];

    // 处理转义字符 (例如 \")
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    // 处理字符串状态 (在字符串内的 {} 不计入层级)
    if (char === '"') {
      inString = !inString;
      continue;
    }

    // 如果不在字符串内，计算大括号层级
    if (!inString) {
      if (char === '{') {
        balance++;
      } else if (char === '}') {
        balance--;
        // 当层级归零时，说明找到了最外层的闭合括号
        if (balance === 0) {
          return text.substring(firstOpen, i + 1);
        }
      }
    }
  }

  // 如果循环结束还没归零，说明 JSON 不完整，但在这种情况下我们
  // 仍然尝试返回正则匹配作为兜底，或者直接抛出
  throw new Error("Invalid JSON: Unbalanced braces");
}

/**
 * Analyzes a narrative using the Tri-Lens Protocol.
 * Restores Google Search Grounding to find real-world sources.
 */
export const analyzeNarrative = async (text: string): Promise<AnalysisResult> => {
  const ai = getAI();
  
  // 保持使用 gemini-2.0-flash
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

    // 获取文本
    const resultText = response.text || '{}';
    
    // [使用新的提取器]
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
    // 调试技巧：如果再次失败，您可以在控制台看到这行被截取后的 JSON
    // console.log("Extracted JSON was:", cleanJsonText); 
    throw new Error("Invalid intelligence report format.");
  }
};

export const getSuspectResponse = async (systemInstruction: string, history: Message[], message: string): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-2.0-flash', 
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

export const encodeBase64 = (bytes: Uint8Array):
