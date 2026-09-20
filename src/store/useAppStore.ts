import { create } from "zustand";
import {
  Candidate,
  Test,
  Question,
  TestAttempt,
  Result,
  AiReport,
  UserSession,
  Answer,
  SecurityEvent,
  RetestAuthorization,
  DEFAULT_POSITIONS,
  DEFAULT_PROFESSIONAL_CATEGORIES,
  DEFAULT_SECTORS,
} from "../types";
import {
  SEED_ADMIN,
  SEED_CANDIDATES,
  SEED_TESTS,
  SEED_QUESTIONS,
  SEED_ATTEMPTS,
  SEED_RESULTS,
  SEED_AI_REPORTS,
} from "../data/seedData";

interface AppState {
  // Auth
  currentUser: UserSession | null;
  adminPassword?: string;
  activeView:
    | "login"
    | "dashboard"
    | "candidates"
    | "tests"
    | "test-questions"
    | "results"
    | "reports"
    | "candidate-portal"
    | "test-taking";
  selectedTestId: string | null;
  selectedAttemptId: string | null;
  currentAttempt: TestAttempt | null;
  latestFinishedResultId: string | null;
  setLatestFinishedResultId: (id: string | null) => void;

  // Data Collections
  candidates: Candidate[];
  tests: Test[];
  questions: Question[];
  attempts: TestAttempt[];
  results: Result[];
  aiReports: Record<string, AiReport>;

  // Setores, Posições e Categorias Profissionais Oficiais (configuráveis)
  sectors: string[];
  addSector: (sector: string) => boolean;
  deleteSector: (sector: string) => void;
  positions: string[];
  addPosition: (pos: string) => boolean;
  deletePosition: (pos: string) => void;
  professionalCategories: string[];
  addProfessionalCategory: (cat: string) => boolean;
  deleteProfessionalCategory: (cat: string) => void;
  clearAllExistingData: () => void;

  // Security Monitoring Configuration
  maxSecurityWarnings: number;

  // Actions
  loginAdmin: (username: string, password: string) => boolean;
  loginCandidate: (documentNumber: string, password: string) => boolean;
  logout: () => void;
  resetAdminPassword: (oldPass: string, newPass: string) => boolean;
  setActiveView: (
    view:
      | "login"
      | "dashboard"
      | "candidates"
      | "tests"
      | "test-questions"
      | "results"
      | "reports"
      | "candidate-portal"
      | "test-taking"
  ) => void;
  setSelectedTestId: (id: string | null) => void;
  setSelectedAttemptId: (id: string | null) => void;

  // Candidates CRUD
  addCandidate: (candidate: Omit<Candidate, "id" | "createdAt" | "updatedAt">) => void;
  updateCandidate: (id: string, data: Partial<Candidate>) => void;
  deleteCandidate: (id: string, force?: boolean) => { success: boolean; message: string };
  toggleCandidateStatus: (id: string) => void;
  assignTestsToCandidate: (candidateId: string, testIds: string[]) => void;

  // Tests CRUD
  addTest: (test: Omit<Test, "id" | "createdAt" | "updatedAt">) => Test;
  updateTest: (id: string, data: Partial<Test>) => void;
  deleteTest: (id: string, force?: boolean) => { success: boolean; message: string };
  toggleTestStatus: (id: string) => void;

  // Questions CRUD
  addQuestion: (question: Omit<Question, "id">) => void;
  updateQuestion: (id: string, data: Partial<Question>) => void;
  deleteQuestion: (id: string) => { success: boolean; message: string };
  reorderQuestions: (testId: string, orderedIds: string[]) => void;
  addBulkQuestions: (testId: string, questions: Partial<Question>[]) => void;

  // Test Taking & Integrity
  startAttempt: (testId: string, candidateId: string) => TestAttempt;
  saveAnswer: (questionId: string, answer: Partial<Answer>) => void;
  recordSecurityEvent: (eventType: SecurityEvent["eventType"], description: string) => number;
  submitAttempt: (attemptId: string, reason?: string) => Result;

  // Grading & Results
  updateAnswerManualScore: (
    attemptId: string,
    questionId: string,
    score: number,
    feedback?: string
  ) => void;
  updateResultStatus: (resultId: string, status: Result["status"], notes?: string) => void;
  saveAiReport: (report: AiReport) => void;

