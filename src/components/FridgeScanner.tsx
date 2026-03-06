import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FridgeScannerProps {
  onScanComplete: (base64Image: string) => void;
  isScanning: boolean;
  scanMode: 'manual' | 'camera';
  onScanModeChange: (mode: 'manual' | 'camera') => void;
  isPremiumUser: boolean;
  onUpgradeClick: () => void;
  onEnterIngredientsClick: () => void;
}

export const FridgeScanner: React.FC<FridgeScannerProps> = ({
  onScanComplete,
  isScanning,
  scanMode,
  onScanModeChange,
  isPremiumUser,
  onUpgradeClick,
  onEnterIngredientsClick,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
      };
      reader.readAsDataURL(file);
    }

    setFileError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = () => {
    if (preview) {
      const base64Data = preview.split(',')[1];
      onScanComplete(base64Data);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-emerald-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-emerald-900">Fridge Ingredient Scanner</h2>
        <p className="text-emerald-600/70 text-sm">
          Take a fridge or pantry photo and we&apos;ll auto-extract your ingredients in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => onScanModeChange('manual')}
          className={`p-3 rounded-xl border text-left transition-all ${
            scanMode === 'manual'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
              : 'border-slate-200 text-slate-500 hover:border-emerald-200'
          }`}
        >
          <p className="font-semibold">Enter ingredients</p>
          <p className="text-xs mt-0.5">Type items manually in your pantry list.</p>
        </button>

        <button
          onClick={() => onScanModeChange('camera')}
          className={`p-3 rounded-xl border text-left transition-all ${
            scanMode === 'camera'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
              : 'border-slate-200 text-slate-500 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="font-semibold">Scan with camera</p>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <Crown size={12} />
              Premium
            </span>
          </div>
          <p className="text-xs mt-0.5">Launch your phone camera to snap fridge photos.</p>
        </button>
      </div>

      {scanMode === 'manual' && (
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600 mb-3">
            Prefer typing? Add ingredients directly to your pantry list, then generate recipes instantly.
          </p>
          <button
            onClick={onEnterIngredientsClick}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Open ingredient list
          </button>
        </div>
      )}

      {scanMode === 'camera' && !isPremiumUser && (
        <div className="mb-5 p-4 rounded-2xl border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800 flex items-center gap-2 font-medium">
            <Lock size={16} />
            Camera scan is available on Premium.
          </p>
          <p className="text-xs text-amber-700 mt-1 mb-3">
            Upgrade to open your camera directly and scan fridge/pantry photos with one tap.
          </p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      )}

      {scanMode === 'camera' && isPremiumUser && !preview && (
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full mb-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <Camera size={18} />
          Open Camera (Premium)
        </button>
      )}

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => galleryInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors group"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-emerald-600" size={30} />
            </div>
            <p className="text-emerald-700 font-medium">Upload fridge or pantry photo</p>
            <p className="text-emerald-500 text-xs mt-1">Gallery upload fallback for all users</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-video rounded-[var(--radius-control)] overflow-hidden bg-[#2d1a0b]">
            <img src={preview} alt="Fridge preview" className="w-full h-full object-contain" />
            <button onClick={clearPreview} className="absolute top-3 right-3 app-icon-pill bg-black/45 text-white hover:bg-black/70" aria-label="Clear selected image">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {preview && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleScan}
          disabled={isScanning}
          className="app-button-primary w-full mt-5 md:mt-6 flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Extracting ingredients...
            </>
          ) : (
            <>
              <Upload size={20} />
              Extract Ingredients
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};
