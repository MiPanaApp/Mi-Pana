/**
 * Genera un sutil y rápido sonido "pop" sintético usando Web Audio API. 
 * Ideal para micro-interacciones al abrir modales, notificaciones o cuadros de diálogo.
 */
export const playPopSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
      // Ignorar de forma segura si el navegador bloquea AudioContext
      console.debug('No se pudo reproducir el sonido de la alerta:', e);
    }
  };
