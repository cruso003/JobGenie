// src/components/resume-builder/HistoryTab.tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, Eye } from "lucide-react";
import { ChatMessage } from "@/types/resume-builder";

interface HistoryTabProps {
  chatMessages: ChatMessage[];
  previewDocument: (html: string) => void;
}

export default function HistoryTab({ chatMessages, previewDocument }: HistoryTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Document History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-5 border-l-2 border-muted space-y-4 py-2">
          {chatMessages
            .filter(message => message.role === "assistant" && message.html)
            .map((message, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[18px] top-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">
                    Revision {index + 1}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {message.timestamp.toLocaleString()}
                  </div>
                  <div className="p-3 rounded-md bg-muted/50 text-sm border">
                    {message.content}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-8"
                      onClick={() => previewDocument(message.html || "")}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