  // Single-Attempt Enforcement & Retest Authorization
  authorizedRetests: Record<string, RetestAuthorization>;
  authorizeRetest: (candidateId: string, testId: string, notes?: string) => void;
  revokeRetestAuthorization: (candidateId: string, testId: string) => void;
  isCandidateAllowedToTakeTest: (
    candidateId: string,
    testId: string
  ) => { allowed: boolean; reason: string; isRetestAuthorized?: boolean };
}

const STORAGE_KEY = "espacie_services_store_v7";
const SESSION_KEY = "espacie_services_session_v7";

interface SavedSession {
  currentUser: UserSession | null;
  activeView: AppState["activeView"];
  selectedTestId: string | null;
  selectedAttemptId: string | null;
  currentAttempt: TestAttempt | null;
  latestFinishedResultId: string | null;
}

function loadInitialState() {
  let rawData: string | null = null;
  let rawSession: string | null = null;
  try {
    rawData = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("espacie_services_store_v6");
    rawSession = localStorage.getItem(SESSION_KEY);
  } catch (e) {
    console.warn("Could not read localStorage", e);
  }

  let candidates: Candidate[] = [];
  let tests: Test[] = [...SEED_TESTS];
  let questions: Question[] = [...SEED_QUESTIONS];
  let attempts: TestAttempt[] = [];
  let results: Result[] = [];
  let aiReports: Record<string, AiReport> = {};
  let authorizedRetests: Record<string, RetestAuthorization> = {};
  let sectors: string[] = [...DEFAULT_SECTORS];
  let positions: string[] = [...DEFAULT_POSITIONS];
  let professionalCategories: string[] = [...DEFAULT_PROFESSIONAL_CATEGORIES];
  let adminPassword = "admin123";

  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed.candidates)) candidates = parsed.candidates;
      if (Array.isArray(parsed.tests)) tests = parsed.tests;
      if (Array.isArray(parsed.questions)) questions = parsed.questions;
      if (Array.isArray(parsed.attempts)) attempts = parsed.attempts;
      if (Array.isArray(parsed.results)) results = parsed.results;
      if (parsed.aiReports && typeof parsed.aiReports === "object") aiReports = parsed.aiReports;
      if (parsed.authorizedRetests && typeof parsed.authorizedRetests === "object") authorizedRetests = parsed.authorizedRetests;
      if (Array.isArray(parsed.sectors)) sectors = parsed.sectors;
      if (Array.isArray(parsed.positions)) positions = parsed.positions;
      if (Array.isArray(parsed.professionalCategories)) professionalCategories = parsed.professionalCategories;
      if (typeof parsed.adminPassword === "string" && parsed.adminPassword.length >= 6) {
        adminPassword = parsed.adminPassword;
      }
    } catch (e) {
      console.warn("Could not parse data from localStorage", e);
    }
  }

  // Load active session (preserves user state on page refresh or APK app reopen)
  let currentUser: UserSession | null = null;
  let activeView: AppState["activeView"] = "login";
  let selectedTestId: string | null = null;
  let selectedAttemptId: string | null = null;
  let currentAttempt: TestAttempt | null = null;
  let latestFinishedResultId: string | null = null;

  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession);
      if (parsed && parsed.currentUser) {
        if (parsed.currentUser.role === "admin") {
          currentUser = {
            id: SEED_ADMIN.id,
            username: "admin",
            fullName: "Administrador Geral",
            email: "admin@espacie.co.ao",
            role: "admin",
          };
        } else {
          // If candidate, refresh candidateProfile if found in latest candidates
          const foundCand = candidates.find((c) => c.id === parsed.currentUser.id);
          currentUser = {
            ...parsed.currentUser,
            candidateProfile: foundCand || parsed.currentUser.candidateProfile,
          };
        }

        activeView =
          parsed.activeView || (currentUser.role === "admin" ? "dashboard" : "candidate-portal");
        selectedTestId = parsed.selectedTestId || null;
        selectedAttemptId = parsed.selectedAttemptId || null;
        currentAttempt = parsed.currentAttempt || null;
        latestFinishedResultId = parsed.latestFinishedResultId || null;
      }
    } catch (e) {
      console.warn("Could not parse session from localStorage", e);
    }
  }

  return {
    candidates,
    tests,
    questions,
    attempts,
    results,
    aiReports,
    authorizedRetests,
    sectors,
    positions,
    professionalCategories,
    adminPassword,
    currentUser,
    activeView,
    selectedTestId,
    selectedAttemptId,
    currentAttempt,
    latestFinishedResultId,
  };
}

