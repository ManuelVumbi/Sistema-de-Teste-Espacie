import { useState, type FormEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import { EspacieLogo } from "../common/EspacieLogo";
import { Shield, User, KeyRound, FileText, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function LoginView() {
  const { loginAdmin, loginCandidate } = useAppStore();

  const [activeTab, setActiveTab] = useState<"candidate" | "admin">("candidate");

  // Admin credentials state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Candidate credentials state
  const [candDoc, setCandDoc] = useState("");
  const [candPass, setCandPass] = useState("");

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(adminUsername, adminPassword);
    if (success) {
      toast.success("Autenticado com sucesso como Administrador Geral.");
    } else {
      toast.error("Credenciais inválidas. Verifique o utilizador ou palavra-passe.");
    }
  };

  const handleCandidateLogin = (e: FormEvent) => {
    e.preventDefault();
    const success = loginCandidate(candDoc, candPass);
    if (success) {
      toast.success("Acesso autorizado ao Portal do Candidato.");
    } else {
      toast.error("Documento ou palavra-passe incorretos, ou candidato inativo.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 select-none">
      {/* Background ambient accents in Espacie navy/blue */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-[#091B30]/95 border border-[#17365D] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center pb-1">
            <EspacieLogo theme="on-dark" size="xl" />
          </div>
          <p className="text-xs text-slate-300">
            Sistema Integrado de Testes e Avaliação Técnica
          </p>
        </div>

        {/* Profile Tab Switcher */}
        <div className="flex rounded-2xl bg-[#061424] p-1 border border-[#17365D] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("candidate")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "candidate"
                ? "bg-[#0A2540] text-sky-400 shadow-xs border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4" /> Candidato
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "admin"
                ? "bg-[#0A2540] text-sky-400 shadow-xs border border-sky-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" /> Administrador
          </button>
        </div>

        {/* Candidate Login Form */}
        {activeTab === "candidate" && (
          <form onSubmit={handleCandidateLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                Número de BI ou Passaporte
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={candDoc}
                  onChange={(e) => setCandDoc(e.target.value)}
                  placeholder="Ex: 004819283LA042"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 font-mono text-xs focus:border-sky-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                Palavra-passe do Candidato
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={candPass}
                  onChange={(e) => setCandPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md shadow-sky-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Acessar Provas Técnicas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Administrator Login Form */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                Nome de Utilizador
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Utilizador"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                Palavra-passe
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#061424] border border-slate-700/90 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md shadow-sky-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Entrar no Painel Administrativo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
