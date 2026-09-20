import { useState } from "react";
import { Calculator as CalcIcon, X, RotateCcw, Delete } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsertValue?: (val: string) => void;
}

export function ScientificCalculator({ isOpen, onClose, onInsertValue }: Props) {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState<number>(0);
  const [angleMode, setAngleMode] = useState<"DEG" | "RAD">("DEG");
  const [formula, setFormula] = useState("");

  if (!isOpen) return null;

  const handleNum = (num: string) => {
    if (display === "0" || display === "Error") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOp = (op: string) => {
    setFormula(display + " " + op + " ");
    setDisplay("0");
  };

  const handleClear = () => {
    setDisplay("0");
    setFormula("");
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleEquals = () => {
    try {
      const fullExpr = formula + display;
      // Sanitize expression
      const cleanExpr = fullExpr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**");

      // eslint-disable-next-line no-eval
      const res = Function(`'use strict'; return (${cleanExpr})`)();
      const formatted = Number.isFinite(res) ? String(Math.round(res * 1000000) / 1000000) : "Error";
      setDisplay(formatted);
      setFormula("");
    } catch {
      setDisplay("Error");
    }
  };

  const handleFunction = (fn: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res = 0;
    const toRad = angleMode === "DEG" ? (val * Math.PI) / 180 : val;

    switch (fn) {
      case "sin":
        res = Math.sin(toRad);
        break;
      case "cos":
        res = Math.cos(toRad);
        break;
      case "tan":
        res = Math.tan(toRad);
        break;
      case "sqrt":
        res = val >= 0 ? Math.sqrt(val) : NaN;
        break;
      case "sq":
        res = Math.pow(val, 2);
        break;
      case "log":
        res = val > 0 ? Math.log10(val) : NaN;
        break;
      case "ln":
        res = val > 0 ? Math.log(val) : NaN;
        break;
      case "inv":
        res = val !== 0 ? 1 / val : NaN;
        break;
      case "pi":
        res = Math.PI;
        break;
      case "e":
        res = Math.E;
        break;
      case "neg":
        res = -val;
        break;
      default:
        break;
    }

    if (isNaN(res)) {
      setDisplay("Error");
    } else {
      setDisplay(String(Math.round(res * 1000000) / 1000000));
    }
  };

  // Memory functions
  const handleMem = (action: "M+" | "M-" | "MR" | "MC") => {
    const val = parseFloat(display) || 0;
    if (action === "M+") setMemory(memory + val);
    if (action === "M-") setMemory(memory - val);
    if (action === "MR") setDisplay(String(memory));
    if (action === "MC") setMemory(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CalcIcon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-slate-100">
              Calculadora Científica
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
              Espacie Support
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAngleMode(angleMode === "DEG" ? "RAD" : "DEG")}
              className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-600 hover:border-emerald-500 text-emerald-400 font-bold transition-colors"
            >
              {angleMode}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800">
          <div className="text-right text-xs text-slate-400 font-mono h-4 overflow-hidden truncate">
            {formula}
          </div>
          <div className="text-right text-2xl font-mono font-bold text-emerald-400 tracking-wider truncate py-1">
            {display}
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-xs text-slate-400 font-mono">
            <span>Mem: {memory}</span>
            {onInsertValue && (
              <button
                onClick={() => onInsertValue(display)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-sans"
              >
                Copiar p/ Resposta
              </button>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 space-y-2 select-none">
          {/* Memory row */}
          <div className="grid grid-cols-4 gap-1.5">
            {(["MC", "MR", "M+", "M-"] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleMem(m)}
                className="py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-400 text-xs font-semibold font-mono border border-slate-700/50"
              >
                {m}
              </button>
            ))}
          </div>

          {/* Scientific row 1 */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleFunction("sin")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              sin
            </button>
            <button
              onClick={() => handleFunction("cos")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              cos
            </button>
            <button
              onClick={() => handleFunction("tan")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              tan
            </button>
            <button
              onClick={() => handleFunction("pi")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              π
            </button>
            <button
              onClick={() => handleFunction("e")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              e
            </button>
          </div>

          {/* Scientific row 2 */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => handleFunction("log")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              log
            </button>
            <button
              onClick={() => handleFunction("ln")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              ln
            </button>
            <button
              onClick={() => handleFunction("sqrt")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              √x
            </button>
            <button
              onClick={() => handleFunction("sq")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              x²
            </button>
            <button
              onClick={() => handleFunction("inv")}
              className="py-1.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-mono"
            >
              1/x
            </button>
          </div>

          {/* Main numeric & operator grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={handleClear}
              className="py-2.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-sm font-bold border border-rose-800/50 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> C
            </button>
            <button
              onClick={handleDelete}
              className="py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono flex items-center justify-center"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFunction("neg")}
              className="py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono"
            >
              ±
            </button>
            <button
              onClick={() => handleOp("÷")}
              className="py-2.5 rounded bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 text-base font-bold border border-emerald-700/50"
            >
              ÷
            </button>

            {["7", "8", "9"].map((n) => (
              <button
                key={n}
                onClick={() => handleNum(n)}
                className="py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-base font-bold font-mono transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleOp("×")}
              className="py-2.5 rounded bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 text-base font-bold border border-emerald-700/50"
            >
              ×
            </button>

            {["4", "5", "6"].map((n) => (
              <button
                key={n}
                onClick={() => handleNum(n)}
                className="py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-base font-bold font-mono transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleOp("-")}
              className="py-2.5 rounded bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 text-base font-bold border border-emerald-700/50"
            >
              -
            </button>

            {["1", "2", "3"].map((n) => (
              <button
                key={n}
                onClick={() => handleNum(n)}
                className="py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-base font-bold font-mono transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handleOp("+")}
              className="py-2.5 rounded bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 text-base font-bold border border-emerald-700/50"
            >
              +
            </button>

            <button
              onClick={() => handleNum("0")}
              className="col-span-2 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-base font-bold font-mono transition-colors"
            >
              0
            </button>
            <button
              onClick={() => {
                if (!display.includes(".")) handleNum(".");
              }}
              className="py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-base font-bold font-mono"
            >
              .
            </button>
            <button
              onClick={handleEquals}
              className="py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-lg font-bold font-mono shadow-md shadow-emerald-900/40 transition-all"
            >
              =
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
