import { useState, type FormEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  Candidate,
  SENIORITY_LEVELS,
  DocumentType,
  SeniorityLevel,
  Sector,
  SECTORS,
} from "../../types";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  KeyRound,
  FileText,
  AlertTriangle,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Briefcase,
  Layers,
  Building,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export function CandidatesManagement() {
  const {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    toggleCandidateStatus,
    attempts,
    results,
    tests,
    authorizedRetests,
    authorizeRetest,
    revokeRetestAuthorization,
    assignTestsToCandidate,
    positions,
    addPosition,
    deletePosition,
    professionalCategories,
    addProfessionalCategory,
    deleteProfessionalCategory,
    sectors,
    addSector,
    deleteSector,
    clearAllExistingData,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeniority, setFilterSeniority] = useState<string>("all");
  const [filterJobTitle, setFilterJobTitle] = useState<string>("all");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("BI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [seniority, setSeniority] = useState<string>("Técnico");
  const [sector, setSector] = useState<Sector>(sectors[0] || "Industrial");
  const [accessPassword, setAccessPassword] = useState("candidato123");
  const [showCandidatePassword, setShowCandidatePassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [assignedTestIds, setAssignedTestIds] = useState<string[]>([]);

  // Position, Category & Sector Management Modals
  const [isPositionsManagerOpen, setIsPositionsManagerOpen] = useState(false);
  const [positionsTab, setPositionsTab] = useState<"positions" | "categories" | "sectors">("positions");
  const [positionsSearch, setPositionsSearch] = useState("");
  const [newPositionInput, setNewPositionInput] = useState("");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newSectorInput, setNewSectorInput] = useState("");
  const [isAddPositionQuickOpen, setIsAddPositionQuickOpen] = useState(false);
  const [isAddCategoryQuickOpen, setIsAddCategoryQuickOpen] = useState(false);
  const [isAddSectorQuickOpen, setIsAddSectorQuickOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Candidate history modal state
  const [viewHistoryCandidate, setViewHistoryCandidate] = useState<Candidate | null>(null);

  // Quick Test Access Management modal state
  const [assignTestsCandidate, setAssignTestsCandidate] = useState<Candidate | null>(null);
  const [quickAssignedTestIds, setQuickAssignedTestIds] = useState<string[]>([]);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setDocumentType("BI");
    setDocumentNumber("");
    setJobTitle(positions[0] || "");
    setSector(sectors[0] || "Industrial");
    setSeniority(professionalCategories[0] || "Técnico");
    setAccessPassword("candidato123");
    setIsActive(true);
    setAssignedTestIds([]);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (c: Candidate) => {
    setEditingId(c.id);
    setFullName(c.fullName);
    setEmail(c.email);
    setPhone(c.phone || "");
    setDocumentType(c.documentType);
    setDocumentNumber(c.documentNumber);
    setJobTitle(c.jobTitle);
    setSector(c.sector || "Industrial");
    setSeniority(c.seniority);
    setAccessPassword(c.accessPassword || "candidato123");
    setIsActive(c.isActive);
    setAssignedTestIds(c.assignedTestIds || []);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validations
    if (!fullName.trim() || !email.trim() || !documentNumber.trim() || !jobTitle.trim()) {
      toast.error("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Formato de e-mail inválido.");
      return;
    }

    const docClean = documentNumber.trim().toUpperCase();
    const duplicateDoc = candidates.find(
      (c) => c.documentNumber.toUpperCase() === docClean && c.id !== editingId
    );

    if (duplicateDoc) {
      toast.error("Já existe um candidato com este número de documento registado.");
      return;
    }

    if (editingId) {
      updateCandidate(editingId, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        documentType,
        documentNumber: docClean,
        jobTitle: jobTitle.trim(),
        sector,
        seniority,
        accessPassword: accessPassword.trim(),
        isActive,
        assignedTestIds,
      });
      toast.success("Candidato atualizado com sucesso.");
    } else {
      addCandidate({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        documentType,
        documentNumber: docClean,
        jobTitle: jobTitle.trim(),
        sector,
        seniority,
        accessPassword: accessPassword.trim(),
        isActive,
        assignedTestIds,
      });
      toast.success("Candidato cadastrado com sucesso.");
    }

    resetForm();
  };

  const handleDelete = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeniority =
      filterSeniority === "all" || c.seniority === filterSeniority;

    const matchesJobTitle =
      filterJobTitle === "all" || c.jobTitle === filterJobTitle;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && c.isActive) ||
      (filterStatus === "inactive" && !c.isActive);

    return matchesSearch && matchesSeniority && matchesJobTitle && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            Gestão de Candidatos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Cadastre, edite e acompanhe o histórico de credenciais e avaliações com base nas 52 posições oficiais.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPositionsManagerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0b1f38] hover:bg-[#0f2a4c] text-sky-300 border border-sky-500/30 font-semibold text-xs transition-colors shadow-sm"
          >
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span>Cargos & Categorias ({positions.length})</span>
          </button>

          <button
            onClick={() => setIsClearAllConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 text-xs transition-colors"
            title="Limpar todos os dados existentes do sistema"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Dados</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-sky-950/40 transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" /> Cadastrar Candidato
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#091A2E] border border-[#17365D] rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, BI, cargo..."
            className="w-full pl-9 pr-4 py-2 bg-[#061424] border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto overflow-x-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Filter by Cargo / Posição */}
          <select
            value={filterJobTitle}
            onChange={(e) => setFilterJobTitle(e.target.value)}
            className="bg-[#061424] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden max-w-[200px]"
          >
            <option value="all">Todos os Cargos ({positions.length})</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Filter by Categoria Profissional */}
          <select
            value={filterSeniority}
            onChange={(e) => setFilterSeniority(e.target.value)}
            className="bg-[#061424] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todas as Categorias</option>
            {professionalCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todos os Estados</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Candidato</th>
                <th className="px-4 py-3.5">Documento</th>
                <th className="px-4 py-3.5">Cargo / Senioridade</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-center">Testes Autorizados</th>
                <th className="px-4 py-3.5 text-center">Histórico</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhum candidato encontrado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const candAttempts = attempts.filter((a) => a.candidateId === c.id);
                  const candResults = results.filter((r) => r.candidateId === c.id);
                  const authCount = (c.assignedTestIds || []).length;

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100">{c.fullName}</div>
                        <div className="text-xs text-slate-400">
                          {c.email} {c.phone && `• ${c.phone}`}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-medium text-slate-200">
                          {c.documentType} {c.documentNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200">{c.jobTitle}</div>
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-semibold border border-slate-700 mt-0.5">
                          {c.seniority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => toggleCandidateStatus(c.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 ${
                            c.isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {c.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAssignTestsCandidate(c);
                            setQuickAssignedTestIds(c.assignedTestIds || []);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:scale-105 ${
                            authCount > 0
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                          title="Gerir testes previamente autorizados para este candidato"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{authCount} {authCount === 1 ? "teste" : "testes"}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setViewHistoryCandidate(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>{candAttempts.length} testes</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="Editar Candidato"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                          title="Excluir Candidato"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Create or Edit Candidate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  {editingId ? "Editar Candidato" : "Cadastrar Novo Candidato"}
                </h3>
              </div>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: João Baptista Silva"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao.silva@exemplo.com"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Tipo de Documento *
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="BI">Bilhete de Identidade (BI)</option>
                    <option value="Passaporte">Passaporte Internacional</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Número do Documento (Único) *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Ex: 004819283LA042"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold block">
                      Cargo / Função Pretendida *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddPositionQuickOpen(true)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Cargo
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="candidate-positions-datalist"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Selecione ou digite o cargo..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                    />
                    <datalist id="candidate-positions-datalist">
                      {positions.map((pos) => (
                        <option key={pos} value={pos} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{positions.length} cargos oficiais disponíveis</span>
                    <button
                      type="button"
                      onClick={() => setIsPositionsManagerOpen(true)}
                      className="text-sky-400 hover:underline"
                    >
                      Gerir lista
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold block">
                      Categoria Profissional *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryQuickOpen(true)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Categoria
                    </button>
                  </div>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                  >
                    {professionalCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    {professionalCategories.length} categorias hierárquicas oficiais
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Palavra-passe de Acesso do Candidato
                  </label>
                  <div className="relative">
                    <input
                      type={showCandidatePassword ? "text" : "password"}
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      title={showCandidatePassword ? "Ocultar" : "Mostrar"}
                    >
                      {showCandidatePassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Utilizada no Portal do Candidato com o BI/Passaporte.
                  </span>
                </div>

                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                    />
                    <span>Candidato Ativo no Sistema</span>
                  </label>
                  <span className="text-[10px] text-slate-500 pl-6">
                    Candidatos inativos não conseguem iniciar testes.
                  </span>
                </div>

                {/* Authorized Tests Assignment in Form */}
                <div className="md:col-span-2 pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      Testes Previamente Autorizados para este Candidato:
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {assignedTestIds.length} selecionado(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    O candidato só terá permissão para visualizar e realizar os testes explicitamente marcados abaixo.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {tests
                      .filter((t) => t.isActive)
                      .map((t) => {
                        const isChecked = assignedTestIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignedTestIds((prev) => [...prev, t.id]);
                                } else {
                                  setAssignedTestIds((prev) => prev.filter((id) => id !== t.id));
                                }
                              }}
                              className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold block truncate">{t.title}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {t.sector} • {t.durationMinutes} min
                              </span>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/50 transition-all"
                >
                  {editingId ? "Guardar Alterações" : "Concluir Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Candidate History */}
      {viewHistoryCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Histórico de Testes: {viewHistoryCandidate.fullName}
                </h3>
                <p className="text-xs text-slate-400">
                  {viewHistoryCandidate.documentType} {viewHistoryCandidate.documentNumber} • {viewHistoryCandidate.seniority}
                </p>
              </div>
              <button
                onClick={() => setViewHistoryCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.filter((r) => r.candidateId === viewHistoryCandidate.id).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhuma avaliação submetida até o momento por este candidato.
                </div>
              ) : (
                results
                  .filter((r) => r.candidateId === viewHistoryCandidate.id)
                  .map((r) => {
                    const test = tests.find((t) => t.id === r.testId);
                    const isApto = r.classification === "Apto";
                    const isRetestAuthorized = !!authorizedRetests[`${viewHistoryCandidate.id}_${r.testId}`];

                    return (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{test?.title}</div>
                          <div className="text-slate-400 text-[11px]">
                            {test?.sector} • Realizado em {new Date(r.publishedAt).toLocaleDateString("pt-AO")}
                          </div>
                          {isRetestAuthorized && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                              ★ Repetição Autorizada pelo Administrador
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right font-mono">
                            <span className="font-bold text-slate-100 text-sm">{r.percentage}%</span>
                            <span className="block text-[10px] text-slate-500">
                              {r.totalScore}/{r.maxScore} pts
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isApto
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {r.classification}
                          </span>

                          {isRetestAuthorized ? (
                            <button
                              type="button"
                              onClick={() => {
                                revokeRetestAuthorization(viewHistoryCandidate.id, r.testId);
                                toast.info("Autorização de repetição revogada.");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-colors"
                              title="Revogar autorização de repetir teste"
                            >
                              Revogar Repetição
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                authorizeRetest(viewHistoryCandidate.id, r.testId);
                                toast.success(`Repetição de teste autorizada para ${viewHistoryCandidate.fullName}.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 border border-slate-700 text-[11px] font-semibold transition-colors"
                              title="Autorizar o candidato a realizar novamente este teste"
                            >
                              Autorizar Repetição
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewHistoryCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Test Authorization per Candidate */}
      {assignTestsCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Autorizar Testes: {assignTestsCandidate.fullName}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {assignTestsCandidate.jobTitle} • {assignTestsCandidate.seniority} • {assignTestsCandidate.documentType} {assignTestsCandidate.documentNumber}
                </p>
              </div>
              <button
                onClick={() => setAssignTestsCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {quickAssignedTestIds.length} de {tests.filter((t) => t.isActive).length} testes autorizados
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickAssignedTestIds(tests.filter((t) => t.isActive).map((t) => t.id))}
                    className="text-emerald-400 hover:underline text-xs font-medium"
                  >
                    Marcar Todos
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setQuickAssignedTestIds([])}
                    className="text-rose-400 hover:underline text-xs font-medium"
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto p-1">
                {tests
                  .filter((t) => t.isActive)
                  .map((t) => {
                    const isChecked = quickAssignedTestIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-xs"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuickAssignedTestIds((prev) => [...prev, t.id]);
                            } else {
                              setQuickAssignedTestIds((prev) => prev.filter((id) => id !== t.id));
                            }
                          }}
                          className="mt-1 rounded accent-emerald-500 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-100 truncate">{t.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 shrink-0">
                              {t.sector}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {t.description || "Avaliação técnica corporativa"}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                            <span>Duração: {t.durationMinutes} min</span>
                            <span>Corte: {t.passingScore}%</span>
                            <span>Categoria: {t.category}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAssignTestsCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  assignTestsToCandidate(assignTestsCandidate.id, quickAssignedTestIds);
                  toast.success(
                    `Permissões de testes salvas para ${assignTestsCandidate.fullName} (${quickAssignedTestIds.length} teste(s) autorizados).`
                  );
                  setAssignTestsCandidate(null);
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-950/50 transition-all"
              >
                Salvar Autorizações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POSITIONS & CATEGORIES MANAGER MODAL */}
      {isPositionsManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-[#091B30] border border-[#17365D] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Gerir Cargos & Categorias Oficiais
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Configure os cargos pretendidos e as categorias hierárquicas da Espacie Services.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPositionsManagerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-[#061424] p-1 border border-[#17365D] gap-1 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setPositionsTab("positions")}
                className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  positionsTab === "positions"
                    ? "bg-[#0A2540] text-sky-400 border border-sky-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Cargos ({positions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPositionsTab("categories")}
                className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  positionsTab === "categories"
                    ? "bg-[#0A2540] text-sky-400 border border-sky-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Categorias ({professionalCategories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPositionsTab("sectors")}
                className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  positionsTab === "sectors"
                    ? "bg-[#0A2540] text-sky-400 border border-sky-500/30 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Setores ({sectors.length})</span>
              </button>
            </div>

            {/* Content for Positions */}
            {positionsTab === "positions" && (
              <div className="space-y-4">
                {/* Add new position inline */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPositionInput}
                    onChange={(e) => setNewPositionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPositionInput.trim()) {
                        e.preventDefault();
                        addPosition(newPositionInput.trim());
                        toast.success(`Cargo "${newPositionInput.trim()}" adicionado com sucesso.`);
                        setNewPositionInput("");
                      }
                    }}
                    placeholder="Adicionar novo cargo (ex: Inspetor de Soldadura, Técnico de Poços)..."
                    className="flex-1 px-3 py-2.5 bg-[#061424] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPositionInput.trim()) {
                        addPosition(newPositionInput.trim());
                        toast.success(`Cargo "${newPositionInput.trim()}" adicionado com sucesso.`);
                        setNewPositionInput("");
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Search filter for positions */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={positionsSearch}
                    onChange={(e) => setPositionsSearch(e.target.value)}
                    placeholder="Filtrar posições na lista..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#061424] border border-slate-700/60 rounded-xl text-xs text-slate-300 placeholder-slate-500 focus:border-sky-400 focus:outline-hidden"
                  />
                </div>

                {/* Positions list */}
                <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                  {positions
                    .filter((p) => p.toLowerCase().includes(positionsSearch.toLowerCase()))
                    .map((pos) => {
                      const count = candidates.filter((c) => c.jobTitle === pos).length;
                      return (
                        <div
                          key={pos}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#061424]/80 border border-[#17365D] hover:border-sky-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span className="font-semibold text-slate-200">{pos}</span>
                            {count > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                {count} candidato(s)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              deletePosition(pos);
                              toast.success(`Cargo "${pos}" removido da lista oficial.`);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Remover cargo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Content for Professional Categories */}
            {positionsTab === "categories" && (
              <div className="space-y-4">
                {/* Add new category inline */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategoryInput.trim()) {
                        e.preventDefault();
                        addProfessionalCategory(newCategoryInput.trim());
                        toast.success(`Categoria "${newCategoryInput.trim()}" adicionada.`);
                        setNewCategoryInput("");
                      }
                    }}
                    placeholder="Adicionar nova categoria profissional hierárquica..."
                    className="flex-1 px-3 py-2.5 bg-[#061424] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryInput.trim()) {
                        addProfessionalCategory(newCategoryInput.trim());
                        toast.success(`Categoria "${newCategoryInput.trim()}" adicionada.`);
                        setNewCategoryInput("");
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Categories list */}
                <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                  {professionalCategories.map((cat) => {
                    const count = candidates.filter((c) => c.seniority === cat).length;
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#061424]/80 border border-[#17365D] hover:border-sky-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="font-semibold text-slate-200">{cat}</span>
                          {count > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                              {count} candidato(s)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            deleteProfessionalCategory(cat);
                            toast.success(`Categoria "${cat}" removida da lista.`);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Remover categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content for Sectors of Activity */}
            {positionsTab === "sectors" && (
              <div className="space-y-4">
                {/* Add new sector inline */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSectorInput}
                    onChange={(e) => setNewSectorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSectorInput.trim()) {
                        e.preventDefault();
                        addSector(newSectorInput.trim());
                        toast.success(`Setor "${newSectorInput.trim()}" adicionado com sucesso.`);
                        setNewSectorInput("");
                      }
                    }}
                    placeholder="Adicionar novo setor de atividade..."
                    className="flex-1 px-3 py-2.5 bg-[#061424] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSectorInput.trim()) {
                        addSector(newSectorInput.trim());
                        toast.success(`Setor "${newSectorInput.trim()}" adicionado com sucesso.`);
                        setNewSectorInput("");
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Sectors list */}
                <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                  {sectors.map((sec) => {
                    const candCount = candidates.filter((c) => c.sector === sec).length;
                    const testCount = tests.filter((t) => t.sector === sec).length;
                    return (
                      <div
                        key={sec}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#061424]/80 border border-[#17365D] hover:border-sky-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="font-semibold text-slate-200">{sec}</span>
                          {(candCount > 0 || testCount > 0) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                              {candCount} candidato(s) • {testCount} teste(s)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            deleteSector(sec);
                            toast.success(`Setor "${sec}" removido da lista.`);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Remover setor de atividade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setIsPositionsManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0A2540] hover:bg-[#12365c] text-sky-300 font-semibold text-xs border border-sky-500/30 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD POSITION MODAL */}
      {isAddPositionQuickOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#091B30] border border-[#17365D] rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                Adicionar Novo Cargo
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPositionQuickOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nome do Cargo / Posição</label>
              <input
                type="text"
                value={newPositionInput}
                onChange={(e) => setNewPositionInput(e.target.value)}
                placeholder="Ex: Engenheiro de Segurança..."
                className="w-full px-3 py-2 bg-[#061424] border border-slate-700 rounded-xl text-slate-100 focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddPositionQuickOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPositionInput.trim()) {
                    addPosition(newPositionInput.trim());
                    setJobTitle(newPositionInput.trim());
                    toast.success(`Cargo "${newPositionInput.trim()}" adicionado e selecionado.`);
                    setNewPositionInput("");
                    setIsAddPositionQuickOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
              >
                Adicionar & Usar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {isAddCategoryQuickOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#091B30] border border-[#17365D] rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Adicionar Categoria Profissional
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryQuickOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nome da Categoria</label>
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Ex: Coordenador Sénior, Supervisor Chefe..."
                className="w-full px-3 py-2 bg-[#061424] border border-slate-700 rounded-xl text-slate-100 focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddCategoryQuickOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newCategoryInput.trim()) {
                    addProfessionalCategory(newCategoryInput.trim());
                    setSeniority(newCategoryInput.trim());
                    toast.success(`Categoria "${newCategoryInput.trim()}" adicionada e selecionada.`);
                    setNewCategoryInput("");
                    setIsAddCategoryQuickOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
              >
                Adicionar & Usar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL DATA CONFIRMATION MODAL */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#091B30] border border-rose-800/60 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center gap-3 text-rose-400 border-b border-[#17365D] pb-3">
              <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Limpar Informações Existentes</h3>
                <p className="text-slate-400 text-xs">Remoção de registros anteriores do sistema</p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Esta ação irá remover todos os candidatos, tentativas e resultados previamente registrados, deixando a base pronta para novos cadastros com as 52 posições oficiais.
            </p>

            <div className="p-3 rounded-xl bg-[#061424] border border-[#17365D] text-slate-400 text-[11px] space-y-1">
              <div className="text-sky-400 font-semibold">Os seguintes dados serão preservados:</div>
              <div>• Catálogo de testes e perguntas estruturadas</div>
              <div>• 52 Posições Técnicas oficiais</div>
              <div>• 22 Categorias Profissionais oficiais</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllExistingData();
                  toast.success("Todas as informações antigas foram removidas com sucesso.");
                  setIsClearAllConfirmOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-950/50"
              >
                Sim, Limpar Registros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DELETION CONFIRMATION MODAL */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#091B30] border border-[#17365D] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-[#17365D] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Eliminar Candidato</h3>
                  <p className="text-[11px] text-slate-400">Confirmação de exclusão cadastral</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-1">
              <div className="p-3 rounded-xl bg-[#061424] border border-[#17365D] space-y-1">
                <p className="text-slate-200 font-semibold text-xs">
                  {candidateToDelete.fullName}
                </p>
                <p className="text-[11px] text-slate-400">
                  Cargo: <b className="text-slate-300">{candidateToDelete.jobTitle}</b> • Doc: <b className="text-slate-300 font-mono">{candidateToDelete.documentNumber}</b>
                </p>
                <p className="text-[11px] text-slate-400">
                  E-mail: <b className="text-slate-300">{candidateToDelete.email}</b>
                </p>
              </div>

              {attempts.filter((a) => a.candidateId === candidateToDelete.id).length > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    Histórico de Avaliações Registado
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Este candidato possui <b>{attempts.filter((a) => a.candidateId === candidateToDelete.id).length} tentativa(s)/resultado(s)</b> de avaliação no sistema.
                  </p>
                  <p className="text-[11px] text-amber-200/70">
                    Você pode eliminar definitivamente o cadastro e todo o histórico associado, ou apenas desativar o acesso do candidato.
                  </p>
                </div>
              ) : (
                <p className="text-slate-300 text-xs leading-relaxed">
                  Tem a certeza de que deseja eliminar o cadastro deste candidato? Esta ação não pode ser desfeita.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>

              {attempts.filter((a) => a.candidateId === candidateToDelete.id).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    updateCandidate(candidateToDelete.id, { isActive: false });
                    toast.info(`O candidato "${candidateToDelete.fullName}" foi desativado.`);
                    setCandidateToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-semibold transition-colors"
                >
                  Apenas Desativar
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const res = deleteCandidate(candidateToDelete.id, true);
                  if (res.success) {
                    toast.success(res.message);
                  } else {
                    toast.error(res.message);
                  }
                  setCandidateToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {attempts.filter((a) => a.candidateId === candidateToDelete.id).length > 0
                  ? "Excluir Candidato e Histórico"
                  : "Excluir Candidato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