const init = loadInitialState();

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: init.currentUser,
  activeView: init.activeView,
  adminPassword: init.adminPassword,
  selectedTestId: init.selectedTestId,
  selectedAttemptId: init.selectedAttemptId,
  currentAttempt: init.currentAttempt,
  latestFinishedResultId: init.latestFinishedResultId,
  setLatestFinishedResultId: (id) => {
    set({ latestFinishedResultId: id });
    persistSession({ latestFinishedResultId: id });
  },

  candidates: init.candidates,
  tests: init.tests,
  questions: init.questions,
  attempts: init.attempts,
  results: init.results,
  aiReports: init.aiReports,
  authorizedRetests: init.authorizedRetests || {},

  // Setores, Posições e Categorias dinâmicas
  sectors: init.sectors,
  positions: init.positions,
  professionalCategories: init.professionalCategories,

  addSector: (newSec: string) => {
    const trimmed = newSec.trim();
    if (!trimmed) return false;
    const current = get().sectors;
    if (current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return false; // Já existe
    }
    const updated = [trimmed, ...current];
    set({ sectors: updated });
    persistData({ sectors: updated });
    return true;
  },

  deleteSector: (secToDelete: string) => {
    const updated = get().sectors.filter((s) => s !== secToDelete);
    set({ sectors: updated });
    persistData({ sectors: updated });
  },

  addPosition: (newPos: string) => {
    const trimmed = newPos.trim();
    if (!trimmed) return false;
    const current = get().positions;
    if (current.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      return false; // Já existe
    }
    const updated = [trimmed, ...current];
    set({ positions: updated });
    persistData({ positions: updated });
    return true;
  },

  deletePosition: (posToDelete: string) => {
    const updated = get().positions.filter((p) => p !== posToDelete);
    set({ positions: updated });
    persistData({ positions: updated });
  },

  addProfessionalCategory: (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return false;
    const current = get().professionalCategories;
    if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false; // Já existe
    }
    const updated = [trimmed, ...current];
    set({ professionalCategories: updated });
    persistData({ professionalCategories: updated });
    return true;
  },

  deleteProfessionalCategory: (catToDelete: string) => {
    const updated = get().professionalCategories.filter((c) => c !== catToDelete);
    set({ professionalCategories: updated });
    persistData({ professionalCategories: updated });
  },

  clearAllExistingData: () => {
    set({
      candidates: [],
      tests: [],
      questions: [],
      attempts: [],
      results: [],
      aiReports: {},
      authorizedRetests: {},
      selectedTestId: null,
      selectedAttemptId: null,
    });
    persistData({
      candidates: [],
      tests: [],
      questions: [],
      attempts: [],
      results: [],
      aiReports: {},
      authorizedRetests: {},
    });
  },

  maxSecurityWarnings: 3,

  loginAdmin: (username, password) => {
    const validPass = get().adminPassword || "admin123";
    if (username.trim().toLowerCase() === "admin" && password === validPass) {
      const user: UserSession = {
        id: SEED_ADMIN.id,
        username: "admin",
        fullName: "Administrador Geral",
        email: "admin@espacie.co.ao",
        role: "admin",
      };
      set({
        currentUser: user,
        activeView: "dashboard",
      });
      persistSession({
        currentUser: user,
        activeView: "dashboard",
      });
      return true;
    }
    return false;
  },

  loginCandidate: (docNumber, password) => {
    const docClean = docNumber.trim().toUpperCase();
    const candidate = get().candidates.find(
      (c) =>
        c.documentNumber.trim().toUpperCase() === docClean &&
        (c.accessPassword || "candidato123") === password.trim()
    );

    if (candidate) {
      if (!candidate.isActive) {
        return false;
      }
      const user: UserSession = {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        role: "candidate",
        candidateProfile: candidate,
      };
      set({
        currentUser: user,
        activeView: "candidate-portal",
      });
      persistSession({
        currentUser: user,
        activeView: "candidate-portal",
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({
      currentUser: null,
      activeView: "login",
      currentAttempt: null,
      selectedTestId: null,
      selectedAttemptId: null,
      latestFinishedResultId: null,
    });
    persistSession({
      currentUser: null,
      activeView: "login",
      currentAttempt: null,
      selectedTestId: null,
      selectedAttemptId: null,
      latestFinishedResultId: null,
    });
  },

  resetAdminPassword: (oldPass, newPass) => {
    const currentPass = get().adminPassword || "admin123";
    if (oldPass === currentPass && newPass.length >= 6) {
      set({ adminPassword: newPass });
      persistData({ adminPassword: newPass });
      return true;
    }
    return false;
  },

  setActiveView: (view) => {
    set({ activeView: view });
    persistSession({ activeView: view });
  },
  setSelectedTestId: (id) => {
    set({ selectedTestId: id });
    persistSession({ selectedTestId: id });
  },
  setSelectedAttemptId: (id) => {
    set({ selectedAttemptId: id });
    persistSession({ selectedAttemptId: id });
  },

  // Candidates CRUD
  addCandidate: (candData) => {
    const newCand: Candidate = {
      ...candData,
      id: `cand-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newCand, ...get().candidates];
    set({ candidates: updated });
    persistData({ candidates: updated });
  },

  updateCandidate: (id, data) => {
    const updated = get().candidates.map((c) =>
      c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
    );
    const updatedUser =
      get().currentUser?.role === "candidate" && get().currentUser?.id === id
        ? {
            ...get().currentUser!,
            candidateProfile: {
              ...get().currentUser!.candidateProfile!,
              ...data,
            },
          }
        : get().currentUser;
    set({ candidates: updated, currentUser: updatedUser });
    persistData({ candidates: updated });
  },

  assignTestsToCandidate: (candidateId, testIds) => {
    const updated = get().candidates.map((c) =>
      c.id === candidateId
        ? { ...c, assignedTestIds: testIds, updatedAt: new Date().toISOString() }
        : c
    );
    const updatedUser =
      get().currentUser?.role === "candidate" && get().currentUser?.id === candidateId
        ? {
            ...get().currentUser!,
            candidateProfile: {
              ...get().currentUser!.candidateProfile!,
              assignedTestIds: testIds,
            },
          }
        : get().currentUser;
    set({ candidates: updated, currentUser: updatedUser });
    persistData({ candidates: updated });
  },

  deleteCandidate: (id, force = false) => {
    const hasAttempts = get().attempts.some((a) => a.candidateId === id);
    if (hasAttempts && !force) {
      // Soft disable instead
      const updated = get().candidates.map((c) =>
        c.id === id ? { ...c, isActive: false, updatedAt: new Date().toISOString() } : c
      );
      set({ candidates: updated });
      persistData({ candidates: updated });
      return {
        success: false,
        message:
          "Candidato possui histórico de avaliações/tentativas. Para removê-lo definitivamente, confirme a exclusão de todo o histórico associado.",
      };
    }
    const updatedCandidates = get().candidates.filter((c) => c.id !== id);
    const updatedAttempts = force ? get().attempts.filter((a) => a.candidateId !== id) : get().attempts;
    const updatedResults = force ? get().results.filter((r) => r.candidateId !== id) : get().results;
    set({ candidates: updatedCandidates, attempts: updatedAttempts, results: updatedResults });
    persistData({ candidates: updatedCandidates, attempts: updatedAttempts, results: updatedResults });
    return { success: true, message: "Candidato removido com sucesso." };
  },

  toggleCandidateStatus: (id) => {
    const updated = get().candidates.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive, updatedAt: new Date().toISOString() } : c
    );
    set({ candidates: updated });
    persistData({ candidates: updated });
  },

  // Tests CRUD
  addTest: (testData) => {
    const newTest: Test = {
      ...testData,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTest, ...get().tests];
    set({ tests: updated });
    persistData({ tests: updated });
    return newTest;
  },

  updateTest: (id, data) => {
    const updated = get().tests.map((t) =>
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    );
    set({ tests: updated });
    persistData({ tests: updated });
  },

  deleteTest: (id, force = false) => {
    const hasAttempts = get().attempts.some((a) => a.testId === id);
    if (hasAttempts && !force) {
      return {
        success: false,
        message:
          "Este teste possui resultados e tentativas registradas. Para removê-lo definitivamente, confirme a exclusão de todo o histórico associado.",
      };
    }
    const updatedTests = get().tests.filter((t) => t.id !== id);
    const updatedQuestions = get().questions.filter((q) => q.testId !== id);
    const updatedAttempts = force ? get().attempts.filter((a) => a.testId !== id) : get().attempts;
    const updatedResults = force ? get().results.filter((r) => r.testId !== id) : get().results;
    const updatedCandidates = get().candidates.map((c) => ({
      ...c,
      assignedTestIds: c.assignedTestIds?.filter((tid) => tid !== id) || [],
    }));

    const resetSelected = get().selectedTestId === id ? null : get().selectedTestId;

    set({
      tests: updatedTests,
      questions: updatedQuestions,
      attempts: updatedAttempts,
      results: updatedResults,
      candidates: updatedCandidates,
      selectedTestId: resetSelected,
    });
    persistData({
      tests: updatedTests,
      questions: updatedQuestions,
      attempts: updatedAttempts,
      results: updatedResults,
      candidates: updatedCandidates,
    });
    return { success: true, message: "Teste e todas as questões associadas foram excluídos com sucesso." };
  },

  toggleTestStatus: (id) => {
    const updated = get().tests.map((t) =>
      t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t
    );
    set({ tests: updated });
    persistData({ tests: updated });
  },

  // Questions CRUD
  addQuestion: (qData) => {
    const newQ: Question = {
      ...qData,
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const updated = [...get().questions, newQ];
    set({ questions: updated });
    persistData({ questions: updated });
  },

  updateQuestion: (id, data) => {
    const updated = get().questions.map((q) => (q.id === id ? { ...q, ...data } : q));
    set({ questions: updated });
    persistData({ questions: updated });
  },

  deleteQuestion: (id) => {
    const updated = get().questions.filter((q) => q.id !== id);
    set({ questions: updated });
    persistData({ questions: updated });
    return { success: true, message: "Questão excluída com sucesso." };
  },

  reorderQuestions: (testId, orderedIds) => {
    const updated = get().questions.map((q) => {
      if (q.testId === testId) {
        const newOrder = orderedIds.indexOf(q.id) + 1;
        return newOrder > 0 ? { ...q, order: newOrder } : q;
      }
      return q;
    });
    set({ questions: updated });
    persistData({ questions: updated });
  },

  addBulkQuestions: (testId, bulk) => {
    const currentMaxOrder = get()
      .questions.filter((q) => q.testId === testId)
      .reduce((max, q) => Math.max(max, q.order), 0);

    const createdList: Question[] = bulk.map((b, idx) => ({
      id: b.id || `q-${Date.now()}-${idx}`,
      testId,
      statement: b.statement || "Questão gerada por IA",
      type: b.type || "multiple_choice",
      points: b.points || 10,
      difficulty: b.difficulty || "Médio",
      order: currentMaxOrder + idx + 1,
      options: b.options || [],
      correctAnswer: b.correctAnswer,
      evaluationCriteria: b.evaluationCriteria,
      imageUrl: b.imageUrl,
      legalSource: b.legalSource,
      verificationDate: b.verificationDate,
    }));

    const updated = [...get().questions, ...createdList];
    set({ questions: updated });
    persistData({ questions: updated });
  },

  // Test Taking
  startAttempt: (testId, candidateId) => {
    const test = get().tests.find((t) => t.id === testId);
    if (!test) throw new Error("Teste não encontrado");

    const testQuestions = get().questions.filter((q) => q.testId === testId);
    if (testQuestions.length === 0) {
      throw new Error("Este teste ainda não possui perguntas publicadas pela administração.");
    }

    const check = get().isCandidateAllowedToTakeTest(candidateId, testId);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    // If retest was authorized, consume it for this new attempt
    const retestKey = `${candidateId}_${testId}`;
    if (get().authorizedRetests[retestKey]) {
      const updatedAuth = { ...get().authorizedRetests };
      delete updatedAuth[retestKey];
      set({ authorizedRetests: updatedAuth });
      persistData({ authorizedRetests: updatedAuth });
    }

    const previousAttempts = get().attempts.filter(
      (a) => a.testId === testId && a.candidateId === candidateId
    );
    const newAttempt: TestAttempt = {
      id: `att-${Date.now()}`,
      testId,
      candidateId,
      attemptNumber: previousAttempts.length + 1,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 0,
      score: 0,
      maxScore: 0,
      percentage: 0,
      isApproved: false,
      answers: {},
      securityEvents: [],
    };

    const updated = [newAttempt, ...get().attempts];
    set({
      attempts: updated,
      currentAttempt: newAttempt,
      activeView: "test-taking",
    });
    persistData({ attempts: updated });
    persistSession({
      currentAttempt: newAttempt,
      activeView: "test-taking",
      selectedTestId: testId,
    });
    return newAttempt;
  },

  saveAnswer: (questionId, ans) => {
    const current = get().currentAttempt;
    if (!current) return;

    const existingAns = current.answers[questionId] || { questionId };
    const updatedAns: Answer = {
      ...existingAns,
      ...ans,
      questionId,
    };

    const updatedAttempt: TestAttempt = {
      ...current,
      answers: {
        ...current.answers,
        [questionId]: updatedAns,
      },
    };

    const updatedAttempts = get().attempts.map((a) =>
      a.id === current.id ? updatedAttempt : a
    );

    set({
      currentAttempt: updatedAttempt,
      attempts: updatedAttempts,
    });
    persistData({ attempts: updatedAttempts });
    persistSession({ currentAttempt: updatedAttempt });
  },

  recordSecurityEvent: (eventType, description) => {
    const current = get().currentAttempt;
    if (!current) return 0;

    const newEvent: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      attemptId: current.id,
      eventType,
      description,
      timestamp: new Date().toISOString(),
    };

    const events = [...current.securityEvents, newEvent];
    const updatedAttempt: TestAttempt = {
      ...current,
      securityEvents: events,
    };

    const updatedAttempts = get().attempts.map((a) =>
      a.id === current.id ? updatedAttempt : a
    );

    set({
      currentAttempt: updatedAttempt,
      attempts: updatedAttempts,
    });
    persistData({ attempts: updatedAttempts });

    return events.length;
  },

  submitAttempt: (attemptId, reason) => {
    const attempt = get().attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Tentativa não encontrada");

    const test = get().tests.find((t) => t.id === attempt.testId);
    if (!test) throw new Error("Teste não encontrado");

    const testQuestions = get().questions.filter((q) => q.testId === test.id);

    let totalEarned = 0;
    let maxScore = 0;
    const evaluatedAnswers: Record<string, Answer> = { ...attempt.answers };

    testQuestions.forEach((q) => {
      maxScore += q.points;
      const ans = evaluatedAnswers[q.id];

      if (q.type === "multiple_choice" || q.type === "true_false") {
        const isCorrect = ans && ans.selectedOptionId === q.correctAnswer;
        const awarded = isCorrect ? q.points : 0;
        totalEarned += awarded;
        evaluatedAnswers[q.id] = {
          ...(ans || { questionId: q.id }),
          isCorrect: !!isCorrect,
          awardedScore: awarded,
        };
      } else if (q.type === "essay") {
        // If already graded manually or by AI, keep; otherwise mark pending review
        if (ans && ans.awardedScore !== undefined && ans.awardedScore > 0) {
          totalEarned += ans.awardedScore;
        }
      } else if (q.type === "visual_drawing") {
        if (ans && ans.drawingData) {
          // award provisional 70% if drawn, pending examiner confirmation
          const prov = Math.round(q.points * 0.75 * 10) / 10;
          totalEarned += prov;
          evaluatedAnswers[q.id] = {
            ...ans,
            awardedScore: prov,
            isCorrect: true,
          };
        }
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalEarned / maxScore) * 1000) / 10 : 0;
    const isApproved = percentage >= test.passingScore;

    const completedAt = new Date().toISOString();
    const timeSpent = Math.max(
      Math.floor((new Date(completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000),
      60
    );

    const completedAttempt: TestAttempt = {
      ...attempt,
      status:
        reason === "security_limit"
          ? "terminated_security"
          : reason === "timeout"
          ? "terminated_timeout"
          : "completed",
      completedAt,
      timeSpentSeconds: timeSpent,
      score: Math.round(totalEarned * 10) / 10,
      maxScore,
      percentage,
      isApproved,
      answers: evaluatedAnswers,
    };

    const newResult: Result = {
      id: `res-${Date.now()}`,
      attemptId: attempt.id,
      candidateId: attempt.candidateId,
      testId: test.id,
      totalScore: Math.round(totalEarned * 10) / 10,
      maxScore,
      percentage,
      classification: isApproved ? "Apto" : "Não Apto",
      status: "published",
      adminNotes:
        reason === "security_limit"
          ? "Tentativa encerrada preventivamente pelo monitor de integridade por excesso de saídas de janela."
          : reason === "timeout"
          ? "Tentativa encerrada automaticamente pelo término do tempo limite."
          : "Avaliação concluída pelo candidato e corrigida automaticamente.",
      publishedAt: completedAt,
    };

    const updatedAttempts = get().attempts.map((a) =>
      a.id === attempt.id ? completedAttempt : a
    );
    const updatedResults = [newResult, ...get().results.filter((r) => r.attemptId !== attempt.id)];

    set({
      attempts: updatedAttempts,
      results: updatedResults,
      currentAttempt: null,
      selectedAttemptId: attempt.id,
      latestFinishedResultId: newResult.id,
      activeView: get().currentUser?.role === "candidate" ? "candidate-portal" : "results",
    });

    persistData({ attempts: updatedAttempts, results: updatedResults });
    persistSession({
      currentAttempt: null,
      selectedAttemptId: attempt.id,
      latestFinishedResultId: newResult.id,
      activeView: get().currentUser?.role === "candidate" ? "candidate-portal" : "results",
    });
    return newResult;
  },

  updateAnswerManualScore: (attemptId, questionId, score, feedback) => {
    const attempt = get().attempts.find((a) => a.id === attemptId);
    if (!attempt) return;

    const existingAns = attempt.answers[questionId] || { questionId };
    const updatedAns: Answer = {
      ...existingAns,
      awardedScore: score,
      feedback: feedback || existingAns.feedback,
      evaluatedAt: new Date().toISOString(),
      isCorrect: score > 0,
    };

    const newAnswers = {
      ...attempt.answers,
      [questionId]: updatedAns,
    };

    // Recalculate total score
    let totalScore = 0;
    Object.values(newAnswers).forEach((ans) => {
      totalScore += ans.awardedScore || 0;
    });

    const percentage =
      attempt.maxScore > 0 ? Math.round((totalScore / attempt.maxScore) * 1000) / 10 : 0;
    const test = get().tests.find((t) => t.id === attempt.testId);
    const passing = test ? test.passingScore : 70;
    const isApproved = percentage >= passing;

    const updatedAttempt: TestAttempt = {
      ...attempt,
      answers: newAnswers,
      score: Math.round(totalScore * 10) / 10,
      percentage,
      isApproved,
    };

    const updatedAttempts = get().attempts.map((a) =>
      a.id === attemptId ? updatedAttempt : a
    );

    // Update Result as well
    const updatedResults = get().results.map((r) =>
      r.attemptId === attemptId
        ? {
            ...r,
            totalScore: Math.round(totalScore * 10) / 10,
            percentage,
            classification: (isApproved ? "Apto" : "Não Apto") as "Apto" | "Não Apto",
          }
        : r
    );

    set({ attempts: updatedAttempts, results: updatedResults });
    persistData({ attempts: updatedAttempts, results: updatedResults });
  },

  updateResultStatus: (resultId, status, notes) => {
    const updated = get().results.map((r) =>
      r.id === resultId
        ? {
            ...r,
            status,
            adminNotes: notes !== undefined ? notes : r.adminNotes,
          }
        : r
    );
    set({ results: updated });
    persistData({ results: updated });
  },

  saveAiReport: (report) => {
    const updated = {
      ...get().aiReports,
      [report.attemptId]: report,
    };
    set({ aiReports: updated });
    persistData({ aiReports: updated });
  },

  authorizeRetest: (candidateId, testId, notes) => {
    const retestKey = `${candidateId}_${testId}`;
    const newAuth: RetestAuthorization = {
      candidateId,
      testId,
      authorizedAt: new Date().toISOString(),
      authorizedBy: get().currentUser?.fullName || "Administrador Geral",
      notes: notes || "Autorização de nova tentativa concedida pelo Administrador",
    };
    const updated = {
      ...get().authorizedRetests,
      [retestKey]: newAuth,
    };
    set({ authorizedRetests: updated });
    persistData({ authorizedRetests: updated });
  },

  revokeRetestAuthorization: (candidateId, testId) => {
    const retestKey = `${candidateId}_${testId}`;
    const updated = { ...get().authorizedRetests };
    delete updated[retestKey];
    set({ authorizedRetests: updated });
    persistData({ authorizedRetests: updated });
  },

  isCandidateAllowedToTakeTest: (candidateId, testId) => {
    const candidate = get().candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      return { allowed: false, reason: "Perfil do candidato não encontrado." };
    }

    // 1. Candidate must be active
    if (!candidate.isActive) {
      return {
        allowed: false,
        reason: "O seu cadastro de candidato encontra-se inativo. Contacte a coordenação.",
      };
    }

    // 2. Candidate must be previously authorized for this specific test
    const assigned = candidate.assignedTestIds || [];
    if (!assigned.includes(testId)) {
      return {
        allowed: false,
        reason: "Acesso não autorizado: você não possui autorização prévia da coordenação para realizar este teste.",
      };
    }

    // 3. Test must exist and be active
    const test = get().tests.find((t) => t.id === testId);
    if (!test || !test.isActive) {
      return {
        allowed: false,
        reason: "Este teste não está disponível no momento.",
      };
    }

    // 4. Single-attempt rule
    const completedAttempts = get().attempts.filter(
      (a) =>
        a.candidateId === candidateId &&
        a.testId === testId &&
        (a.status === "completed" ||
          a.status === "terminated_security" ||
          a.status === "terminated_timeout")
    );

    const retestKey = `${candidateId}_${testId}`;
    const isRetestAuthorized = !!get().authorizedRetests[retestKey];

    // If no completed attempt yet, allowed (1st attempt)
    if (completedAttempts.length === 0) {
      return { allowed: true, reason: "Tentativa autorizada pela coordenação." };
    }

    // If candidate has completed attempt, check if retest was explicitly authorized
    if (isRetestAuthorized) {
      return {
        allowed: true,
        reason: "Nova tentativa de repetição autorizada pelo Administrador.",
        isRetestAuthorized: true,
      };
    }

    return {
      allowed: false,
      reason:
        "Cada candidato pode realizar o teste apenas uma vez. Para repetir o teste, é necessária autorização prévia do Administrador.",
      isRetestAuthorized: false,
    };
  },
}));

function persistData(data: Partial<{
  candidates: Candidate[];
  tests: Test[];
  questions: Question[];
  attempts: TestAttempt[];
  results: Result[];
  aiReports: Record<string, AiReport>;
  authorizedRetests: Record<string, RetestAuthorization>;
  sectors: string[];
  positions: string[];
  professionalCategories: string[];
  adminPassword?: string;
}>) {
  try {
    const existingRaw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem("espacie_services_store_v6");
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...existing,
        ...data,
      })
    );
  } catch (e) {
    console.warn("Error saving data to localStorage", e);
  }
}

function persistSession(session: Partial<SavedSession>) {
  try {
    const existingRaw = localStorage.getItem(SESSION_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...existing,
        ...session,
      })
    );
  } catch (e) {
    console.warn("Error saving session to localStorage", e);
  }
}

// Multi-tab and APK / WebView cross-view real-time synchronization
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === SESSION_KEY) {
      try {
        const refreshed = loadInitialState();
        useAppStore.setState({
          candidates: refreshed.candidates,
          tests: refreshed.tests,
          questions: refreshed.questions,
          attempts: refreshed.attempts,
          results: refreshed.results,
          aiReports: refreshed.aiReports,
          authorizedRetests: refreshed.authorizedRetests,
          sectors: refreshed.sectors,
          positions: refreshed.positions,
          professionalCategories: refreshed.professionalCategories,
          adminPassword: refreshed.adminPassword,
          ...(e.key === SESSION_KEY
            ? {
                currentUser: refreshed.currentUser,
                activeView: refreshed.activeView,
                selectedTestId: refreshed.selectedTestId,
                selectedAttemptId: refreshed.selectedAttemptId,
                currentAttempt: refreshed.currentAttempt,
                latestFinishedResultId: refreshed.latestFinishedResultId,
              }
            : {}),
        });
      } catch (err) {
        console.warn("Error synchronizing storage state across tabs/APK", err);
      }
    }
  });
}
