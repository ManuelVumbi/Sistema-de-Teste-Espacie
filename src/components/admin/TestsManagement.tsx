import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import {
  Test,
  SECTORS_AND_CATEGORIES,
  Sector,
  DifficultyLevel,
  SeniorityLevel,
} from "../../types";
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Layers,
  HelpCircle,
  X,
  Sparkles,
  ChevronRight,
  Upload,
  FileText,
  Loader2,
  Paperclip,
  Check,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AiServiceAdapter } from "../../services/aiService";

export function TestsManagement() {
  const {
    tests,
    addTest,
    updateTest,
    deleteTest,
    toggleTestStatus,
    questions,
    attempts,
    setActiveView,
    setSelectedTestId,
    addBulkQuestions,
    sectors,
    addSector,
    deleteSector,
    positions,
    addPosition,
    deletePosition,
    professionalCategories,
    addProfessionalCategory,
    deleteProfessionalCategory,
  } = useAppStore();

  const aiService = AiServiceAdapter.getInstance();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick add position, category & sector modal state
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);
  const [newPosName, setNewPosName] = useState("");
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddSectorModalOpen, setIsAddSectorModalOpen] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [isSectorsManagerOpen, setIsSectorsManagerOpen] = useState(false);
  const [managerNewSector, setManagerNewSector] = useState("");
  const [isCategoriesManagerOpen, setIsCategoriesManagerOpen] = useState(false);
  const [managerNewCategory, setManagerNewCategory] = useState("");
  const [categoriesSearch, setCategoriesSearch] = useState("");
  const [isPositionsManagerOpen, setIsPositionsManagerOpen] = useState(false);
  const [managerNewPosition, setManagerNewPosition] = useState("");
  const [positionsSearch, setPositionsSearch] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState(sectors[0] || "Industrial");
  const [category, setCategory] = useState(professionalCategories[0] || "Técnico");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Médio");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Sources and Files fields
  const [sourceMaterial, setSourceMaterial] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; charCount?: number }[]>([]);
  const [autoGenerateQuestions, setAutoGenerateQuestions] = useState(true);
  const [autoGenerateCount, setAutoGenerateCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update categories when sector changes
  const currentSectorObj = SECTORS_AND_CATEGORIES.find((s) => s.sector === sector);
  const availableCategories = currentSectorObj?.categories || [];

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSector(sectors[0] || "Industrial");
    setCategory(professionalCategories[0] || "Técnico");
    setDifficulty("Médio");
    setDurationMinutes(45);
    setPassingScore(70);
    setMaxAttempts(1);
    setIsActive(true);
    setSourceMaterial("");
    setUploadedFiles([]);
    setAutoGenerateQuestions(true);
    setAutoGenerateCount(5);
    setIsGenerating(false);
    setIsExtractingFile(false);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (t: Test) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description || "");
    setSector(t.sector);
    setCategory(t.category);
    setDifficulty(t.difficulty || "Médio");
    setDurationMinutes(t.durationMinutes);
    setPassingScore(t.passingScore);
    setMaxAttempts(t.maxAttempts);
    setIsActive(t.isActive);
    setSourceMaterial(t.sourceMaterial || "");
    setUploadedFiles(
      t.sourceFiles?.map((name) => ({ name, size: "Anexo" })) || []
    );
    setAutoGenerateQuestions(false);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtractingFile(true);
    try {
      for (const file of Array.from(files) as File[]) {
        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        const extRes = await aiService.extractFileContent(file);
        if (extRes.success && extRes.text) {
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, size: sizeStr, charCount: extRes.charCount },
          ]);
          setSourceMaterial((prev) => {
            return (prev ? prev + "\n\n" : "") + extRes.text;
          });
          toast.success(
            `Arquivo "${file.name}" extraído com sucesso (${extRes.charCount.toLocaleString()} caracteres obtidos para a base do teste).`
          );
        } else {
          setUploadedFiles((prev) => [...prev, { name: file.name, size: sizeStr }]);
          toast.warning(
            `Arquivo "${file.name}" anexado como referência para o teste.`
          );
        }
      }
    } catch (err: any) {
      toast.error(`Falha ao processar arquivo: ${err.message || "Erro de leitura"}`);
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUploadedFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !sector.trim() || !category.trim()) {
      toast.error("Por favor preencha os campos obrigatórios do teste.");
      return;
    }

    if (editingId) {
      updateTest(editingId, {
        title: title.trim(),
        description: description.trim(),
        sector: sector as Sector,
        category,
        difficulty,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        maxAttempts: Number(maxAttempts),
        isActive,
        sourceMaterial: sourceMaterial.trim() || undefined,
        sourceFiles: uploadedFiles.map((f) => f.name),
      });
      toast.success("Teste atualizado com sucesso.");
      resetForm();
    } else {
      setIsGenerating(true);
      try {
        const created = addTest({
          title: title.trim(),
          description: description.trim(),
          sector: sector as Sector,
          category,
          difficulty,
          recommendedSeniority: "Pleno",
          durationMinutes: Number(durationMinutes),
          passingScore: Number(passingScore),
          maxAttempts: Number(maxAttempts),
          isActive,
          sourceMaterial: sourceMaterial.trim() || undefined,
          sourceFiles: uploadedFiles.map((f) => f.name),
        });

        if (autoGenerateQuestions) {
          toast.info("A gerar perguntas estruturadas com IA com base nas fontes fornecidas...");
          try {
            const isAngolaRelevant =
              sector.includes("Petróleo") ||
              sector.includes("Mineração") ||
              sector.includes("Jurídico");

            const genRes = await aiService.generateQuestions({
              topic: title.trim(),
              sector: sector as Sector,
              category,
              description: description.trim(),
              count: Number(autoGenerateCount),
              type: "mixed",
              difficulty: difficulty,
              seniority: category || "Técnico",
              sourceMaterial: sourceMaterial.trim() || undefined,
              isAngolaOilGasRelevant: isAngolaRelevant,
            });

            if (genRes.success && genRes.questions.length > 0) {
              addBulkQuestions(created.id, genRes.questions);
              toast.success(
                `Teste criado com sucesso e ${genRes.questions.length} perguntas geradas com fidelidade ao documento/área! O teste está pronto.`
              );
            } else {
              toast.warning("Teste criado. Gerador automático retornou vazio; adicione questões no banco.");
            }
          } catch (aiErr) {
            console.warn("AI generation error on test creation", aiErr);
            toast.warning("Teste criado. Por favor cadastre perguntas no Banco de Questões.");
          }
        } else {
          toast.success("Teste cadastrado com sucesso.");
        }

        setSelectedTestId(created.id);
        setActiveView("test-questions");
        resetForm();
      } catch (err: any) {
        toast.error(err.message || "Erro ao criar o teste.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleDelete = (test: Test) => {
    setTestToDelete(test);
  };

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = filterSector === "all" || t.sector === filterSector;
    const matchesPosition =
      filterPosition === "all" ||
      t.title.toLowerCase().includes(filterPosition.toLowerCase()) ||
      t.category === filterPosition;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && t.isActive) ||
      (filterStatus === "inactive" && !t.isActive);

    const matchesDifficulty =
      filterDifficulty === "all" || t.difficulty === filterDifficulty;

    return matchesSearch && matchesSector && matchesPosition && matchesStatus && matchesDifficulty;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-sky-400" />
            Gestão de Testes e Avaliações
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Crie e gerencie provas técnicas com base nas 52 posições oficiais da Espacie Services.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSectorsManagerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0b1f38] hover:bg-[#0f2a4c] text-sky-300 border border-sky-500/30 font-semibold text-xs transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Setores ({sectors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoriesManagerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0b1f38] hover:bg-[#0f2a4c] text-sky-300 border border-sky-500/30 font-semibold text-xs transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Categorias ({professionalCategories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPositionsManagerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0b1f38] hover:bg-[#0f2a4c] text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Cargos ({positions.length})</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-sky-950/40 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Criar Novo Teste
          </button>
        </div>
      </div>

      {/* Quick Positions Filter Bar (52 Positions) */}
      <div className="bg-[#091A2E] border border-[#17365D] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Posições Oficiais ({positions.length}):
          </span>
          {filterPosition !== "all" && (
            <button
              onClick={() => setFilterPosition("all")}
              className="text-[11px] text-sky-400 hover:underline font-semibold"
            >
              Limpar Filtro ({filterPosition})
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          <button
            onClick={() => setFilterPosition("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterPosition === "all"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-[#061424] text-slate-300 hover:bg-slate-800 border border-slate-700/60"
            }`}
          >
            Todas ({positions.length})
          </button>
          {positions.map((pos) => {
            const isSelected = filterPosition === pos;
            return (
              <button
                key={pos}
                onClick={() => setFilterPosition(isSelected ? "all" : pos)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-sky-500 text-slate-950 font-bold"
                    : "bg-[#061424] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#091A2E] border border-[#17365D] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, categoria ou setor..."
            className="w-full pl-9 pr-4 py-2 bg-[#061424] border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="bg-[#061424] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden max-w-[200px]"
          >
            <option value="all">Todas as Posições ({positions.length})</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="bg-[#061424] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden max-w-xs"
          >
            <option value="all">Todos os Setores ({sectors.length})</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#061424] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todos os Estados</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-[#061424] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todas as Dificuldades</option>
            <option value="Fácil">Fácil</option>
            <option value="Médio">Médio</option>
            <option value="Difícil">Difícil</option>
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTests.map((t) => {
          const testQuestions = questions.filter((q) => q.testId === t.id);
          const testAttempts = attempts.filter((a) => a.testId === t.id);

          return (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-[11px] font-semibold text-emerald-400 border border-slate-700">
                      {t.sector}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        t.difficulty === "Fácil"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : t.difficulty === "Difícil"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {t.difficulty || "Médio"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleTestStatus(t.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      t.isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {t.isActive ? "Ativo" : "Inativo"}
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 text-base leading-snug">
                    {t.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Categoria: {t.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {t.description || "Avaliação técnica de conformidade e prontidão operacional."}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{testQuestions.length} questões</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Corte: {t.passingScore}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedTestId(t.id);
                    setActiveView("test-questions");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/60 border border-slate-700 text-slate-200 hover:text-emerald-300 text-xs font-semibold transition-all"
                >
                  <Layers className="w-3.5 h-3.5" /> Gerir Perguntas ({testQuestions.length})
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                    title="Editar Teste"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                    title="Eliminar Teste"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Test */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="w-full max-w-2xl bg-[#091B30] border border-[#17365D] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] px-5 sm:px-6 py-4 bg-[#0B223D] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    {editingId ? "Editar Teste de Avaliação" : "Criar Novo Teste de Avaliação"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Estruturação de prova técnica baseada em posições, fontes e setor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                {/* Título do Teste */}
                <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold block">
                    Título do Teste / Posição Avaliada *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddPosModalOpen(true)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Cargo</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    list="test-positions-datalist"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Selecione das 52 posições ou digite o título..."
                    className="w-full p-3 rounded-xl bg-[#061424] border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                  />
                  <datalist id="test-positions-datalist">
                    {positions.map((pos) => (
                      <option key={pos} value={`Avaliação Técnica: ${pos}`} />
                    ))}
                    {positions.map((pos) => (
                      <option key={`raw-${pos}`} value={pos} />
                    ))}
                  </datalist>
                </div>

                {/* Popular position quick suggestions */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Sugestões rápidas das 52 posições:</span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                    {positions.slice(0, 16).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setTitle(`Avaliação Técnica: ${pos}`)}
                        className="px-2 py-0.5 rounded-md bg-[#0A2540] hover:bg-[#12365c] text-sky-300 border border-sky-500/30 text-[10px] font-semibold transition-colors"
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Descrição / Objetivos</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o escopo da avaliação técnica..."
                  className="w-full p-3 rounded-xl bg-[#061424] border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold block">Setor de Atividade *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddSectorModalOpen(true)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Setor</span>
                    </button>
                  </div>
                  <select
                    value={sector}
                    onChange={(e) => {
                      const newSec = e.target.value;
                      if (newSec === "__NEW_SECTOR__") {
                        setIsAddSectorModalOpen(true);
                      } else {
                        setSector(newSec);
                        const matching = SECTORS_AND_CATEGORIES.find((s) => s.sector === newSec);
                        if (matching && matching.categories.length > 0) {
                          setCategory(matching.categories[0]);
                        }
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-[#061424] border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                  >
                    {sectors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {sector && !sectors.includes(sector) && (
                      <option value={sector}>{sector}</option>
                    )}
                    <option value="__NEW_SECTOR__" className="text-sky-400 font-semibold bg-[#091B30]">
                      + Adicionar Novo Setor...
                    </option>
                  </select>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{sectors.length} setores configurados</span>
                    <button
                      type="button"
                      onClick={() => setIsSectorsManagerOpen(true)}
                      className="text-sky-400 hover:underline"
                    >
                      Gerir lista de setores
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
                      onClick={() => setIsAddCatModalOpen(true)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova Categoria</span>
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#061424] border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                  >
                    <optgroup label={`Categorias Hierárquicas Oficiais (${professionalCategories.length})`}>
                      {professionalCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={`Posições Técnicas / Especialidades (${positions.length})`}>
                      {positions.map((p) => (
                        <option key={`pos-${p}`} value={p}>
                          {p}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{professionalCategories.length} categorias configuradas</span>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesManagerOpen(true)}
                      className="text-sky-400 hover:underline font-medium"
                    >
                      Gerir categorias (remover/adicionar)
                    </button>
                  </div>
                </div>
              </div>

              {/* Dificuldade do Teste */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block">
                    Nível de Dificuldade da Avaliação *
                  </label>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {difficulty === "Fácil"
                      ? "Foco em conceitos operacionais básicos e procedimentos essenciais"
                      : difficulty === "Médio"
                      ? "Padrão de execução em campo, conformidade e boas práticas"
                      : "Cenários de alta complexidade, diagnóstico e decisões críticas"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["Fácil", "Médio", "Difícil"] as DifficultyLevel[]).map((d) => {
                    const isSelected = difficulty === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? d === "Fácil"
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40"
                              : d === "Médio"
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40"
                              : "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950/40"
                            : "bg-[#061424] border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            d === "Fácil"
                              ? "bg-emerald-400 ring-2 ring-emerald-400/30"
                              : d === "Médio"
                              ? "bg-amber-400 ring-2 ring-amber-400/30"
                              : "bg-rose-400 ring-2 ring-rose-400/30"
                          }`}
                        />
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Duração (Minutos) *</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-[#061424] border border-slate-700 text-slate-100 text-xs focus:border-sky-400 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Nota de Corte (% para Apto) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Tentativas Máximas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                  />
                  <span>Teste Ativo e Disponível para Candidatos</span>
                </label>
              </div>

              {/* Source Material & File Upload Section */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">
                          Fontes de Conhecimento e Arquivos de Base para o Teste
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Adicione manuais, normas, procedimentos ou legislação angolana que sirvam de base para gerar as perguntas.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Anexar Arquivos</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                      className="hidden"
                    />
                  </div>

                  {/* Extraction indicator */}
                  {isExtractingFile && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                      <span>Processando e extraindo texto do arquivo para fundamentar as questões da IA...</span>
                    </div>
                  )}

                  {/* Uploaded files chips */}
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {uploadedFiles.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-sky-500/40 text-sky-300 text-[11px]"
                        >
                          <FileText className="w-3 h-3 text-sky-400" />
                          <span className="font-medium max-w-[200px] truncate">{file.name}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({file.size}
                            {file.charCount ? ` • ${file.charCount.toLocaleString()} caracteres extraídos` : ""})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(file.name)}
                            className="ml-1 text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text source material textarea */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span>Conteúdo / Excertos de Regulamentos, Normas e Procedimentos</span>
                      <span className="text-slate-500 text-[10px] font-normal">
                        (Opcional - Usado pelo motor de IA para criar questões fiéis)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={sourceMaterial}
                      onChange={(e) => setSourceMaterial(e.target.value)}
                      placeholder="Cole aqui textos de manuais de Secretariado, procedimentos de Petróleo e Gás, Decretos Presidenciais, etc..."
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-hidden placeholder:text-slate-600"
                    />
                  </div>

                  {/* Auto-generate questions on create option */}
                  {!editingId && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-300 font-medium">
                        <input
                          type="checkbox"
                          checked={autoGenerateQuestions}
                          onChange={(e) => setAutoGenerateQuestions(e.target.checked)}
                          className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
                        />
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 inline" />
                        <span>Gerar automaticamente perguntas com IA a partir deste material</span>
                      </label>

                      {autoGenerateQuestions && (
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              difficulty === "Fácil"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : difficulty === "Difícil"
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            Nível {difficulty}
                          </span>
                          <span>Quantidade:</span>
                          <select
                            value={autoGenerateCount}
                            onChange={(e) => setAutoGenerateCount(Number(e.target.value))}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:outline-hidden"
                          >
                            <option value={5}>5 Perguntas</option>
                            <option value={10}>10 Perguntas</option>
                            <option value={15}>15 Perguntas</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pinned Sticky Footer */}
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-[#17365D] bg-[#071627] shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                * Campos obrigatórios para validação técnica
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-950/50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando Perguntas com IA...</span>
                    </>
                  ) : editingId ? (
                    "Guardar Alterações"
                  ) : autoGenerateQuestions ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Criar e Gerar com IA</span>
                    </>
                  ) : (
                    "Criar Teste"
                  )}
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* QUICK ADD POSITION MODAL */}
      {isAddPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#091B30] border border-[#17365D] rounded-2xl p-5 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                Adicionar Cargo / Posição
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPosModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nome do Cargo / Posição</label>
              <input
                type="text"
                value={newPosName}
                onChange={(e) => setNewPosName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPosName.trim()) {
                    e.preventDefault();
                    addPosition(newPosName.trim());
                    setTitle(`Avaliação Técnica: ${newPosName.trim()}`);
                    toast.success(`Posição "${newPosName.trim()}" adicionada com sucesso.`);
                    setNewPosName("");
                    setIsAddPosModalOpen(false);
                  }
                }}
                placeholder="Ex: Engenheiro de Produção Offshore..."
                className="w-full px-3 py-2 bg-[#061424] border border-slate-700 rounded-xl text-slate-100 focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddPosModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPosName.trim()) {
                    addPosition(newPosName.trim());
                    setTitle(`Avaliação Técnica: ${newPosName.trim()}`);
                    toast.success(`Posição "${newPosName.trim()}" adicionada com sucesso.`);
                    setNewPosName("");
                    setIsAddPosModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
              >
                Adicionar & Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#091B30] border border-[#17365D] rounded-2xl p-5 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Adicionar Categoria Profissional
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nome da Categoria</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCatName.trim()) {
                    e.preventDefault();
                    addProfessionalCategory(newCatName.trim());
                    setCategory(newCatName.trim());
                    toast.success(`Categoria "${newCatName.trim()}" adicionada com sucesso.`);
                    setNewCatName("");
                    setIsAddCatModalOpen(false);
                  }
                }}
                placeholder="Ex: Supervisor Operacional Sénior..."
                className="w-full px-3 py-2 bg-[#061424] border border-slate-700 rounded-xl text-slate-100 focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newCatName.trim()) {
                    addProfessionalCategory(newCatName.trim());
                    setCategory(newCatName.trim());
                    toast.success(`Categoria "${newCatName.trim()}" adicionada com sucesso.`);
                    setNewCatName("");
                    setIsAddCatModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
              >
                Adicionar & Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD SECTOR MODAL */}
      {isAddSectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#091B30] border border-[#17365D] rounded-2xl p-5 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Adicionar Setor de Atividade
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSectorModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nome do Setor de Atividade</label>
              <input
                type="text"
                autoFocus
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSectorName.trim()) {
                    e.preventDefault();
                    const trimmed = newSectorName.trim();
                    const ok = addSector(trimmed);
                    if (ok) {
                      setSector(trimmed);
                      toast.success(`Setor "${trimmed}" adicionado e selecionado.`);
                      setNewSectorName("");
                      setIsAddSectorModalOpen(false);
                    } else {
                      setSector(trimmed);
                      toast.info(`Setor "${trimmed}" já existe e foi selecionado.`);
                      setNewSectorName("");
                      setIsAddSectorModalOpen(false);
                    }
                  }
                }}
                placeholder="Ex: Mineração e Geologia, Telecomunicações..."
                className="w-full px-3 py-2 bg-[#061424] border border-slate-700 rounded-xl text-slate-100 focus:border-sky-400 focus:outline-hidden"
              />
            </div>

            {/* Quick suggested sectors */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Sugestões comuns para indústria angolana:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  "Telecomunicações & TI",
                  "Mineração & Geologia",
                  "Petroquímica & Refinação",
                  "Energias Renováveis",
                  "Construção Civil & Obras",
                  "Banca, Finanças & Seguros",
                  "Aviação & Transportes Aéreos",
                  "Agronegócio & Pescas",
                ]
                  .filter((sugg) => !sectors.some((s) => s.toLowerCase() === sugg.toLowerCase()))
                  .slice(0, 4)
                  .map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNewSectorName(sugg)}
                      className="px-2 py-1 rounded-md bg-[#0A2540] hover:bg-[#12365c] text-sky-300 border border-sky-500/30 text-[10px] transition-colors"
                    >
                      {sugg}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddSectorModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newSectorName.trim()) {
                    const trimmed = newSectorName.trim();
                    const ok = addSector(trimmed);
                    if (ok) {
                      setSector(trimmed);
                      toast.success(`Setor "${trimmed}" adicionado e selecionado.`);
                      setNewSectorName("");
                      setIsAddSectorModalOpen(false);
                    } else {
                      setSector(trimmed);
                      toast.info(`Setor "${trimmed}" já existe e foi selecionado.`);
                      setNewSectorName("");
                      setIsAddSectorModalOpen(false);
                    }
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
              >
                Adicionar & Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTORS MANAGER MODAL */}
      {isSectorsManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#091B30] border border-[#17365D] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Gestão de Setores de Atividade
                </h3>
                <p className="text-[11px] text-slate-400">
                  {sectors.length} setores configurados no sistema para classificação de provas técnicas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSectorsManagerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add new sector form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={managerNewSector}
                onChange={(e) => setManagerNewSector(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && managerNewSector.trim()) {
                    e.preventDefault();
                    const trimmed = managerNewSector.trim();
                    const ok = addSector(trimmed);
                    if (ok) {
                      toast.success(`Setor "${trimmed}" adicionado.`);
                      setManagerNewSector("");
                    } else {
                      toast.warning(`O setor "${trimmed}" já existe.`);
                    }
                  }
                }}
                placeholder="Digitar novo setor de atividade..."
                className="flex-1 px-3 py-2 bg-[#061424] border border-slate-700 rounded-xl text-slate-100 focus:border-sky-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (managerNewSector.trim()) {
                    const trimmed = managerNewSector.trim();
                    const ok = addSector(trimmed);
                    if (ok) {
                      toast.success(`Setor "${trimmed}" adicionado.`);
                      setManagerNewSector("");
                    } else {
                      toast.warning(`O setor "${trimmed}" já existe.`);
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Sectors list with test count */}
            <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
              {sectors.map((sec) => {
                const count = tests.filter((t) => t.sector === sec).length;
                return (
                  <div
                    key={sec}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#061424]/80 border border-[#17365D] hover:border-sky-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="font-semibold text-slate-200">{sec}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                        {count} {count === 1 ? "teste" : "testes"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deleteSector(sec);
                        toast.success(`Setor "${sec}" removido da lista.`);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remover setor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setIsSectorsManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0A2540] hover:bg-[#12365c] text-sky-300 font-semibold text-xs border border-sky-500/30 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGER MODAL */}
      {isCategoriesManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#091B30] border border-[#17365D] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Gestão de Categorias Profissionais
                </h3>
                <p className="text-[11px] text-slate-400">
                  {professionalCategories.length} categorias configuradas no sistema para avaliação de candidatos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoriesManagerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick add category inside manager */}
            <div className="flex gap-2">
              <input
                type="text"
                value={managerNewCategory}
                onChange={(e) => setManagerNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && managerNewCategory.trim()) {
                    e.preventDefault();
                    const trimmed = managerNewCategory.trim();
                    const ok = addProfessionalCategory(trimmed);
                    if (ok) {
                      toast.success(`Categoria "${trimmed}" adicionada com sucesso.`);
                      setManagerNewCategory("");
                    } else {
                      toast.warning(`A categoria "${trimmed}" já existe.`);
                    }
                  }
                }}
                placeholder="Adicionar nova categoria profissional..."
                className="flex-1 px-3 py-2 bg-[#061424] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (managerNewCategory.trim()) {
                    const trimmed = managerNewCategory.trim();
                    const ok = addProfessionalCategory(trimmed);
                    if (ok) {
                      toast.success(`Categoria "${trimmed}" adicionada com sucesso.`);
                      setManagerNewCategory("");
                    } else {
                      toast.warning(`A categoria "${trimmed}" já existe.`);
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Search filter for categories */}
            <div>
              <input
                type="text"
                value={categoriesSearch}
                onChange={(e) => setCategoriesSearch(e.target.value)}
                placeholder="Pesquisar categoria na lista..."
                className="w-full px-3 py-1.5 bg-[#061424]/80 border border-slate-700/60 rounded-lg text-slate-200 text-xs placeholder-slate-500 focus:border-indigo-400 focus:outline-hidden"
              />
            </div>

            {/* Categories list with test count and remove button */}
            <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
              {professionalCategories
                .filter((cat) =>
                  categoriesSearch
                    ? cat.toLowerCase().includes(categoriesSearch.toLowerCase())
                    : true
                )
                .map((cat) => {
                  const count = tests.filter((t) => t.category === cat).length;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#061424]/80 border border-[#17365D] hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="font-semibold text-slate-200">{cat}</span>
                        {count > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            {count} {count === 1 ? "teste" : "testes"}
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
                        title="Remover categoria profissional"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              {professionalCategories.length === 0 && (
                <p className="text-center text-slate-400 py-4">Nenhuma categoria cadastrada.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setIsCategoriesManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0A2540] hover:bg-[#12365c] text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POSITIONS AND ROLES MANAGER MODAL */}
      {isPositionsManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#091B30] border border-[#17365D] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#17365D] pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Gestão de Cargos e Posições Avaliadas
                </h3>
                <p className="text-[11px] text-slate-400">
                  Adicione, pesquise ou remova cargos oficiais da lista de testes técnicos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPositionsManagerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick add position inline */}
            <div className="flex gap-2">
              <input
                type="text"
                value={managerNewPosition}
                onChange={(e) => setManagerNewPosition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && managerNewPosition.trim()) {
                    e.preventDefault();
                    const trimmed = managerNewPosition.trim();
                    const ok = addPosition(trimmed);
                    if (ok) {
                      toast.success(`Cargo "${trimmed}" adicionado com sucesso.`);
                      setManagerNewPosition("");
                    } else {
                      toast.warning(`O cargo "${trimmed}" já existe.`);
                    }
                  }
                }}
                placeholder="Adicionar novo cargo / função..."
                className="flex-1 px-3 py-2 bg-[#061424] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (managerNewPosition.trim()) {
                    const trimmed = managerNewPosition.trim();
                    const ok = addPosition(trimmed);
                    if (ok) {
                      toast.success(`Cargo "${trimmed}" adicionado com sucesso.`);
                      setManagerNewPosition("");
                    } else {
                      toast.warning(`O cargo "${trimmed}" já existe.`);
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Filter */}
            <div>
              <input
                type="text"
                value={positionsSearch}
                onChange={(e) => setPositionsSearch(e.target.value)}
                placeholder="Pesquisar cargo na lista..."
                className="w-full px-3 py-1.5 bg-[#061424]/80 border border-slate-700/60 rounded-lg text-slate-200 text-xs placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
              {positions
                .filter((pos) =>
                  positionsSearch
                    ? pos.toLowerCase().includes(positionsSearch.toLowerCase())
                    : true
                )
                .map((pos) => {
                  const count = tests.filter((t) => t.title.toLowerCase().includes(pos.toLowerCase())).length;
                  return (
                    <div
                      key={pos}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#061424]/80 border border-[#17365D] hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="font-semibold text-slate-200">{pos}</span>
                        {count > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            {count} {count === 1 ? "teste" : "testes"}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          deletePosition(pos);
                          toast.success(`Cargo "${pos}" removido com sucesso.`);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remover cargo da lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              {positions.length === 0 && (
                <p className="text-center text-slate-400 py-4">Nenhum cargo cadastrado.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setIsPositionsManagerOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0A2540] hover:bg-[#12365c] text-amber-300 font-semibold text-xs border border-amber-500/30 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST DELETION CONFIRMATION MODAL */}
      {testToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#091B30] border border-[#17365D] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-[#17365D] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Eliminar Teste</h3>
                  <p className="text-[11px] text-slate-400">Confirmação de exclusão do teste</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-1">
              <div className="p-3 rounded-xl bg-[#061424] border border-[#17365D] space-y-1">
                <p className="text-slate-200 font-semibold text-xs">
                  {testToDelete.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  Setor: <b className="text-slate-300">{testToDelete.sector}</b> • Categoria: <b className="text-slate-300">{testToDelete.category}</b>
                </p>
                <p className="text-[11px] text-slate-400">
                  Questões associadas: <b className="text-amber-400">{questions.filter((q) => q.testId === testToDelete.id).length}</b>
                </p>
              </div>

              {attempts.filter((a) => a.testId === testToDelete.id).length > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    Histórico de Avaliações Registado
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Este teste possui <b>{attempts.filter((a) => a.testId === testToDelete.id).length} tentativa(s)/resultado(s)</b> de candidatos registados.
                  </p>
                  <p className="text-[11px] text-amber-200/70">
                    Você pode eliminar definitivamente o teste e todo o histórico associado, ou apenas desativá-lo para impedir novos acessos.
                  </p>
                </div>
              ) : (
                <p className="text-slate-300 text-xs leading-relaxed">
                  Tem a certeza que deseja eliminar este teste e todas as suas perguntas associadas? Esta ação não pode ser desfeita.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-[#17365D]">
              <button
                type="button"
                onClick={() => setTestToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>

              {attempts.filter((a) => a.testId === testToDelete.id).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    updateTest(testToDelete.id, { isActive: false });
                    toast.info(`O teste "${testToDelete.title}" foi desativado.`);
                    setTestToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-semibold transition-colors"
                >
                  Apenas Desativar
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const res = deleteTest(testToDelete.id, true);
                  if (res.success) {
                    toast.success(res.message);
                  } else {
                    toast.error(res.message);
                  }
                  setTestToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {attempts.filter((a) => a.testId === testToDelete.id).length > 0
                  ? "Excluir Teste e Histórico"
                  : "Excluir Teste"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
