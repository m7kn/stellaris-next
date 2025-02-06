import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SelectionControlsProps {
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSelectRange: (start: number, end: number) => void;
  visibleIds: number[];
}

const SelectionControls: React.FC<SelectionControlsProps> = ({
  onSelectAll,
  onClearSelection,
  onSelectRange,
  visibleIds,
}) => {
  const [rangeStart, setRangeStart] = React.useState('');
  const [rangeEnd, setRangeEnd] = React.useState('');

  const handleRangeSelect = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    
    if (isNaN(start) || isNaN(end)) {
      alert('Kérlek adj meg érvényes ID tartományt!');
      return;
    }

    // Ellenőrizzük, hogy a tartomány látható-e
    const startVisible = visibleIds.includes(start);
    const endVisible = visibleIds.includes(end);
    
    if (!startVisible || !endVisible) {
      alert('A megadott ID tartomány nem található a látható elemek között!');
      return;
    }

    onSelectRange(start, end);
    setRangeStart('');
    setRangeEnd('');
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <Button size="sm" onClick={onSelectAll}>
        Összes látható kijelölése
      </Button>
      <Button size="sm" variant="outline" onClick={onClearSelection}>
        Kijelölés törlése
      </Button>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="ID kezdet"
          value={rangeStart}
          onChange={(e) => setRangeStart(e.target.value)}
          className="w-24 h-8"
        />
        <span>-</span>
        <Input
          type="number"
          placeholder="ID vég"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(e.target.value)}
          className="w-24 h-8"
        />
        <Button size="sm" onClick={handleRangeSelect}>
          Tartomány kijelölése
        </Button>
      </div>
    </div>
  );
};

export default SelectionControls;