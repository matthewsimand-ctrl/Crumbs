import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FridgeScannerProps {
  onScanComplete: (base64Image: string) => void;
  isScanning: boolean;
}

export const FridgeScanner: React.FC<FridgeScannerProps> = ({ onScanComplete, isScanning }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Please choose an image file (JPG/PNG/HEIC).');
      return;
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
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full app-card">
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">Scan Your Fridge</h2>
        <p className="text-[var(--color-text-muted)] text-sm md:text-base">Upload a quick photo and let AI spot your ingredients 📸</p>
      </div>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-control)] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-primary-soft)]/60 transition-colors group px-4"
          >
            <div className="app-icon-pill mb-3 group-hover:scale-105 transition-transform">
              <Camera size={30} />
            </div>
            <p className="font-semibold text-center">Tap to upload or take a photo</p>
            <p className="text-[var(--color-text-muted)] text-xs mt-1">Best results: bright light + full shelf view</p>
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

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {fileError && (
        <div className="status-panel mt-4 flex items-center justify-center gap-2">
          <ImageOff size={16} />
          {fileError}
        </div>
      )}

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
              Analyzing Ingredients...
            </>
          ) : (
            <>
              <Upload size={20} />
              Analyze Fridge
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};
