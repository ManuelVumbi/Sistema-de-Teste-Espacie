import { useRef, useState, useEffect, type MouseEvent, type TouchEvent } from "react";
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Download,
} from "lucide-react";

interface Props {
  initialData?: string;
  onSave: (dataUrl: string) => void;
  readOnly?: boolean;
}

export function DrawingCanvas({ initialData, onSave, readOnly = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [color, setColor] = useState("#10b981"); // emerald-500
  const [brushSize, setBrushSize] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const COLORS = [
    { label: "Esmeralda", value: "#10b981" },
    { label: "Âmbar", value: "#f59e0b" },
    { label: "Azul Céu", value: "#38bdf8" },
    { label: "Vermelho Alerta", value: "#ef4444" },
    { label: "Branco", value: "#f8fafc" },
    { label: "Amarelo", value: "#eab308" },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width || 600;
      canvas.height = 320;
    } else {
      canvas.width = 600;
      canvas.height = 320;
    }

    // Default dark canvas background
    ctx.fillStyle = "#090d16"; // ultra dark slate
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid guide lines (subtle blueprint grid)
    drawGrid(ctx, canvas.width, canvas.height);

    // If initial image data exists, render it
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = initialData;
    }

    // Save initial state for undo
    saveHistoryState(ctx, canvas.width, canvas.height);
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(51, 65, 85, 0.25)";
    ctx.lineWidth = 0.5;

    const gridSize = 20;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const saveHistoryState = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    const data = ctx.getImageData(0, 0, w, h);
    setHistory((prev) => [...prev.slice(-10), data]);
  };

  const getCoordinates = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = mode === "erase" ? "#090d16" : color;
  };

  const draw = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveHistoryState(ctx, canvas.width, canvas.height);

    // Auto-export snapshot to answer
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  const handleClear = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    saveHistoryState(ctx, canvas.width, canvas.height);
    setHasDrawn(false);
    onSave("");
  };

  const handleUndo = () => {
    if (readOnly || history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHist = [...history];
    newHist.pop(); // remove current
    const prev = newHist[newHist.length - 1];
    if (prev) {
      ctx.putImageData(prev, 0, 0);
      setHistory(newHist);
      onSave(canvas.toDataURL("image/png"));
    }
  };

  const handleManualSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Canvas Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 border-b border-slate-700">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("draw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mode === "draw"
                  ? "bg-emerald-500 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" /> Pincel
            </button>
            <button
              type="button"
              onClick={() => setMode("erase")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mode === "erase"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Eraser className="w-3.5 h-3.5" /> Borracha
            </button>
          </div>

          {/* Color Palette */}
          {mode === "draw" && (
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color === c.value
                      ? "scale-125 border-white ring-2 ring-emerald-400"
                      : "border-slate-600 hover:scale-110"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          )}

          {/* Brush Size */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tamanho:</span>
            <input
              type="range"
              min="1"
              max="12"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 accent-emerald-500 cursor-pointer"
            />
            <span className="font-mono text-slate-200">{brushSize}px</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              title="Desfazer traço"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40"
              title="Limpar quadro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo Auto
            </button>
          </div>
        </div>
      )}

      {/* Drawing Board Area */}
      <div className="relative w-full overflow-hidden flex items-center justify-center p-2 bg-slate-950">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full rounded-xl border border-slate-800 shadow-inner ${
            readOnly ? "cursor-default" : mode === "draw" ? "cursor-crosshair" : "cursor-cell"
          }`}
          style={{ touchAction: "none" }}
        />

        {!hasDrawn && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500/80">
            <Paintbrush className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
            <p className="text-xs font-medium">
              Clique e arraste para desenhar o diagrama técnico ou esquema
            </p>
            <p className="text-[11px] text-slate-600">
              Grade de precisão milimétrica • Salvamento automático integrado
            </p>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          {hasDrawn
            ? "Esquema gráfico pronto e gravado na resposta do candidato."
            : "Área de resposta gráfica desimpedida."}
        </span>
        <span className="font-mono text-emerald-400">Espacie Visual CAD</span>
      </div>
    </div>
  );
}
