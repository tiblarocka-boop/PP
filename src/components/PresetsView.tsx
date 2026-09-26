import React, { useState, useRef } from 'react';
import { EQPreset } from '../types/audio';
import { parseGraphicEqText, exportGraphicEqText } from '../utils/graphicEqParser';
import {
  HEADPHONE_BRANDS,
  HEADPHONE_PROFILES,
  searchHeadphoneProfiles,
  HeadphoneProfile,
} from '../utils/headphoneDatabase';
import {
  Bookmark,
  Plus,
  Download,
  Upload,
  Trash2,
  Check,
  Sparkles,
  Headphones,
  FileText,
  Search,
  Sliders,
  ExternalLink,
} from 'lucide-react';

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
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Headphone Database Flattening State
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [headphoneSearch, setHeadphoneSearch] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'All',
    '🎧 Headphones (AutoEq)',
    'pp48 Special',
    'Bass',
    'Genre',
    'Standard',
    'Custom',
  ];

  const filteredPresets = allPresets.filter((p) => {
    if (filterCategory === 'All') return true;
    if (filterCategory === '🎧 Headphones (AutoEq)') return p.category === 'Headphones (AutoEq)';
    return p.category === filterCategory;
  });

  const searchedHeadphones = searchHeadphoneProfiles(headphoneSearch, selectedBrand);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCurrentAsPreset(newPresetName.trim());
    setNewPresetName('');
    setIsSaving(false);
  };

  // Export as standard GraphicEQ .txt file
  const handleExportGraphicEq = () => {
    const activePreset = allPresets.find((p) => p.id === currentPresetId) || allPresets[0];
    const bandsObj = activePreset.bands10.map((gain, i) => ({
      id: `b_${i}`,
      frequency: [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000][i],
      gain,
      q: 1.41,
      type: 'peaking' as BiquadFilterType,
    }));

    const textContent = exportGraphicEqText(activePreset.name, activePreset.preamp, bandsObj);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute(
      'download',
      `${activePreset.name.replace(/\s+/g, '_')}_GraphicEQ.txt`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  // Export all custom presets as JSON
  const handleExportJson = () => {
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

  // Handle both .txt (GraphicEQ/Equalizer APO/Peace) and .json files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          // Parse .txt GraphicEQ
          const imported = parseGraphicEqText(content, file.name);
          onImportPresets([imported]);
          onSelectPreset(imported);
          setImportNotice(`Loaded "${imported.name}" from .txt GraphicEQ!`);
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          // Parse JSON
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onImportPresets(parsed);
            setImportNotice(`Imported ${parsed.length} presets from JSON!`);
            setTimeout(() => setImportNotice(null), 4000);
          }
        }
      } catch (err: any) {
        alert(err?.message || 'Invalid equalizer file. Please upload a valid .txt GraphicEQ or .json file.');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Apply Headphone Flattening profile
  const handleApplyHeadphoneProfile = (hp: HeadphoneProfile) => {
    const preset: EQPreset = {
      id: `hp_${hp.id}`,
      name: `${hp.brand} ${hp.model}`,
      category: 'Headphones (AutoEq)',
      author: `AutoEq (${hp.source})`,
      headphoneModel: hp.model,
      source: hp.source,
      notes: hp.notes,
      preamp: hp.preamp,
      bands10: [...hp.bands10],
      bands32: hp.bands32,
      bassGain: 0,
      trebleGain: 0,
    };

    onImportPresets([preset]);
    onSelectPreset(preset);
    setImportNotice(`Applied Harman flattening calibration for ${hp.brand} ${hp.model}!`);
    setTimeout(() => setImportNotice(null), 4000);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="font-audiophile text-xs font-bold tracking-wider text-slate-200">
            PRESETS &amp; HEADPHONE PROFILES
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSaving(!isSaving)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Export GraphicEQ .txt */}
          <button
            onClick={handleExportGraphicEq}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs transition-all active:scale-95"
            title="Export Active Preset as .txt GraphicEQ (Equalizer APO / Peace / Wavelet)"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">.txt</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
            title="Export Custom Presets JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Import .txt or .json */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-medium transition-all active:scale-95"
            title="Import .txt (GraphicEQ) or .json"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import .txt / .json</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Import Notice Banner */}
      {importNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Save Preset Dialog */}
      {isSaving && (
        <form
          onSubmit={handleSave}
          className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center gap-2 shadow-lg animate-in fade-in"
        >
          <input
            type="text"
            placeholder="Preset Name (e.g. Master Clean or Deep Sub)..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all active:scale-95"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all active:scale-95 ${
              filterCategory === cat
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Headphone Database View when Headphone filter is active */}
      {filterCategory === '🎧 Headphones (AutoEq)' ? (
        <div className="space-y-3 animate-in fade-in">
          {/* Brand pills and Search Input */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-audiophile font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                HARMAN TARGET FLATTENING CALIBRATION (AUTOEQ)
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Oratory1990 / Crinacle
              </span>
            </div>

            {/* Model Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={headphoneSearch}
                onChange={(e) => setHeadphoneSearch(e.target.value)}
                placeholder="Search headphone (e.g. HD600, AirPods Pro, XM4, DT770, Sundara)..."
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500/60 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {headphoneSearch && (
                <button
                  onClick={() => setHeadphoneSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Brand Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {HEADPHONE_BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedBrand === brand
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Headphone list grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {searchedHeadphones.map((hp) => (
              <div
                key={hp.id}
                className="p-3 rounded-2xl border bg-slate-950/80 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{hp.brand} {hp.model}</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                      {hp.type}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="text-amber-400/90 font-medium">🎯 {hp.target}</span>
                    <span aria-hidden="true">·</span>
                    <span>source: {hp.source}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-400 font-num">{hp.preamp}dB preamp</span>
                  </div>

                  {hp.notes && (
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {hp.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleApplyHeadphoneProfile(hp)}
                  className="w-full py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Flattening Calibration</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Presets Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredPresets.map((preset) => {
            const isSelected = currentPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99] ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#0b0f19] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-cyan-500 text-black' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {preset.category === 'pp48 Special' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : preset.category === 'Headphones (AutoEq)' ? (
                      <Headphones className="w-4 h-4" />
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
      )}
    </div>
  );
};
