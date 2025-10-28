import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered,
  Image,
  Sigma,
  Braces
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write your content here...",
  minHeight = "300px",
  label 
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const insertAtCursor = (before: string, after: string = "") => {
    const textarea = document.querySelector('textarea[data-editor="true"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { 
      icon: Bold, 
      label: "Bold", 
      action: () => insertAtCursor("**", "**"),
      tooltip: "Bold (Ctrl+B)"
    },
    { 
      icon: Italic, 
      label: "Italic", 
      action: () => insertAtCursor("*", "*"),
      tooltip: "Italic (Ctrl+I)"
    },
    { 
      icon: Code, 
      label: "Inline Code", 
      action: () => insertAtCursor("`", "`"),
      tooltip: "Inline code"
    },
    { 
      icon: Braces, 
      label: "Code Block", 
      action: () => insertAtCursor("\n```\n", "\n```\n"),
      tooltip: "Code block"
    },
    { 
      icon: Sigma, 
      label: "Inline Math", 
      action: () => insertAtCursor("$", "$"),
      tooltip: "Inline LaTeX: $equation$"
    },
    { 
      icon: Sigma, 
      label: "Block Math", 
      action: () => insertAtCursor("\n$$\n", "\n$$\n"),
      tooltip: "Block LaTeX: $$equation$$"
    },
    { 
      icon: List, 
      label: "Bullet List", 
      action: () => insertAtCursor("\n- ", ""),
      tooltip: "Bullet list"
    },
    { 
      icon: ListOrdered, 
      label: "Numbered List", 
      action: () => insertAtCursor("\n1. ", ""),
      tooltip: "Numbered list"
    },
    { 
      icon: Image, 
      label: "Image", 
      action: () => insertAtCursor("![alt text](", ")"),
      tooltip: "Insert image"
    },
  ];

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      
      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
          <div className="border-b bg-muted/50">
            <TabsList className="h-auto p-1 bg-transparent">
              <TabsTrigger value="write" className="data-[state=active]:bg-background">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-background">
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="write" className="mt-0">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
              {toolbarButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={btn.action}
                  title={btn.tooltip}
                  className="h-8 px-2"
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            {/* Editor */}
            <Textarea
              data-editor="true"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none font-mono text-sm"
              style={{ minHeight }}
            />

            {/* Help text */}
            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t">
              <strong>Tips:</strong> Use <code>$equation$</code> for inline math, <code>$$equation$$</code> for block math. 
              Markdown supported. Example: <code>$\frac{'{x^2 + y^2}'}{2}$</code>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 p-4" style={{ minHeight }}>
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted-foreground text-sm">Nothing to preview yet...</p>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
