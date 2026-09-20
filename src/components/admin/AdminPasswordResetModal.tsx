import { useState, type FormEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import { KeyRound, Eye, EyeOff, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

interface AdminPasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPasswordResetModal({
  isOpen,
  onClose,
}: AdminPasswordResetModalProps) {
  const { resetAdminPassword } = useAppStore();

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!currentPass) {
      toast.error("Por favor, insira a palavra-passe atual.");
      return;
    }

    if (newPass.length < 6) {
      toast.error("A nova palavra-passe deve conter pelo menos 6 caracteres.");
      return;
    }

    if (newPass !== confirmPass) {
      toast.error("A confirmação da palavra-passe não coincide com a nova palavra-passe.");
      return;
    }

    const success = resetAdminPassword(currentPass, newPass);
    if (success) {
      toast.success("Palavra-passe de Administrador atualizada com sucesso e sincronizada!");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      onClose();
    } else {
      toast.error("A palavra-passe atual informada está incorreta.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#091A2E] border border-[#17365D] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Redefinir Palavra-passe do Administrador
              </h3>
              <p className="text-[11px] text-slate-400">
                Altere as credenciais de acesso seguro ao Painel Geral
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security advice */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            A nova palavra-passe será exigida nos próximos inícios de sessão em todos os dispositivos e aplicações (Web e APK).
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block text-xs">
              Palavra-passe Atual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showCurrent ? "Ocultar" : "Mostrar"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block text-xs">
              Nova Palavra-passe
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showNew ? "Ocultar" : "Mostrar"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Mínimo de 6 caracteres.
            </span>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block text-xs">
              Confirmar Nova Palavra-passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showConfirm ? "Ocultar" : "Mostrar"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-950/40 transition-all hover:scale-105 active:scale-95"
            >
              Atualizar Palavra-passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
