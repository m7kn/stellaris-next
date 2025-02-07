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
import { getModelConfig } from '@/config/models';
import { Loader2 } from 'lucide-react';

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  initialValue: string;
  englishText: string;
  rowKey: string;
  translator: string;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
  englishText,
  rowKey,
  translator
}) => {
  const [value, setValue] = React.useState(initialValue);
  const [isTranslating, setIsTranslating] = React.useState(false);
  
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

  const handleTranslate = async () => {
    try {
      setIsTranslating(true); // Fordítás kezdete      
      const response = await fetch('/api/translate/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: englishText,
          modelId: translator
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Translation failed');
      }
  
      const { translation } = await response.json();
      // Csak a form értéket frissítjük
      setValue(translation);
    } catch (error) {
      console.error('Translation error:', error);
      alert(`Hiba történt a fordítás során: ${(error as any).message}`);
    } finally {
      setIsTranslating(false); // Fordítás vége      
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
              disabled={isTranslating}
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
              <Button variant="secondary" onClick={handleTranslate} disabled={isTranslating}>
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fordítás...
                  </>
                ) : (
                  'AI Fordítás'
                )}
              </Button>              
              <Button onClick={handleSave} disabled={isTranslating}>
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

