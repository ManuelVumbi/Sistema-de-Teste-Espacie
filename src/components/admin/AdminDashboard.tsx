import { useAppStore } from "../../store/useAppStore";
import {
  Users,
  FileCheck2,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

export function AdminDashboard() {
  const { candidates, tests, attempts, results, setActiveView, setSelectedAttemptId } =
    useAppStore();

  // Metrics
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter((c) => c.isActive).length;
  const totalTests = tests.length;
  const activeTests = tests.filter((t) => t.isActive).length;
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter((a) => a.status === "completed").length;

  const aptoCount = results.filter((r) => r.classification === "Apto").length;
  const naoAptoCount = results.filter((r) => r.classification === "Não Apto").length;
  const approvalRate =
    results.length > 0 ? Math.round((aptoCount / results.length) * 100) : 0;

  const avgScore =
    results.length > 0
      ? Math.round((results.reduce((acc, r) => acc + r.percentage, 0) / results.length) * 10) / 10
      : 0;

  // Chart 1: Desempenho por Setor
  const sectorDataMap: Record<string, { sector: string; count: number; totalPct: number }> = {};
  results.forEach((r) => {
    const test = tests.find((t) => t.id === r.testId);
    const sector = test?.sector || "Outros";
    if (!sectorDataMap[sector]) {
      sectorDataMap[sector] = { sector, count: 0, totalPct: 0 };
    }
    sectorDataMap[sector].count += 1;
    sectorDataMap[sector].totalPct += r.percentage;
  });

  const sectorChartData = Object.values(sectorDataMap).map((d) => ({
    name: d.sector.length > 14 ? d.sector.substring(0, 12) + "..." : d.sector,
    fullName: d.sector,
    media: Math.round(d.totalPct / d.count),
    avaliacoes: d.count,
  }));

  // Chart 2: Aprovação por Nível de Senioridade
  const seniorityMap: Record<string, { total: number; aptos: number }> = {};
  results.forEach((r) => {
    const cand = candidates.find((c) => c.id === r.candidateId);
    const sen = cand?.seniority || "Outro";
    if (!seniorityMap[sen]) {
      seniorityMap[sen] = { total: 0, aptos: 0 };
    }
    seniorityMap[sen].total += 1;
    if (r.classification === "Apto") seniorityMap[sen].aptos += 1;
  });

  const seniorityChartData = Object.entries(seniorityMap).map(([sen, d]) => ({
    seniority: sen,
    taxa: Math.round((d.aptos / (d.total || 1)) * 100),
    total: d.total,
  }));

  // Chart 3: Pie Apto vs Não Apto
  const pieData = [
    { name: "Apto", value: aptoCount || 1, color: "#10b981" },
    { name: "Não Apto", value: naoAptoCount || 1, color: "#f43f5e" },
  ];

  // Chart 4: Evolução Temporal de Resultados
  const timelineData = [
    { mes: "Jan", media: 68, avaliacoes: 4 },
    { mes: "Fev", media: 72, avaliacoes: 7 },
    { mes: "Mar", media: 76, avaliacoes: 12 },
    { mes: "Abr", media: 80, avaliacoes: 15 },
    { mes: "Mai", media: 78, avaliacoes: 18 },
    { mes: "Jun", media: 82, avaliacoes: 22 },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Painel Geral de Controle
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Visão consolidada de testes técnicos, candidatos e métricas de desempenho em Angola.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView("tests")}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all"
          >
            + Criar Novo Teste
          </button>
          <button
            onClick={() => setActiveView("reports")}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-colors"
          >
            Relatórios Gerais
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Candidatos</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalCandidates}</div>
          <p className="text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">{activeCandidates} ativos</span> no sistema
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Testes Cadastrados</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalTests}</div>
          <p className="text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">{activeTests} ativos</span> para aplicação
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tentativas Realizadas</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalAttempts}</div>
          <p className="text-[11px] text-slate-400">
            <span className="text-blue-400 font-medium">{completedAttempts} concluídas</span>
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Taxa de Aprovação</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{approvalRate}%</div>
          <p className="text-[11px] text-slate-400">
            {aptoCount} aptos / {naoAptoCount} não aptos
          </p>
        </div>

        {/* Card 5 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Média Global</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{avgScore}%</div>
          <p className="text-[11px] text-slate-400">Rendimento médio ponderado</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Desempenho Médio por Setor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Desempenho Médio por Setor Industrial (%)
              </h3>
              <p className="text-xs text-slate-400">
                Médias calculadas sobre avaliações oficiais
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value}%`, "Média"]}
                />
                <Bar dataKey="media" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Aprovação por Nível de Senioridade */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Taxa de Aprovação por Senioridade (%)
            </h3>
            <p className="text-xs text-slate-400">
              Proporção de candidatos com parecer Apto por nível
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seniorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="seniority" stroke="#64748b" fontSize={10} interval={0} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any) => [`${value}%`, "Taxa de Aptos"]}
                />
                <Bar dataKey="taxa" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribuição de Pareceres (Apto vs Não Apto) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Distribuição de Pareceres Técnicos
            </h3>
            <p className="text-xs text-slate-400">
              Total de aptidões em relação às notas de corte
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Evolução Temporal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Tendência de Desempenho e Volume Mensal
            </h3>
            <p className="text-xs text-slate-400">
              Evolução média de notas e número de exames realizados
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="media"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                  name="Média (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Últimas Tentativas e Avaliações Submetidas
            </h3>
            <p className="text-xs text-slate-400">
              Exames concluídos recentemente pelos candidatos
            </p>
          </div>

          <button
            onClick={() => setActiveView("results")}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Ver Todas as Avaliações <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Candidato</th>
                <th className="px-4 py-3">Teste</th>
                <th className="px-4 py-3 text-center">Pontuação</th>
                <th className="px-4 py-3 text-center">Percentagem</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {results.slice(0, 5).map((res) => {
                const cand = candidates.find((c) => c.id === res.candidateId);
                const test = tests.find((t) => t.id === res.testId);
                const isApto = res.classification === "Apto";

                return (
                  <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-100">
                      {cand?.fullName || "Candidato"}
                      <span className="block text-xs font-normal text-slate-400">
                        {cand?.documentNumber} • {cand?.seniority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {test?.title}
                      <span className="block text-xs text-slate-400">{test?.sector}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      {res.totalScore} / {res.maxScore}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-100">
                      {res.percentage}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isApto
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isApto ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {res.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedAttemptId(res.attemptId);
                          setActiveView("results");
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      >
                        Auditar Prova
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
