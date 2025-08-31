import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";

// Temporarily disable Redis functionality
export type CompanionKey = {
  companionName: string;
  modelName: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;

  public constructor() {
    // Temporarily disabled Redis
    console.log("Memory manager initialized without Redis");
  }

  public async init() {
    console.log("Memory manager init - Redis disabled");
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
    }
    return MemoryManager.instance;
  }

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    console.log("writeToHistory disabled - Redis not available");
    return "";
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    console.log("readLatestHistory disabled - Redis not available");
    return "";
  }

  public async seedChatHistory(
    seedContent: String,
    delimiter: string = "\n",
    companionKey: CompanionKey
  ) {
    console.log("seedChatHistory disabled - Redis not available");
    return;
  }

  public async vectorSearch(
    recentChatHistory: string,
    companionFileName: string
  ) {
    console.log("vectorSearch disabled - Vector DB not available");
    return [];
  }
}

