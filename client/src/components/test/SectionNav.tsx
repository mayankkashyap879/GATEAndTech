import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import type { TestSection } from "@shared/schema";

interface SectionNavProps {
  sections: TestSection[];
  activeSectionId: number | null;
  onSectionChange: (sectionId: number) => void;
  sectionProgress: Record<number, { answered: number; total: number }>;
  sectionTimeRemaining?: number | null; // seconds remaining in current section
  disabledSections?: Set<number>; // sections that can't be navigated back to
}

export default function SectionNav({
  sections,
  activeSectionId,
  onSectionChange,
  sectionProgress,
  sectionTimeRemaining,
  disabledSections = new Set(),
}: SectionNavProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeWarning = sectionTimeRemaining !== null && 
                        sectionTimeRemaining !== undefined && 
                        sectionTimeRemaining <= 300; // 5 minutes

  const isTimeCritical = sectionTimeRemaining !== null && 
                         sectionTimeRemaining !== undefined && 
                         sectionTimeRemaining <= 60; // 1 minute

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Section Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {sections.map((section) => {
              const isActive = section.id === activeSectionId;
              const isDisabled = disabledSections.has(section.id);
              const progress = sectionProgress[section.id] || { answered: 0, total: 0 };
              const completionPercent = progress.total > 0 
                ? Math.round((progress.answered / progress.total) * 100) 
                : 0;

              return (
                <Button
                  key={section.id}
                  onClick={() => !isDisabled && onSectionChange(section.id)}
                  disabled={isDisabled}
                  variant={isActive ? "default" : "outline"}
                  className={`relative ${
                    isActive 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : isDisabled 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                  size="sm"
                >
                  <span className="font-medium">{section.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 ${
                      isActive 
                        ? "bg-blue-700 text-white" 
                        : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  >
                    {progress.answered}/{progress.total}
                  </Badge>
                  
                  {/* Completion indicator */}
                  {completionPercent === 100 && !isActive && (
                    <CheckCircle2 className="ml-1 h-4 w-4 text-green-500" />
                  )}
                  
                  {/* Disabled indicator */}
                  {isDisabled && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Sectional Timer (if applicable) */}
          {sectionTimeRemaining !== null && sectionTimeRemaining !== undefined && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-semibold ${
                isTimeCritical
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse"
                  : isTimeWarning
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Section: {formatTime(sectionTimeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Section Description/Info (optional) */}
        {activeSectionId && (
          <div className="mt-2 text-sm text-muted-foreground">
            {sections.find(s => s.id === activeSectionId)?.durationSeconds && (
              <span>
                Duration: {Math.floor(sections.find(s => s.id === activeSectionId)!.durationSeconds! / 60)} minutes
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
