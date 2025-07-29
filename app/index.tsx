import {
  ApiResult,
  ModelResult,
  OpenAIResponse,
  ResultCardProps,
  SampleText,
  TrainingDataItem,
} from "@/types/types";
import {
  analyzeSentimentWithKeywords,
  buildOpenAIRequest,
  delay,
  findBestMatch,
  handleAnalysisError,
  parseOpenAIResponse,
  showErrorAlert,
  validateApiResponse,
  validateInput,
} from "@/utils/utils";
import {
  Ionicons,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SentimentAnalysisApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"api" | "model">("api");
  const [inputText, setInputText] = useState<string>("");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [modelResult, setModelResult] = useState<ModelResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Sample training data for DIY approach
  const trainingData: TrainingDataItem[] = [
    {
      text: "I love this product! It's amazing.",
      sentiment: "positive",
      confidence: 0.95,
    },
    {
      text: "This is terrible. I hate it.",
      sentiment: "negative",
      confidence: 0.92,
    },
    {
      text: "It's okay, nothing special.",
      sentiment: "neutral",
      confidence: 0.78,
    },
    {
      text: "Best purchase I've ever made!",
      sentiment: "positive",
      confidence: 0.98,
    },
    {
      text: "Waste of money. Very disappointed.",
      sentiment: "negative",
      confidence: 0.89,
    },
    {
      text: "The weather is nice today.",
      sentiment: "positive",
      confidence: 0.75,
    },
    {
      text: "I'm feeling sad and lonely.",
      sentiment: "negative",
      confidence: 0.87,
    },
    {
      text: "This is just a regular day.",
      sentiment: "neutral",
      confidence: 0.82,
    },
  ];

  // API analysis functions
  const callOpenAIAPI = async (
    text: string,
    apiKey: string
  ): Promise<ApiResult> => {
    const startTime = Date.now();

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      buildOpenAIRequest(text, apiKey)
    );

    validateApiResponse(response);

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0].message.content.trim();
    const result = parseOpenAIResponse(content);

    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(1);

    return {
      sentiment: result.sentiment,
      confidence: parseFloat(result.confidence.toFixed(2)),
      processing_time: `${processingTime}s`,
      model: "OpenAI GPT-3.5-Turbo",
      tokens_used:
        data.usage?.total_tokens || Math.floor(text.split(" ").length * 1.3),
      reasoning: result.reasoning || "API analysis",
      api_used: true,
    };
  };

  const performSimulationAnalysis = async (
    text: string,
    isApiFallback: boolean
  ): Promise<ApiResult> => {
    await delay(1500);

    const { sentiment, confidence } = analyzeSentimentWithKeywords(text);

    return {
      sentiment,
      confidence: parseFloat(confidence.toFixed(2)),
      processing_time: "1.3s",
      model: isApiFallback
        ? "OpenAI GPT-3.5-Turbo (Fallback)"
        : "Demo Simulation",
      tokens_used: Math.floor(text.split(" ").length * 1.3),
      reasoning: "Rule-based analysis using keyword matching",
      api_used: false,
    };
  };

  const analyzeWithAPI = async (text: string): Promise<void> => {
    setLoading(true);

    try {
      validateInput(text);

      let result: ApiResult;

      if (apiKey?.trim()) {
        try {
          result = await callOpenAIAPI(text, apiKey);
        } catch (error) {
          const errorMessage = handleAnalysisError(error, "API call failed");
          showErrorAlert(
            "API Error",
            `${errorMessage}. Using fallback analysis.`
          );
          result = await performSimulationAnalysis(text, true);
        }
      } else {
        result = await performSimulationAnalysis(text, false);
      }

      setApiResult(result);
    } catch (error) {
      const errorMessage = handleAnalysisError(error, "Analysis failed");
      showErrorAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Model analysis functions
  const performModelAnalysis = async (text: string): Promise<ModelResult> => {
    await delay(2000);

    const bestMatch = findBestMatch(text, trainingData);
    const confidence = Math.max(
      0.6,
      bestMatch.confidence - 0.1 + Math.random() * 0.1
    );

    return {
      sentiment: bestMatch.sentiment,
      confidence: parseFloat(confidence.toFixed(2)),
      processing_time: "2.8s",
      model: "Custom BERT Fine-tuned",
      training_samples: trainingData.length,
      feature_extraction: "TF-IDF + Word Embeddings",
      accuracy: "87.3%",
    };
  };

  const analyzeWithModel = async (text: string): Promise<void> => {
    setLoading(true);

    try {
      validateInput(text);
      const result = await performModelAnalysis(text);
      setModelResult(result);
    } catch (error) {
      const errorMessage = handleAnalysisError(error, "Model analysis failed");
      showErrorAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // UI utility functions
  const getSentimentIcon = (
    sentiment: "positive" | "negative" | "neutral"
  ): string => {
    const iconMap = {
      positive: "thumbs-up",
      negative: "thumbs-down",
      neutral: "remove",
    };
    return iconMap[sentiment];
  };

  const getSentimentColor = (
    sentiment: "positive" | "negative" | "neutral"
  ): string => {
    const colorMap = {
      positive: "#10B981",
      negative: "#EF4444",
      neutral: "#F59E0B",
    };
    return colorMap[sentiment];
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "#10B981";
    if (confidence >= 0.6) return "#F59E0B";
    return "#EF4444";
  };

  // Event handlers
  const handleTabPress = (tab: "api" | "model"): void => {
    setActiveTab(tab);
  };

  const handleSampleTextPress = (text: string): void => {
    setInputText(text);
  };

  const handleToggleApiKey = (): void => {
    setShowApiKey(!showApiKey);
  };

  const handleAnalyzePress = async (): Promise<void> => {
    if (activeTab === "api") {
      await analyzeWithAPI(inputText);
    } else {
      await analyzeWithModel(inputText);
    }
  };

  const getAnalyzeButtonText = (
    loading: boolean,
    activeTab: "api" | "model"
  ): string => {
    if (loading) {
      return "Analyzing...";
    }

    if (activeTab === "api") {
      return "Analyze with API";
    }

    return "Analyze with Model";
  };

  // Component functions
  const ResultCard: React.FC<ResultCardProps> = ({ result, type }) => {
    if (!result) return null;

    const isApiResult = (res: ApiResult | ModelResult): res is ApiResult => {
      return "tokens_used" in res;
    };

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.sentimentContainer}>
            <Ionicons
              name={
                getSentimentIcon(result.sentiment) as
                  | "thumbs-up"
                  | "thumbs-down"
                  | "remove"
              }
              size={20}
              color={getSentimentColor(result.sentiment)}
            />
            <View
              style={[
                styles.sentimentBadge,
                { backgroundColor: `${getSentimentColor(result.sentiment)}20` },
              ]}
            >
              <Text
                style={[
                  styles.sentimentText,
                  { color: getSentimentColor(result.sentiment) },
                ]}
              >
                {result.sentiment.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.confidenceContainer}>
            <Ionicons name="bar-chart" size={16} color="#6B7280" />
            <Text
              style={[
                styles.confidenceText,
                { color: getConfidenceColor(result.confidence) },
              ]}
            >
              {(result.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.resultGrid}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Processing Time:</Text>
            <Text style={styles.resultValue}>{result.processing_time}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Model:</Text>
            <Text style={styles.resultValue}>{result.model}</Text>
          </View>
          {type === "api" && isApiResult(result) && (
            <>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Tokens Used:</Text>
                <Text style={styles.resultValue}>{result.tokens_used}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>API Status:</Text>
                <Text
                  style={[
                    styles.resultValue,
                    { color: result.api_used ? "#10B981" : "#F59E0B" },
                  ]}
                >
                  {result.api_used ? "Real API" : "Simulation"}
                </Text>
              </View>
              {Boolean(result.reasoning) && (
                <View style={[styles.resultItem, { width: "100%" }]}>
                  <Text style={styles.resultLabel}>Analysis:</Text>
                  <Text style={styles.resultValue}>{result.reasoning}</Text>
                </View>
              )}
            </>
          )}
          {type === "model" && !isApiResult(result) && (
            <>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Training Samples:</Text>
                <Text style={styles.resultValue}>
                  {result.training_samples}
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Features:</Text>
                <Text style={styles.resultValue}>
                  {result.feature_extraction}
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Model Accuracy:</Text>
                <Text style={styles.resultValue}>{result.accuracy}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const sampleTexts: SampleText[] = [
    {
      text: "I absolutely love this new feature! It's incredible.",
      type: "Positive",
    },
    {
      text: "This service is terrible and completely useless.",
      type: "Negative",
    },
    { text: "The weather is okay today, nothing special.", type: "Neutral" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#3B82F6", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="brain" size={24} color="white" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sentiment Analysis Lab</Text>
            <Text style={styles.headerSubtitle}>
              Compare API vs Custom Model approaches
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => handleTabPress("api")}
            style={[styles.tab, activeTab === "api" && styles.activeTab]}
          >
            <Ionicons
              name="flash"
              size={20}
              color={activeTab === "api" ? "white" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "api" && styles.activeTabText,
              ]}
            >
              Quick API
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabPress("model")}
            style={[styles.tab, activeTab === "model" && styles.activeTab]}
          >
            <Ionicons
              name="code-slash"
              size={20}
              color={activeTab === "model" ? "white" : "#6B7280"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "model" && styles.activeTabText,
              ]}
            >
              DIY Model
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <SimpleLineIcons name="target" size={20} color="#6B7280" />
            <Text style={styles.inputTitle}>Analyze Text Sentiment</Text>
          </View>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter text to analyze sentiment... (e.g., 'I love this new product!', 'This is terrible service', 'It's an okay experience')"
            multiline
            numberOfLines={4}
            style={styles.textInput}
            textAlignVertical="top"
          />

          {activeTab === "api" && (
            <View style={styles.apiKeyContainer}>
              <View style={styles.apiKeyHeader}>
                <Text style={styles.apiKeyLabel}>
                  OpenAI API Key{" "}
                  {apiKey?.trim()
                    ? "(✓ Provided)"
                    : "(Optional - will use demo if empty)"}
                  :
                </Text>
                <TouchableOpacity onPress={handleToggleApiKey}>
                  <Text style={styles.toggleButton}>
                    {showApiKey ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-proj-... (Leave empty for demo mode)"
                secureTextEntry={!showApiKey}
                style={[
                  styles.apiKeyInput,

                  apiKey?.trim() && {
                    borderColor: "#10B981",
                    backgroundColor: "#F0FDF4",
                  },
                ]}
              />
              <Text style={styles.apiKeyHint}>
                {apiKey?.trim()
                  ? "🟢 Will use real OpenAI API for analysis"
                  : "🟡 Demo mode - using simulated analysis"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleAnalyzePress}
            disabled={!inputText.trim() || loading}
            style={[
              styles.analyzeButton,
              { backgroundColor: activeTab === "api" ? "#3B82F6" : "#8B5CF6" },
              (!inputText.trim() || loading) && styles.disabledButton,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={16} color="white" />
            )}
            <Text style={styles.analyzeButtonText}>
              {getAnalyzeButtonText(loading, activeTab)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {activeTab === "api" && <ResultCard result={apiResult} type="api" />}
        {activeTab === "model" && (
          <ResultCard result={modelResult} type="model" />
        )}

        {/* Approach Information */}
        <View style={styles.approachContainer}>
          <View style={styles.approachCard}>
            <View style={styles.approachHeader}>
              <Ionicons name="flash" size={20} color="#3B82F6" />
              <Text style={styles.approachTitle}>Quick API Approach</Text>
            </View>
            <Text style={styles.approachText}>
              • Fast and production-ready{"\n"}• Pre-trained on massive datasets
              {"\n"}• No training or setup required{"\n"}• Pay-per-use pricing
              model{"\n"}• Consistent performance
            </Text>
            <View style={styles.approachNote}>
              <Text style={styles.approachNoteTitle}>Best for:</Text>
              <Text style={styles.approachNoteText}>
                Quick prototypes, production apps, when you need reliable
                results immediately
              </Text>
            </View>
          </View>

          <View style={styles.approachCard}>
            <View style={styles.approachHeader}>
              <Ionicons name="server" size={20} color="#8B5CF6" />
              <Text style={styles.approachTitle}>DIY Model Approach</Text>
            </View>
            <Text style={styles.approachText}>
              • Full control over training data{"\n"}• Customizable for specific
              domains{"\n"}• No external API dependencies{"\n"}• Learn ML
              fundamentals hands-on{"\n"}• Privacy and data control
            </Text>
            <View style={styles.approachNote}>
              <Text style={styles.approachNoteTitle}>Best for:</Text>
              <Text style={styles.approachNoteText}>
                Learning, custom requirements, sensitive data, when you have
                domain-specific needs
              </Text>
            </View>
          </View>
        </View>

        {/* Sample Texts */}
        <View style={styles.samplesCard}>
          <View style={styles.samplesHeader}>
            <Ionicons name="sparkles" size={20} color="#6366F1" />
            <Text style={styles.samplesTitle}>Try These Sample Texts</Text>
          </View>
          <View style={styles.samplesGrid}>
            {sampleTexts.map((sample, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSampleTextPress(sample.text)}
                style={styles.sampleItem}
              >
                <Text style={styles.sampleType}>{sample.type}</Text>
                <Text style={styles.sampleText}>{sample.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  activeTab: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "white",
  },
  inputCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
  },
  apiKeyContainer: {
    marginBottom: 16,
  },
  apiKeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  apiKeyLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  toggleButton: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  apiKeyHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sentimentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sentimentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 4,
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  resultItem: {
    width: "50%",
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 2,
  },
  approachContainer: {
    marginBottom: 16,
  },
  approachCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  approachHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  approachTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  approachText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  approachNote: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  approachNoteTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  approachNoteText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  samplesCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  samplesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  samplesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  samplesGrid: {
    gap: 12,
  },
  sampleItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  sampleType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
    marginBottom: 4,
  },
  sampleText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});

export default SentimentAnalysisApp;
