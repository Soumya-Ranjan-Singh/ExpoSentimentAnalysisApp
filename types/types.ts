// Define interfaces for type safety
export type SentimentType = "positive" | "negative" | "neutral";

export interface TrainingDataItem {
  text: string;
  sentiment: SentimentType;
  confidence: number;
}

export interface SimilarityItem extends TrainingDataItem {
  similarity: number;
}

export interface ApiResult {
  sentiment: SentimentType;
  confidence: number;
  processing_time: string;
  model: string;
  tokens_used: number;
  reasoning: string;
  api_used: boolean;
}

export interface ModelResult {
  sentiment: SentimentType;
  confidence: number;
  processing_time: string;
  model: string;
  training_samples: number;
  feature_extraction: string;
  accuracy: string;
}

export interface ResultCardProps {
  result: ApiResult | ModelResult | null;
  type: "api" | "model";
}

export interface SampleText {
  text: string;
  type: string;
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    total_tokens: number;
  };
}

export interface ParsedSentimentResult {
  sentiment: SentimentType;
  confidence: number;
  reasoning: string;
}

// Error handling utilities
export class AnalysisError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AnalysisError";
  }
}
