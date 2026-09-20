import { useState, type FormEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import { EspacieLogo } from "../common/EspacieLogo";
import {
  Shield,
  User,
  KeyRound,
  FileText,
  Lock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export function LoginView() {
  const { loginAdmin, loginCandidate, resetAdminPassword } = useAppStore();

  const [activeTab, setActiveTab] = useState<"admin" | "candidate">("candidate");

  // Admin credentials state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Candidate credentials state
  const [candDoc, setCandDoc] = useState("");
  const [candPass, setCandPass] = useState("");

  // Admin Password Reset Modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetOldPass, setResetOldPass] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(adminUsername, adminPassword);
    if (success) {
      toast.success("Autenticado com sucesso como Administrador Geral.");
    } else {
      toast.error("Credenciais inválidas. Verifique o nome de utilizador ou palavra-passe.");
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

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    if (resetNewPass !== resetConfirmPass) {
      toast.error("A nova palavra-passe e a confirmação não coincidem.");
      return;
    }
    if (resetNewPass.length < 6) {
      toast.error("A nova palavra-passe deve conter pelo menos 6 caracteres.");
      return;
    }

    const success = resetAdminPassword(resetOldPass, resetNewPass);
    if (success) {
      toast.success("Palavra-passe de administrador redefinida com sucesso!");
      setResetModalOpen(false);
      setAdminPassword(resetNewPass);
    } else {
      toast.error("A palavra-passe atual informada está incorreta.");
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
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
                  placeholder="Digite a sua palavra-passe..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
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
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/90 rounded-xl text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Palavra-passe</label>
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  Redefinir palavra-passe
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full pl-10 pr-4 py-3 bg-[#061424] border border-slate-700/90 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
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

            <div className="p-2.5 rounded-xl bg-[#061424] border border-[#17365D] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Credencial padrão:</span>
              <span className="font-mono text-sky-400">admin / admin123</span>
            </div>
          </form>
        )}
      </div>

      {/* Admin Password Reset Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">
                Redefinir Palavra-passe de Administrador
              </h3>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Palavra-passe Atual
                </label>
                <input
                  type="password"
                  required
                  value={resetOldPass}
                  onChange={(e) => setResetOldPass(e.target.value)}
                  placeholder="admin123"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Nova Palavra-passe (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Confirmar Nova Palavra-passe
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
