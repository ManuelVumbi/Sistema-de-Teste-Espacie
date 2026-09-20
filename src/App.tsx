import { useAppStore } from "./store/useAppStore";
import { EspacieLogo } from "./components/common/EspacieLogo";
import { LoginView } from "./components/auth/LoginView";
import { AdminSidebar } from "./components/admin/AdminSidebar";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { CandidatesManagement } from "./components/admin/CandidatesManagement";
import { TestsManagement } from "./components/admin/TestsManagement";
import { QuestionsManagement } from "./components/admin/QuestionsManagement";
import { ResultsManagement } from "./components/admin/ResultsManagement";
import { ReportsManagement } from "./components/admin/ReportsManagement";
import { CandidatePortal } from "./components/candidate/CandidatePortal";
import { TestTakingEnvironment } from "./components/candidate/TestTakingEnvironment";
import { Toaster } from "sonner";
import {
  LogOut,
  ShieldCheck,
  User,
  Sparkles,
  Menu,
  X,
  Layers,
} from "lucide-react";
import { useState } from "react";

export default function App() {
  const {
    currentUser,
    activeView,
    setActiveView,
    logout,
    tests,
    candidates,
    results,
  } = useAppStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not authenticated, show login
  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors theme="dark" />
        <LoginView />
      </>
    );
  }

  // If candidate
  if (currentUser.role === "candidate") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        <Toaster position="top-right" richColors theme="dark" />
        {activeView === "test-taking" ? (
          <TestTakingEnvironment />
        ) : (
          <CandidatePortal />
        )}
      </div>
    );
  }

  // Administrator View
  const viewTitles: Record<string, string> = {
    dashboard: "Painel de Controle Executivo",
    candidates: "Gestão de Candidatos",
    tests: "Gestão de Testes e Avaliações",
    "test-questions": "Banco de Perguntas & IA",
    results: "Resultados & Avaliação",
    reports: "Relatórios Gerais & Inteligência",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      <Toaster position="top-right" richColors theme="dark" />

      {/* Top Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <EspacieLogo theme="on-dark" size="sm" />
            <span className="hidden sm:inline-block text-[10px] text-sky-400 font-mono tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#0A2540] border border-sky-500/30">
              Painel Administrativo
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-slate-800">
            <span className="text-xs text-slate-400">Módulo Ativo:</span>
            <span className="text-xs font-semibold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80">
              {viewTitles[activeView] || "Painel"}
            </span>
          </div>
        </div>

        {/* Right Header: Admin profile & logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200">
              {currentUser.username}
            </span>
            <span className="text-[10px] text-slate-400">Administrador Geral</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-xs font-semibold transition-all"
            title="Encerrar Sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terminar Sessão</span>
          </button>
        </div>
      </header>

      {/* Body with Sidebar and Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto">
          <AdminSidebar />
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-slate-900 border-r border-slate-800 z-50 p-2 overflow-y-auto">
              <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeView === "dashboard" && <AdminDashboard />}
          {activeView === "candidates" && <CandidatesManagement />}
          {activeView === "tests" && <TestsManagement />}
          {activeView === "test-questions" && <QuestionsManagement />}
          {activeView === "results" && <ResultsManagement />}
          {activeView === "reports" && <ReportsManagement />}
        </main>
      </div>
    </div>
  );
}
