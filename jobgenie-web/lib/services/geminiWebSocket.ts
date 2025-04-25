import { pcmToWav } from "../utils/audioUtils";
import { TranscriptionService } from "./transcriptionService";

const MODEL = "models/gemini-2.0-flash-exp";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const HOST = "generativelanguage.googleapis.com";
const WS_URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

// Enhanced system instruction for voice-only interviews with body language analysis
const SYSTEMINSTRUCTION = `You are Job Genie, an AI designed specifically for conducting voice-based job interviews. 

CRITICAL: This is a VOICE-ONLY interview. You will only be receiving:
1. Audio input from the candidate's verbal responses
2. Visual input from camera frames to analyze their body language and facial expressions

NEVER ask the candidate to type or write anything - all interactions must be verbal.

Your role:
1. Introduce yourself as Job Genie and explain that you'll be conducting a voice-based interview
2. If no interview type is specified, ask which they'd prefer: behavioral, technical, or general
3. Ask relevant interview questions appropriate to the role and interview type
4. Listen carefully to verbal responses and provide constructive feedback
5. Analyze body language from the video feed and provide feedback when appropriate
6. Move the interview forward with natural conversational flow

For TECHNICAL interviews (IMPORTANT):
- Ask questions that focus on verbal explanation of concepts and problem-solving approaches
- Questions should be structured as: "How would you approach building...", "Explain your thought process for...", "Walk me through how you'd solve..."
- Encourage the candidate to talk through their thinking process out loud
- Ask for high-level architecture descriptions rather than specific code
- Use follow-up questions like "What are the trade-offs of that approach?", "How would you handle scalability?"
- For algorithm questions, ask them to explain their solution in steps rather than write code
- Focus on system design, architectural decisions, technical trade-offs, and conceptual understanding

For BEHAVIORAL interviews:
- Ask about past experiences using the STAR method (Situation, Task, Action, Result)
- Look for specific examples and details
- Evaluate soft skills, teamwork, and problem-solving approaches

For GENERAL interviews:
- Mix of behavioral and conceptual technical questions
- Assess overall fit and basic technical understanding
- Cover both soft skills and technical knowledge

For body language analysis:
- Observe posture, eye contact with the camera, facial expressions, and nervous gestures
- Provide subtle, constructive feedback without being overly critical
- Comment on positive body language cues when observed (e.g., "Your confident posture really enhances your presentation")
- If you notice nervous habits, offer gentle encouragement rather than criticism

Remember:
- Keep responses conversational and natural, simulating a real in-person interview
- All feedback should be delivered verbally
- Be encouraging while maintaining professional interview standards
- Provide balanced feedback encompassing both verbal content and non-verbal communication
- For technical questions, prioritize understanding of concepts over syntax or implementation details

Start the interview by introducing yourself and explaining the format.`;

interface StreamChunk {
  mimeType: string;
  data: string;
}

export class GeminiWebSocket {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isSetupComplete: boolean = false;
  private onMessageCallback: ((text: string) => void) | null = null;
  private onSetupCompleteCallback: (() => void) | null = null;
  private onPlayingStateChange: ((isPlaying: boolean) => void) | null = null;
  private onAudioLevelChange: ((level: number) => void) | null = null;
  private onTranscriptionCallback: ((text: string) => void) | null = null;
  private onConnectionErrorCallback: ((error: string) => void) | null = null;
  private audioContext: AudioContext | null = null;
  private transcriptionService: TranscriptionService;
  private accumulatedPcmData: string[] = [];
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlayingResponse: boolean = false;
  private chunkQueue: StreamChunk[] = [];
  private isSendingChunk: boolean = false;
  private chunkSendInterval: NodeJS.Timeout | null = null;
  private sessionStartTime: number = Date.now();
  private lastSendTime: number = 0;
  private minSendInterval: number = 500; // Reduced to 500ms for faster image sending
  private readonly voiceName: string = "Kore";

