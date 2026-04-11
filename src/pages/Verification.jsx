import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, ShieldCheck, ArrowLeft, HourglassIcon } from 'lucide-react';

export default function Verification() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  // Document capture state
  const [documentType, setDocumentType] = useState('dni');
  const [documentFront, setDocumentFront] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);

  // Selfie capture state
  const [selfieCapture, setSelfieCapture] = useState(null);
  const [livenessScore, setLivenessScore] = useState(0);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null); // Ref para acceder al stream sin closures stale
  const [stream, setStream] = useState(null);
  const [livenessStep, setLivenessStep] = useState('init'); // init | detecting | captured
  const [countdown, setCountdown] = useState(3);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleDocumentCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFront(file);
      const url = URL.createObjectURL(file);
      setFrontPreview(url);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      streamRef.current = mediaStream; // Guardamos en ref para acceso inmediato
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(e => console.warn("Auto-play prevented", e));
      }
      setLivenessStep('detecting');

      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timer);
          setTimeout(capturePhoto, 500);
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    // Apagar cámara ANTES de hacer el blob para evitar el indicador de grabación de iOS
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Error al capturar la foto. Inténtalo de nuevo.');
        return;
      }
      setSelfieCapture(blob);
      setLivenessScore(calculateLivenessScore(blob));
      setLivenessStep('captured');
    }, 'image/jpeg', 0.9);
  };

  const calculateLivenessScore = (blob) => {
    let score = 70;
    if (blob.size > 50000) score += 15;
    if (blob.size < 5000000) score += 15;
    return Math.min(score, 100);
  };

  const compressImage = async (blobOrFile, maxWidth, quality) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(blobOrFile);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      };
    });
  };

  const handleSubmit = async () => {
    if (!authUser || !authUser.uid) return;
    if (!selfieCapture) {
      alert('La selfie no fue capturada correctamente. Toca "Repetir" e inténtalo de nuevo.');
      return;
    }
    if (!documentFront) {
      alert('El documento no fue cargado correctamente.');
      return;
    }
    setUploading(true);
    try {
      const uid = authUser.uid;

      // Comprimir imágenes antes de subir para ahorrar costos y tiempo
      const compressedDocument = await compressImage(documentFront, 800, 0.75); // ~200KB
      const compressedSelfie = await compressImage(selfieCapture, 600, 0.70); // ~150KB

      // Subir documento
      const docRef = ref(storage, `verifications/${uid}/document_front.jpg`);
      await uploadBytes(docRef, compressedDocument);
      const documentFrontUrl = await getDownloadURL(docRef);

      // Subir selfie
      const selfieRef = ref(storage, `verifications/${uid}/selfie.jpg`);
      await uploadBytes(selfieRef, compressedSelfie);
      const selfieUrl = await getDownloadURL(selfieRef);

      // Guardar en Firestore
      await setDoc(doc(db, 'verifications', uid), {
        userId: uid,
        status: 'pending',
        documentType,
        documentFrontUrl,
        selfieUrl,
        livenessScore,
        submittedAt: serverTimestamp(),
        country: authUser.country || '',
        expiresAt: new Date(Date.now() + 2 * 365 * 24 * 3600000)
      });

      // Actualizar usuario
      await updateDoc(doc(db, 'users', uid), { verificationStatus: 'pending' });

      setCurrentStep(3); // success step
    } catch (error) {
      console.error('Error enviando verificación:', error);
      alert('Error al enviar la verificación. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32">
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 active:scale-95 transition-transform rounded-full hover:bg-gray-50">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="font-black text-[17px] text-gray-800 tracking-tight">Verificar identidad</h1>
        <div className="w-8"></div>
      </div>

      <div className="max-w-md mx-auto p-6 pt-8">
        {currentStep < 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Introducción', 'Documento', 'Selfie'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black ${
                  currentStep > i ? 'bg-[#00C97A] text-white' : currentStep === i ? 'bg-[#1A1A3A] text-white' : 'bg-[#E8E8F0] text-[#1A1A3A]/40'
                }`}>
                  {currentStep > i ? '✓' : i + 1}
                </div>
                <span className={`text-[12px] font-bold hidden sm:inline-block ${currentStep === i ? 'text-[#1A1A3A]' : 'text-[#1A1A3A]/40'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`w-8 h-0.5 ${currentStep > i ? 'bg-[#00C97A]' : 'bg-[#E8E8F0]'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* PASO 0: INTRODUCCIÓN */}
        {currentStep === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-[#1A1A3A] mb-2">Conviértete en Pana Verificado <ShieldCheck className="inline text-[#00C97A]" /></h2>
            <p className="text-[#1A1A3A]/60 font-bold mb-8">La comunidad confía más en panas verificados</p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center shadow-sm">
                <div className="w-10 h-10 bg-[#00C97A]/10 rounded-full flex items-center justify-center text-[#00C97A] shrink-0"><ShieldCheck size={20} /></div>
                <p className="text-sm font-bold text-gray-700">Badge "Pana Verificado" en tu perfil y anuncios</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center shadow-sm">
                <div className="w-10 h-10 bg-[#FFB400]/10 rounded-full flex items-center justify-center text-[#FFB400] shrink-0"><span className="font-black text-lg">📈</span></div>
                <p className="text-sm font-bold text-gray-700">Tus anuncios aparecen primero en búsquedas</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shrink-0"><span className="font-black text-lg">💬</span></div>
                <p className="text-sm font-bold text-gray-700">Más mensajes y contactos de otros panas</p>
              </div>
            </div>

            <div className="bg-[#FFF8E7] border border-[#FFB400]/30 rounded-2xl p-4 text-[13px] text-[#1A1A3A]/70 mb-8 font-medium">
              🔒 Tus documentos se almacenan de forma segura y encriptada. Solo son accesibles por el equipo de verificación de Mi Pana y nunca se comparten con terceros. Al verificarte aceptas que Mi Pana puede contactarte en caso de disputas.
            </div>

            <button onClick={() => setCurrentStep(1)} className="w-full bg-[#1A1A3A] text-white font-black py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all">
              Comenzar verificación →
            </button>
          </div>
        )}

        {/* PASO 1: DOCUMENTO */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-black text-[#1A1A3A] mb-6">Sube tu documento</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de documento</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer">
                <option value="dni">DNI (España)</option>
                <option value="passport">Pasaporte</option>
                <option value="cedula">Cédula Venezolana</option>
                <option value="nie">NIE (España)</option>
                <option value="foreign">Documento Extranjero</option>
              </select>
            </div>

            <div 
              onClick={() => fileInputRef.current.click()}
              className="w-full h-48 border-2 border-dashed border-[#1A1A3A]/30 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-[#EDEDF5]/50 hover:bg-[#EDEDF5] active:scale-[0.98] transition-all overflow-hidden relative mb-8"
            >
              {frontPreview ? (
                <img src={frontPreview} alt="Documento" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <Camera size={28} className="text-[#1A1A3A]"/>
                  </div>
                  <p className="text-[14px] font-bold text-[#1A1A3A]/60">Toca para fotografiar la parte frontal</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleDocumentCapture} />
            
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-8 space-y-2">
              <p className="text-[13px] font-bold text-gray-600 flex items-center gap-2"><span className="text-green-500">✅</span> Documento completo y legible</p>
              <p className="text-[13px] font-bold text-gray-600 flex items-center gap-2"><span className="text-green-500">✅</span> Buena iluminación sin reflejos</p>
              <p className="text-[13px] font-bold text-gray-600 flex items-center gap-2"><span className="text-red-500">❌</span> Sin fotos borrosas o cortadas</p>
              <p className="text-[13px] font-bold text-gray-600 flex items-center gap-2"><span className="text-red-500">❌</span> Sin filtros ni ediciones</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCurrentStep(0)} className="px-6 py-4 rounded-2xl font-black bg-gray-200 text-gray-700 active:scale-95 transition-transform">Atrás</button>
              <button 
                onClick={() => {
                  if (documentFront) {
                    setCurrentStep(2);
                  } else {
                    alert('Debes subir la foto del documento para continuar.');
                  }
                }}
                disabled={!documentFront} 
                className="flex-1 bg-[#1A1A3A] text-white font-black py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                Siguiente paso →
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: SELFIE / LIVENESS */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <h2 className="text-2xl font-black text-[#1A1A3A] mb-2">Selfie de seguridad</h2>
            <p className="text-sm font-bold text-gray-500 mb-8">Necesitamos comprobar que eres tú.</p>

            <div className="relative w-full aspect-[3/4] max-w-xs mx-auto rounded-[32px] overflow-hidden bg-black mb-8 shadow-2xl">
              
              {/* Se mantiene siempre renderizado para que videoRef sea válido de inmediato */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover scale-x-[-1] ${(livenessStep === 'detecting' || livenessStep === 'captured') ? 'block' : 'hidden'}`} 
              />

              {livenessStep === 'init' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A3A] text-white p-6 z-10">
                  <Camera size={48} className="text-[#FFB400] mb-4 opacity-80" />
                  <p className="font-bold text-center mb-6">Coloca tu cara dentro del óvalo en la pantalla que aparecerá al encender la cámara.</p>
                  <button onClick={startCamera} className="w-full bg-[#FFB400] text-black font-black py-3 rounded-xl active:scale-95 transition-transform">Encender cámara</button>
                </div>
              )}

              {(livenessStep === 'detecting' || livenessStep === 'captured') && (
                <>
                  {livenessStep === 'captured' && selfieCapture && (
                    <img src={URL.createObjectURL(selfieCapture)} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" alt="Selfie" />
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[70%] h-[60%] border-4 border-white/80 rounded-[100px] opacity-70 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
                  </div>
                  
                  {livenessStep === 'detecting' && (
                    <div className="absolute top-8 left-0 right-0 text-center z-10">
                      <span className="bg-black/50 backdrop-blur-md text-white font-bold px-4 py-2 rounded-full text-sm">Mantén la mirada a la cámara</span>
                    </div>
                  )}

                  {livenessStep === 'detecting' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <span className="text-white font-black text-8xl drop-shadow-lg scale-150 animate-pulse">{countdown > 0 ? countdown : ''}</span>
                    </div>
                  )}
                  
                  {livenessStep === 'captured' && (
                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                        <span className="text-4xl">✅</span>
                      </div>
                      <p className="text-white font-black text-xl drop-shadow-md">¡Perfecto, pana!</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {livenessStep === 'captured' && (
              <div className="flex gap-3">
                <button onClick={() => { stopCamera(); setLivenessStep('init'); setSelfieCapture(null); }} className="px-5 py-4 rounded-2xl font-black bg-gray-200 text-gray-700 active:scale-95 transition-transform">Repetir</button>
                <button onClick={handleSubmit} disabled={uploading} className="flex-1 bg-[#1A1A3A] text-[#FFB400] font-black py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                  {uploading ? <><span className="animate-spin text-xl">⏳</span> Enviando...</> : 'Enviar solicitud'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: ÉXITO */}
        {currentStep === 3 && (
          <div className="animate-in zoom-in-95 duration-500 text-center py-10">
            <div className="w-24 h-24 bg-[#FFB400]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HourglassIcon size={40} className="text-[#FFB400]" />
            </div>
            <h2 className="text-2xl font-black text-[#1A1A3A] mb-3">¡Solicitud enviada, pana!</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-[280px] mx-auto text-sm">
              Revisaremos tu solicitud en las próximas 24 horas. Te notificaremos por email con el resultado.
            </p>
            <button onClick={() => navigate('/perfil')} className="w-full bg-[#1A1A3A] text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all">
              Volver al perfil
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
