import { useState, useMemo } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  Briefcase,
  Download,
  Filter,
  Search,
  Award,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  ShieldCheck,
  FileText,
  Building2,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  generateJobRolePdf,
  generateAllJobRolesPdf,
  generateIndividualPdf,
} from "../../utils/pdfGenerator";
import { DEFAULT_POSITIONS } from "../../types";
import { toast } from "sonner";

export function RoleReportsTab() {
  const { tests, candidates, results, attempts, questions, positions, aiReports } =
    useAppStore();

  const [selectedRole, setSelectedRole] = useState<string>("Mecânico");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<"all" | "evaluated">("all");

  // Compile all available job roles without duplicates
  const allRoles = useMemo(() => {
    const rawList = [
      ...(positions && positions.length > 0 ? positions : DEFAULT_POSITIONS),
      ...candidates.map((c) => c.jobTitle).filter(Boolean),
      ...tests.map((t) => t.title).filter(Boolean),
    ];
    return Array.from(new Set(rawList.map((r) => r.trim()))).sort((a, b) =>
      a.localeCompare(b, "pt-PT")
    );
  }, [positions, candidates, tests]);

  // Pre-calculate statistics for each role for quick display and sorting
  const rolesWithStats = useMemo(() => {
    return allRoles.map((role) => {
      const roleCandidates = candidates.filter(
        (c) => c.jobTitle && c.jobTitle.trim().toLowerCase() === role.toLowerCase()
      );
      const roleResults = results.filter((r) => {
        const cand = candidates.find((c) => c.id === r.candidateId);
        if (cand && cand.jobTitle && cand.jobTitle.trim().toLowerCase() === role.toLowerCase()) {
          return true;
        }
        const test = tests.find((t) => t.id === r.testId);
        return (
          test &&
          (test.title.toLowerCase().includes(role.toLowerCase()) ||
            test.category.toLowerCase().includes(role.toLowerCase()))
        );
      });

      const sector =
        roleCandidates.find((c) => c.sector)?.sector ||
        tests.find(
          (t) =>
            t.title.toLowerCase().includes(role.toLowerCase()) ||
            t.category.toLowerCase().includes(role.toLowerCase())
        )?.sector ||
        "Geral";

      const totalCandidates = roleCandidates.length;
      const totalEvaluated = roleResults.length;
      const aptos = roleResults.filter((r) => r.classification === "Apto").length;
      const approvalRate =
        totalEvaluated > 0 ? Math.round((aptos / totalEvaluated) * 100) : 0;
      const avgScore =
        totalEvaluated > 0
          ? Math.round(
              (roleResults.reduce((acc, r) => acc + r.percentage, 0) / totalEvaluated) * 10
            ) / 10
          : 0;

      return {
        role,
        sector,
        totalCandidates,
        totalEvaluated,
        aptos,
        approvalRate,
        avgScore,
        roleCandidates,
        roleResults,
      };
    });
  }, [allRoles, candidates, results, tests]);

  // Set default selectedRole if not set
  useMemo(() => {
    if (!selectedRole && rolesWithStats.length > 0) {
      const withEval = rolesWithStats.find((r) => r.totalEvaluated > 0);
      setSelectedRole(withEval ? withEval.role : rolesWithStats[0].role);
    }
  }, [selectedRole, rolesWithStats]);

  // Filtered roles list for the selector / comparative table
  const filteredRoles = useMemo(() => {
    return rolesWithStats.filter((r) => {
      const matchesSearch =
        r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sector.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = filterSector === "all" || r.sector === filterSector;
      const matchesActivity = filterActivity === "all" || r.totalEvaluated > 0;
      return matchesSearch && matchesSector && matchesActivity;
    });
  }, [rolesWithStats, searchQuery, filterSector, filterActivity]);

  // Current active role data
  const currentRoleData = useMemo(() => {
    const found = rolesWithStats.find(
      (r) => r.role.toLowerCase() === selectedRole.toLowerCase()
    );
    if (found) return found;
    return (
      rolesWithStats[0] || {
        role: selectedRole,
        sector: "Geral",
        totalCandidates: 0,
        totalEvaluated: 0,
        aptos: 0,
        approvalRate: 0,
        avgScore: 0,
        roleCandidates: [],
        roleResults: [],
      }
    );
  }, [selectedRole, rolesWithStats]);

  // Tests associated with the currently selected role
  const currentRoleTests = useMemo(() => {
    return tests.filter((t) => {
      const titleMatch = t.title.toLowerCase().includes(currentRoleData.role.toLowerCase());
      const catMatch = t.category.toLowerCase().includes(currentRoleData.role.toLowerCase());
      const candMatch = currentRoleData.roleCandidates.some((c) =>
        (c.assignedTestIds || []).includes(t.id)
      );
      return titleMatch || catMatch || candMatch;
    });
  }, [tests, currentRoleData]);

  // Candidates ranking for this role
  const sortedRoleResults = useMemo(() => {
    return [...currentRoleData.roleResults].sort(
      (a, b) => b.percentage - a.percentage || b.totalScore - a.totalScore
    );
  }, [currentRoleData.roleResults]);

  // Seniority distribution for this role
  const seniorityDistribution = useMemo(() => {
    const map: Record<
      string,
      { seniority: string; registered: number; evaluated: number; aptos: number; scores: number[] }
    > = {};

    currentRoleData.roleCandidates.forEach((c) => {
      const sen = c.seniority || "Geral";
      if (!map[sen]) {
        map[sen] = { seniority: sen, registered: 0, evaluated: 0, aptos: 0, scores: [] };
      }
      map[sen].registered += 1;
    });

    currentRoleData.roleResults.forEach((r) => {
      const cand = candidates.find((c) => c.id === r.candidateId);
      const sen = cand?.seniority || "Geral";
      if (!map[sen]) {
        map[sen] = { seniority: sen, registered: 0, evaluated: 0, aptos: 0, scores: [] };
      }
      map[sen].evaluated += 1;
      map[sen].scores.push(r.percentage);
      if (r.classification === "Apto") map[sen].aptos += 1;
    });

    return Object.values(map);
  }, [currentRoleData, candidates]);

  // Export PDF for current role
  const handleExportCurrentRolePdf = () => {
    generateJobRolePdf(currentRoleData.role, tests, candidates, results, attempts);
    toast.success(`Download do Relatório do Cargo "${currentRoleData.role}" iniciado.`);
  };

  // Export PDF for any specific role
  const handleExportSpecificRolePdf = (roleName: string) => {
    generateJobRolePdf(roleName, tests, candidates, results, attempts);
    toast.success(`Download do Relatório do Cargo "${roleName}" iniciado.`);
  };

  // Export Consolidated PDF of all roles
  const handleExportAllRolesPdf = () => {
    const rolesList = allRoles;
    generateAllJobRolesPdf(rolesList, tests, candidates, results, attempts);
    toast.success("Download do Relatório Comparativo de Todos os Cargos iniciado.");
  };

  // Quick export individual candidate PDF
  const handleExportCandidatePdf = (candidateId: string, testId: string, attemptId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    const test = tests.find((t) => t.id === testId);
    const attempt = attempts.find((a) => a.id === attemptId);
    const res = results.find((r) => r.attemptId === attemptId);
    const testQs = questions.filter((q) => q.testId === testId);
    const aiReport = aiReports[attemptId];

    if (!cand || !test || !attempt) {
      toast.error("Dados da avaliação não encontrados.");
      return;
    }

    generateIndividualPdf(cand, test, attempt, testQs, res, aiReport);
    toast.success(`Exportando relatório individual de ${cand.fullName}...`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Briefcase className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-100">
              Relatórios Oficiais por Cargo / Função
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              {allRoles.length} Cargos Disponíveis
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Gere relatórios técnicos completos e auditáveis por cargo específico, visualizando a prontidão operacional dos candidatos, o histórico classificativo e o parecer homologado pela Direção de Recursos Humanos da Espacie Services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCurrentRolePdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all hover:scale-105 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar Cargo Atual (PDF)
          </button>
          <button
            onClick={handleExportAllRolesPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-400" /> Exportar Todos os Cargos (PDF)
          </button>
        </div>
      </div>

      {/* Role Selection & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Direct Cargo Dropdown */}
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Selecionar Cargo para Análise:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 font-semibold focus:border-emerald-500 focus:outline-hidden"
            >
              {allRoles.map((role) => {
                const stats = rolesWithStats.find((r) => r.role === role);
                return (
                  <option key={role} value={role}>
                    {role} {stats && stats.totalEvaluated > 0 ? `(${stats.totalEvaluated} avaliações)` : stats && stats.totalCandidates > 0 ? `(${stats.totalCandidates} cand.)` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Search input */}
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pesquisar Cargo / Função:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Soldador, Mecânico, HSE, RH..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Filter by Sector */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Setor:
            </label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-hidden"
            >
              <option value="all">Todos os Setores</option>
              {Array.from(new Set(rolesWithStats.map((r) => r.sector))).map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Activity */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Status de Avaliação:
            </label>
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-hidden"
            >
              <option value="all">Todos os Cargos</option>
              <option value="evaluated">Com Provas Realizadas</option>
            </select>
          </div>
        </div>

        {/* Quick Role Selection Chips Carousel */}
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between">
            <span>Acesso Rápido aos Cargos:</span>
            <span className="text-[10px] text-slate-500">
              Mostrando {filteredRoles.length} de {allRoles.length} cargos
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {filteredRoles.slice(0, 16).map((item) => {
              const isSelected = item.role.toLowerCase() === selectedRole.toLowerCase();
              return (
                <button
                  key={item.role}
                  onClick={() => setSelectedRole(item.role)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40 scale-102"
                      : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                >
                  <span>{item.role}</span>
                  {item.totalEvaluated > 0 ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isSelected
                          ? "bg-slate-950/20 text-slate-950 font-bold"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {item.totalEvaluated} aval.
                    </span>
                  ) : item.totalCandidates > 0 ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isSelected
                          ? "bg-slate-950/20 text-slate-950 font-bold"
                          : "bg-sky-500/20 text-sky-400"
                      }`}
                    >
                      {item.totalCandidates} cand.
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Cargo In-Depth Dossier Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
        {/* Cargo Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider">
                Cargo em Análise
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
                Setor: {currentRoleData.sector}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                LGT Lei 12/23 & Dec. 31/94
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-3">
              <span>{currentRoleData.role}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Relatório consolidado de aptidão técnica, conformidade e competências operacionais aplicadas para o cargo de <b>{currentRoleData.role}</b> na Espacie Services.
            </p>
          </div>

          <button
            onClick={handleExportCurrentRolePdf}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <Download className="w-5 h-5" /> Gerar Relatório do Cargo (PDF)
          </button>
        </div>

        {/* 4 KPI Cards for the Role */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" /> Candidatos no Cargo
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100">
              {currentRoleData.totalCandidates}
            </div>
            <p className="text-[11px] text-slate-500">Registados no sistema</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Avaliações Realizadas
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100">
              {currentRoleData.totalEvaluated}
            </div>
            <p className="text-[11px] text-slate-500">Provas técnicas concluídas</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Taxa de Aptidão
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {currentRoleData.approvalRate}%
            </div>
            <p className="text-[11px] text-slate-500">
              {currentRoleData.aptos} apto(s) de {currentRoleData.totalEvaluated}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-1">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rendimento Médio
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100">
              {currentRoleData.avgScore}%
            </div>
            <p className="text-[11px] text-slate-500">Média ponderada do cargo</p>
          </div>
        </div>

        {/* Associated Technical Tests for this Role */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" /> Provas Técnicas Associadas ao Cargo
            </h4>
            <span className="text-xs text-slate-400">
              {currentRoleTests.length} teste(s) registado(s)
            </span>
          </div>

          {currentRoleTests.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
              Nenhuma prova técnica vinculada especificamente por título ao cargo de <b>{currentRoleData.role}</b>. Você pode criar um teste para este cargo no menu <b>Testes Técnicos</b>.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentRoleTests.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {t.sector}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Corte: {t.passingScore}%
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-200 text-xs line-clamp-1">{t.title}</h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>{t.durationMinutes} min</span>
                    <span>Dificuldade: {t.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quadro Classificativo dos Candidatos do Cargo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Quadro Classificativo dos Candidatos — {currentRoleData.role}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({sortedRoleResults.length} avaliações)
              </span>
            </h4>
          </div>

          {sortedRoleResults.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Nenhum candidato concluiu avaliações técnicas até o momento para o cargo de <b>{currentRoleData.role}</b>.
              </p>
              {currentRoleData.roleCandidates.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    Candidatos registados com este cargo aguardando prova:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {currentRoleData.roleCandidates.map((c) => (
                      <span
                        key={c.id}
                        className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium"
                      >
                        {c.fullName} • {c.seniority} ({c.documentNumber})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Posição</th>
                    <th className="px-4 py-3">Candidato</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Senioridade</th>
                    <th className="px-4 py-3">Prova Realizada</th>
                    <th className="px-4 py-3 text-center">Pontuação</th>
                    <th className="px-4 py-3 text-center">Classificação</th>
                    <th className="px-4 py-3 text-center">Data</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedRoleResults.map((res, idx) => {
                    const cand = candidates.find((c) => c.id === res.candidateId);
                    const test = tests.find((t) => t.id === res.testId);
                    const isApproved = res.classification === "Apto";
                    return (
                      <tr key={res.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-300">
                          #{idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-100">
                          {cand ? cand.fullName : "Candidato"}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                          {cand ? `${cand.documentType} ${cand.documentNumber}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {cand ? cand.seniority : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {test ? test.title : "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-100">
                          {res.totalScore} / {res.maxScore} pts ({res.percentage}%)
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> APTO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                              <XCircle className="w-3 h-3" /> NÃO APTO
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400 text-[11px]">
                          {new Date(res.publishedAt).toLocaleDateString("pt-AO")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              handleExportCandidatePdf(res.candidateId, res.testId, res.attemptId)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                            title="Descarregar Relatório Individual do Candidato em PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seniority Distribution Table for this Role */}
        {seniorityDistribution.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Distribuição por Categoria Profissional / Senioridade
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Categoria / Senioridade</th>
                    <th className="px-4 py-2.5 text-center">Candidatos Registados</th>
                    <th className="px-4 py-2.5 text-center">Avaliados</th>
                    <th className="px-4 py-2.5 text-center">Aptos</th>
                    <th className="px-4 py-2.5 text-center">Taxa de Aptidão</th>
                    <th className="px-4 py-2.5 text-center">Média Técnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {seniorityDistribution.map((sen) => {
                    const rate =
                      sen.evaluated > 0
                        ? `${Math.round((sen.aptos / sen.evaluated) * 100)}%`
                        : "-";
                    const avg =
                      sen.scores.length > 0
                        ? `${
                            Math.round(
                              (sen.scores.reduce((a, b) => a + b, 0) / sen.scores.length) * 10
                            ) / 10
                          }%`
                        : "-";
                    return (
                      <tr key={sen.seniority} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2.5 font-bold text-slate-200">{sen.seniority}</td>
                        <td className="px-4 py-2.5 text-center font-mono">{sen.registered}</td>
                        <td className="px-4 py-2.5 text-center font-mono">{sen.evaluated}</td>
                        <td className="px-4 py-2.5 text-center font-mono text-emerald-400 font-bold">
                          {sen.aptos}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-400">
                          {rate}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-slate-200">{avg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Matriz Comparativa Geral de Todos os Cargos */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              Matriz Comparativa Geral de Todos os Cargos
            </h3>
            <p className="text-xs text-slate-400">
              Visão corporativa de todos os cargos monitorizados na Espacie Services com emissão direta de relatórios.
            </p>
          </div>

          <button
            onClick={handleExportAllRolesPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> Descarregar Relatório Comparativo (PDF)
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Cargo / Função</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3 text-center">Candidatos</th>
                <th className="px-4 py-3 text-center">Avaliados</th>
                <th className="px-4 py-3 text-center">Aptos</th>
                <th className="px-4 py-3 text-center">Taxa de Aptidão</th>
                <th className="px-4 py-3 text-center">Média Técnica</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoles.map((item) => (
                <tr
                  key={item.role}
                  className={`hover:bg-slate-900/50 transition-colors ${
                    item.role.toLowerCase() === selectedRole.toLowerCase()
                      ? "bg-slate-900/40"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-slate-200">
                    <button
                      onClick={() => setSelectedRole(item.role)}
                      className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                    >
                      {item.role}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.sector}</td>
                  <td className="px-4 py-3 text-center font-mono">{item.totalCandidates}</td>
                  <td className="px-4 py-3 text-center font-mono">{item.totalEvaluated}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-400">
                    {item.aptos}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-emerald-400">
                    {item.totalEvaluated > 0 ? `${item.approvalRate}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-200">
                    {item.totalEvaluated > 0 ? `${item.avgScore}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleExportSpecificRolePdf(item.role)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      title={`Exportar Relatório em PDF para ${item.role}`}
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" /> PDF do Cargo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
