import { useState, useRef, type FormEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  Question,
  QuestionType,
  SENIORITY_LEVELS,
  SECTORS_AND_CATEGORIES,
} from "../../types";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  MoveUp,
  MoveDown,
  CheckCircle,
  HelpCircle,
  Image,
  Paintbrush,
  BookOpen,
  X,
  Check,
  AlertCircle,
  Loader2,
  Info,
  Upload,
  Paperclip,
  FileText,
} from "lucide-react";
import { aiService } from "../../services/aiService";
import { toast } from "sonner";

export function QuestionsManagement() {
  const {
    tests,
    selectedTestId,
    setActiveView,
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    addBulkQuestions,
  } = useAppStore();

  const test = tests.find((t) => t.id === selectedTestId) || tests[0];

  const testQuestions = questions
    .filter((q) => q.testId === test?.id)
    .sort((a, b) => a.order - b.order);

  // Manual Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Question form fields
  const [statement, setStatement] = useState("");
  const [qType, setQType] = useState<QuestionType>("multiple_choice");
  const [points, setPoints] = useState(10);
  const [difficulty, setDifficulty] = useState<"Fácil" | "Médio" | "Difícil">("Médio");
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: "opt-1", text: "" },
    { id: "opt-2", text: "" },
    { id: "opt-3", text: "" },
    { id: "opt-4", text: "" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState("opt-1");
  const [evaluationCriteria, setEvaluationCriteria] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [legalSource, setLegalSource] = useState("");
  const [verificationDate, setVerificationDate] = useState("");

  // AI Generation Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isExtractingAiFile, setIsExtractingAiFile] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiSeniority, setAiSeniority] = useState(SENIORITY_LEVELS[2]);
  const [aiDifficulty, setAiDifficulty] = useState("Médio");
  const [aiType, setAiType] = useState<"multiple_choice" | "true_false" | "essay" | "mixed">("mixed");
  const [aiContext, setAiContext] = useState("");
  const [aiSourceMaterial, setAiSourceMaterial] = useState("");
  const [aiUploadedFiles, setAiUploadedFiles] = useState<{ name: string; size: string; charCount?: number }[]>([]);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<Partial<Question>[] | null>(null);
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());

  if (!test) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Nenhum teste selecionado.</p>
        <button
          onClick={() => setActiveView("tests")}
          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl"
        >
          Voltar aos Testes
        </button>
      </div>
    );
  }

  const resetForm = () => {
    setEditingQuestionId(null);
    setStatement("");
    setQType("multiple_choice");
    setPoints(10);
    setDifficulty("Médio");
    setOptions([
      { id: "opt-1", text: "" },
      { id: "opt-2", text: "" },
      { id: "opt-3", text: "" },
      { id: "opt-4", text: "" },
    ]);
    setCorrectAnswer("opt-1");
    setEvaluationCriteria("");
    setImageUrl("");
    setLegalSource("");
    setVerificationDate("");
    setIsQuestionModalOpen(false);
  };

  const openCreateQuestion = () => {
    resetForm();
    setIsQuestionModalOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setStatement(q.statement);
    setQType(q.type);
    setPoints(q.points);
    setDifficulty(q.difficulty);
    setOptions(
      q.options && q.options.length > 0
        ? q.options
        : [
            { id: "opt-1", text: "" },
            { id: "opt-2", text: "" },
          ]
    );
    setCorrectAnswer(q.correctAnswer || "opt-1");
    setEvaluationCriteria(q.evaluationCriteria || "");
    setImageUrl(q.imageUrl || "");
    setLegalSource(q.legalSource || "");
    setVerificationDate(q.verificationDate || "");
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: FormEvent) => {
    e.preventDefault();

    if (!statement.trim()) {
      toast.error("O enunciado da pergunta é obrigatório.");
      return;
    }

    if (qType === "multiple_choice" || qType === "image_based") {
      const validOptions = options.filter((o) => o.text.trim().length > 0);
      if (validOptions.length < 2) {
        toast.error("Adicione pelo menos 2 opções de resposta.");
        return;
      }
    }

    if (editingQuestionId) {
      updateQuestion(editingQuestionId, {
        statement: statement.trim(),
        type: qType,
        points: Number(points),
        difficulty,
        options: qType === "true_false" ? undefined : options,
        correctAnswer,
        evaluationCriteria: evaluationCriteria.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        legalSource: legalSource.trim() || undefined,
        verificationDate: verificationDate.trim() || undefined,
      });
      toast.success("Questão atualizada.");
    } else {
      addQuestion({
        testId: test.id,
        statement: statement.trim(),
        type: qType,
        points: Number(points),
        difficulty,
        order: testQuestions.length + 1,
        options:
          qType === "true_false"
            ? [
                { id: "true", text: "Verdadeiro" },
                { id: "false", text: "Falso" },
              ]
            : options,
        correctAnswer,
        evaluationCriteria: evaluationCriteria.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        legalSource: legalSource.trim() || undefined,
        verificationDate: verificationDate.trim() || undefined,
      });
      toast.success("Questão adicionada ao teste.");
    }

    resetForm();
  };

  // Reorder up and down
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testQuestions.length) return;

    const list = [...testQuestions];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    reorderQuestions(
      test.id,
      list.map((q) => q.id)
    );
  };

  // AI Question Generation
  const handleGenerateAi = async () => {
    setAiGenerating(true);
    setGeneratedPreview(null);
    try {
      const isAngolaRelevant =
        test.sector.includes("Petróleo") ||
        test.sector.includes("Mineração") ||
        test.sector.includes("Jurídico");

      const res = await aiService.generateQuestions({
        topic: test.title,
        sector: test.sector,
        category: test.category,
        count: Number(aiCount),
        type: aiType,
        difficulty: aiDifficulty,
        seniority: aiSeniority,
        context: aiContext,
        sourceMaterial: aiSourceMaterial.trim() || test.sourceMaterial || undefined,
        isAngolaOilGasRelevant: isAngolaRelevant,
      });

      if (res.success && res.questions.length > 0) {
        setGeneratedPreview(res.questions);
        // By default, mark all generated as accepted
        const allAcc = new Set<number>();
        res.questions.forEach((_, idx) => allAcc.add(idx));
        setAcceptedIndices(allAcc);
        toast.success(`${res.questions.length} questões estruturadas com sucesso pela IA.`);
      } else {
        toast.error("Não foi possível gerar as questões. Tente novamente.");
      }
    } catch (err) {
      toast.error("Falha ao comunicar com o gerador de questões.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiQuestions = () => {
    if (!generatedPreview) return;
    const selected = generatedPreview.filter((_, idx) => acceptedIndices.has(idx));
    if (selected.length === 0) {
      toast.warning("Selecione pelo menos uma questão para adicionar.");
      return;
    }

    addBulkQuestions(test.id, selected);
    toast.success(`${selected.length} questões adicionadas ao teste.`);
    setIsAiModalOpen(false);
    setGeneratedPreview(null);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveView("tests")}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar à Lista de Testes
          </button>
          <h2 className="text-2xl font-bold text-slate-100">
            {test.title}
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
            <span>Setor: <b className="text-emerald-400">{test.sector}</b></span>
            <span>•</span>
            <span>Categoria: <b className="text-slate-200">{test.category}</b></span>
            <span>•</span>
            <span>Dificuldade: <b className="text-amber-400">{test.difficulty || "Médio"}</b></span>
            <span>•</span>
            <span>{testQuestions.length} questões</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGeneratedPreview(null);
              setAiDifficulty(test?.difficulty || "Médio");
              if (!aiSourceMaterial && test?.sourceMaterial) {
                setAiSourceMaterial(test.sourceMaterial);
              }
              setIsAiModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" /> Gerar com IA
          </button>
          <button
            onClick={openCreateQuestion}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Criar Manual
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {testQuestions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-500" />
            <h3 className="text-base font-bold text-slate-200">
              Nenhuma pergunta cadastrada para este teste
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Utilize o assistente de IA da Espacie Services para gerar questões técnicas alinhadas
              às normas de Angola, ou adicione manualmente.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Iniciar Gerador de Questões com IA
              </button>
            </div>
          </div>
        ) : (
          testQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs font-mono">
                      #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                      {q.type === "multiple_choice"
                        ? "Múltipla Escolha"
                        : q.type === "true_false"
                        ? "Verdadeiro / Falso"
                        : q.type === "essay"
                        ? "Dissertativa"
                        : q.type === "image_based"
                        ? "Baseada em Imagem"
                        : "Desenho / Visual"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 text-xs font-semibold">
                      {q.points} Pontos
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs">
                      {q.difficulty}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed pt-1">
                    {q.statement}
                  </p>

                  {/* Legal reference if any */}
                  {q.legalSource && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fonte/Norma: {q.legalSource}</span>
                      {q.verificationDate && (
                        <span className="text-slate-500 font-mono">
                          (Verif: {q.verificationDate})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Actions (Move, Edit, Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                    title="Mover para Cima"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, "down")}
                    disabled={idx === testQuestions.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                    title="Mover para Baixo"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditQuestion(q)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                    title="Editar Questão"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setQuestionToDelete(q)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                    title="Remover Questão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Options display */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  {q.options.map((opt) => {
                    const isCorrect = opt.id === q.correctAnswer;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isCorrect
                            ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="truncate">{opt.text}</span>
                        {isCorrect && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                            Gabarito
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Evaluation criteria for essays */}
              {q.evaluationCriteria && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Critério de Correção: </span>
                  {q.evaluationCriteria}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: AI Question Generator */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Gerador de Perguntas Assistido por IA
                  </h3>
                  <p className="text-xs text-slate-400">
                    Geração técnica contextualizada com diretrizes de conformidade para Angola.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Role & Literature Grounding Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                  Título do Teste / Posição Avaliada *
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Base Obrigatória
                </span>
              </div>
              <p className="text-sm font-bold text-slate-100">
                {test.title}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Todas as questões geradas serão formuladas com base estrita na literatura e fontes técnicas fornecidas abaixo, focando com rigor nas competências práticas e operacionais exigidas para <b>{test.title}</b>.
              </p>
            </div>

            {/* Prompt Config */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Quantidade</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                >
                  <option value={5}>5 Perguntas</option>
                  <option value={10}>10 Perguntas</option>
                  <option value={15}>15 Perguntas</option>
                  <option value={20}>20 Perguntas</option>
                  <option value={30}>30 Perguntas</option>
                  <option value={50}>50 Perguntas</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Senioridade Alvo</label>
                <select
                  value={aiSeniority}
                  onChange={(e) => setAiSeniority(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                >
                  {SENIORITY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Dificuldade</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                >
                  <option value="Misto">Misto (Fácil, Médio, Difícil)</option>
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Médio</option>
                  <option value="Difícil">Difícil</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Tipos de Perguntas Pretendidos
                </label>
                <select
                  value={aiType}
                  onChange={(e) => setAiType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                >
                  <option value="mixed">Misto (Múltipla Escolha, V/F, Dissertativas e Visual)</option>
                  <option value="multiple_choice">Apenas Múltipla Escolha</option>
                  <option value="true_false">Apenas Verdadeiro / Falso</option>
                  <option value="essay">Apenas Dissertativas Técnicas</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Tema Livre ou Contexto Específico (Opcional)
                </label>
                <input
                  type="text"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Ex: Foco em procedimentos de emergência e Decreto Presidencial..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Sources & Files Attachment for AI Prompt */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                  Material Base & Normas Técnicas para Geração
                </label>
                <button
                  type="button"
                  onClick={() => aiFileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs border border-slate-700 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Anexar Arquivo</span>
                </button>
                <input
                  type="file"
                  ref={aiFileInputRef}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setIsExtractingAiFile(true);
                    try {
                      for (const file of Array.from(files) as File[]) {
                        const sizeKb = Math.round(file.size / 1024);
                        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

                        const extRes = await aiService.extractFileContent(file);
                        if (extRes.success && extRes.text) {
                          setAiUploadedFiles((prev) => [
                            ...prev,
                            { name: file.name, size: sizeStr, charCount: extRes.charCount },
                          ]);
                          setAiSourceMaterial((prev) => {
                            const header = `\n--- [DOCUMENTO BASE EXTRAÍDO: ${file.name}] ---\n`;
                            return (prev ? prev + "\n" : "") + header + extRes.text;
                          });
                          toast.success(
                            `Arquivo "${file.name}" extraído (${extRes.charCount.toLocaleString()} caracteres obtidos para base das questões).`
                          );
                        } else {
                          setAiUploadedFiles((prev) => [...prev, { name: file.name, size: sizeStr }]);
                          toast.warning(`Arquivo "${file.name}" anexado.`);
                        }
                      }
                    } catch (err: any) {
                      toast.error(`Erro ao processar arquivo: ${err.message || "Falha"}`);
                    } finally {
                      setIsExtractingAiFile(false);
                      if (aiFileInputRef.current) aiFileInputRef.current.value = "";
                    }
                  }}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                  className="hidden"
                />
              </div>

              {/* Extraction progress indicator */}
              {isExtractingAiFile && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
                  <span>Extraindo texto do documento para fundamentar as questões...</span>
                </div>
              )}

              {aiUploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiUploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-sky-500/40 text-sky-300 text-[11px]"
                    >
                      <FileText className="w-2.5 h-2.5 text-sky-400" />
                      <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({file.size}
                        {file.charCount ? ` • ${file.charCount.toLocaleString()} chars` : ""})
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-400 ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                rows={3}
                value={aiSourceMaterial}
                onChange={(e) => setAiSourceMaterial(e.target.value)}
                placeholder="Cole aqui textos, manuais da Espacie Services, artigos de leis ou procedimentos operacionais para fundamentar as questões geradas..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden placeholder:text-slate-600"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                Setor: <b>{test.sector}</b> • Categoria: <b>{test.category}</b>
              </span>
              <button
                type="button"
                disabled={aiGenerating}
                onClick={handleGenerateAi}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 transition-all"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando Questões...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Gerar {aiCount} Perguntas
                  </>
                )}
              </button>
            </div>

            {/* Generated Preview List */}
            {generatedPreview && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-slate-200">
                    Pré-visualização: {generatedPreview.length} Perguntas Geradas
                  </h4>
                  <span className="text-emerald-400 font-semibold">
                    {acceptedIndices.size} selecionadas para adicionar
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {generatedPreview.map((pq, idx) => {
                    const isAccepted = acceptedIndices.has(idx);

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                          isAccepted
                            ? "bg-slate-950 border-emerald-500/60"
                            : "bg-slate-950/40 border-slate-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-emerald-400 font-bold">
                                #{idx + 1}
                              </span>
                              <span className="text-slate-400">[{pq.type}]</span>
                              <span className="text-amber-400">{pq.points} pts</span>
                            </div>
                            <p className="font-medium text-slate-200">{pq.statement}</p>
                            {pq.legalSource && (
                              <p className="text-[11px] text-slate-400">
                                Fonte: {pq.legalSource}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(acceptedIndices);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              setAcceptedIndices(next);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              isAccepted
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Aceita
                              </>
                            ) : (
                              "Rejeitar"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setGeneratedPreview(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiQuestions}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md"
                  >
                    Adicionar {acceptedIndices.size} Perguntas ao Teste
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Manual Question Form */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  {editingQuestionId ? "Editar Pergunta" : "Criar Nova Pergunta"}
                </h3>
              </div>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Enunciado da Pergunta *
                </label>
                <textarea
                  rows={3}
                  required
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Redija o texto claro e objetivo da questão..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Tipo de Pergunta</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  >
                    <option value="multiple_choice">Escolha Múltipla</option>
                    <option value="true_false">Verdadeiro / Falso</option>
                    <option value="essay">Dissertativa</option>
                    <option value="image_based">Com Imagem</option>
                    <option value="visual_drawing">Área de Desenho / Visual</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Pontos *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>

              {/* Options for multiple choice */}
              {(qType === "multiple_choice" || qType === "image_based") && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold">
                      Opções de Resposta e Gabarito
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setOptions([
                          ...options,
                          { id: `opt-${options.length + 1}`, text: "" },
                        ])
                      }
                      className="text-emerald-400 hover:underline text-xs"
                    >
                      + Adicionar Opção
                    </button>
                  </div>

                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === opt.id}
                          onChange={() => setCorrectAnswer(opt.id)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          title="Marcar como gabarito correto"
                        />
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...options];
                            next[idx].text = e.target.value;
                            setOptions(next);
                          }}
                          placeholder={`Opção ${idx + 1}`}
                          className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setOptions(options.filter((_, i) => i !== idx))
                            }
                            className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* True / False correct answer */}
              {qType === "true_false" && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-slate-300 font-semibold block">Gabarito Correto</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tf"
                        value="true"
                        checked={correctAnswer === "true"}
                        onChange={() => setCorrectAnswer("true")}
                        className="accent-emerald-500"
                      />
                      <span>Verdadeiro</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tf"
                        value="false"
                        checked={correctAnswer === "false"}
                        onChange={() => setCorrectAnswer("false")}
                        className="accent-emerald-500"
                      />
                      <span>Falso</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Essay / Drawing Evaluation criteria */}
              {(qType === "essay" || qType === "visual_drawing") && (
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-slate-300 font-semibold block">
                    Critérios de Correção e Palavras-chave
                  </label>
                  <textarea
                    rows={2}
                    value={evaluationCriteria}
                    onChange={(e) => setEvaluationCriteria(e.target.value)}
                    placeholder="Pontos necessários que a resposta do candidato deve contemplar..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Optional image url */}
              {qType === "image_based" && (
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    URL da Imagem da Questão
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... ou caminho da imagem"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Legal Reference & Verification Date (Angola Compliance) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Fonte / Norma Validada (Angola / O&G)
                  </label>
                  <input
                    type="text"
                    value={legalSource}
                    onChange={(e) => setLegalSource(e.target.value)}
                    placeholder="Ex: Lei n.º 10/04 das Actividades Petrolíferas"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Data de Verificação da Norma
                  </label>
                  <input
                    type="date"
                    value={verificationDate}
                    onChange={(e) => setVerificationDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  {editingQuestionId ? "Guardar Alterações" : "Salvar Questão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION DELETION CONFIRMATION MODAL */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#091B30] border border-[#17365D] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-[#17365D] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Eliminar Questão</h3>
                  <p className="text-[11px] text-slate-400">Confirmação de remoção da pergunta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#061424] border border-[#17365D] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sky-400 uppercase">
                  {questionToDelete.type === "multiple_choice"
                    ? "Múltipla Escolha"
                    : questionToDelete.type === "true_false"
                    ? "Verdadeiro / Falso"
                    : "Descritiva / Dissertativa"}
                </span>
                <span className="text-amber-400 font-semibold">{questionToDelete.points} pontos</span>
              </div>
              <p className="text-slate-200 text-xs line-clamp-3 leading-relaxed">
                "{questionToDelete.statement}"
              </p>
            </div>

            <p className="text-slate-300 text-xs">
              Tem a certeza de que deseja remover esta questão do teste? Esta ação removerá a pergunta permanentemente.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteQuestion(questionToDelete.id);
                  toast.success("Questão eliminada com sucesso.");
                  setQuestionToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Eliminar Questão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
