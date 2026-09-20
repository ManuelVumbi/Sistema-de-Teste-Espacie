import { useState } from "react";
import { Keyboard as KeyboardIcon, X, ArrowUp, Delete, CornerDownLeft, Space } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

export function VirtualKeyboard({
  isOpen,
  onClose,
  onKeyPress,
  onBackspace,
  onEnter,
}: Props) {
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);

  if (!isOpen) return null;

  const rows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
  ];

  const shiftMap: Record<string, string> = {
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")",
    "-": "_",
    "=": "+",
    "[": "{",
    "]": "}",
    ";": ":",
    "'": '"',
    ",": "<",
    ".": ">",
    "/": "?",
  };

  const handleKeyClick = (key: string) => {
    let char = key;
    if (isShift || isCaps) {
      if (shiftMap[key] && isShift) {
        char = shiftMap[key];
      } else {
        char = key.toUpperCase();
      }
    }
    onKeyPress(char);
    if (isShift) setIsShift(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 border-t border-slate-700 backdrop-blur-md shadow-2xl p-3 max-w-4xl mx-auto rounded-t-2xl animate-in slide-in-from-bottom duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-2">
        <div className="flex items-center gap-2">
          <KeyboardIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Teclado Virtual QWERTY
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Espacie Assist
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Grid */}
      <div className="space-y-1.5 select-none">
        {/* Row 1 */}
        <div className="flex justify-center gap-1">
          {rows[0].map((k) => (
            <button
              key={k}
              onClick={() => handleKeyClick(k)}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-100 text-xs font-mono font-semibold border border-slate-700/60 transition-colors shadow-xs"
            >
              {isShift && shiftMap[k] ? shiftMap[k] : k}
            </button>
          ))}
          <button
            onClick={onBackspace}
            className="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 active:bg-rose-700 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-1">
          {rows[1].map((k) => (
            <button
              key={k}
              onClick={() => handleKeyClick(k)}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-100 text-xs font-mono font-semibold border border-slate-700/60 transition-colors shadow-xs"
            >
              {isShift || isCaps ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex justify-center gap-1">
          <button
            onClick={() => setIsCaps(!isCaps)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              isCaps
                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            Caps
          </button>
          {rows[2].map((k) => (
            <button
              key={k}
              onClick={() => handleKeyClick(k)}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-100 text-xs font-mono font-semibold border border-slate-700/60 transition-colors shadow-xs"
            >
              {isShift || isCaps ? k.toUpperCase() : k}
            </button>
          ))}
          <button
            onClick={onEnter}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-500/50 flex items-center justify-center"
          >
            <CornerDownLeft className="w-4 h-4 mr-1" /> Enter
          </button>
        </div>

        {/* Row 4 */}
        <div className="flex justify-center gap-1">
          <button
            onClick={() => setIsShift(!isShift)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center ${
              isShift
                ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5 mr-1" /> Shift
          </button>
          {rows[3].map((k) => (
            <button
              key={k}
              onClick={() => handleKeyClick(k)}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-100 text-xs font-mono font-semibold border border-slate-700/60 transition-colors shadow-xs"
            >
              {isShift && shiftMap[k] ? shiftMap[k] : isShift || isCaps ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Row 5 - Space */}
        <div className="flex justify-center gap-2 pt-1">
          <button
            onClick={() => onKeyPress(" ")}
            className="w-1/2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Space className="w-4 h-4" /> Barra de Espaço
          </button>
        </div>
      </div>
    </div>
  );
}
