import { useState, useRef } from 'react';
import { X, Check, Search, Minus, Plus } from 'lucide-react';

export default function AvatarCropper({ image, onApply, onCancel }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isApplying, setIsApplying] = useState(false);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleApply = () => {
    setIsApplying(true);
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    
    img.onload = () => {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const aspectRatio = imgWidth / imgHeight;
      
      const bx = 110; // UI Box Size
      
      let drawW, drawH;
      if (aspectRatio > 1) {
        drawH = bx;
        drawW = bx * aspectRatio;
      } else {
        drawW = bx;
        drawH = bx / aspectRatio;
      }

      const sFactor = imgWidth / drawW;
      const viewSize = bx / scale;
      
      // Calculate view position based on the transform logic
      const viewX = (drawW - viewSize) / 2 - (position.x / scale);
      const viewY = (drawH - viewSize) / 2 - (position.y / scale);
      
      const sx = viewX * sFactor;
      const sy = viewY * sFactor;
      const sw = viewSize * sFactor;
      const sh = viewSize * sFactor;
      
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      
      setTimeout(() => {
        onApply(canvas.toDataURL('image/jpeg', 0.9));
        setIsApplying(false);
      }, 300);
    };

    img.onerror = () => {
      setIsApplying(false);
      onCancel();
    };
  };

  return (
    <div className="bg-[#E8E8F0] rounded-[24px] shadow-[8px_8px_16px_rgba(180,180,210,0.6),-8px_-8px_16px_rgba(255,255,255,0.95)] p-5 text-center mt-6 animate-[fadeIn_0.3s_ease-out] border border-white/50">
      <h3 className="text-[13px] font-black text-[#1A1A3A] mb-4 tracking-tight flex items-center justify-center gap-2">
         Ajustar Recorte 📏
      </h3>
      
      <div className="flex justify-center mb-4">
        <div 
          className="w-[110px] h-[110px] rounded-full overflow-hidden border-[4px] border-white shadow-[inset_4px_4px_8px_rgba(180,180,210,0.5),6px_6px_12px_rgba(0,0,0,0.1)] relative cursor-move bg-[#D1D1DF]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <img 
            src={image} 
            alt="Preview" 
            className="select-none"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none'
            }} 
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Zoom Control */}
        <div className="flex items-center gap-3 justify-center px-4 py-2 bg-[#E8E8F0] rounded-2xl shadow-[inset_2px_2px_4px_rgba(180,180,210,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]">
          <button onClick={() => setScale(s => Math.max(s - 0.2, 1))} className="p-1 px-3 text-[#1A1A3A]/40 active:scale-90 transition-transform">
            <Minus size={16} />
          </button>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full bg-[#FFB400]" style={{ width: `${((scale - 1) / 2) * 100}%` }}></div>
          </div>
          <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-1 px-3 text-[#1A1A3A]/40 active:scale-90 transition-transform">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            disabled={isApplying}
            onClick={onCancel} 
            className="flex-1 py-3 px-4 bg-[#E8E8F0] text-[#1A1A3A]/60 font-bold text-sm rounded-2xl shadow-[4px_4px_8px_rgba(180,180,210,0.5),-4px_-4px_8px_rgba(255,255,255,0.9)] active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/40"
          >
            <X size={16} /> Cancelar
          </button>
          <button 
            disabled={isApplying}
            onClick={handleApply} 
            className="flex-1 py-3 px-4 bg-gradient-to-br from-[#FFB400] to-[#FF9000] text-white font-black text-sm rounded-2xl shadow-[4px_4px_10px_rgba(255,180,0,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isApplying ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <><Check size={18} /> Aplicar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
