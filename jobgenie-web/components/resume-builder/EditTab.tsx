// src/components/resume-builder/EditTab.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  Settings,
  FileEdit,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Award,
  X,
  RefreshCw,
  Eye,
  Clock
} from "lucide-react";
import { Template, PendingChange } from "@/types/resume-builder";

interface EditTabProps {
  pendingChanges: PendingChange[];
  setPendingChanges: (changes: PendingChange[]) => void;
  removePendingChange: (index: number) => void;
  applyPendingChanges: () => void;
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  colorOptions: Record<string, string>;
  addPendingChange: (description: string, prompt: string) => void;
  showMobilePreview: () => void;
}

export default function EditTab({
  pendingChanges,
  setPendingChanges,
  removePendingChange,
  applyPendingChanges,
  selectedTemplate,
  setSelectedTemplate,
  activeColor,
  setActiveColor,
  colorOptions,
  addPendingChange,
  showMobilePreview
}: EditTabProps) {
  // Track pending sections to visually indicate which ones are being edited
  const [pendingSections, setPendingSections] = useState<Record<string, string[]>>({});

  // Function to add a section to pending and visually mark it
  const addSectionChange = (section: string, changeType: string, description: string, prompt: string) => {
    // Add the change to the pending changes
    addPendingChange(description, prompt);
    
    // Update the pending sections state
    setPendingSections(prev => {
      const sectionChanges = prev[section] || [];
      if (!sectionChanges.includes(changeType)) {
        return {
          ...prev,
          [section]: [...sectionChanges, changeType]
        };
      }
      return prev;
    });
  };

  // Function to check if a section has a pending change
  const hasPendingChange = (section: string, changeType: string): boolean => {
    return pendingSections[section]?.includes(changeType) || false;
  };

  // Clear pending section indicators when changes are applied
  const handleApplyChanges = () => {
    applyPendingChanges();
    setPendingSections({});
  };

  // Clear pending section indicators when changes are discarded
  const handleDiscardChanges = () => {
    setPendingChanges([]);
    setPendingSections({});
  };

  return (
    <>
      {/* Mobile-only Preview Button - only show on small screens */}
      <div className="md:hidden mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={showMobilePreview}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Current Document
        </Button>
      </div>

      {/* Pending Changes Banner */}
      {pendingChanges.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-amber-500 mr-2" />
            <span className="text-sm text-amber-700">
              {pendingChanges.length} changes pending
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDiscardChanges}
            >
              Discard
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApplyChanges}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Document Style
          </CardTitle>
          <CardDescription className="text-xs">
            Change the overall look and feel of your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Template</Label>
              <div className="grid grid-cols-3 gap-3">
                {["modern", "classic", "minimal"].map((template) => (
                  <div
                    key={template}
                    className={`
                      p-3 rounded-lg border cursor-pointer text-center transition-all
                      ${selectedTemplate === template ? "border-primary bg-primary/5" : "hover:bg-accent"}
                      ${pendingSections['template']?.includes(template) ? "ring-2 ring-amber-400" : ""}
                    `}
                    onClick={() => {
                      setSelectedTemplate(template as Template);
                      addSectionChange(
                        'template',
                        template,
                        `Change template to ${template} style`,
                        `Change the document template to a ${template} style`
                      );
                    }}
                  >
                    {template === "modern" && (
                      <div className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md mb-2" />
                    )}
                    {template === "classic" && (
                      <div className="w-full h-12 bg-slate-700 rounded-md mb-2" />
                    )}
                    {template === "minimal" && (
                      <div className="w-full h-12 bg-gradient-to-r from-gray-100 to-gray-300 rounded-md mb-2" />
                    )}
                    <span className="text-xs font-medium capitalize">
                      {template}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Color Theme</Label>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(colorOptions).map(([color, hex]) => (
                  <div
                    key={color}
                    className={`aspect-square rounded-md cursor-pointer flex items-center justify-center transition-all ${
                      activeColor === color
                        ? "ring-2 ring-primary ring-offset-1"
                        : "hover:ring-1 hover:ring-primary/40"
                    } ${pendingSections['color']?.includes(color) ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => {
                      setActiveColor(color);
                      addSectionChange(
                        'color',
                        color,
                        `Change color scheme to ${color}`,
                        `Change the document color scheme to ${color}`
                      );
                    }}
                  >
                    {activeColor === color && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Font Size</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className={pendingSections['font']?.includes('smaller') ? "bg-amber-50 border-amber-300" : ""}
                  onClick={() => {
                    addSectionChange(
                      'font',
                      'smaller',
                      "Make font smaller",
                      "Decrease the font size throughout the document"
                    );
                  }}
                >
                  A-
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full"></div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={pendingSections['font']?.includes('larger') ? "bg-amber-50 border-amber-300" : ""}
                  onClick={() => {
                    addSectionChange(
                      'font',
                      'larger',
                      "Make font larger",
                      "Increase the font size throughout the document"
                    );
                  }}
                >
                  A+
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Sections */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-primary" />
            Content Sections
          </CardTitle>
          <CardDescription className="text-xs">
            Manage sections in your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["summary", "experience", "education", "skills", "projects"].map(
              (section) => (
                <div 
                  key={section}
                  className={`flex items-center justify-between p-2.5 border rounded-md hover:bg-accent transition-colors 
                    ${hasPendingChange(section, 'edit') || hasPendingChange(section, 'remove') 
                      ? "bg-amber-50 border-amber-300" 
                      : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full ${
                      hasPendingChange(section, 'remove') 
                        ? "bg-red-100" 
                        : hasPendingChange(section, 'edit')
                          ? "bg-amber-100"
                          : "bg-primary/10"
                      } flex items-center justify-center`}>
                      {hasPendingChange(section, 'remove') ? (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <CheckCircle2 className={`h-3.5 w-3.5 ${
                          hasPendingChange(section, 'edit') ? "text-amber-500" : "text-primary"
                        }`} />
                      )}
                    </div>
                    <span className="text-sm capitalize">{section}</span>
                    {hasPendingChange(section, 'edit') && (
                      <span className="text-xs text-amber-600 italic">Editing</span>
                    )}
                    {hasPendingChange(section, 'remove') && (
                      <span className="text-xs text-red-600 italic">Removing</span>
                    )}
                  </div>
                  <div className="flex">
                    <Button
                      variant={hasPendingChange(section, 'edit') ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        addSectionChange(
                          section,
                          'edit',
                          `Improve ${section} section`,
                          `Enhance the ${section} section with more compelling content`
                        );
                      }}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={hasPendingChange(section, 'remove') ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        addSectionChange(
                          section,
                          'remove',
                          `Remove ${section} section`,
                          `Remove the ${section} section from the document`
                        );
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => {
              // Show a simple dialog to select section type
              const sectionType = prompt("What type of section would you like to add?");
              if (sectionType) {
                addSectionChange(
                  'newSection',
                  sectionType,
                  `Add new ${sectionType} section`,
                  `Add a new section about ${sectionType} to the document`
                );
              }
            }}
          >
            + Add New Section
          </Button>
        </CardContent>
      </Card>

      {/* Additional Content Options */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Document Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`justify-start ${pendingSections['improvements']?.includes('concise') ? "bg-amber-50 border-amber-300" : ""}`}
              onClick={() => {
                addSectionChange(
                  'improvements',
                  'concise',
                  "Make more concise",
                  "Make the entire document more concise and to the point"
                );
              }}
            >
              <ZoomOut className="h-4 w-4 mr-2" />
              Make more concise
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`justify-start ${pendingSections['improvements']?.includes('details') ? "bg-amber-50 border-amber-300" : ""}`}
              onClick={() => {
                addSectionChange(
                  'improvements',
                  'details',
                  "Add more details",
                  "Expand the document with more detailed information"
                );
              }}
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Add more details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`justify-start ${pendingSections['improvements']?.includes('language') ? "bg-amber-50 border-amber-300" : ""}`}
              onClick={() => {
                addSectionChange(
                  'improvements',
                  'language',
                  "Improve language",
                  "Enhance the wording and language throughout the document"
                );
              }}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Improve language
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`justify-start ${pendingSections['improvements']?.includes('achievements') ? "bg-amber-50 border-amber-300" : ""}`}
              onClick={() => {
                addSectionChange(
                  'improvements',
                  'achievements',
                  "Add achievements",
                  "Include more achievements and accomplishments"
                );
              }}
            >
              <Award className="h-4 w-4 mr-2" />
              Add achievements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Changes Summary */}
      {pendingChanges.length > 0 && (
        <Card className="mt-6 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Changes to Apply ({pendingChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {pendingChanges.map((change, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                  <span className="text-sm">{change.description}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0" 
                    onClick={() => {
                      removePendingChange(index);
                      // This is a simple approach - if we need more precise tracking
                      // we'd need to store more info about each change
                      if (pendingChanges.length === 1) {
                        setPendingSections({});
                      }
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              variant="default" 
              className="w-full mt-4" 
              onClick={handleApplyChanges}
            >
              Apply All Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mobile-only Apply Button - fixed at bottom for easier access */}
      {pendingChanges.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button 
            variant="default" 
            className="w-full" 
            onClick={handleApplyChanges}
          >
            Apply {pendingChanges.length} Changes
          </Button>
        </div>
      )}
    </>
  );
}
