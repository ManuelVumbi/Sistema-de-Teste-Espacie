import { useState } from "react";
import { X, Sparkles, Copy, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (sym: string) => void;
}

type TabType = "math" | "chemical" | "physical" | "geometric" | "safety";

export function SymbolPalette({ isOpen, onClose, onInsertSymbol }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("math");
  const [copiedSym, setCopiedSym] = useState<string | null>(null);

  if (!isOpen) return null;

  const SYMBOLS = {
    math: [
      { sym: "π", label: "Pi" },
      { sym: "∑", label: "Somatório" },
      { sym: "√", label: "Raiz Quadrada" },
      { sym: "∛", label: "Raiz Cúbica" },
      { sym: "∫", label: "Integral" },
      { sym: "∂", label: "Derivada Parcial" },
      { sym: "∞", label: "Infinito" },
      { sym: "±", label: "Mais ou Menos" },
      { sym: "≈", label: "Aproximadamente" },
      { sym: "≠", label: "Diferente" },
      { sym: "≤", label: "Menor ou igual" },
      { sym: "≥", label: "Maior ou igual" },
      { sym: "×", label: "Multiplicação" },
      { sym: "÷", label: "Divisão" },
      { sym: "‰", label: "Por mil" },
      { sym: "∝", label: "Proporcional" },
      { sym: "∈", label: "Pertence" },
      { sym: "∉", label: "Não pertence" },
      { sym: "∪", label: "União" },
      { sym: "∩", label: "Interseção" },
      { sym: "Δ", label: "Delta (Variação)" },
      { sym: "θ", label: "Teta (Ângulo)" },
      { sym: "α", label: "Alfa" },
      { sym: "β", label: "Beta" },
    ],
    chemical: [
      { sym: "H₂O", label: "Água" },
      { sym: "CO₂", label: "Dióxido de Carbono" },
      { sym: "CH₄", label: "Metano" },
      { sym: "O₂", label: "Oxigénio" },
      { sym: "N₂", label: "Azoto" },
      { sym: "H₂S", label: "Gás Sulfídrico" },
      { sym: "NaCl", label: "Cloreto de Sódio" },
      { sym: "H₂SO₄", label: "Ácido Sulfúrico" },
      { sym: "HCl", label: "Ácido Clorídrico" },
      { sym: "NH₃", label: "Amoníaco" },
      { sym: "pH", label: "Potencial Hidrogeniônico" },
      { sym: "⇌", label: "Equilíbrio Químico" },
      { sym: "→", label: "Reação Unidirecional" },
      { sym: "↑", label: "Libertação de Gás" },
      { sym: "↓", label: "Precipitado" },
      { sym: "ΔH", label: "Entalpia" },
      { sym: "ppm", label: "Partes por milhão" },
      { sym: "ppb", label: "Partes por bilhão" },
    ],
    physical: [
      { sym: "Ω", label: "Ohm (Resistência)" },
      { sym: "μ", label: "Micro / Coef. Atrito" },
      { sym: "λ", label: "Comprimento de onda" },
      { sym: "ρ", label: "Massa Específica / Resistividade" },
      { sym: "σ", label: "Tensão Mecânica" },
      { sym: "τ", label: "Torque / Cisalhamento" },
      { sym: "ω", label: "Velocidade Angular" },
      { sym: "η", label: "Rendimento / Viscosidade" },
      { sym: "Hz", label: "Hertz (Frequência)" },
      { sym: "kW", label: "Quilowatt" },
      { sym: "kWh", label: "Quilowatt-hora" },
      { sym: "bar", label: "Pressão (bar)" },
      { sym: "psi", label: "Pressão (psi)" },
      { sym: "m/s²", label: "Aceleração" },
      { sym: "N·m", label: "Newton-metro" },
      { sym: "Pa", label: "Pascal" },
    ],
    geometric: [
      { sym: "∠", label: "Ângulo" },
      { sym: "°", label: "Grau" },
      { sym: "⟂", label: "Perpendicular" },
      { sym: "∥", label: "Paralelo" },
      { sym: "△", label: "Triângulo" },
      { sym: "□", label: "Quadrado" },
      { sym: "○", label: "Círculo" },
      { sym: "⌀", label: "Diâmetro" },
      { sym: "R", label: "Raio" },
      { sym: "⌒", label: "Arco" },
      { sym: "≅", label: "Congruente" },
      { sym: "≡", label: "Idêntico" },
    ],
    safety: [
      { sym: "⚠", label: "Perigo Geral" },
      { sym: "⚡", label: "Risco Elétrico" },
      { sym: "☣", label: "Risco Biológico" },
      { sym: "☢", label: "Risco Radiológico" },
      { sym: "⛔", label: "Acesso Proibido" },
      { sym: "🚸", label: "Atenção Pedestres" },
      { sym: "🛢️", label: "Líquidos Inflamáveis" },
      { sym: "🛡️", label: "EPI Obrigatório" },
      { sym: "🔥", label: "Ponto de Inflamação" },
      { sym: "🛑", label: "Paragem Obrigatória" },
      { sym: "✔", label: "Item Conforme" },
      { sym: "✖", label: "Não Conforme" },
    ],
  };

  const handleSelect = (sym: string) => {
    onInsertSymbol(sym);
    setCopiedSym(sym);
    setTimeout(() => setCopiedSym(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-slate-100">
              Painel de Símbolos Técnicos
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 overflow-x-auto text-xs">
          {[
            { id: "math", label: "Matemática" },
            { id: "chemical", label: "Química" },
            { id: "physical", label: "Física & Unidades" },
            { id: "geometric", label: "Geometria" },
            { id: "safety", label: "Segurança / HSSE" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-800 text-emerald-400 border border-slate-700 font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Symbol Grid */}
        <div className="p-4 max-h-72 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {SYMBOLS[activeTab].map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.sym)}
                title={item.label}
                className="group relative flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700/60 text-slate-200 hover:text-emerald-300 transition-all hover:scale-105"
              >
                <span className="text-xl font-mono mb-1">{item.sym}</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[64px] group-hover:text-slate-300">
                  {item.label}
                </span>

                {copiedSym === item.sym && (
                  <span className="absolute inset-0 bg-emerald-600/90 text-slate-950 font-bold text-xs flex items-center justify-center rounded-xl animate-in fade-in">
                    <Check className="w-4 h-4 mr-1" /> Inserido
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Clique em um símbolo para inseri-lo na resposta ativa.</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <Copy className="w-3.5 h-3.5" /> Espacie Tools
          </span>
        </div>
      </div>
    </div>
  );
}
