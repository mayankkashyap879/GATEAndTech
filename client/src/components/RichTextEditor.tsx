import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered,
  Image,
  Sigma,
  Braces,
  Link as LinkIcon,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Maximize2,
  Minimize2
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newValue = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + text + value.substring(start);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { 
      icon: Bold, 
      action: () => insertAtCursor("**", "**", "bold text"),
      tooltip: "Bold (Ctrl+B)"
    },
    { 
      icon: Italic, 
      action: () => insertAtCursor("*", "*", "italic text"),
      tooltip: "Italic (Ctrl+I)"
    },
    { 
      icon: Code, 
      action: () => insertAtCursor("`", "`", "code"),
      tooltip: "Inline code"
    },
    { 
      icon: Quote, 
      action: () => insertAtCursor("\n> ", "", "quote"),
      tooltip: "Quote"
    },
  ];

  const headingButtons = [
    { 
      icon: Heading1, 
      action: () => insertAtCursor("\n# ", "", "Heading 1"),
      tooltip: "Heading 1"
    },
    { 
      icon: Heading2, 
      action: () => insertAtCursor("\n## ", "", "Heading 2"),
      tooltip: "Heading 2"
    },
    { 
      icon: Heading3, 
      action: () => insertAtCursor("\n### ", "", "Heading 3"),
      tooltip: "Heading 3"
    },
  ];

  const latexTemplates = [
    { name: 'Inline Equation', template: '$x^2 + y^2 = z^2$' },
    { name: 'Block Equation', template: '\n$$\n\\int_{a}^{b} f(x) \\, dx\n$$\n' },
    { name: 'Fraction', template: '$\\frac{a}{b}$' },
    { name: 'Square Root', template: '$\\sqrt{x}$' },
    { name: 'Nth Root', template: '$\\sqrt[n]{x}$' },
    { name: 'Sum', template: '$\\sum_{i=1}^{n} x_i$' },
    { name: 'Product', template: '$\\prod_{i=1}^{n} x_i$' },
    { name: 'Limit', template: '$\\lim_{x \\to \\infty} f(x)$' },
    { name: 'Derivative', template: '$\\frac{dy}{dx}$' },
    { name: 'Partial Derivative', template: '$\\frac{\\partial f}{\\partial x}$' },
    { name: 'Integral', template: '$\\int f(x) \\, dx$' },
    { name: 'Definite Integral', template: '$\\int_{a}^{b} f(x) \\, dx$' },
    { name: 'Double Integral', template: '$\\iint f(x,y) \\, dx \\, dy$' },
    { name: 'Matrix 2x2', template: '\n$$\n\\begin{bmatrix}\na & b \\\\\nc & d\n\\end{bmatrix}\n$$\n' },
    { name: 'Matrix 3x3', template: '\n$$\n\\begin{bmatrix}\na & b & c \\\\\nd & e & f \\\\\ng & h & i\n\\end{bmatrix}\n$$\n' },
    { name: 'Binomial', template: '$\\binom{n}{k}$' },
    { name: 'Vector', template: '$\\vec{v}$' },
    { name: 'Greek Letters', template: '$\\alpha, \\beta, \\gamma, \\delta, \\epsilon, \\theta, \\lambda, \\pi, \\sigma, \\phi, \\omega$' },
    { name: 'Trigonometry', template: '$\\sin(x), \\cos(x), \\tan(x)$' },
    { name: 'Logarithm', template: '$\\log_b(x), \\ln(x)$' },
    { name: 'Exponent', template: '$e^{x}$' },
    { name: 'Infinity', template: '$\\infty$' },
    { name: 'Subscript', template: '$x_i$' },
    { name: 'Superscript', template: '$x^2$' },
    { name: 'Both Scripts', template: '$x_i^2$' },
  ];

  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const charCount = value.length;

  return (
    <div className={`space-y-2 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col' : ''}`}>
      {label && !isFullscreen && <label className="text-sm font-medium">{label}</label>}
      
      <Card className={`overflow-hidden ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")} className={isFullscreen ? 'h-full flex flex-col' : ''}>
          <div className="border-b bg-muted/50 flex items-center justify-between">
            <TabsList className="h-auto p-1 bg-transparent">
              <TabsTrigger value="write" className="data-[state=active]:bg-background">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-background">
                Preview
              </TabsTrigger>
            </TabsList>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="mr-2"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          <TabsContent value="write" className={`mt-0 ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
              {/* Text Formatting */}
              {toolbarButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={btn.action}
                  title={btn.tooltip}
                  className="h-8 w-8 p-0"
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              ))}

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Headings */}
              {headingButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={btn.action}
                  title={btn.tooltip}
                  className="h-8 w-8 p-0"
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              ))}

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Lists */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor("\n- ", "", "List item")}
                title="Bullet list"
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor("\n1. ", "", "List item")}
                title="Numbered list"
                className="h-8 w-8 p-0"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Insert Elements */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor("[", "](url)", "link text")}
                title="Insert link"
                className="h-8 w-8 p-0"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor("\n![", "](image-url)", "alt text")}
                title="Insert image"
                className="h-8 w-8 p-0"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertText('\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n')}
                title="Insert table"
                className="h-8 w-8 p-0"
              >
                <Table className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Math */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor("$", "$", "equation")}
                title="Inline LaTeX: $equation$"
                className="h-8 w-8 p-0"
              >
                <Sigma className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertAtCursor("\n$$\n", "\n$$\n", "equation")}
                title="Block LaTeX: $$equation$$"
                className="h-8 w-8 p-0"
              >
                <Sigma className="h-5 w-5" />
              </Button>

              {/* LaTeX Templates Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="LaTeX templates"
                    className="h-8 px-2 text-xs font-mono"
                  >
                    ƒ(x)
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
                  <DropdownMenuLabel>LaTeX Templates</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {latexTemplates.map((template, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={() => insertText(template.template)}
                      className="font-mono text-xs cursor-pointer"
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Code Block */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertText('\n```javascript\n// Your code here\n```\n')}
                title="Insert code block"
                className="h-8 w-8 p-0"
              >
                <Braces className="h-4 w-4" />
              </Button>
            </div>

            {/* Editor */}
            <Textarea
              ref={textareaRef}
              data-editor="true"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none font-mono text-sm"
              style={{ minHeight: isFullscreen ? '100%' : minHeight }}
            />

            {/* Help text & Stats */}
            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t flex items-center justify-between">
              <div>
                <strong>Tips:</strong> Use <code>$equation$</code> for inline math, <code>$$equation$$</code> for block math. 
                Example: <code>$\frac{'{x^2 + y^2}'}{2}$</code>
              </div>
              <div className="font-mono">
                {wordCount} words • {charCount} chars
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className={`mt-0 p-4 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`} style={!isFullscreen ? { minHeight } : {}}>
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