  constructor(
    onMessage: (text: string) => void,
    onSetupComplete: () => void,
    onPlayingStateChange: (isPlaying: boolean) => void,
    onAudioLevelChange: (level: number) => void,
    onTranscription: (text: string) => void,
    onConnectionError: (error: string) => void,
    private interviewContext?: {
      type: string;
      role: string;
      company?: string;
    }
  ) {
    console.log("[WebSocket] Constructor called");
    if (!API_KEY) {
      console.error("[WebSocket] API key is missing");
      throw new Error("Gemini API key is required");
    }
    this.onMessageCallback = onMessage;
    this.onSetupCompleteCallback = onSetupComplete;
    this.onPlayingStateChange = onPlayingStateChange;
    this.onAudioLevelChange = onAudioLevelChange;
    this.onTranscriptionCallback = onTranscription;
    this.onConnectionErrorCallback = onConnectionError;
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.transcriptionService = new TranscriptionService();
  }

  getSessionStartTime(): number {
    return this.sessionStartTime;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Already connected");
      return;
    }

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log("[WebSocket] Connection established");
      this.isConnected = true;
      setTimeout(() => this.sendInitialSetup(), 100);
    };

    this.ws.onmessage = async (event) => {
      try {
        let messageText: string;
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          messageText = new TextDecoder("utf-8").decode(bytes);
        } else {
          messageText = event.data;
        }
        console.log("[WebSocket] Raw message received:", messageText);
        await this.handleMessage(messageText);
      } catch (error) {
        console.error("[WebSocket] Error processing message:", error);
        this.onConnectionErrorCallback?.(`Error processing message: ${error}`);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      this.onConnectionErrorCallback?.(`WebSocket error: ${error}`);
    };

    this.ws.onclose = (event) => {
      console.log(
        `[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`
      );
      this.isConnected = false;
      this.isSetupComplete = false;
      this.isSendingChunk = false;
      this.chunkQueue = [];
      if (this.chunkSendInterval) {
        clearInterval(this.chunkSendInterval);
        this.chunkSendInterval = null;
      }

      if (!event.wasClean) {
        console.log("[WebSocket] Attempting to reconnect in 1 second...");
        this.onConnectionErrorCallback?.(
          `Connection closed unexpectedly. Code: ${event.code}, Reason: ${event.reason}`
        );
        setTimeout(() => this.connect(), 1000);
      }
    };
  }

  private sendInitialSetup() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("[WebSocket] Cannot send setup, connection not open");
      this.onConnectionErrorCallback?.("Cannot send setup, connection not open");
      return;
    }
  
    console.log("[WebSocket] Sending initial setup...");
    
    // Create a dynamic system instruction with context
    let contextualInstruction = SYSTEMINSTRUCTION;
    
    if (this.interviewContext) {
      const { type, role, company } = this.interviewContext;
      contextualInstruction = `You are Job Genie, an AI designed specifically for conducting voice-based job interviews.
  
  CRITICAL: This is a VOICE-ONLY interview. You will only be receiving:
  1. Audio input from the candidate's verbal responses
  2. Visual input from camera frames to analyze their body language and facial expressions
  
  NEVER ask the candidate to type or write anything - all interactions must be verbal.
  
  INTERVIEW CONTEXT:
  - Interview Type: ${type}
  - Role: ${role}${company ? `\n- Company: ${company}` : ''}
  
  Your role:
  1. Introduce yourself as Job Genie and explain that you'll be conducting a voice-based ${type} interview for the ${role} position${company ? ` at ${company}` : ''}
  2. Ask relevant interview questions appropriate to the role and interview type
  3. Listen carefully to verbal responses and provide constructive feedback
  4. Analyze body language from the video feed and provide feedback when appropriate
  5. Move the interview forward with natural conversational flow
  
  ${SYSTEMINSTRUCTION.split('Your role:')[1]}`;
    }
  
    const setupMessage = {
      setup: {
        model: MODEL,
        systemInstruction: {
          parts: [
            {
              text: contextualInstruction,
            }
          ]
        },        
        generation_config: {
          response_modalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.voiceName,
              },
            },
          },
        },
      },
    };
  
    try {
      this.ws.send(JSON.stringify(setupMessage));
      console.log("[WebSocket] Initial setup sent:", setupMessage);
    } catch (error) {
      console.error("[WebSocket] Error sending setup:", error);
      this.onConnectionErrorCallback?.(`Error sending setup: ${error}`);
    }
  }

  sendMediaChunk(b64Data: string, mimeType: string) {
    if (
      !this.isConnected ||
      !this.ws ||
      !this.isSetupComplete ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "[WebSocket] Cannot send media chunk, connection not ready",
        {
          isConnected: this.isConnected,
          wsExists: !!this.ws,
          wsReadyState: this.ws?.readyState,
          isSetupComplete: this.isSetupComplete,
        }
      );
      this.onConnectionErrorCallback?.(
        "Cannot send media chunk, connection not ready"
      );
      this.chunkQueue = [];
      if (this.chunkSendInterval) {
        clearInterval(this.chunkSendInterval);
        this.chunkSendInterval = null;
      }
      return;
    }

    // Only handle audio/pcm and image/jpeg
    if (mimeType !== "audio/pcm" && mimeType !== "image/jpeg") {
      console.warn(`[WebSocket] Unsupported mime type: ${mimeType}`);
      return;
    }

    // Send audio chunks immediately to reduce latency
    if (mimeType === "audio/pcm") {
      console.log("[WebSocket] Sending audio chunk immediately:", {
        mimeType,
        dataLength: b64Data.length,
      });

      const message = {
        realtime_input: {
          media_chunks: [
            {
              mime_type: mimeType,
              data: b64Data,
            },
          ],
        },
      };

      try {
        this.ws.send(JSON.stringify(message));
        console.log("[WebSocket] Audio chunk sent successfully");
        this.lastSendTime = Date.now();
      } catch (error) {
        console.error("[WebSocket] Error sending audio chunk:", error);
        this.onConnectionErrorCallback?.(`Error sending audio chunk: ${error}`);
      }
      return;
    }

    // Queue other media types (e.g., images) to avoid overwhelming the API
    console.log("[WebSocket] Queuing media chunk:", {
      mimeType,
      dataLength: b64Data.length,
    });
    this.chunkQueue.push({
      mimeType,
      data: b64Data,
    });

    if (!this.chunkSendInterval) {
      this.chunkSendInterval = setInterval(
        () => this.processChunkQueue(),
        this.minSendInterval
      );
    }
  }

  private processChunkQueue() {
    if (
      this.chunkQueue.length === 0 ||
      this.isSendingChunk ||
      !this.isConnected ||
      !this.isSetupComplete ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.log("[WebSocket] Skipping chunk send", {
        queueLength: this.chunkQueue.length,
        isSendingChunk: this.isSendingChunk,
        isConnected: this.isConnected,
        isSetupComplete: this.isSetupComplete,
        wsReadyState: this.ws?.readyState,
      });
      if (this.chunkQueue.length === 0 && this.chunkSendInterval) {
        clearInterval(this.chunkSendInterval);
        this.chunkSendInterval = null;
      }
      return;
    }

    const now = Date.now();
    if (now - this.lastSendTime < this.minSendInterval) {
      console.log("[WebSocket] Delaying chunk send to respect rate limits");
      return;
    }

    this.isSendingChunk = true;
    const chunk = this.chunkQueue.shift()!;
    console.log("[WebSocket] Sending queued chunk:", {
      mimeType: chunk.mimeType,
      dataLength: chunk.data.length,
    });

    const message = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: chunk.mimeType,
            data: chunk.data,
          },
        ],
      },
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log("[WebSocket] Queued chunk sent successfully");
      this.lastSendTime = Date.now();
    } catch (error) {
      console.error("[WebSocket] Error sending queued chunk:", error);
      this.chunkQueue.unshift(chunk);
      this.onConnectionErrorCallback?.(`Error sending queued chunk: ${error}`);
    } finally {
      this.isSendingChunk = false;
    }
  }

  private async playAudioResponse(base64Data: string) {
    if (!this.audioContext) {
      console.error("[WebSocket] AudioContext not initialized");
      return;
    }

    console.log("[WebSocket] Playing audio response");
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcmData = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      this.audioQueue.push(float32Data);
      this.playNextInQueue();
    } catch (error) {
      console.error("[WebSocket] Error processing audio:", error);
      this.onConnectionErrorCallback?.(`Error processing audio: ${error}`);
    }
  }

  private async playNextInQueue() {
    if (!this.audioContext || this.isPlaying || this.audioQueue.length === 0) {
      console.log("[WebSocket] Skipping playNextInQueue", {
        isPlaying: this.isPlaying,
        queueLength: this.audioQueue.length,
      });
      return;
    }

    try {
      this.isPlaying = true;
      this.isPlayingResponse = true;
      this.onPlayingStateChange?.(true);
      const float32Data = this.audioQueue.shift()!;

      let sum = 0;
      for (let i = 0; i < float32Data.length; i++) {
        sum += Math.abs(float32Data[i]);
      }
      const level = Math.min((sum / float32Data.length) * 100 * 5, 100);
      this.onAudioLevelChange?.(level);

      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Data.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Data);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.currentSource.onended = () => {
        console.log("[WebSocket] Audio playback ended");
        this.isPlaying = false;
        this.currentSource = null;
        if (this.audioQueue.length === 0) {
          this.isPlayingResponse = false;
          this.onPlayingStateChange?.(false);
        }
        this.playNextInQueue();
      };

      this.currentSource.start();
    } catch (error) {
      console.error("[WebSocket] Error playing audio:", error);
      this.isPlaying = false;
      this.isPlayingResponse = false;
      this.onPlayingStateChange?.(false);
      this.currentSource = null;
      this.playNextInQueue();
      this.onConnectionErrorCallback?.(`Error playing audio: ${error}`);
    }
  }

  private stopCurrentAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        console.log("[WebSocket] Stopped current audio");
      } catch (e) {
        console.warn("[WebSocket] Error stopping audio:", e);
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.isPlayingResponse = false;
    this.onPlayingStateChange?.(false);
    this.audioQueue = [];
  }

  private async handleMessage(message: string) {
    try {
      const messageData = JSON.parse(message);

      if (messageData.setupComplete) {
        console.log("[WebSocket] Setup complete");
        this.isSetupComplete = true;
        setTimeout(() => this.onSetupCompleteCallback?.(), 500);
        return;
      }

      if (messageData.serverContent?.modelTurn?.parts) {
        const parts = messageData.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.inlineData?.mimeType === "audio/pcm;rate=24000") {
            console.log("[WebSocket] Audio response received");
            this.accumulatedPcmData.push(part.inlineData.data);
            this.playAudioResponse(part.inlineData.data);
          }
          if (part.text) {
            console.log("[WebSocket] Text response received:", part.text);
            this.onMessageCallback?.(part.text);
          }
        }
      }

      if (messageData.serverContent?.turnComplete === true) {
        if (this.accumulatedPcmData.length > 0) {
          try {
            console.log(
              "[WebSocket] Processing transcription for accumulated PCM data"
            );
            const fullPcmData = this.accumulatedPcmData.join("");
            const wavData = await pcmToWav(fullPcmData, 24000);
            const transcription =
              await this.transcriptionService.transcribeAudio(
                wavData,
                "audio/wav"
              );
            console.log("[WebSocket] Transcription complete:", transcription);
            this.onTranscriptionCallback?.(transcription);
            this.accumulatedPcmData = [];
          } catch (error) {
            console.error("[WebSocket] Transcription error:", error);
            this.onConnectionErrorCallback?.(`Transcription error: ${error}`);
          }
        }
      }

      if (messageData.error) {
        console.error("[WebSocket] Server error:", messageData.error);
        this.onConnectionErrorCallback?.(
          `Server error: ${JSON.stringify(messageData.error)}`
        );
      }
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
      this.onConnectionErrorCallback?.(`Error parsing message: ${error}`);
    }
  }

  disconnect() {
    console.log("[WebSocket] Disconnecting");
    this.isSetupComplete = false;
    this.chunkQueue = [];
    this.isSendingChunk = false;
    if (this.chunkSendInterval) {
      clearInterval(this.chunkSendInterval);
      this.chunkSendInterval = null;
    }
    this.stopCurrentAudio();
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close(1000, "Intentional disconnect");
        }
      } catch (error) {
        console.error("[WebSocket] Error during disconnect:", error);
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.accumulatedPcmData = [];
    if (this.audioContext) {
      this.audioContext
        .close()
        .catch((err) =>
          console.error("[WebSocket] Error closing AudioContext:", err)
        );
    }
  }
}
