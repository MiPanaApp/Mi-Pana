import { useState, useRef, useCallback, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../services/firebase";

export default function useOtpVerification() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const confirmationResult = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const sendOtpSms = useCallback(async (fullPhoneNumber) => {
    setStatus("sending");
    setError(null);

    // Bypass de test para desarrollo sin OTP real
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
      setTimeout(() => {
        setStatus("sent");
        setCountdown(60);
      }, 1500); // Simulamos red
      return;
    }

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
      confirmationResult.current = result;
      setStatus("sent");
      
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      setStatus("error");
      if (err.code === "auth/invalid-phone-number") {
        setError("Número de teléfono inválido");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera unos minutos.");
      } else if (err.code === "auth/captcha-check-failed") {
        setError("Error de verificación. Intenta de nuevo.");
      } else {
        setError("Error enviando el código. Intenta de nuevo.");
      }
    }
  }, []);

  const verifyOtp = useCallback(async (code) => {
    setStatus("verifying");
    setError(null);
    
    // Bypass de test
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
      return new Promise((resolve) => setTimeout(() => {
        setStatus("verified");
        resolve({ uid: "test-001", phoneNumber: "+34000000000" });
      }, 1000));
    }

    try {
      const result = await confirmationResult.current.confirm(code);
      setStatus("verified");
      return result.user;
    } catch (err) {
      setStatus("error");
      if (err.code === "auth/invalid-verification-code") {
        setError("Código incorrecto. Verifica e intenta de nuevo.");
      } else if (err.code === "auth/code-expired") {
        setError("El código ha expirado. Solicita uno nuevo.");
      } else {
        setError("Error verificando el código.");
      }
      throw err;
    }
  }, []);

  const resendOtp = useCallback((fullPhoneNumber) => {
    if (countdown === 0) {
      sendOtpSms(fullPhoneNumber);
    }
  }, [countdown, sendOtpSms]);

  return { status, error, countdown, sendOtpSms, verifyOtp, resendOtp };
}
