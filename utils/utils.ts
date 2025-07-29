import {
  AnalysisError,
  ParsedSentimentResult,
  SentimentType,
  SimilarityItem,
  TrainingDataItem,
} from "@/types/types";
import { Alert } from "react-native";

// API utilities
export const validateApiResponse = (response: Response): void => {
  if (!response.ok) {
    throw new AnalysisError(
      `API Error: ${response.status} ${response.statusText}`,
      "API_ERROR"
    );
  }
};

export const parseOpenAIResponse = (content: string): ParsedSentimentResult => {
  try {
    return JSON.parse(content) as ParsedSentimentResult;
  } catch {
    return extractSentimentFromText(content);
  }
};

export const extractSentimentFromText = (
  content: string
): ParsedSentimentResult => {
  const sentimentMatch =
    /sentiment['":\s]*['"]?(positive|negative|neutral)['"]?/i.exec(content);

  const confidenceMatch = /confidence['":\s]*([0-9.]+)/i.exec(content);

  return {
    sentiment: sentimentMatch
      ? (sentimentMatch[1].toLowerCase() as SentimentType)
      : "neutral",
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75,
    reasoning: "Parsed from API response",
  };
};

export const buildOpenAIRequest = (
  text: string,
  apiKey: string
): RequestInit => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  },
  body: JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `Analyze the sentiment of this text and respond ONLY with a JSON object in this exact format: {"sentiment": "positive|negative|neutral", "confidence": 0.95, "reasoning": "brief explanation"}. Text to analyze: "${text}"`,
      },
    ],
    max_tokens: 100,
    temperature: 0.1,
  }),
});

// Sentiment analysis utilities
export const analyzeSentimentWithKeywords = (
  text: string
): { sentiment: SentimentType; confidence: number } => {
  const positiveWords = [
    "love",
    "amazing",
    "great",
    "excellent",
    "wonderful",
    "fantastic",
    "good",
    "best",
    "nice",
    "happy",
    "awesome",
    "perfect",
    "brilliant",
  ];
  const negativeWords = [
    "hate",
    "terrible",
    "bad",
    "awful",
    "horrible",
    "worst",
    "sad",
    "angry",
    "disappointed",
    "waste",
    "annoying",
    "frustrating",
    "useless",
  ];

  const words = text.toLowerCase().split(" ");
  let positiveScore = 0;
  let negativeScore = 0;

  words.forEach((word: string) => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) {
    return {
      sentiment: "positive",
      confidence: Math.min(0.7 + positiveScore * 0.1, 0.98),
    };
  }

  if (negativeScore > positiveScore) {
    return {
      sentiment: "negative",
      confidence: Math.min(0.7 + negativeScore * 0.1, 0.98),
    };
  }

  return {
    sentiment: "neutral",
    confidence: 0.65 + Math.random() * 0.2,
  };
};

export const findBestMatch = (
  text: string,
  trainingData: TrainingDataItem[]
): SimilarityItem => {
  const similarities: SimilarityItem[] = trainingData
    .map((item) => {
      const commonWords = text
        .toLowerCase()
        .split(" ")
        .filter((word: string) =>
          item.text.toLowerCase().includes(word)
        ).length;
      return { ...item, similarity: commonWords };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return similarities[0];
};

// Validation utilities
export const validateInput = (text: string): void => {
  if (!text.trim()) {
    throw new AnalysisError(
      "Please enter some text to analyze",
      "INVALID_INPUT"
    );
  }
};

// Delay utility
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Error handling utilities
export const handleAnalysisError = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (error instanceof AnalysisError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

export const showErrorAlert = (title: string, message: string): void => {
  Alert.alert(title, message);
};
