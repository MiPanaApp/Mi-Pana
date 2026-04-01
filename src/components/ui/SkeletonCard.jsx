export default function SkeletonCard() {
  return (
    <div className="bg-[#EDEDF5] rounded-[20px] overflow-hidden
                    shadow-[5px_5px_12px_rgba(180,180,210,0.7),
                    -5px_-5px_12px_rgba(255,255,255,0.9)]">
      
      {/* Imagen skeleton */}
      <div className="skeleton w-full h-[104px]
                      rounded-t-[20px]" />
      
      {/* Cuerpo */}
      <div className="p-3 flex flex-col gap-2">
        
        {/* Título */}
        <div className="skeleton h-3 w-[85%] rounded-md" />
        
        {/* Descripción línea 1 */}
        <div className="skeleton-light h-2.5 w-full rounded-md" />
        
        {/* Descripción línea 2 */}
        <div className="skeleton-light h-2.5 w-[70%] rounded-md" />
        
        {/* Footer: precio + botón */}
        <div className="flex items-center
                        justify-between mt-1">
          <div className="skeleton h-3 w-[40%] rounded-md" />
          <div className="skeleton w-7 h-7 rounded-[10px]
                          flex-shrink-0" />
        </div>
        
      </div>
    </div>
  )
}
