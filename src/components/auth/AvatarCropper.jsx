import { useState, useRef } from 'react';

export default function AvatarCropper({ image, onApply }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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

  const increaseScale = () => setScale(s => Math.min(s + 0.15, 3));
  const decreaseScale = () => setScale(s => Math.max(s - 0.15, 0.5));

  return (
    <div className="bg-[#E8E8F0] rounded-[20px] shadow-[inset_4px_4px_9px_rgba(180,180,210,.55),inset_-4px_-4px_9px_rgba(255,255,255,.9)] p-4 text-center mt-4">
      <h3 className="text-[12px] font-bold text-[#8888AA] mb-4">Ajusta y recorta tu foto de perfil</h3>
      
      <div className="flex justify-center mb-2">
        <div 
          className="w-[110px] h-[110px] rounded-full overflow-hidden border-[3px] border-[#FFB400] shadow-[4px_4px_12px_rgba(255,180,0,.3),-2px_-2px_8px_rgba(255,240,100,.3)] relative cursor-move bg-black mx-auto"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img 
            src={image} 
            alt="Preview" 
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
      <p className="text-[10px] text-[#AAAACC] mb-4">Arrastra para reencuadrar</p>

      <div className="flex justify-center flex-wrap gap-2">
        <button onClick={decreaseScale} className="px-3 py-1 bg-[#E8E8F0] rounded-xl shadow-[4px_4px_9px_rgba(180,180,210,.5),-4px_-4px_9px_rgba(255,255,255,.8)] text-[#8888AA] font-bold">🔍 −</button>
        <button onClick={increaseScale} className="px-3 py-1 bg-[#E8E8F0] rounded-xl shadow-[4px_4px_9px_rgba(180,180,210,.5),-4px_-4px_9px_rgba(255,255,255,.8)] text-[#8888AA] font-bold">🔍 +</button>
        <button onClick={() => onApply({ scale, position })} className="px-4 py-1 bg-gradient-to-r from-[#FFB400] to-[#FF9000] rounded-xl text-white font-bold shadow-[2px_2px_8px_rgba(255,180,0,.3)]">✓ Aplicar</button>
      </div>
    </div>
  );
}
