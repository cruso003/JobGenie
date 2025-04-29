// src/components/resume-builder/SavedDocumentsDialog.tsx
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import { FileText, FileEdit, Folder, ChevronRight } from "lucide-react";
  import { ChatMessage, Document } from "@/types/resume-builder";
  
  interface SavedDocumentsDialogProps {
    showDocumentList: boolean;
    setShowDocumentList: (show: boolean) => void;
    existingDocuments: Document[];
    loadDocument: (document: Document) => void;
    setChatMessages: (messages: ChatMessage[]) => void;
    setCurrentHtml: (html: string) => void;
    setIsPromptEditable: (editable: boolean) => void;
  }
  
  export default function SavedDocumentsDialog({
    showDocumentList,
    setShowDocumentList,
    existingDocuments,
    loadDocument,
    setChatMessages,
    setCurrentHtml,
    setIsPromptEditable
  }: SavedDocumentsDialogProps) {
    return (
      <Dialog open={showDocumentList} onOpenChange={setShowDocumentList}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Saved Documents
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[350px] mt-4">
            {existingDocuments.length > 0 ? (
              <div className="space-y-1">
                {existingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => loadDocument(doc)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        {doc.document_type === "resume" ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <FileEdit className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No saved documents found
                </p>
              </div>
            )}
          </ScrollArea>
  
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setChatMessages([]);
                setCurrentHtml("");
                setIsPromptEditable(true);
                setShowDocumentList(false);
              }}
            >
              Create New Document
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowDocumentList(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  