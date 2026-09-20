import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Download,
  AlertCircle,
  LogOut,
  Award,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Layers,
} from "lucide-react";
import { generateIndividualPdf } from "../../utils/pdfGenerator";
import { CandidatePerformanceReportModal } from "./CandidatePerformanceReportModal";
import { toast } from "sonner";

import { EspacieLogo } from "../common/EspacieLogo";

export function CandidatePortal() {
  const {
    currentUser,
    logout,
    setActiveView,
    tests,
    questions,
    attempts,
    results,
    aiReports,
    startAttempt,
    isCandidateAllowedToTakeTest,
    authorizedRetests,
    latestFinishedResultId,
    setLatestFinishedResultId,
  } = useAppStore();

  const candidate = currentUser?.candidateProfile;
  const [selectedResultModal, setSelectedResultModal] = useState<string | null>(null);

  if (!candidate) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Sessão de candidato não encontrada.</p>
      </div>
    );
  }

  // Active tests previously authorized for this specific candidate
  const assignedIds = candidate.assignedTestIds || [];
  const authorizedTests = tests.filter((t) => t.isActive && assignedIds.includes(t.id));

  // Candidate attempts & results
  const candidateAttempts = attempts
    .filter((a) => a.candidateId === candidate.id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const candidateResults = results
    .filter((r) => r.candidateId === candidate.id)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const handleStartTest = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) return;

    const testQuestions = questions.filter((q) => q.testId === testId);
    if (testQuestions.length === 0) {
      toast.error(
        "Este teste ainda não possui perguntas publicadas pela coordenação da Espacie Services. Aguarde a validação técnica."
      );
      return;
    }

    const permission = isCandidateAllowedToTakeTest(candidate.id, testId);
    if (!permission.allowed) {
      toast.error(permission.reason);
      return;
    }

    try {
      startAttempt(test.id, candidate.id);
      toast.success(`Iniciando avaliação: ${test.title}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar o teste.");
    }
  };

  const handleDownloadPdf = (resultId: string) => {
    const res = results.find((r) => r.id === resultId);
    if (!res) return;
    const attempt = attempts.find((a) => a.id === res.attemptId);
    const test = tests.find((t) => t.id === res.testId);
    if (!attempt || !test) return;

    const testQuestions = questions.filter((q) => q.testId === test.id);
    const aiReport = aiReports[attempt.id];

    generateIndividualPdf(candidate, test, attempt, testQuestions, res, aiReport, {
      hideQuestionAudit: true,
    });
    toast.success("Download do relatório individual iniciado.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Portal Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EspacieLogo theme="on-dark" size="sm" />
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-xs text-emerald-400 font-mono font-semibold tracking-wider block">
              PORTAL DO CANDIDATO
            </span>
            <h1 className="font-bold text-base text-slate-100">
              Espacie Services
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-slate-200">{candidate.fullName}</div>
            <div className="text-xs text-slate-400">
              {candidate.documentType}: {candidate.documentNumber} • {candidate.seniority}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold transition-colors border border-slate-700/60"
            title="Sair do Portal"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Terminar Sessão</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Candidate Profile Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Credencial Validada
              </div>
              <h2 className="text-2xl font-bold text-slate-100">
                Olá, {candidate.fullName}
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                Bem-vindo ao ambiente oficial de avaliações técnicas da Espacie Services.
                Aqui pode consultar os testes atribuídos ao seu perfil, realizar os exames
                com suporte técnico e consultar os seus pareceres oficiais.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Cargo Almejado</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {candidate.jobTitle}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Nível de Senioridade</span>
                <span className="font-semibold text-emerald-400 block">
                  {candidate.seniority}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Identificação</span>
                <span className="font-mono text-slate-300 block">
                  {candidate.documentType} {candidate.documentNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Testes Disponíveis para Realização */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Testes e Avaliações Disponíveis
              </h3>
              <p className="text-xs text-slate-400">
                Selecione um teste para iniciar. Certifique-se de estar num ambiente tranquilo antes de começar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {authorizedTests.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-200">
                  Nenhum Teste Previamente Autorizado
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  O acesso às avaliações técnicas da Espacie Services requer prévia convocação e autorização por parte da coordenação ou do Administrador. Caso esteja a aguardar um teste para a sua candidatura, entre em contacto com a área de recursos humanos.
                </p>
              </div>
            ) : (
              authorizedTests.map((t) => {
                const testQCount = questions.filter((q) => q.testId === t.id).length;
                const usedAttempts = candidateAttempts.filter((a) => a.testId === t.id).length;
                const permission = isCandidateAllowedToTakeTest(candidate.id, t.id);
                const isRetestAuthorized = permission.isRetestAuthorized;

              return (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                        {t.sector}
                      </span>
                      {isRetestAuthorized ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
                          ✨ Repetição Autorizada
                        </span>
                      ) : testQCount === 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 text-[11px] font-medium border border-amber-500/30">
                          Em Preparação
                        </span>
                      ) : usedAttempts > 0 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-700">
                          Concluído ({usedAttempts}x)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                          Disponível
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-100 text-base leading-snug line-clamp-2">
                      {t.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {t.description || "Avaliação de competências e conhecimentos técnicos para o cargo."}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{t.durationMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{testQCount} Questões</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Corte: {t.passingScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    {testQCount === 0 ? (
                      <div className="text-center py-2.5 px-3 rounded-xl bg-slate-800/80 text-xs text-amber-400/90 border border-slate-700 font-medium">
                        Em elaboração pela equipe técnica
                      </div>
                    ) : permission.allowed ? (
                      <button
                        onClick={() => handleStartTest(t.id)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          isRetestAuthorized
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40"
                        }`}
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        {isRetestAuthorized ? "Iniciar Nova Tentativa (Autorizado)" : "Iniciar Teste"}
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-800/80 text-slate-500 font-semibold text-xs border border-slate-800 cursor-not-allowed"
                        >
                          Teste Concluído (Tentativa Única)
                        </button>
                        <p className="text-[10px] text-slate-400 text-center leading-tight">
                          Para repetir o exame, solicite autorização ao Administrador.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </section>

        {/* Section: Histórico de Resultados do Candidato */}
        <section className="space-y-4 pt-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Histórico de Avaliações e Resultados Oficiais
            </h3>
            <p className="text-xs text-slate-400">
              Consulte aqui o resultado das provas realizadas e emita o respectivo relatório individual em PDF.
            </p>
          </div>

          {candidateResults.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm">Ainda não concluiu nenhuma avaliação técnica.</p>
              <p className="text-xs text-slate-500">
                Os seus resultados serão apresentados aqui assim que concluir um exame.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Teste</th>
                      <th className="px-4 py-3.5">Data de Realização</th>
                      <th className="px-4 py-3.5 text-center">Pontuação</th>
                      <th className="px-4 py-3.5 text-center">Percentagem</th>
                      <th className="px-4 py-3.5 text-center">Parecer</th>
                      <th className="px-5 py-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {candidateResults.map((res) => {
                      const test = tests.find((t) => t.id === res.testId);
                      const isApproved = res.classification === "Apto";

                      return (
                        <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-200">
                            {test?.title || "Teste Avaliativo"}
                            <span className="block text-xs font-normal text-slate-400">
                              Setor: {test?.sector} • Nota de corte: {test?.passingScore}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            {new Date(res.publishedAt).toLocaleDateString("pt-AO")} às{" "}
                            {new Date(res.publishedAt).toLocaleTimeString("pt-AO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-4 text-center font-mono">
                            {res.totalScore} / {res.maxScore}
                          </td>
                          <td className="px-4 py-4 text-center font-mono font-bold text-slate-100">
                            {res.percentage}%
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                isApproved
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" /> Apto
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" /> Não Apto
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedResultModal(res.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-105 shadow-xs"
                              title="Visualizar relatório completo na tela"
                            >
                              <FileText className="w-3.5 h-3.5" /> Ver Desempenho
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(res.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all hover:scale-105 shadow-xs"
                              title="Descarregar relatório oficial em PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 px-4 sm:px-8 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Espacie Services — Luanda, Angola. Todos os direitos reservados.</span>
        <span className="font-mono text-slate-400">Sistema de Testes v2.4.0</span>
      </footer>

      {/* Automatic or On-Demand Performance Report Modal */}
      {(selectedResultModal || latestFinishedResultId) && (
        <CandidatePerformanceReportModal
          resultId={(selectedResultModal || latestFinishedResultId)!}
          isPostTestCompletion={Boolean(latestFinishedResultId)}
          onClose={() => {
            const wasPostTest = Boolean(latestFinishedResultId);
            setSelectedResultModal(null);
            setLatestFinishedResultId(null);
            if (wasPostTest) {
              logout();
              setActiveView("login");
            }
          }}
        />
      )}
    </div>
  );
}
