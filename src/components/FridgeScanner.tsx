import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FridgeScannerProps {
  onScanComplete: (base64Image: string) => void;
  isScanning: boolean;
}

export const FridgeScanner: React.FC<FridgeScannerProps> = ({ onScanComplete, isScanning }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        // We don't auto-complete here, let user confirm or just use the preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = () => {
    if (preview) {
      const base64Data = preview.split(',')[1];
      onScanComplete(base64Data);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-amber-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-amber-900">Scan Your Fridge</h2>
        <p className="text-amber-700/70 text-sm">Upload a photo and let AI identify your ingredients</p>
      </div>

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors group"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="text-amber-700" size={32} />
            </div>
            <p className="text-amber-800 font-medium">Click to upload or take a photo</p>
            <p className="text-amber-600 text-xs mt-1">Supports JPG, PNG</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-video rounded-2xl overflow-hidden bg-black"
          >
            <img src={preview} alt="Fridge Preview" className="w-full h-full object-contain" />
            <button
              onClick={clearPreview}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={fileInputRef}
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
