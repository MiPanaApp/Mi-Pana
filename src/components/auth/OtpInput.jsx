import { useRef, useEffect } from "react";

export default function OtpInput({ length = 6, onComplete }) {
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return;

    if (value && index < length - 1) {
      inputsRef.current[index + 1].focus();
    }

    const currentValues = inputsRef.current.map(input => input.value);
    if (currentValues.every(val => val !== "")) {
      onComplete(currentValues.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-[44px] h-[52px] rounded-[14px] bg-[#E8E8F0] shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-center text-[20px] font-black text-[#1A1A3A] border-none outline-none focus:shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9),inset_0_0_0_2px_#FFB400] transition-shadow"
        />
      ))}
    </div>
  );
}
