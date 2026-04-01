export default function SkeletonListItem() {
  return (
    <div className="bg-[#EDEDF5] rounded-[20px]
                    shadow-[5px_5px_12px_rgba(180,180,210,0.7),
                    -5px_-5px_12px_rgba(255,255,255,0.9)]
                    p-3 flex gap-3 items-center">
      
      {/* Imagen cuadrada izquierda */}
      <div className="skeleton w-[90px] h-[90px]
                      rounded-[14px] flex-shrink-0" />
      
      {/* Contenido derecha */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="skeleton h-3 w-[80%] rounded-md" />
        <div className="skeleton-light h-2.5
                        w-[50%] rounded-md" />
        <div className="skeleton-light h-2.5
                        w-[65%] rounded-md" />
        <div className="skeleton h-3 w-[35%]
                        rounded-md mt-1" />
      </div>
      
    </div>
  )
}
