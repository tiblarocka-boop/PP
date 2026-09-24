import React, { useState, useRef } from 'react';
import { EQPreset } from '../types/audio';
import { Bookmark, Plus, Download, Upload, Trash2, Check, Sparkles } from 'lucide-react';

interface PresetsViewProps {
  currentPresetId: string;
  allPresets: EQPreset[];
  onSelectPreset: (preset: EQPreset) => void;
  onSaveCurrentAsPreset: (name: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  onImportPresets: (presets: EQPreset[]) => void;
}

export const PresetsView: React.FC<PresetsViewProps> = ({
  currentPresetId,
  allPresets,
  onSelectPreset,
  onSaveCurrentAsPreset,
  onDeleteCustomPreset,
  onImportPresets,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'pp48 Special', 'Bass', 'Genre', 'Standard', 'Custom'];

  const filteredPresets = allPresets.filter((p) => {
    if (filterCategory === 'All') return true;
    return p.category === filterCategory;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCurrentAsPreset(newPresetName.trim());
    setNewPresetName('');
    setIsSaving(false);
  };

  const handleExport = () => {
    const custom = allPresets.filter((p) => p.category === 'Custom');
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(custom, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'fatyliser_custom_presets.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportPresets(parsed);
        }
      } catch (err) {
        alert('Invalid preset JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="font-audiophile text-xs font-bold tracking-wider text-slate-200">
          PRESET LIBRARY
        </h3>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSaving(!isSaving)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </button>

          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Export Custom Presets"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Import Presets JSON"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Save Preset Dialog */}
      {isSaving && (
        <form
          onSubmit={handleSave}
          className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center gap-2 shadow-lg"
        >
          <input
            type="text"
            placeholder="e.g. My Bass Car Tune"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Category Pills (Functional Filter Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Presets List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredPresets.map((preset) => {
          const isSelected = currentPresetId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#0b0f19] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {preset.category === 'pp48 Special' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span>{preset.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>by {preset.author || 'pp48'}</span>
                    {preset.preamp !== 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-num">
                          {preset.preamp > 0 ? `+${preset.preamp}` : preset.preamp}dB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete button if custom */}
              {preset.category === 'Custom' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomPreset(preset.id);
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Custom Preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
