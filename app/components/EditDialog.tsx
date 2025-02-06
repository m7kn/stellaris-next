import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  initialValue: string;
  englishText: string;
  rowKey: string;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
  englishText,
  rowKey
}) => {
  const [value, setValue] = React.useState(initialValue);
  
  // Reset value when dialog opens with new initialValue
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
    // Escape to close
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fordítás szerkesztése</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Kulcs</h4>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              {rowKey}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Angol szöveg</h4>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap">
              {englishText}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Magyar fordítás</h4>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="font-mono"
              placeholder="Írd be a fordítást..."
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            <div className="text-xs text-muted-foreground">
              Ctrl+Enter a mentéshez, Escape a bezáráshoz
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Mégsem
              </Button>
              <Button onClick={handleSave}>
                Mentés
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;