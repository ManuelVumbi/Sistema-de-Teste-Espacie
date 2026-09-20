import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  Result,
  TestAttempt,
  Question,
  Candidate,
  Test,
  AiReport,
} from "../../types";
import {
  Award,
  Search,
  Filter,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Sparkles,
  ShieldAlert,
  Edit3,
  Check,
  Save,
  Clock,
  X,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { generateIndividualPdf } from "../../utils/pdfGenerator";
import { aiService } from "../../services/aiService";
import { toast } from "sonner";

export function ResultsManagement() {
  const {
    results,
    attempts,
    tests,
    candidates,
    questions,
    aiReports,
    saveAiReport,
    updateAnswerManualScore,
    updateResultStatus,
    selectedAttemptId,
    setSelectedAttemptId,
    authorizedRetests,
    authorizeRetest,
    revokeRetestAuthorization,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTest, setFilterTest] = useState<string>("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");

  // Audit modal state
  const [activeAttemptModalId, setActiveAttemptModalId] = useState<string | null>(
    selectedAttemptId || null
  );

  // Manual score inputs: Record<questionId, { score: number; feedback: string }>
  const [editScores, setEditScores] = useState<
    Record<string, { score: number; feedback: string }>
  >({});

  // Question audit filter (all, correct, wrong, partial)
  const [auditQuestionFilter, setAuditQuestionFilter] = useState<
    "all" | "correct" | "wrong" | "partial"
  >("all");

  // AI Report Generation state
  const [generatingAi, setGeneratingAi] = useState(false);

  // Filtered results list
  const filteredResults = results.filter((r) => {
    const cand = candidates.find((c) => c.id === r.candidateId);
    const test = tests.find((t) => t.id === r.testId);

    const matchesSearch =
      cand?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand?.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test?.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTest = filterTest === "all" || r.testId === filterTest;

    const matchesClass =
      filterClassification === "all" || r.classification === filterClassification;

    return matchesSearch && matchesTest && matchesClass;
  });

  // Selected attempt for audit modal
  const modalAttempt = attempts.find((a) => a.id === activeAttemptModalId);
  const modalCandidate = candidates.find((c) => c.id === modalAttempt?.candidateId);
  const modalTest = tests.find((t) => t.id === modalAttempt?.testId);
  const modalResult = results.find((r) => r.attemptId === modalAttempt?.id);
  const modalQuestions = questions
    .filter((q) => q.testId === modalTest?.id)
    .sort((a, b) => a.order - b.order);
  const modalAiReport = modalAttempt ? aiReports[modalAttempt.id] : undefined;

  const handleOpenAuditModal = (attemptId: string) => {
    setActiveAttemptModalId(attemptId);
    setSelectedAttemptId(attemptId);

    // Initialize edit scores with current answers
    const att = attempts.find((a) => a.id === attemptId);
    if (att) {
      const initialMap: Record<string, { score: number; feedback: string }> = {};
      Object.entries(att.answers).forEach(([qid, ans]) => {
        initialMap[qid] = {
          score: ans.awardedScore || 0,
          feedback: ans.feedback || "",
        };
      });
      setEditScores(initialMap);
    }
  };

  const handleSaveManualGrade = (questionId: string) => {
    if (!modalAttempt) return;
    const grade = editScores[questionId];
    if (!grade) return;

    updateAnswerManualScore(
      modalAttempt.id,
      questionId,
      Number(grade.score),
      grade.feedback
    );
    toast.success("Nota da questão atualizada e total recalculado.");
  };

  const handleGenerateAiReport = async () => {
    if (!modalCandidate || !modalTest || !modalAttempt) return;
    setGeneratingAi(true);
    try {
      const res = await aiService.generateCandidateReport({
        candidate: modalCandidate,
        test: modalTest,
        attempt: modalAttempt,
        answers: Object.values(modalAttempt.answers),
      });

      if (res.success && res.report) {
        saveAiReport(res.report);
        toast.success("Parecer técnico e análise de IA gerados com sucesso!");
      }
    } catch {
      toast.error("Não foi possível gerar a análise por IA.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleExportIndividualPdf = () => {
    if (!modalCandidate || !modalTest || !modalAttempt) return;
    generateIndividualPdf(
      modalCandidate,
      modalTest,
      modalAttempt,
      modalQuestions,
      modalResult,
      modalAiReport
    );
    toast.success("Exportando Relatório Individual em PDF...");
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" />
            Resultados, Avaliação & Correção
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe o rendimento dos candidatos, realize correções manuais de dissertativas e emita pareceres com IA.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por candidato, BI/Passaporte..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={filterTest}
            onChange={(e) => setFilterTest(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden max-w-xs"
          >
            <option value="all">Todos os Testes</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <select
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todas as Classificações</option>
            <option value="Apto">Apenas Aptos</option>
            <option value="Não Apto">Apenas Não Aptos</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Candidato</th>
                <th className="px-4 py-3.5">Teste</th>
                <th className="px-4 py-3.5 text-center">Pontuação</th>
                <th className="px-4 py-3.5 text-center">Percentagem</th>
                <th className="px-4 py-3.5 text-center">Parecer</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => {
                  const cand = candidates.find((c) => c.id === r.candidateId);
                  const test = tests.find((t) => t.id === r.testId);
                  const isApto = r.classification === "Apto";
                  const hasAiReport = !!aiReports[r.attemptId];

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100">{cand?.fullName}</div>
                        <div className="text-xs text-slate-400">
                          {cand?.documentType} {cand?.documentNumber} • {cand?.seniority}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200">{test?.title}</div>
                        <span className="text-xs text-slate-400">{test?.sector}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        {r.totalScore} / {r.maxScore}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-100">
                        {r.percentage}%
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isApto
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {isApto ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Apto
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Não Apto
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                          {r.status === "published"
                            ? "Publicado"
                            : "Pendente de Revisão"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {authorizedRetests[`${r.candidateId}_${r.testId}`] ? (
                          <button
                            type="button"
                            onClick={() => {
                              revokeRetestAuthorization(r.candidateId, r.testId);
                              toast.info("Autorização de repetição revogada.");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
                            title="Revogar permissão de repetir este teste"
                          >
                            Repetição Autorizada
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              authorizeRetest(r.candidateId, r.testId);
                              toast.success(`Repetição de teste autorizada para ${cand?.fullName || "candidato"}.`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 text-xs font-semibold transition-colors"
                            title="Autorizar o candidato a realizar novamente este teste"
                          >
                            Autorizar Repetição
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenAuditModal(r.attemptId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 border border-slate-700 text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Auditar & Corrigir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Full Audit, Manual Correction & AI Report */}
      {modalAttempt && modalCandidate && modalTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                    Tentativa #{modalAttempt.attemptNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      modalAttempt.isApproved
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {modalAttempt.isApproved ? "APTO" : "NÃO APTO"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-1">
                  Auditoria de Prova: {modalCandidate.fullName}
                </h3>
                <p className="text-xs text-slate-400">
                  {modalTest.title} • Cargo: {modalCandidate.jobTitle} ({modalCandidate.seniority})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportIndividualPdf}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" /> Baixar PDF
                </button>
                <button
                  onClick={() => setActiveAttemptModalId(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Candidate & Exam Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Pontuação Total</span>
                <span className="text-base font-mono font-bold text-slate-100">
                  {modalAttempt.score} / {modalAttempt.maxScore}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Rendimento</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {modalAttempt.percentage}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Tempo de Prova</span>
                <span className="text-base font-mono font-bold text-slate-300">
                  {Math.round(modalAttempt.timeSpentSeconds / 60)} min
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Eventos de Integridade</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {modalAttempt.securityEvents?.length || 0} avisos
                </span>
              </div>
            </div>

            {/* Security Audit Events */}
            {modalAttempt.securityEvents && modalAttempt.securityEvents.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Registro do Monitor de Integridade do Navegador
                </h4>
                <ul className="space-y-1 text-slate-300">
                  {modalAttempt.securityEvents.map((ev) => (
                    <li key={ev.id} className="flex items-center justify-between font-mono text-[11px]">
                      <span>• {ev.description}</span>
                      <span className="text-slate-500">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Report Card / Generator Button */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      Análise e Parecer Técnico Assistido por IA
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Geração de sumário executivo, forças identificadas e recomendações de contratação.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={handleGenerateAiReport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {modalAiReport ? "Regenerar Parecer" : "Gerar Análise por IA"}
                    </>
                  )}
                </button>
              </div>

              {modalAiReport && (
                <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 leading-relaxed text-slate-200">
                    <p>{modalAiReport.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <span className="font-bold text-emerald-400">Pontos Fortes:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {modalAiReport.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                      <span className="font-bold text-amber-400">Pontos a Melhorar:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {modalAiReport.toImprove.map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Recomendações: </span>
                    {modalAiReport.recommendations.join(" ")}
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    {modalAiReport.aiDisclaimer}
                  </p>
                </div>
              )}
            </div>

            {/* Questions & Answers Detailed List with Full Audit of Certas e Erradas */}
            {(() => {
              // Calculate audit summary statistics
              const stats = modalQuestions.reduce(
                (acc, q) => {
                  const ans = modalAttempt.answers[q.id];
                  const awarded =
                    ans?.awardedScore !== undefined
                      ? ans.awardedScore
                      : ans?.isCorrect
                      ? q.points
                      : 0;
                  const isCorr =
                    q.type === "multiple_choice" || q.type === "true_false"
                      ? ans?.selectedOptionId === q.correctAnswer || ans?.isCorrect === true
                      : awarded >= q.points;
                  const isWro =
                    q.type === "multiple_choice" || q.type === "true_false"
                      ? !ans?.selectedOptionId || ans?.selectedOptionId !== q.correctAnswer
                      : awarded === 0;
                  const isPart = !isCorr && !isWro && awarded > 0;

                  if (isCorr) acc.correct++;
                  else if (isPart) acc.partial++;
                  else acc.wrong++;

                  return acc;
                },
                { correct: 0, wrong: 0, partial: 0 }
              );

              // Filter questions according to selected filter
              const displayedQuestions = modalQuestions.filter((q) => {
                const ans = modalAttempt.answers[q.id];
                const awarded =
                  ans?.awardedScore !== undefined
                    ? ans.awardedScore
                    : ans?.isCorrect
                    ? q.points
                    : 0;
                const isCorr =
                  q.type === "multiple_choice" || q.type === "true_false"
                    ? ans?.selectedOptionId === q.correctAnswer || ans?.isCorrect === true
                    : awarded >= q.points;
                const isWro =
                  q.type === "multiple_choice" || q.type === "true_false"
                    ? !ans?.selectedOptionId || ans?.selectedOptionId !== q.correctAnswer
                    : awarded === 0;
                const isPart = !isCorr && !isWro && awarded > 0;

                if (auditQuestionFilter === "correct") return isCorr;
                if (auditQuestionFilter === "wrong") return isWro;
                if (auditQuestionFilter === "partial") return isPart;
                return true;
              });

              return (
                <div className="space-y-4">
                  {/* Audit Summary Header and Filter Chips */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          Auditoria de Questões: Certas vs. Erradas
                        </h4>
                        <p className="text-xs text-slate-400">
                          Identificação detalhada do desempenho do candidato em cada questão com gabarito oficial.
                        </p>
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{stats.correct} Certas</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{stats.wrong} Erradas</span>
                        </div>
                        {stats.partial > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{stats.partial} Parciais</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-500 font-semibold text-[11px] mr-1">Filtrar:</span>
                      <button
                        type="button"
                        onClick={() => setAuditQuestionFilter("all")}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          auditQuestionFilter === "all"
                            ? "bg-slate-800 text-white font-bold border border-slate-700"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Todas ({modalQuestions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditQuestionFilter("correct")}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          auditQuestionFilter === "correct"
                            ? "bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50"
                            : "text-emerald-400/80 hover:text-emerald-300"
                        }`}
                      >
                        Apenas Certas ({stats.correct})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditQuestionFilter("wrong")}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          auditQuestionFilter === "wrong"
                            ? "bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50"
                            : "text-rose-400/80 hover:text-rose-300"
                        }`}
                      >
                        Apenas Erradas ({stats.wrong})
                      </button>
                      {stats.partial > 0 && (
                        <button
                          type="button"
                          onClick={() => setAuditQuestionFilter("partial")}
                          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                            auditQuestionFilter === "partial"
                              ? "bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50"
                              : "text-amber-400/80 hover:text-amber-300"
                          }`}
                        >
                          Parciais ({stats.partial})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {displayedQuestions.map((q) => {
                      const idx = modalQuestions.findIndex((mq) => mq.id === q.id);
                      const ans = modalAttempt.answers[q.id];
                      const gradeState = editScores[q.id] || {
                        score: ans?.awardedScore !== undefined ? ans.awardedScore : (ans?.isCorrect ? q.points : 0),
                        feedback: ans?.feedback || "",
                      };

                      const awarded =
                        ans?.awardedScore !== undefined
                          ? ans.awardedScore
                          : ans?.isCorrect
                          ? q.points
                          : 0;

                      const isCorr =
                        q.type === "multiple_choice" || q.type === "true_false"
                          ? ans?.selectedOptionId === q.correctAnswer || ans?.isCorrect === true
                          : awarded >= q.points;
                      const isWro =
                        q.type === "multiple_choice" || q.type === "true_false"
                          ? !ans?.selectedOptionId || ans?.selectedOptionId !== q.correctAnswer
                          : awarded === 0;
                      const isPart = !isCorr && !isWro && awarded > 0;

                      // Correct answer label for multiple choice or true/false
                      let correctAnswerText = "";
                      if (q.type === "multiple_choice") {
                        const opt = q.options?.find((o) => o.id === q.correctAnswer);
                        correctAnswerText = opt ? opt.text : q.correctAnswer || "-";
                      } else if (q.type === "true_false") {
                        correctAnswerText = q.correctAnswer === "true" ? "Verdadeiro" : "Falso";
                      } else if (q.type === "essay") {
                        correctAnswerText = q.evaluationCriteria || "Critérios técnicos e conceituais esperados.";
                      } else if (q.type === "visual_drawing") {
                        correctAnswerText = q.evaluationCriteria || "Layout técnico, demarcação de segurança e pontos de controle.";
                      }

                      return (
                        <div
                          key={q.id}
                          className={`p-4 sm:p-5 rounded-2xl bg-slate-950 border text-xs space-y-3.5 transition-all ${
                            isCorr
                              ? "border-emerald-500/40 shadow-sm shadow-emerald-950/20"
                              : isWro
                              ? "border-rose-500/40 shadow-sm shadow-rose-950/20"
                              : "border-amber-500/40 shadow-sm shadow-amber-950/20"
                          }`}
                        >
                          {/* Header of Question with High-Visibility Right/Wrong Badge */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-slate-400 font-bold">
                                  Questão #{idx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                                  {q.type === "multiple_choice"
                                    ? "Múltipla Escolha"
                                    : q.type === "true_false"
                                    ? "Verdadeiro / Falso"
                                    : q.type === "essay"
                                    ? "Dissertativa"
                                    : "Esboço Visual"}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  {q.points} pts máx
                                </span>
                              </div>
                              <p className="font-bold text-slate-100 text-sm leading-snug">
                                {q.statement}
                              </p>
                            </div>

                            {/* Prominent Status Pill: Certa vs Errada */}
                            <div className="shrink-0 flex items-center gap-2">
                              {isCorr ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs tracking-wide">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>CERTA (+{awarded} pts)</span>
                                </span>
                              ) : isWro ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs tracking-wide">
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                  <span>ERRADA (0 pts)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wide">
                                  <AlertCircle className="w-4 h-4 text-amber-400" />
                                  <span>PARCIAL ({awarded}/{q.points} pts)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Candidate Response Card */}
                          <div
                            className={`p-3.5 rounded-xl border space-y-1.5 ${
                              isCorr
                                ? "bg-emerald-950/15 border-emerald-500/30"
                                : isWro
                                ? "bg-rose-950/15 border-rose-500/30"
                                : "bg-amber-950/15 border-amber-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-300">
                                {isCorr ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : isWro ? (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                )}
                                Resposta Registrada do Candidato:
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isCorr
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : isWro
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {isCorr ? "Resposta Correta" : isWro ? "Resposta Incorreta" : "Parcial"}
                              </span>
                            </div>

                            {q.type === "multiple_choice" && (
                              <p className="text-slate-100 font-medium text-xs pt-1">
                                {q.options?.find((o) => o.id === ans?.selectedOptionId)?.text || (
                                  <span className="text-rose-400 italic">Candidato não respondeu a esta questão</span>
                                )}
                              </p>
                            )}

                            {q.type === "true_false" && (
                              <p className="text-slate-100 font-medium text-xs pt-1">
                                {ans?.selectedOptionId === "true" ? (
                                  "Verdadeiro"
                                ) : ans?.selectedOptionId === "false" ? (
                                  "Falso"
                                ) : (
                                  <span className="text-rose-400 italic">Candidato não respondeu a esta questão</span>
                                )}
                              </p>
                            )}

                            {q.type === "essay" && (
                              <p className="text-slate-100 whitespace-pre-wrap leading-relaxed text-xs pt-1">
                                {ans?.textAnswer || (
                                  <span className="text-rose-400 italic">Nenhuma resposta dissertativa submetida.</span>
                                )}
                              </p>
                            )}

                            {q.type === "visual_drawing" && (
                              <div className="pt-1">
                                {ans?.drawingData ? (
                                  <div className="max-w-md rounded-xl overflow-hidden border border-slate-700">
                                    <img
                                      src={ans.drawingData}
                                      alt="Desenho técnico do candidato"
                                      className="w-full bg-slate-950"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-rose-400 italic">Nenhum desenho técnico submetido.</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Official Answer Key (Gabarito Oficial) */}
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                Gabarito Oficial & Fundamentação Técnica:
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Gabarito de Referência
                              </span>
                            </div>

                            <p className="text-slate-200 font-semibold text-xs leading-relaxed">
                              {correctAnswerText}
                            </p>

                            {/* Full Options Breakdown for Multiple Choice */}
                            {q.type === "multiple_choice" && q.options && q.options.length > 0 && (
                              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  Alternativas da Questão:
                                </span>
                                <div className="grid grid-cols-1 gap-1">
                                  {q.options.map((opt) => {
                                    const isThisCorrect = opt.id === q.correctAnswer;
                                    const isThisChosen = opt.id === ans?.selectedOptionId;

                                    return (
                                      <div
                                        key={opt.id}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                                          isThisCorrect
                                            ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium"
                                            : isThisChosen
                                            ? "bg-rose-950/40 border-rose-500/60 text-rose-200"
                                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-[10px] text-slate-500">
                                            {opt.id}:
                                          </span>
                                          <span>{opt.text}</span>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1.5">
                                          {isThisCorrect && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                              Gabarito Oficial
                                            </span>
                                          )}
                                          {isThisChosen && (
                                            <span
                                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                isThisCorrect
                                                  ? "bg-emerald-500/20 text-emerald-300"
                                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                              }`}
                                            >
                                              {isThisCorrect ? "Opção do Candidato" : "Escolhida pelo Candidato"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {q.legalSource && (
                              <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1.5">
                                <span className="font-bold text-slate-300">Base Normativa / Literatura:</span>
                                <span className="text-slate-300 font-mono">{q.legalSource}</span>
                              </div>
                            )}
                          </div>

                          {/* Manual Grading and Feedback controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                            <div className="flex items-center gap-3">
                              <label className="text-slate-400 font-medium">Nota Atribuída:</label>
                              <input
                                type="number"
                                min="0"
                                max={q.points}
                                step="0.5"
                                value={gradeState.score}
                                onChange={(e) =>
                                  setEditScores({
                                    ...editScores,
                                    [q.id]: {
                                      ...gradeState,
                                      score: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-20 p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-center focus:border-emerald-500 focus:outline-hidden"
                              />
                              <span className="text-slate-500">de {q.points} pts</span>
                            </div>

                            <div className="flex-1 max-w-md">
                              <input
                                type="text"
                                placeholder="Feedback / parecer do examinador..."
                                value={gradeState.feedback}
                                onChange={(e) =>
                                  setEditScores({
                                    ...editScores,
                                    [q.id]: {
                                      ...gradeState,
                                      feedback: e.target.value,
                                    },
                                  })
                                }
                                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-hidden"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveManualGrade(q.id)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" /> Salvar Nota
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Footer with Status Update */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Estado Oficial da Avaliação:</span>
                <select
                  value={modalResult?.status || "published"}
                  onChange={(e) => {
                    if (modalResult) {
                      updateResultStatus(modalResult.id, e.target.value as "published" | "pending_review");
                      toast.success("Estado da avaliação atualizado.");
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden"
                >
                  <option value="pending_review">Pendente de Revisão</option>
                  <option value="published">Publicado Oficialmente</option>
                </select>
              </div>

              <button
                onClick={() => setActiveAttemptModalId(null)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Concluir Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
