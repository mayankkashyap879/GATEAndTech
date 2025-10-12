import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CalculatorDialog({ open, onOpenChange }: CalculatorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scientific Calculator</DialogTitle>
          <DialogDescription>
            Use this calculator for numerical calculations
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded text-center">
          <p className="text-sm text-muted-foreground">Calculator functionality coming soon...</p>
          <p className="text-xs text-muted-foreground mt-2">For now, use your system calculator</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
