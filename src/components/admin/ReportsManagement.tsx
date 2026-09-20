import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  FileBarChart,
  Download,
  Filter,
  Calendar,
  Layers,
  Award,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { generateGeneralExecutivePdf } from "../../utils/pdfGenerator";
import { toast } from "sonner";

export function ReportsManagement() {
  const { tests, candidates, results, attempts, questions } = useAppStore();

  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");

  // Filtered by sector and period
  const now = new Date().getTime();
  const relevantResults = results.filter((r) => {
    if (selectedSector !== "all") {
      const test = tests.find((t) => t.id === r.testId);
      if (test?.sector !== selectedSector) return false;
    }
    if (selectedPeriod !== "all") {
      const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
      const resDate = new Date(r.publishedAt).getTime();
      if (now - resDate > days * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  // KPIs based on filtered results (or all if filtered set is empty for overview)
  const totalResults = relevantResults.length;
  const aptoCount = relevantResults.filter((r) => r.classification === "Apto").length;
  const approvalRate = totalResults > 0 ? Math.round((aptoCount / totalResults) * 100) : 0;
  const avgScore =
    totalResults > 0
      ? Math.round(
          (relevantResults.reduce((acc, r) => acc + r.percentage, 0) / totalResults) * 10
        ) / 10
      : 0;

  // Sector distribution based on real results
  const sectorDataMap: Record<string, { sector: string; count: number; aptos: number }> = {};
  relevantResults.forEach((r) => {
    const test = tests.find((t) => t.id === r.testId);
    const sec = test?.sector || "Outros";
    if (!sectorDataMap[sec]) {
      sectorDataMap[sec] = { sector: sec, count: 0, aptos: 0 };
    }
    sectorDataMap[sec].count += 1;
    if (r.classification === "Apto") sectorDataMap[sec].aptos += 1;
  });

  const sectorChartData = Object.values(sectorDataMap).map((d) => ({
    name: d.sector.length > 15 ? d.sector.substring(0, 13) + "..." : d.sector,
    fullName: d.sector,
    taxa: Math.round((d.aptos / (d.count || 1)) * 100),
    total: d.count,
  }));

  // Top Performers Ranking aligned strictly with real system data
  const rankingSource = relevantResults.length > 0 ? relevantResults : results;
  const topCandidates = [...rankingSource]
    .sort((a, b) => b.percentage - a.percentage || b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((r) => {
      const cand = candidates.find((c) => c.id === r.candidateId);
      const test = tests.find((t) => t.id === r.testId);
      const isApproved = r.classification === "Apto";
      return {
        id: r.id,
        candidateName: cand?.fullName || "Candidato",
        documentNumber: cand?.documentNumber || "-",
        seniority: cand?.seniority || "-",
        jobTitle: cand?.jobTitle || "Candidato",
        testTitle: test?.title || "-",
        sector: test?.sector || "-",
        score: r.percentage,
        totalScore: r.totalScore,
        maxScore: r.maxScore,
        classification: r.classification,
        isApproved,
        date: new Date(r.publishedAt).toLocaleDateString("pt-AO"),
      };
    });

  // Export Consolidated PDF
  const handleExportConsolidatedPdf = () => {
    generateGeneralExecutivePdf(tests, candidates, rankingSource, attempts);
    toast.success("Download do Relatório Executivo Geral em PDF iniciado.");
  };

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-emerald-400" />
            Relatórios Gerais & Inteligência Analítica
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Gere relatórios executivos auditáveis, rankings e visualizações analíticas de desempenho.
          </p>
        </div>

        <button
          onClick={handleExportConsolidatedPdf}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" /> Exportar Relatório Executivo (PDF)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Período de Análise:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Último Trimestre</option>
            <option value="all">Todo o Histórico</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-amber-400" />
          <span>Setor:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todos os Setores</option>
            {Array.from(new Set(tests.map((t) => t.sector))).map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Avaliações Analisadas</span>
          <div className="text-2xl font-bold text-slate-100">{totalResults}</div>
          <p className="text-[11px] text-slate-500">Amostra representativa</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Taxa Global de Aptidão</span>
          <div className="text-2xl font-bold text-emerald-400">{approvalRate}%</div>
          <p className="text-[11px] text-slate-500">{aptoCount} aptos no período</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Rendimento Médio Ponderado</span>
          <div className="text-2xl font-bold text-slate-100">{avgScore}%</div>
          <p className="text-[11px] text-slate-500">Média em exames técnicos</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Total de Testes Ativos</span>
          <div className="text-2xl font-bold text-amber-400">
            {tests.filter((t) => t.isActive).length}
          </div>
          <p className="text-[11px] text-slate-500">Em conformidade normativa</p>
        </div>
      </div>

      {/* Grid: Charts and Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Taxa de Aprovação por Setor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Índice de Aptidão por Setor de Atividade (%)
            </h3>
            <p className="text-xs text-slate-400">
              Comparativo de percentual de candidatos aptos
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value}%`, "Taxa de Aptidão"]}
                />
                <Bar dataKey="taxa" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Ranking - Quadro de Honra */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Quadro de Honra (Top Melhores Desempenhos)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                  Dados Reais
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Classificação oficial baseada no rendimento técnico apurado no sistema
              </p>
            </div>
            <Award className="w-5 h-5 text-amber-400" />
          </div>

          {topCandidates.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400">
              Nenhuma avaliação registrada para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {topCandidates.map((top, idx) => (
                <div
                  key={top.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        idx === 0
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40"
                          : idx === 1
                          ? "bg-slate-400 text-slate-950"
                          : idx === 2
                          ? "bg-amber-700 text-amber-100"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>{top.candidateName}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({top.documentNumber})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-300 font-medium">{top.jobTitle}</span> • {top.seniority}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {top.testTitle} ({top.sector}) • {top.date}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono font-bold text-slate-100 text-sm">
                      {top.score}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {top.totalScore} / {top.maxScore} pts
                    </div>
                    <div>
                      {top.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> APTO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> NÃO APTO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
