import { LegalData } from '../data/LegalData';
import { useNavigate } from 'react-router-dom';

export default function CookiesPage() {
  const navigate = useNavigate();
  const doc = LegalData.cookies;

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#1A1A3A] font-black text-xl tracking-tight">Mi Pana</span>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="text-sm font-bold text-[#1A1A3A]/70 hover:text-[#1A1A3A]"
          >
            Volver
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-black text-[#1A1A3A] mb-8">{doc.title}</h1>
        
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
            {doc.content}
          </div>
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => navigate('/home')}
            className="bg-[#FFB400] text-[#1A1A3A] font-black px-6 py-3 rounded-2xl hover:bg-[#FF9000] transition-colors shadow-[0_4px_14px_rgba(255,180,0,0.3)]"
          >
            Volver a Mi Pana
          </button>
        </div>
      </main>

      <footer className="py-8 text-center text-sm font-medium text-gray-400">
        &copy; 2026 Mi Pana &middot; mipana.net
      </footer>
    </div>
  );
}
