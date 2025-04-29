// src/components/resume-builder/MobileActionBar.tsx
import { Button } from "@/components/ui/button";
import { Eye, Save, RefreshCw } from "lucide-react";
import { ChatMessage, PendingChange } from "@/types/resume-builder";

interface MobileActionBarProps {
  chatMessages: ChatMessage[];
  currentHtml: string;
  activeTab: string;
  pendingChanges: PendingChange[];
  setShowPreview: (show: boolean) => void;
  applyPendingChanges: () => void;
  saveDocument: () => void;
  isLoading: boolean;
}

export default function MobileActionBar({
  chatMessages,
  currentHtml,
  activeTab,
  pendingChanges,
  setShowPreview,
  applyPendingChanges,
  saveDocument,
  isLoading
}: MobileActionBarProps) {
  // Only show on mobile when we have a document and are in chat/edit mode
  if (!(chatMessages.length > 0 && currentHtml)) {
    return null;
  }

  // Chat tab on mobile
  if (activeTab === "chat") {
    return (
      <div className="md:hidden flex justify-between p-3 border-t bg-card">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 mr-2"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="h-4 w-4 mr-2" /> 
          Preview
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={saveDocument}
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" /> 
          Save
        </Button>
      </div>
    );
  }

  // Edit tab on mobile
  if (activeTab === "edit" && pendingChanges.length > 0) {
    return (
      <div className="md:hidden flex justify-between p-3 border-t bg-card">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 mr-2"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="h-4 w-4 mr-2" /> 
          Preview
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={applyPendingChanges}
          disabled={pendingChanges.length === 0 || isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" /> 
          Apply Changes ({pendingChanges.length})
        </Button>
      </div>
    );
  }

  // If not in a relevant mode, don't render the action bar
  return null;
}
