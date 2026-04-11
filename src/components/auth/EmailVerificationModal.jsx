import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFunctions, httpsCallable } from 'firebase/functions'

export default function EmailVerificationModal({
  isOpen, email, onVerified, onResend
}) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (timeLeft <= 0) return
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timerId)
  }, [isOpen, timeLeft])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleResendClick = async () => {
    try {
      await onResend()
      setTimeLeft(600)
      setCode(['', '', '', '', '', ''])
      setError('')
      setToast('Nuevo código enviado a tu correo')
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleInput = (value, index) => {
    const newCode = [...code]
    newCode[index] = value.replace(/\D/g, '').slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setCode(newCode)
    const nextEmpty = newCode.findIndex(d => !d)
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty
    document.getElementById(`code-${focusIndex}`)?.focus()
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const functions = getFunctions()
      const verifyFn = httpsCallable(functions, 'verifyEmailCode')
      await verifyFn({ code: fullCode })
      onVerified()
    } catch (e) {
      setError(e.message || 'Código incorrecto. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A3A]/60 backdrop-blur-sm z-[9998]"
          />

          {/* Modal Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#EDEDF5] rounded-t-[32px] px-6 pt-6 pb-10 max-w-sm mx-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1.5 bg-[#D8D8E4] rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#1A1A3A] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
                ✉️
              </div>
              <h2 className="text-[22px] font-black text-[#1A1A3A] mb-2">
                Verifica tu email
              </h2>
              <p className="text-[13px] font-semibold text-[#1A1A3A]/50">
                Enviamos un código a<br/>
                <span className="text-[#1A1A3A]/80 font-bold">{email}</span>
              </p>
            </div>

            {/* Toast */}
            {toast && (
              <div className="fixed top-[20%] left-1/2 -translate-x-1/2 bg-[#1A1A3A] text-white text-[13px] font-bold px-4 py-2 rounded-xl shadow-lg z-[10000] whitespace-nowrap animate-[fadeIn_0.3s_ease-out]">
                {toast}
              </div>
            )}

            {/* Code Inputs */}
            <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={timeLeft === 0 || loading}
                  onChange={(e) => handleInput(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-14 text-center text-[24px] font-black text-[#1A1A3A]
                             bg-[#E0E5EC] rounded-2xl border-2 border-transparent
                             focus:border-[#FFB400] focus:outline-none transition-all disabled:opacity-50
                             shadow-[inset_3px_3px_6px_rgba(180,180,210,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]"
                />
              ))}
            </div>

            {/* Timer Output */}
            <div className="text-center mb-6">
              <span className={`text-[18px] font-black ${timeLeft > 0 ? 'text-[#1A1A3A]' : 'text-[#D90429]'}`}>
                {formatTime(timeLeft)}
              </span>
              {timeLeft === 0 && (
                <p className="text-[#D90429] text-[13px] font-bold mt-1">
                  El código ha expirado. Solicita uno nuevo.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-[#D90429] text-[13px] font-bold text-center mb-4">
                {error}
              </p>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || code.join('').length !== 6 || timeLeft === 0}
              className="w-full py-4 rounded-2xl bg-[#1A1A3A] text-white font-black text-[16px]
                         disabled:opacity-40 active:scale-95 transition-all mb-3
                         shadow-[0_8px_20px_rgba(26,26,58,0.3)]"
            >
              {loading ? 'Verificando...' : 'Verificar código ✓'}
            </button>

            {/* Resend */}
            <button
              onClick={handleResendClick}
              className="w-full py-3 text-[14px] font-bold text-[#1A1A3A]/40 hover:text-[#1A1A3A]/70 transition-colors"
            >
              ¿No llegó? Reenviar código
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
