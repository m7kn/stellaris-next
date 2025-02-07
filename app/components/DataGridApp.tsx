"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Search, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { TableData } from '@/types/TableData';
import { Translations } from '@/types/Translations';
import SelectionControls from './SelectionControls';
import EditDialog from './EditDialog';
import { Label } from '@/components/ui/label';
import { TRANSLATION_MODELS } from '@/config/models';
import { Loader2 } from 'lucide-react';

const DataGrid = () => {
  const [data, setData] = useState<Translations[]>([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [debouncedFilters] = useDebounce(filters, 500);
  const [translator, setTranslator] = useState(TRANSLATION_MODELS[0].id);
  const [isTranslating, setIsTranslating] = React.useState(false);

  const columns: { id: keyof Translations, name: string, editable: boolean, width: string, type?: string }[] = [
    { id: 'id', name: 'ID', editable: false, width: '80px' },
    { id: 'filename', name: 'Fájl', editable: false, width: '150px' },
    { id: 'key', name: 'Kulcs', editable: false, width: '200px' },
    { id: 'english_text', name: 'Angol szöveg', editable: false, width: '250px' },
    { id: 'temp_hungarian', name: 'Ideiglenes magyar', editable: true, width: '250px' },
    { id: 'final_hungarian', name: 'Végleges magyar', editable: false, width: '250px' },
    { id: 'is_translated', name: 'Fordítva', editable: false, width: '100px', type: 'boolean' }
  ];

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(debouncedFilters).filter(([_, value]) => value !== 'all')
        )
      });
      
      const response = await fetch(`/api/translations?${queryParams}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const result: TableData = await response.json();
      
      const processedData = result.data.map(item => ({
        ...item,
        filename: item.filename.replace(/^\/.*\//, '')
      }));
     
      setData(processedData);
      setTotalPages(result.totalPages);
      setTotalItems(result.total);
      setLoading(false);
    } catch (error) {
      console.error('Hiba az adatok betöltésekor:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, [page, debouncedFilters]);

  const handleCellEdit = async (rowId: number, columnId: string, value: string) => {
    if (columnId !== 'temp_hungarian') return;

    try {
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateTranslation',
          id: rowId,
          temp_hungarian: value
        }),
      });

      if (!response.ok) throw new Error('Failed to update data');

      const newData = data.map(row => {
        if (row.id === rowId) {
          return { ...row, [columnId]: value };
        }
        return row;
      });
      setData(newData);
    } catch (error) {
      console.error('Hiba a szerkesztés során:', error);
      alert('Hiba történt a szerkesztés során');
    }
  };

  const handleFilter = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
    setPage(1);
  };

  const handleRowSelect = (rowId: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleFinalize = async () => {
    try {
      const selectedIds = Array.from(selectedRows);
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          ids: selectedIds
        }),
      });

      if (!response.ok) throw new Error('Failed to finalize translations');

      await fetchTranslations();
      setSelectedRows(new Set());
      alert('A kijelölt fordítások véglegesítve lettek');
    } catch (error) {
      console.error('Hiba a véglegesítés során:', error);
      alert('Hiba történt a véglegesítés során');
    }
  };

  const handleSelectAll = () => {
    const selectableIds = data
      .filter(row => !row.is_translated)
      .map(row => row.id);
    setSelectedRows(new Set(selectableIds));
  };

  const handleClearSelection = () => {
    setSelectedRows(new Set());
  };

  const handleSelectRange = (start: number, end: number) => {
    const visibleIds = data.map(row => row.id);
    const startIndex = visibleIds.indexOf(start);
    const endIndex = visibleIds.indexOf(end);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const [rangeStart, rangeEnd] = [
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex)
    ];

    const newSelected = new Set(selectedRows);
    for (let i = rangeStart; i <= rangeEnd; i++) {
      const row = data[i];
      if (!row.is_translated) {
        newSelected.add(row.id);
      }
    }
    setSelectedRows(newSelected);
  };

  const handleRowClick = (event: React.MouseEvent, row: Translations) => {
    if (row.is_translated) {
      event.stopPropagation();
      return;
    }

    const target = event.target as HTMLElement;

    // Egyébként Toggle a kijelölést
    handleRowSelect(row.id);
  };  

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    rowId: number;
    value: string;
    englishText: string;
    key: string;
    translator: string;
  } | null>(null);

  const handleCellClick = (row: Translations, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (row.is_translated) return; // Ha már le van fordítva, ne lehessen szerkeszteni
    
    setEditingCell({
      rowId: row.id,
      value: row.temp_hungarian || '',
      englishText: row.english_text,
      key: row.key || '',
      translator: translator
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async (newValue: string) => {
    if (!editingCell) return;

    try {
      await handleCellEdit(editingCell.rowId, 'temp_hungarian', newValue);
      setEditingCell(null);
    } catch (error) {
      console.error('Hiba a szerkesztés során:', error);
      alert('Hiba történt a szerkesztés során');
    }
  };  

  const handleBulkTranslate = async () => {
    setIsTranslating(true); // Fordítás kezdete      
    try {
      const selectedItems = data.filter(row => selectedRows.has(row.id));
      
      for (const item of selectedItems) {
        const response = await fetch('/api/translate/openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: item.english_text,
            modelId: translator
          }),
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Translation failed');
        }
  
        const { translation } = await response.json();
        await handleCellEdit(item.id, 'temp_hungarian', translation);
      }
  
      await fetchTranslations();
    } catch (error) {
      console.error('Bulk translation error:', error);
      alert(`Hiba történt a tömeges fordítás során: ${(error as any).message}`);
    } finally {
      setIsTranslating(false); // Fordítás vége
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold mb-2">Fordítások kezelése</CardTitle>
        <div className="mb-4">
          <Label htmlFor="translator-select">Fordító szolgáltatás</Label>
          <Select
            value={translator}
            onValueChange={setTranslator}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue>
                {TRANSLATION_MODELS.find(m => m.id === translator)?.displayName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TRANSLATION_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col gap-1">
                    <div>{model.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {model.description} • {model.pricing}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>        
        <SelectionControls
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onSelectRange={handleSelectRange}
          visibleIds={data.map(row => row.id)}
        />
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <Button 
            onClick={handleFinalize}
            disabled={selectedRows.size === 0}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Check className="mr-2 h-4 w-4" />
            Kijelölt fordítások véglegesítése
          </Button>
          <Button 
            onClick={handleBulkTranslate}
            disabled={selectedRows.size === 0 || isTranslating}
            size="sm"
            className="w-full sm:w-auto ml-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fordítás...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Kijelöltek AI fordítása
              </>
            )}            
          </Button>          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages} oldal
              ({totalItems} elem)
            </span>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 sm:p-2">
        {loading ? (
          <div className="text-center p-2 text-sm">Betöltés...</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-1 border text-center">
                    <input 
                      type="checkbox" 
                      className="h-3 w-3"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(data.filter(row => !row.is_translated).map(row => row.id)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                    />
                  </th>
                  {columns.map(column => (
                    <th key={column.id} className="p-1 border text-left">
                      <div className="text-xs font-semibold mb-1">{column.name}</div>
                      {column.type === 'boolean' ? (
                        <Select
                          value={filters[column.id] || 'all'}
                          onValueChange={(value) => handleFilter(column.id, value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Szűrés..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Összes</SelectItem>
                            <SelectItem value="true">Igen</SelectItem>
                            <SelectItem value="false">Nem</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Szűrés..."
                          value={filters[column.id] || ''}
                          onChange={(e) => handleFilter(column.id, e.target.value)}
                          className="h-7 text-xs"
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                    <tr 
                        key={row.id} 
                        className={`${row.is_translated ? 'bg-green-50' : ''} border-b cursor-pointer ${
                            selectedRows.has(row.id) ? 'bg-blue-50' : ''
                        } hover:bg-sky-100`}
                        onClick={(e) => handleRowClick(e, row)}
                    >
                    <td className="p-1 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleRowSelect(row.id)}
                        className="h-3 w-3"
                        disabled={row.is_translated}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    {columns.map(column => (
                      <td 
                        key={`${row.id}-${column.id}`} 
                        className="p-1 border text-xs"                        
                      >
                        {column.editable && !row.is_translated ? (
                          <div
                            className="cursor-text p-1 hover:bg-gray-100 rounded"
                            onClick={(e) => handleCellClick(row, e)}
                          >
                            {row[column.id]?.toString() || ''}
                          </div>
                        ) : (
                          <div 
                            className="truncate max-w-[200px]" 
                            title={column.id === 'is_translated' ? 
                              (row[column.id] ? 'Igen' : 'Nem') : 
                              row[column.id] !== null ? String(row[column.id]) : ''}
                          >
                            {column.id === 'is_translated' ? 
                              (row[column.id] ? 'Igen' : 'Nem') :
                              row[column.id]}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      {editingCell && (
        <EditDialog
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingCell(null);
          }}
          onSave={handleEditSave}
          initialValue={editingCell.value}
          englishText={editingCell.englishText}
          rowKey={editingCell.key}
          translator={translator}
        />
      )}    
    </Card>
  );
};

export default DataGrid;