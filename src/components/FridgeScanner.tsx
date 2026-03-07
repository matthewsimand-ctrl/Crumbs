import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X, Lock } from 'lucide-react';
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
  const [fileError, setFileError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileError('No image selected.');
      return;
    }

    setFileError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };
    reader.onerror = () => setFileError('Could not read this image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const openInputByMode = () => {
    if (scanMode === 'camera' && isPremiumUser) {
      cameraInputRef.current?.click();
      return;
    }

    galleryInputRef.current?.click();
  };

  const handleScan = () => {
    if (!preview) return;
    const base64Data = preview.split(',')[1];
    onScanComplete(base64Data);
  };

  const clearPreview = () => {
    setPreview(null);
    setFileError(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-amber-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-amber-900">Scan Your Fridge</h2>
        <p className="text-amber-700/70 text-sm">Capture or upload a photo and let AI identify your ingredients.</p>
      </div>

      <div className="flex gap-2 mb-5 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => onScanModeChange('manual')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${scanMode === 'manual' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600'}`}
        >
          Upload photo
        </button>
        <button
          onClick={() => onScanModeChange('camera')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${scanMode === 'camera' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
        >
          Live camera
        </button>
      </div>

      {scanMode === 'manual' && (
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600 mb-3">Prefer typing? Add ingredients directly to your pantry list.</p>
          <button
            onClick={onEnterIngredientsClick}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
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
          <p className="text-xs text-amber-700 mt-1 mb-3">Upgrade to open your camera directly and scan with one tap.</p>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600"
          >
            Upgrade to Premium
          </button>
        </div>
      )}

      {scanMode === 'camera' && isPremiumUser && !preview && (
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full mb-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700"
        >
          <Camera size={18} />
          Open Camera
        </button>
      )}

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={openInputByMode}
            className="w-full aspect-video border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors group"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="text-amber-700" size={32} />
            </div>
            <p className="text-amber-800 font-medium">Tap to upload or take a photo</p>
            <p className="text-amber-600 text-xs mt-1">Supports JPG, PNG, HEIC</p>
          </motion.button>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-video rounded-[var(--radius-control)] overflow-hidden bg-[#2d1a0b]">
            <img src={preview} alt="Fridge preview" className="w-full h-full object-contain" />
            <button onClick={clearPreview} className="absolute top-3 right-3 app-icon-pill bg-black/45 text-white hover:bg-black/70" aria-label="Clear selected image">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {fileError && <p className="mt-3 text-sm text-red-500">{fileError}</p>}

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
          className="w-full mt-6 py-4 bg-amber-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-200"
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
