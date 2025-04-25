"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, AlertTriangle } from "lucide-react";
import { Base64 } from "js-base64";
import { GeminiWebSocket } from "@/lib/services/geminiWebSocket";
import { motion } from "framer-motion";
import { useToast } from "../ui/use-toast";

interface CameraPreviewProps {
  onTranscription: (text: string) => void;
  onAITranscription?: (text: string) => void;
  setWebSocketRef?: (ws: GeminiWebSocket | null) => void;
  onTimerControl?: (shouldRun: boolean) => void;
  onConnectionError?: (error: string) => void;
  onStartInterview?: () => Promise<boolean>;
  canCreateInterview?: boolean;
  interviewContext?: {
    type: string;
    role: string;
    company?: string;
  };
}

export default function CameraPreview({
  onTranscription,
  onAITranscription,
  setWebSocketRef,
  onTimerControl,
  onConnectionError,
  onStartInterview,
  canCreateInterview = true,
  interviewContext,
}: CameraPreviewProps) {

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const geminiWsRef = useRef<GeminiWebSocket | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [isAudioSetup, setIsAudioSetup] = useState(false);
  const setupInProgressRef = useRef(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showCompressionIndicator, setShowCompressionIndicator] = useState(false);
  const { toast } = useToast();

  const cleanupAudio = useCallback(() => {
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch((err) =>
        console.error("[CameraPreview] Error closing audio context:", err)
      );
      audioContextRef.current = null;
    }
    setIsAudioSetup(false);
  }, []);

  const cleanupWebSocket = useCallback(() => {
    if (geminiWsRef.current) {
      geminiWsRef.current.disconnect();
      geminiWsRef.current = null;
    }
    setWebSocketRef?.(null);
    setIsWebSocketReady(false);
    setConnectionStatus("disconnected");
    setConnectionError(null);
    onTimerControl?.(false);
  }, [setWebSocketRef, onTimerControl]);

  const sendAudioData = useCallback(
    (b64Data: string) => {
      if (!geminiWsRef.current || !isWebSocketReady) {
        return;
      }
      geminiWsRef.current.sendMediaChunk(b64Data, "audio/pcm");
    },
    [isWebSocketReady]
  );

  const captureAndSendImage = useCallback(() => {
    if (!videoRef.current || !videoCanvasRef.current || !geminiWsRef.current || !isWebSocketReady) {
      return;
    }

    const canvas = videoCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    const b64Data = imageData.split(",")[1];
    geminiWsRef.current.sendMediaChunk(b64Data, "image/jpeg");
  }, [isWebSocketReady]);

  const toggleCamera = useCallback(async () => {
    
    if (isStreaming && stream) {
      setIsStreaming(false);
      cleanupWebSocket();
      cleanupAudio();
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
      setConnectionStatus("disconnected");
    } else {
      if (canCreateInterview === false) {
        toast({
          title: "Interview Limit Reached",
          description: "You've used all your free interviews this month. Upgrade to Pro for unlimited interviews.",
          variant: "destructive",
        });
        return;
      }
      
      if (onStartInterview) {
        setConnectionStatus("connecting");
        const success = await onStartInterview();
        if (!success) {
          setConnectionStatus("disconnected");
          return;
        }
      }
      
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
  
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            noiseSuppression: true,
          },
        });
        audioContextRef.current = new AudioContext({
          sampleRate: 24000,
        });
  
        if (!videoRef.current) {
          console.error("[CameraPreview] videoRef.current is null");
          videoStream.getTracks().forEach((track) => track.stop());
          audioStream.getTracks().forEach((track) => track.stop());
          return;
        }
  
        videoRef.current.srcObject = videoStream;
        videoRef.current.muted = true;
  
        const combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioStream.getAudioTracks(),
        ]);
        setStream(combinedStream);
        setIsStreaming(true);
        setConnectionStatus("connecting");
      } catch (err) {
        console.error("[CameraPreview] Error accessing media devices:", err);
        cleanupAudio();
        setIsStreaming(false);
        setStream(null);
        setConnectionStatus("disconnected");
        
        toast({
          title: "Camera Access Error",
          description: "Could not access your camera or microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    }
  }, [isStreaming, stream, cleanupWebSocket, cleanupAudio, canCreateInterview, onStartInterview, toast]);

  useEffect(() => {
    if (!isStreaming || !stream) {
      return;
    }

    const handleTextReceived = (text: string) => {
      if (onAITranscription && text && text.trim()) {
        onAITranscription(text);
      }
    };

    const handleReady = () => {
      setIsWebSocketReady(true);
      setConnectionStatus("connected");
      onTimerControl?.(true);
      if (geminiWsRef.current) {
        setWebSocketRef?.(geminiWsRef.current);
      }
    };

    const handleSpeakingStateChange = (isPlaying: boolean) => {
      setIsModelSpeaking(isPlaying);
    };

    const handleAudioLevelChange = (level: number) => {
      setOutputAudioLevel(level);
    };

    const handleError = (error: string) => {
      setIsWebSocketReady(false);
      setConnectionStatus("error");
      setConnectionError(error);
      onConnectionError?.(error);
      onTimerControl?.(false);
    };

    geminiWsRef.current = new GeminiWebSocket(
      handleTextReceived,
      handleReady,
      handleSpeakingStateChange,
      handleAudioLevelChange,
      onTranscription,
      handleError,
      interviewContext
    );
    geminiWsRef.current.connect();

    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
      cleanupWebSocket();
    };
  }, [isStreaming, stream, onTranscription, onAITranscription, cleanupWebSocket, setWebSocketRef, onTimerControl, onConnectionError]);

  useEffect(() => {
    if (!isStreaming || !stream || !isWebSocketReady) {
      return;
    }

    imageIntervalRef.current = setInterval(captureAndSendImage, 1000);

    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
    };
  }, [isStreaming, stream, isWebSocketReady, captureAndSendImage]);

  useEffect(() => {
    if (
      !isStreaming ||
      !stream ||
      !audioContextRef.current ||
      !isWebSocketReady ||
      isAudioSetup ||
      setupInProgressRef.current
    ) {
      return;
    }

    let isActive = true;
    setupInProgressRef.current = true;

    const setupAudioProcessing = async () => {
      try {
        const ctx = audioContextRef.current;
        if (!ctx || ctx.state === "closed" || !isActive) {
          setupInProgressRef.current = false;
          return;
        }

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        await ctx.audioWorklet.addModule("/worklets/audio-processor.js");

        if (!isActive) {
          setupInProgressRef.current = false;
          return;
        }

        audioWorkletNodeRef.current = new AudioWorkletNode(ctx, "audio-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          processorOptions: {
            sampleRate: 24000,
            bufferSize: 4096,
          },
          channelCount: 1,
          channelCountMode: "explicit",
          channelInterpretation: "speakers",
        });

        audioWorkletNodeRef.current.port.onmessage = (event) => {
          if (!isActive || isModelSpeaking) return;
          const { pcmData, level } = event.data;
          setAudioLevel(level * 100);

          const pcmArray = new Uint8Array(pcmData);
          const b64Data = Base64.fromUint8Array(pcmArray);
          sendAudioData(b64Data);
        };

        const source = ctx.createMediaStreamSource(stream);
        source.connect(audioWorkletNodeRef.current);
        setIsAudioSetup(true);
        setupInProgressRef.current = false;
      } catch (error) {
        console.error("[CameraPreview] Error setting up audio processing:", error);
        if (isActive) {
          cleanupAudio();
          setIsAudioSetup(false);
        }
        setupInProgressRef.current = false;
      }
    };

    setupAudioProcessing();

    return () => {
      isActive = false;
      setIsAudioSetup(false);
      setupInProgressRef.current = false;
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
    };
  }, [isStreaming, stream, isWebSocketReady, isModelSpeaking, sendAudioData, cleanupAudio]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (geminiWsRef.current && isWebSocketReady) {
        const now = Date.now();
        const compressionInterval = 300000;
        if ((now - geminiWsRef.current.getSessionStartTime()) % compressionInterval < 1000) {
          setShowCompressionIndicator(true);
          setTimeout(() => setShowCompressionIndicator(false), 2000);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isWebSocketReady]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-[640px] h-[480px] bg-black rounded-lg overflow-hidden"
        />
        {isStreaming && connectionStatus !== "connected" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="text-center space-y-2">
              {connectionStatus === "error" ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
                  <p className="text-white font-medium">Connection Error</p>
                  <p className="text-white/70 text-sm max-w-xs">
                    {connectionError || "Unable to connect to the interview service."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 text-white border-white/50 hover:bg-white/10"
                    onClick={toggleCamera}
                  >
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
                  <p className="text-white font-medium">
                    {connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
                  </p>
                  <p className="text-white/70 text-sm">Please wait while we set up the session</p>
                </>
              )}
            </div>
          </div>
        )}
        {showCompressionIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm"
          >
            Optimizing session...
          </motion.div>
        )}
        <Button
          onClick={toggleCamera}
          size="icon"
          className={`absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full w-12 h-12 backdrop-blur-sm transition-colors
            ${
              isStreaming
                ? "bg-red-500/50 hover:bg-red-500/70 text-white"
                : "bg-green-500/50 hover:bg-green-500/70 text-white"
            }`}
        >
          {isStreaming ? (
            <VideoOff className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </Button>
      </div>
      {isStreaming && connectionStatus === "connected" && (
        <div className="w-[640px] h-2 rounded-full bg-green-100">
          <div
            className="h-full rounded-full transition-all bg-green-500"
            style={{
              width: `${isModelSpeaking ? outputAudioLevel : audioLevel}%`,
              transition: "width 100ms ease-out",
            }}
          />
        </div>
      )}
      <canvas ref={videoCanvasRef} className="hidden" />
    </div>
  );
}
