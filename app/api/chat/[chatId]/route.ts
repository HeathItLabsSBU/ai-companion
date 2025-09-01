import dotenv from "dotenv";
import { StreamingTextResponse, LangChainStream } from "ai";
import { Replicate } from "langchain/llms/replicate";
import { CallbackManager } from "langchain/callbacks";
import { NextResponse } from "next/server";
import ollama from "@/lib/ollama";
import { supabase } from "@/lib/supabase-client";

dotenv.config({ path: `.env` });

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const userId = "user"; // Replace with actual user ID from auth later

    console.log("Chat request for companion:", params.chatId);
    console.log("User prompt:", prompt);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!prompt || prompt.trim() === "") {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    // Get companion data from Supabase
    const { data: companion, error: companionError } = await supabase
      .from('companions')
      .select('*')
      .eq('id', params.chatId)
      .single();

    if (companionError || !companion) {
      console.error("Companion not found:", companionError);
      return new NextResponse("Companion not found", { status: 404 });
    }

    console.log("Found companion:", companion.name);

    // Create user message in database
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        content: prompt,
        role: 'user',
        user_id: userId,
        companion_id: params.chatId
      });

    if (userMessageError) {
      console.error("Error creating user message:", userMessageError);
    }

    // Get recent chat history from database (last 10 messages)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('companion_id', params.chatId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build conversation context
    let conversationHistory = "";
    if (recentMessages && recentMessages.length > 0) {
      // Reverse to get chronological order
      const chronologicalMessages = recentMessages.reverse();
      conversationHistory = chronologicalMessages
        .map(msg => `${msg.role === 'user' ? 'Human' : companion.name}: ${msg.content}`)
        .join('\n');
    } else {
      // Use seed conversation if no history
      conversationHistory = companion.seed || "";
    }

    // Create the prompt for Ollama
    const ollamaPrompt = `${companion.instructions}

Previous conversation:
${conversationHistory}

Human: ${prompt}
${companion.name}:`;

    console.log("Sending prompt to Ollama:", ollamaPrompt);

    // Call Ollama for inference
    const response = await ollama.generate({
      model: process.env.OLLAMA_MODEL || 'llama2',
      prompt: ollamaPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
      }
    });

    const cleanedResponse = response.response.trim();
    console.log("Ollama response:", cleanedResponse);

    if (cleanedResponse && cleanedResponse.length > 1) {
      // Save the response to the database
      const { error: assistantMessageError } = await supabase
        .from('messages')
        .insert({
          content: cleanedResponse,
          role: 'system',
          user_id: userId,
          companion_id: params.chatId
        });

      if (assistantMessageError) {
        console.error("Error creating assistant message:", assistantMessageError);
      }
    }

    return new NextResponse(cleanedResponse, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error("Error in chat handler:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
