// src/components/resume-builder/PreviewPanel.tsx
import { Button } from "@/components/ui/button";
import { Eye, ZoomIn, ZoomOut, Printer, Maximize, FileText } from "lucide-react";

interface PreviewPanelProps {
    currentHtml: string;
    zoomLevel: number;
    setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
    setShowPreview: (show: boolean) => void;
    previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  }

export default function PreviewPanel({
  currentHtml,
  zoomLevel,
  setZoomLevel,
  setShowPreview,
  previewIframeRef
}: PreviewPanelProps) {
  return (
    <div className="hidden md:flex flex-col w-1/2 border-l">
      <div className="p-3 border-b bg-card/80 flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          Live Preview
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-muted/70 rounded-md h-8 px-1 mr-1">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel((prev) => Math.min(1.5, prev + 0.1))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="h-8"
          >
            <Maximize className="h-3.5 w-3.5 mr-1.5" />
            Expand
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
        {currentHtml ? (
          <div
            className="bg-white shadow-lg w-full max-w-[21cm] mx-auto"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top center",
              height: "29.7cm",
            }}
          >
            <iframe
              ref={previewIframeRef}
              srcDoc={currentHtml}
              title="Document Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="text-center p-12 bg-muted/50 rounded-lg border border-dashed">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Document Yet</h3>
            <p className="text-muted-foreground mt-2">
              Your document preview will appear here after generation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
