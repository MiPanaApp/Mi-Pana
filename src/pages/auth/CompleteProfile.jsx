import { useNavigate } from "react-router-dom";
import ProfileBottomSheet from "../../components/auth/ProfileBottomSheet";
import logoTexto from "../../assets/Logo_Mi_pana_solo_texto_.png";
import "../../styles/auth.css";

export default function CompleteProfile() {
  const navigate = useNavigate();
  
  return (
    <div className="auth-bg">
      <div className="absolute top-[-100px] left-[-50px] w-[300px] h-[300px] rounded-[60%_40%_70%_40%] bg-[#FFB400] opacity-20 blur-xl" />
      <div className="absolute bottom-[-100px] right-[-50px] w-[250px] h-[250px] rounded-[40%_60%_50%_70%] bg-[#1A1A3A] opacity-10 blur-xl" />
      
      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pt-[78px]">
        <div className="mb-[24px] text-center">
          <img src={logoTexto} alt="miPana" style={{ height: "125px", objectFit: "contain", mixBlendMode: "multiply" }} className="mx-auto" />
        </div>
      </div>

      <ProfileBottomSheet 
        isOpen={true} 
        onClose={() => navigate("/home")} 
        authUser={null} 
      />
    </div>
  );
}
