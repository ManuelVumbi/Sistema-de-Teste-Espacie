import { useAppStore } from "../../store/useAppStore";
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  Download,
  Briefcase,
  Layers,
  ShieldCheck,
  Calendar,
  Sparkles,
  LogOut,
  Info,
} from "lucide-react";
import { generateIndividualPdf } from "../../utils/pdfGenerator";
import { EspacieLogo } from "../common/EspacieLogo";
import { toast } from "sonner";

interface CandidatePerformanceReportModalProps {
  resultId: string;
  onClose: () => void;
  isPostTestCompletion?: boolean;
}

export function CandidatePerformanceReportModal({
  resultId,
  onClose,
  isPostTestCompletion = false,
}: CandidatePerformanceReportModalProps) {
  const { results, attempts, tests, questions, aiReports, currentUser, logout, setActiveView } = useAppStore();

  const result = results.find((r) => r.id === resultId);
  if (!result) return null;

  const candidate = currentUser?.candidateProfile;
  if (!candidate || candidate.id !== result.candidateId) {
    // Security / Privacy: Candidates cannot see other candidates' results
    return null;
  }

  const attempt = attempts.find((a) => a.id === result.attemptId);
  const test = tests.find((t) => t.id === result.testId);
  const testQuestions = questions.filter((q) => q.testId === result.testId);
  const aiReport = attempt ? aiReports[attempt.id] : undefined;

  const isApto = result.classification === "Apto";

  const handleDownloadPdf = () => {
    if (!test || !attempt) return;
    generateIndividualPdf(candidate, test, attempt, testQuestions, result, aiReport, {
      hideQuestionAudit: true,
    });
    toast.success("Download do relatório oficial em PDF iniciado!");
  };

  const handleClose = () => {
    onClose();
    if (isPostTestCompletion) {
      logout();
      setActiveView("login");
      toast.success("Sessão finalizada com sucesso. Obrigado por realizar sua avaliação na Espacie Services!");
    }
  };

  const minutesSpent = attempt ? Math.max(1, Math.round(attempt.timeSpentSeconds / 60)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Relatório Oficial de Desempenho
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Espacie Services
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Avaliação Técnica Individual • {test?.title || "Exame Técnico"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Baixar PDF
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={isPostTestCompletion ? "Fechar e ir para a tela de login" : "Fechar relatório"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post-test completion guidance banner */}
        {isPostTestCompletion && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-xs">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-200">Exame Concluído com Sucesso!</p>
              <p className="text-slate-300">
                Reveja o seu desempenho e a auditoria de questões abaixo. Esta janela permanecerá aberta até que decida sair. Ao clicar no botão <strong>"Fechar e Ir para o Login"</strong>, a sua sessão será finalizada com segurança e você será direcionado para a tela de login.
              </p>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-slate-200">
          {/* Main Outcome Card */}
          <div
            className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${
              isApto
                ? "bg-emerald-950/20 border-emerald-500/30"
                : "bg-rose-950/20 border-rose-500/30"
            }`}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                  isApto
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }`}
              >
                {isApto ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <XCircle className="w-9 h-9" />
                )}
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isApto
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {isApto ? "Classificado — Apto" : "Não Apto"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-1">
                  {isApto
                    ? "Parabéns! Obteve aproveitamento superior à nota de corte."
                    : "Desempenho abaixo do índice mínimo exigido para o perfil."}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {result.adminNotes ||
                    "Resultado homologado pelo Sistema Corporativo de Testes da Espacie Services."}
                </p>
              </div>
            </div>

            {/* Score Pill */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[170px] shadow-inner">
              <div className="text-3xl font-black font-mono text-slate-100">
                {result.percentage}%
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Pontuação: <span className="font-bold text-slate-200">{result.totalScore}</span> / {result.maxScore} pts
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Nota mínima: {test?.passingScore}%
              </div>
            </div>
          </div>

          {/* Candidate & Exam Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Dados do Candidato
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nome Completo:</span>
                  <span className="font-semibold text-slate-200">{candidate.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{candidate.documentType}:</span>
                  <span className="font-mono text-slate-200">{candidate.documentNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Cargo Almejado:</span>
                  <span className="text-slate-200">{candidate.jobTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Senioridade:</span>
                  <span className="text-slate-200">{candidate.seniority}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                <Layers className="w-4 h-4 text-amber-400" /> Parâmetros do Teste
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Setor Técnico:</span>
                  <span className="text-slate-200">{test?.sector}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Categoria:</span>
                  <span className="text-slate-200">{test?.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tempo de Realização:</span>
                  <span className="font-mono text-slate-200">{minutesSpent} min / {test?.durationMinutes} min</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Data de Conclusão:</span>
                  <span className="text-slate-200">
                    {new Date(result.publishedAt).toLocaleDateString("pt-AO")} às{" "}
                    {new Date(result.publishedAt).toLocaleTimeString("pt-AO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI / Qualitative Insights if available */}
          {aiReport && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-2">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Análise Diagnóstica Espacie AI
              </div>
              <p className="text-slate-300 leading-relaxed">{aiReport.summary}</p>
              {aiReport.strengths && aiReport.strengths.length > 0 && (
                <div>
                  <span className="font-semibold text-emerald-400">Pontos Fortes Identificados:</span>
                  <ul className="list-disc list-inside text-slate-300 pl-1 mt-0.5">
                    {aiReport.strengths.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Institutional Confidentiality, Audit Protocol & Exam Custody */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Protocolo de Segurança e Custódia Institucional de Prova</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              O seu exame técnico foi finalizado, criptografado e homologado na base de dados central da <strong>Espacie Services</strong>.
              Em estrita conformidade com as normas institucionais de segurança e integridade dos processos de recrutamento e seleção, <strong>o detalhamento analítico de questões e o gabarito oficial permanecem sob custódia exclusiva da banca técnica examinadora e do Departamento de Recursos Humanos</strong>.
            </p>
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">ID da Tentativa:</span>
                <span className="text-slate-200">ESP-{result.attemptId.substring(0, 10).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Registo Oficial:</span>
                <span className="text-slate-200">{new Date(result.publishedAt).toLocaleString("pt-AO")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Documento de uso pessoal do candidato • Registado no sistema Espacie Services.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all"
            >
              <Download className="w-4 h-4" /> Descarregar Relatório PDF
            </button>
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isPostTestCompletion
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40 hover:scale-[1.02]"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              {isPostTestCompletion ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Fechar e Ir para o Login</span>
                </>
              ) : (
                <span>Fechar</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
