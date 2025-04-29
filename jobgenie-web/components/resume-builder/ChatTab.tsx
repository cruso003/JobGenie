// src/components/resume-builder/ChatTab.tsx
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Eye, RefreshCw } from "lucide-react";
import { ChatMessage } from "@/types/resume-builder";

interface ChatTabProps {
  chatMessages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  sendMessage: () => void;
  previewDocument: (html: string) => void;
}

export default function ChatTab({
  chatMessages,
  messagesEndRef,
  isLoading,
  currentMessage,
  setCurrentMessage,
  sendMessage,
  previewDocument
}: ChatTabProps) {
  return (
    <>
      <ScrollArea className="flex-1 p-4">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block max-w-[85%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="mb-1 font-medium text-sm">
                {message.role === "user" ? "You" : "AI Assistant"}
              </div>
              <p className="text-sm">{message.content}</p>
              {message.html && message.role === "assistant" && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => previewDocument(message.html || "")}
                    className="text-xs mt-2"
                  >
                    <Eye className="h-3 w-3 mr-1" /> View Document
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center p-3 bg-muted rounded-lg mb-4 max-w-[85%]">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <p className="text-sm">AI is thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask for changes or improvements..."
            className="min-h-[80px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            className="self-end"
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!isLoading && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                setCurrentMessage("Make the font larger");
                setTimeout(() => sendMessage(), 100);
              }}
            >
              Make font larger
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                setCurrentMessage("Add a skills section");
                setTimeout(() => sendMessage(), 100);
              }}
            >
              Add skills section
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                setCurrentMessage("Make it more concise");
                setTimeout(() => sendMessage(), 100);
              }}
            >
              Make more concise
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
