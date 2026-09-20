import { useAppStore } from "../../store/useAppStore";
import { EspacieLogo } from "../common/EspacieLogo";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Award,
  FileBarChart,
} from "lucide-react";

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export function AdminSidebar({ onCloseMobile }: AdminSidebarProps = {}) {
  const { activeView, setActiveView } = useAppStore();

  const navItems = [
    { id: "dashboard" as const, label: "Painel Geral", icon: LayoutDashboard },
    { id: "candidates" as const, label: "Candidatos & Posições", icon: Users },
    { id: "tests" as const, label: "Gestão de Testes", icon: FileCheck2 },
    { id: "results" as const, label: "Resultados & Correção", icon: Award },
    { id: "reports" as const, label: "Relatórios & IA", icon: FileBarChart },
  ];

  return (
    <aside className="w-64 bg-[#08172b] border-r border-[#152e4d] flex flex-col justify-between shrink-0 select-none h-full">
      {/* Brand Header with Espacie Logo */}
      <div>
        <div className="p-5 border-b border-[#152e4d] flex items-center justify-between">
          <EspacieLogo theme="on-dark" size="md" />
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Menu Administrativo
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id ||
              (item.id === "tests" && activeView === "test-questions");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#0A2540] text-sky-400 border border-sky-500/30 shadow-sm font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Institutional Footer (No session buttons here, centralized in Top Header) */}
      <div className="p-4 border-t border-[#152e4d]">
        <div className="p-3 rounded-xl bg-[#0b1e36]/70 border border-[#1b3a61]/60 text-xs text-slate-400 text-center">
          <div className="font-semibold text-slate-300">Espacie Services</div>
          <div className="text-[10px] text-sky-400/80 font-mono mt-0.5">Sistema Integrado de Avaliação</div>
        </div>
      </div>
    </aside>
  );
}
