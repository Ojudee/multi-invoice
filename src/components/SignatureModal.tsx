import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool, Type } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: string, type: 'draw' | 'type' | 'none') => void;
  initialSignature?: string;
  initialType?: 'draw' | 'type' | 'none';
  clientName?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSignature = '',
  initialType = 'draw',
  clientName = '',
}) => {
  const [mode, setMode] = useState<'draw' | 'type'>(initialType === 'type' ? 'type' : 'draw');
  const [typedName, setTypedName] = useState(initialType === 'type' ? initialSignature : clientName || '');
  const [fontStyle, setFontStyle] = useState<'cursive' | 'serif' | 'clean'>('cursive');
  const [penColor, setPenColor] = useState<string>('#0b2341'); // Univision deep navy
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = penColor;
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw subtle baseline rule
          ctx.save();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(20, canvas.height - 35);
          ctx.lineTo(canvas.width - 20, canvas.height - 35);
          ctx.stroke();
          ctx.restore();

          if (initialSignature && initialType === 'draw') {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              setHasDrawn(true);
            };
            img.src = initialSignature;
          }
        }
      }
    }
  }, [isOpen, mode, penColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // redraw guide line
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 35);
    ctx.lineTo(canvas.width - 20, canvas.height - 35);
    ctx.stroke();
    ctx.restore();

    setHasDrawn(false);
  };

  const handleSave = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl, 'draw');
      } else {
        onSave('', 'none');
      }
    } else {
      if (typedName.trim()) {
        onSave(typedName.trim(), 'type');
      } else {
        onSave('', 'none');
      }
    }
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-neutral-900 rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b2341] text-white">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">Client Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors"
            aria-label="Close signature modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-6">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setMode('draw')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                mode === 'draw'
                  ? 'bg-white text-[#0b2341] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw Digital Signature
            </button>
            <button
              type="button"
              onClick={() => setMode('type')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                mode === 'type'
                  ? 'bg-white text-[#0b2341] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Type Legal Name
            </button>
          </div>

          {mode === 'draw' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Sign with mouse, trackpad, or finger</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ink:</span>
                  <button
                    type="button"
                    onClick={() => setPenColor('#0b2341')}
                    className={`w-5 h-5 rounded-full border-2 ${penColor === '#0b2341' ? 'border-amber-500 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: '#0b2341' }}
                    title="Univision Deep Navy"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#0f172a')}
                    className={`w-5 h-5 rounded-full border-2 ${penColor === '#0f172a' ? 'border-amber-500 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: '#0f172a' }}
                    title="Slate Black"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#1e40af')}
                    className={`w-5 h-5 rounded-full border-2 ${penColor === '#1e40af' ? 'border-amber-500 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: '#1e40af' }}
                    title="Royal Blue"
                  />
                </div>
              </div>

              {/* Canvas Box */}
              <div className="border border-slate-300 rounded-lg bg-slate-50/50 p-1 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={170}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[170px] bg-white rounded cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm italic">
                    Sign inside this box
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Clear Signature
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Signer Legal Name
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Amadou L. Jallow"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0b2341] focus:border-transparent text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Signature Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFontStyle('cursive')}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      fontStyle === 'cursive'
                        ? 'border-[#0b2341] bg-blue-50/50 text-[#0b2341]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs text-slate-500 mb-1">Cursive Script</span>
                    <span className="font-signature text-xl text-[#0b2341]">
                      {typedName || 'Sample Signature'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontStyle('serif')}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      fontStyle === 'serif'
                        ? 'border-[#0b2341] bg-blue-50/50 text-[#0b2341]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs text-slate-500 mb-1">Formal Serif</span>
                    <span className="font-serif italic text-base text-[#0b2341]">
                      {typedName || 'Sample Signature'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontStyle('clean')}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      fontStyle === 'clean'
                        ? 'border-[#0b2341] bg-blue-50/50 text-[#0b2341]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs text-slate-500 mb-1">Clean Modern</span>
                    <span className="font-mono text-sm uppercase tracking-wider text-[#0b2341]">
                      {typedName || 'Sample Signature'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0b2341] hover:bg-[#133863] rounded-lg shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              Apply to Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
