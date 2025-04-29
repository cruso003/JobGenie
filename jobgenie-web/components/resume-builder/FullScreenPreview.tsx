// src/components/resume-builder/FullScreenPreview.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft, ZoomIn, ZoomOut, Printer, Download, X } from "lucide-react";

interface FullScreenPreviewProps {
  currentHtml: string;
  zoomLevel: number;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setShowPreview: (show: boolean) => void;
  isCreatingCoverLetter: boolean;
  exportPdf: () => void;
  isLoading: boolean;
}

export default function FullScreenPreview({
  currentHtml,
  zoomLevel,
  setZoomLevel,
  setShowPreview,
  isCreatingCoverLetter,
  exportPdf,
  isLoading
}: FullScreenPreviewProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold text-lg">
            {isCreatingCoverLetter ? "Cover Letter" : "Resume"} Preview
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-muted rounded-md text-sm">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setZoomLevel((prev: number) => Math.max(0.5, prev - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
           </Button>
           <span className="w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
           <Button 
             variant="ghost" 
             size="icon"
             onClick={() => setZoomLevel((prev) => Math.min(1.5, prev + 0.1))}
           >
             <ZoomIn className="h-4 w-4" />
           </Button>
         </div>
         <Button variant="outline" size="sm" onClick={() => window.print()}>
           <Printer className="h-4 w-4 mr-2" />
           Print
         </Button>
         <Button 
           variant="outline" 
           size="sm" 
           onClick={exportPdf}
           disabled={isLoading}
         >
           <Download className="h-4 w-4 mr-2" />
           Export
         </Button>
       </div>
     </div>
     <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-4">
       <div
         className="w-full max-w-[21cm] bg-white shadow-lg mx-auto"
         style={{
           transform: `scale(${zoomLevel})`,
           transformOrigin: "top center",
           height: "29.7cm",
         }}
       >
         <iframe
           srcDoc={currentHtml}
           title="Document Preview"
           className="w-full h-full border-0"
           sandbox="allow-same-origin"
         />
       </div>
     </div>
     <div className="md:hidden p-4 border-t flex justify-between bg-card">
       <Button variant="outline" onClick={() => setShowPreview(false)}>
         <X className="h-4 w-4 mr-2" />
         Close
       </Button>
       <Button variant="default" onClick={exportPdf} disabled={isLoading}>
         <Download className="h-4 w-4 mr-2" />
         Export
       </Button>
     </div>
   </div>
 );
}
