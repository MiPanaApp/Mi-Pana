import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MessageCircle, Tag, Heart, X } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function NotificationPermissionModal({
  isOpen, onClose
}) {
  const { requestPermission, isSupported } = usePushNotifications()

  if (!isSupported) return null

  const handleActivate = async () => {
    await requestPermission()
    onClose()
  }

  const handleDismiss = () => {
    // Guardar en localStorage para no volver a mostrar
    // por 7 días si el usuario dice "Ahora no"
    localStorage.setItem(
      'notif_dismissed_at',
      Date.now().toString()
    )
    onClose()
  }

  const benefits = [
    {
      icon: <MessageCircle size={20} className="text-[#1A1A3A]" />,
      title: 'Mensajes',
      desc: 'Entérate al instante cuando un pana te escriba'
    },
    {
      icon: <Tag size={20} className="text-[#FFB400]" />,
      title: 'Ofertas y novedades',
      desc: 'Nuevos servicios y productos según tus intereses'
    },
    {
      icon: <Heart size={20} className="text-[#D90429]" />,
      title: 'Actividad en tus anuncios',
      desc: 'Sabe cuándo alguien ve o guarda tu anuncio'
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A3A]/50 backdrop-blur-sm z-[9998]"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] mx-auto max-w-sm bg-[#EDEDF5] rounded-t-[32px] px-6 pt-6 pb-10 shadow-[-4px_-8px_24px_rgba(180,180,210,0.5)] border-t border-white/60"
          >
            {/* Handle */}
            <div className="w-10 h-1.5 bg-[#D8D8E4] rounded-full mx-auto mb-6" />

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#E8E8F0] flex items-center justify-center shadow-[3px_3px_6px_rgba(180,180,210,0.6),-3px_-3px_6px_rgba(255,255,255,0.9)]"
            >
              <X size={14} className="text-[#1A1A3A]/50" />
            </button>

            {/* Icono central */}
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#FFB400] to-[#FF9000] flex items-center justify-center mx-auto mb-5 shadow-[5px_5px_14px_rgba(200,120,0,0.35),-3px_-3px_8px_rgba(255,220,100,0.4)]">
              <Bell size={36} className="text-white" strokeWidth={2.5} />
            </div>

            {/* Título */}
            <h2 className="text-[22px] font-black text-[#1A1A3A] text-center leading-tight mb-2">
              Activa las notificaciones<br />y no te pierdas nada
            </h2>

            <p className="text-[13px] font-semibold text-[#1A1A3A]/50 text-center mb-6">
              Te mantendremos informado sobre:
            </p>

            {/* Beneficios */}
            <div className="flex flex-col gap-3 mb-7">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-4 bg-[#E8E8F0] rounded-2xl px-4 py-3 shadow-[3px_3px_7px_rgba(180,180,210,0.5),-3px_-3px_7px_rgba(255,255,255,0.85)]">
                  <div className="w-9 h-9 rounded-[12px] bg-[#EDEDF5] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_5px_rgba(180,180,210,0.5),-2px_-2px_5px_rgba(255,255,255,0.9)]">
                    {b.icon}
                  </div>
                  <div>
                    <span className="text-[13px] font-black text-[#1A1A3A] block">{b.title}</span>
                    <span className="text-[13px] font-semibold text-[#1A1A3A]/50 block">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón principal */}
            <button
              onClick={handleActivate}
              className="w-full py-4 rounded-2xl bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E] text-white font-black text-[16px] shadow-[5px_5px_14px_rgba(20,20,60,0.35),-2px_-2px_8px_rgba(80,80,160,0.15)] active:scale-95 transition-transform mb-3"
            >
              Sí, activar notificaciones 🔔
            </button>

            {/* Ahora no */}
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-[14px] font-bold text-[#1A1A3A]/40 hover:text-[#1A1A3A]/70 transition-colors"
            >
              Ahora no
            </button>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
