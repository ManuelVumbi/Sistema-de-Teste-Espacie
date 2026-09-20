import { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Sparkles,
  Keyboard,
  ShieldAlert,
  CheckCircle,
  Flag,
  Send,
  HelpCircle,
  Eye,
  Info,
  LogOut,
} from "lucide-react";
import { ScientificCalculator } from "./ScientificCalculator";
import { SymbolPalette } from "./SymbolPalette";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { DrawingCanvas } from "./DrawingCanvas";
import { toast } from "sonner";

export function TestTakingEnvironment() {
  const {
    currentAttempt,
    tests,
    questions,
    saveAnswer,
    recordSecurityEvent,
    submitAttempt,
    maxSecurityWarnings,
    setActiveView,
    currentUser,
  } = useAppStore();

  const test = tests.find((t) => t.id === currentAttempt?.testId);
  const testQuestions = questions
    .filter((q) => q.testId === test?.id)
    .sort((a, b) => a.order - b.order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = testQuestions[currentIndex];

  // Tool modals
  const [calcOpen, setCalcOpen] = useState(false);
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Flags for review
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Confirm submit dialog
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Security warning overlay
  const [securityWarningMsg, setSecurityWarningMsg] = useState<string | null>(null);

  // Active answer text ref for virtual keyboard & symbols insertion
  const activeInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Timer countdown
  const totalDurationSeconds = (test?.durationMinutes || 45) * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalDurationSeconds);

  // Inactivity detection timer
  const lastActivityRef = useRef<number>(Date.now());

  // Set up timer and auto-submit on 0
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit("timeout");
          return 0;
        }
        return prev - 1;
      });

      // Check inactivity (5 minutes = 300s)
      const inactiveSeconds = (Date.now() - lastActivityRef.current) / 1000;
      if (inactiveSeconds > 300) {
        recordSecurityEvent(
          "inactivity",
          "Inatividade prolongada detectada (mais de 5 minutos sem interação)."
        );
        toast.warning("Aviso de Inatividade: Por favor, interaja com o exame.");
        lastActivityRef.current = Date.now();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update activity timestamp
  const registerActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Browser security integrity monitoring (Tab switch & Window Blur)
  useEffect(() => {
    let timeoutId: any = null;

    const handleVisibilityChange = () => {
      registerActivity();
      if (document.hidden) {
        const count = recordSecurityEvent(
          "tab_switch",
          "Candidato mudou de aba ou minimizou o navegador."
        );
        handleSecurityAlert(count, "Saída de aba do exame detectada.");
      }
    };

    const handleWindowBlur = () => {
      registerActivity();
      // small delay to avoid false triggers
      timeoutId = setTimeout(() => {
        if (document.hidden) return; // already handled by visibilitychange
        const count = recordSecurityEvent(
          "window_blur",
          "A janela do exame perdeu o foco principal."
        );
        handleSecurityAlert(count, "Janela do exame perdeu o foco.");
      }, 300);
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordSecurityEvent("copy_attempt", "Tentativa de copiar conteúdo do exame.");
      toast.error("A cópia de questões é restrita pelas normas do exame.");
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("copy", handleCopy);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentAttempt]);

  const handleSecurityAlert = (eventCount: number, reason: string) => {
    if (eventCount >= maxSecurityWarnings) {
      toast.error("Limite de avisos de monitorização excedido! O exame será submetido.");
      setTimeout(() => {
        handleAutoSubmit("security_limit");
      }, 1500);
    } else {
      setSecurityWarningMsg(
        `Aviso de Integridade #${eventCount} de ${maxSecurityWarnings}: ${reason}. O histórico de eventos do navegador está sendo registado.`
      );
      toast.warning(`Aviso de Integridade (${eventCount}/${maxSecurityWarnings})`);
    }
  };

  const handleAutoSubmit = (reason: string) => {
    if (!currentAttempt) return;
    submitAttempt(currentAttempt.id, reason);
    setActiveView("candidate-portal");
    toast.info("Exame finalizado. Você saiu da sala de teste.");
  };

  if (!test || !currentAttempt || testQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white mb-2">
          {!test
            ? "Teste Não Encontrado"
            : testQuestions.length === 0
            ? "Teste em Preparação Técnica"
            : "Sessão Finalizada"}
        </h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          {!test
            ? "A avaliação solicitada não foi localizada no sistema."
            : testQuestions.length === 0
            ? "Este teste ainda não possui perguntas publicadas pela coordenação técnica da Espacie Services."
            : "A sua sessão nesta sala de teste foi concluída com sucesso."}
        </p>
        <button
          onClick={() => setActiveView("candidate-portal")}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
        >
          Retornar Imediatamente ao Portal
        </button>
      </div>
    );
  }

  const currentAnswer = currentAttempt.answers[currentQuestion.id];
  const isFlagged = flaggedIds.has(currentQuestion.id);

  // Formatted countdown timer (HH:MM:SS)
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${hours > 0 ? String(hours).padStart(2, "0") + ":" : ""}${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isTimerCritical = remainingSeconds < 300; // less than 5 minutes

  // Progress metrics
  const totalQuestions = testQuestions.length;
  const answeredCount = Object.keys(currentAttempt.answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Toggle flag
  const toggleFlag = (id: string) => {
    const next = new Set(flaggedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFlaggedIds(next);
  };

  // Virtual keyboard and symbols text insertion
  const handleInsertText = (textToInsert: string) => {
    registerActivity();
    const existing = currentAnswer?.textAnswer || "";
    const updated = existing + textToInsert;
    saveAnswer(currentQuestion.id, { textAnswer: updated });
  };

  return (
    <div
      onMouseMove={registerActivity}
      onKeyDown={registerActivity}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none"
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
            ES
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-slate-100 truncate max-w-[200px] sm:max-w-md">
              {test.title}
            </h1>
            <p className="text-xs text-slate-400">
              Candidato: {currentUser?.fullName} • Setor: {test.sector}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Support tools quick bar */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setCalcOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-300 hover:bg-slate-700/80 transition-colors"
              title="Calculadora Científica"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSymbolsOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-700/80 transition-colors"
              title="Paleta de Símbolos Técnicos"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setKeyboardOpen(!keyboardOpen)}
              className={`p-1.5 rounded-lg transition-colors ${
                keyboardOpen
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700/80"
              }`}
              title="Teclado Virtual QWERTY"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
              isTimerCritical
                ? "bg-rose-950/60 border-rose-500/80 text-rose-400 animate-pulse"
                : "bg-slate-800/90 border-slate-700 text-emerald-400"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timeString}</span>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold border border-slate-700/60 hover:border-rose-700/50 transition-colors"
            title="Sair da Sala de Teste"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair da Sala</span>
          </button>

          {/* Finish exam button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/50 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finalizar Teste</span>
          </button>
        </div>
      </header>

      {/* Progress & Integrity Banner */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Progresso: <b className="text-emerald-400">{answeredCount}</b> de {totalQuestions} respondidas ({progressPercent}%)
          </span>
          <div className="w-28 sm:w-44 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Monitor de Integridade Ativo:</span>
          <span className="font-mono text-slate-200">
            {currentAttempt.securityEvents.length} avisos
          </span>
        </div>
      </div>

      {/* Security Warning Alert Modal */}
      {securityWarningMsg && (
        <div className="bg-amber-950/80 border-b border-amber-600/60 px-4 py-2.5 text-amber-200 text-xs flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{securityWarningMsg}</span>
          </div>
          <button
            onClick={() => setSecurityWarningMsg(null)}
            className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded font-semibold text-[11px]"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Active Question */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            {/* Question Meta Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                  Questão {currentIndex + 1} de {totalQuestions}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                  {currentQuestion.points} Pontos
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs">
                  Dificuldade: {currentQuestion.difficulty}
                </span>
              </div>

              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                  isFlagged
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {isFlagged ? "Marcada para Revisão" : "Marcar para Revisão"}
              </button>
            </div>

            {/* Statement */}
            <div className="space-y-3">
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                {currentQuestion.statement}
              </p>

              {/* Legal Reference or Angola Source if present */}
              {currentQuestion.legalSource && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300">
                      Referência Normativa / Legal:{" "}
                    </span>
                    {currentQuestion.legalSource}
                    {currentQuestion.verificationDate && (
                      <span className="text-slate-500 ml-2">
                        (Verificado em: {currentQuestion.verificationDate})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Question Image */}
              {currentQuestion.imageUrl && (
                <div className="my-4 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 max-w-lg">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Ilustração da Questão"
                    className="w-full object-cover max-h-72"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Answer Input depending on Type */}
            <div className="pt-2">
              {/* Type 1: Multiple Choice */}
              {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          saveAnswer(currentQuestion.id, { selectedOptionId: opt.id })
                        }
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/30"
                            : "bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-500 text-slate-950"
                                : "border-slate-500 text-slate-400"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </div>
                          <span className="text-sm font-medium">{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 2: True or False */}
              {currentQuestion.type === "true_false" && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "true", label: "Verdadeiro", color: "emerald" },
                    { id: "false", label: "Falso", color: "rose" },
                  ].map((btn) => {
                    const isSelected = currentAnswer?.selectedOptionId === btn.id;
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() =>
                          saveAnswer(currentQuestion.id, { selectedOptionId: btn.id })
                        }
                        className={`py-6 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? btn.id === "true"
                              ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-lg"
                              : "bg-rose-950/60 border-rose-500 text-rose-300 font-bold shadow-lg"
                            : "bg-slate-800/70 border-slate-700 hover:bg-slate-800 text-slate-200"
                        }`}
                      >
                        <span className="text-lg tracking-wide block">{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 3: Essay (Dissertativa) */}
              {currentQuestion.type === "essay" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Redija a sua resposta dissertativa com clareza e fundamentação técnica:
                    </span>
                    <span className="font-mono text-slate-400">
                      {(currentAnswer?.textAnswer || "").trim().split(/\s+/).filter(Boolean).length} palavras
                    </span>
                  </div>

                  <textarea
                    ref={activeInputRef}
                    rows={7}
                    value={currentAnswer?.textAnswer || ""}
                    onChange={(e) =>
                      saveAnswer(currentQuestion.id, { textAnswer: e.target.value })
                    }
                    placeholder="Digite aqui a sua resposta técnica completa..."
                    className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-500 text-sm leading-relaxed outline-hidden transition-all resize-y"
                  />

                  {currentQuestion.evaluationCriteria && (
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">
                        Critérios de Correção:{" "}
                      </span>
                      {currentQuestion.evaluationCriteria}
                    </div>
                  )}
                </div>
              )}

              {/* Type 4: Image Based */}
              {currentQuestion.type === "image_based" && currentQuestion.options && (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = currentAnswer?.selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          saveAnswer(currentQuestion.id, { selectedOptionId: opt.id })
                        }
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                            : "bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-500 text-slate-950"
                                : "border-slate-500 text-slate-400"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </div>
                          <span className="text-sm font-medium">{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 5: Visual Drawing Canvas */}
              {currentQuestion.type === "visual_drawing" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Utilize o quadro interativo abaixo para esboçar o diagrama, esquema elétrico,
                    planta de segurança ou fluxograma solicitado no enunciado.
                  </div>
                  <DrawingCanvas
                    initialData={currentAnswer?.drawingData}
                    onSave={(dataUrl) =>
                      saveAnswer(currentQuestion.id, { drawingData: dataUrl })
                    }
                  />
                </div>
              )}
            </div>

            {/* Navigation Buttons between questions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <span className="text-xs text-slate-400">
                Questão {currentIndex + 1} de {totalQuestions}
              </span>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/60"
                >
                  Rever e Finalizar <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Palette & Navigation */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="font-bold text-sm text-slate-200 flex items-center justify-between">
              <span>Mapa de Questões</span>
              <span className="text-xs font-normal text-slate-400">
                {answeredCount}/{totalQuestions} Feitas
              </span>
            </h2>

            {/* Question numbered grid */}
            <div className="grid grid-cols-5 gap-2">
              {testQuestions.map((q, idx) => {
                const isAnswered = !!currentAttempt.answers[q.id];
                const isCurrent = idx === currentIndex;
                const flagged = flaggedIds.has(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl font-mono text-xs font-bold flex items-center justify-center border transition-all ${
                      isCurrent
                        ? "ring-2 ring-emerald-400 border-white bg-slate-700 text-white scale-105"
                        : isAnswered
                        ? "bg-emerald-950/70 border-emerald-500/80 text-emerald-300"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {idx + 1}
                    {flagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500" />
                <span>Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Marcada para Revisão</span>
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Instruções do Exame
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>As respostas são salvas automaticamente a cada clique.</li>
              <li>Não alterne abas ou janelas para evitar advertências.</li>
              <li>Utilize as ferramentas de apoio no menu superior.</li>
              <li>Ao zerar o tempo, o teste será enviado automaticamente.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard docked bottom if opened */}
      <VirtualKeyboard
        isOpen={keyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onKeyPress={(k) => handleInsertText(k)}
        onBackspace={() => {
          const currentText = currentAnswer?.textAnswer || "";
          if (currentText.length > 0) {
            saveAnswer(currentQuestion.id, { textAnswer: currentText.slice(0, -1) });
          }
        }}
        onEnter={() => handleInsertText("\n")}
      />

      {/* Scientific Calculator modal */}
      <ScientificCalculator
        isOpen={calcOpen}
        onClose={() => setCalcOpen(false)}
        onInsertValue={(v) => handleInsertText(v)}
      />

      {/* Symbol Palette modal */}
      <SymbolPalette
        isOpen={symbolsOpen}
        onClose={() => setSymbolsOpen(false)}
        onInsertSymbol={(sym) => handleInsertText(sym)}
      />

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Confirmar Finalização do Teste
                </h3>
                <p className="text-xs text-slate-400">
                  Espacie Services • Avaliação Técnica
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p>
                Você respondeu <b>{answeredCount}</b> de <b>{totalQuestions}</b> questões.
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-amber-400 font-medium">
                  Atenção: Existem {totalQuestions - answeredCount} questão(ões) pendente(s) de resposta.
                </p>
              )}
              {flaggedIds.size > 0 && (
                <p className="text-slate-400">
                  Você possui {flaggedIds.size} questão(ões) marcada(s) para revisão.
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Após a confirmação, as suas respostas serão calculadas e enviadas para a banca examinadora da Espacie Services.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                Voltar ao Exame
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  if (currentAttempt) {
                    submitAttempt(currentAttempt.id);
                    setActiveView("candidate-portal");
                    toast.success("Avaliação finalizada com sucesso! Você saiu da sala de teste.");
                  }
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-md shadow-emerald-950/40 transition-all"
              >
                Sim, Finalizar e Sair da Sala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Sair da Sala de Teste?
                </h3>
                <p className="text-xs text-slate-400">
                  Espacie Services • Avaliação Técnica
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 space-y-1.5">
              <p className="font-semibold">
                Atenção: Ao sair da sala agora, o seu exame será finalizado imediatamente.
              </p>
              <p className="text-slate-300">
                As respostas que selecionou até ao momento serão salvas e enviadas para avaliação.
                Você não poderá reiniciar este teste a menos que a coordenação autorize uma nova tentativa.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                Continuar no Exame
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  if (currentAttempt) {
                    submitAttempt(currentAttempt.id, "user_exited");
                    setActiveView("candidate-portal");
                    toast.info("Você saiu da sala de teste. As respostas foram enviadas.");
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md shadow-rose-950/40 transition-all"
              >
                Sim, Sair Imediatamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
