export type Role = "admin" | "candidate";

// 22 Categorias Profissionais oficiais solicitadas para Espacie Services
export const DEFAULT_PROFESSIONAL_CATEGORIES: string[] = [
  "Director",
  "Gestor",
  "Gestor Adjunto",
  "Engenheiro",
  "Coordenador",
  "Líder de Equipa",
  "Supervisor",
  "Supervisor Júnior",
  "Encarregado",
  "Responsável",
  "Especialista",
  "Inspector",
  "Representante",
  "Técnico",
  "Técnico Júnior",
  "Técnico Sénior",
  "Técnico Qualificado",
  "Assistente",
  "Auxiliar",
  "Estagiário",
  "Formador (Foreman)",
  "Operador",
];

export type SeniorityLevel = string;
export const SENIORITY_LEVELS: string[] = DEFAULT_PROFESSIONAL_CATEGORIES;

// 52 Posições / Cargos oficiais solicitadas para Espacie Services
export const DEFAULT_POSITIONS: string[] = [
  "Mecânico",
  "Secretário Executivo",
  "Armazenista (Fiel de Armazém)",
  "Instrumentista",
  "Contabilista",
  "Soldador",
  "Electricista",
  "Canalizador",
  "Rigger",
  "Instrumentista e Electricista (I/E)",
  "Torneiro Mecânico",
  "Recursos Humanos",
  "Tubista",
  "Cozinheiro",
  "Especialista de Preservação",
  "Motorista",
  "HSE",
  "Operador de Grua",
  "Jardineiro",
  "Logístico",
  "Montador",
  "Administrativa",
  "Engenheiro de Contratos",
  "Empregada",
  "Rigger de Grua",
  "Operador de Torno",
  "Empregada de Mesa",
  "Caldeireiro",
  "Empregada de Limpeza",
  "Climatização (HVAC)",
  "Tecnologias de Informação (IT)",
  "Turbinas",
  "QA/QC",
  "Assistente de Cozinha",
  "Director-Geral",
  "Métodos e Processos",
  "Comprador",
  "Formador de Electricidade",
  "Trabalhador Qualificado",
  "Analista de Materiais",
  "Assistente de Limpeza",
  "QHSE",
  "Manutenção",
  "Técnico de Viagens",
  "Técnico Comercial",
  "Contabilidade",
  "QHSE Sénior",
  "Desenhador AutoCAD",
  "Segurança",
  "Coordenador de Produção",
  "Operador de Empilhador",
  "Desenhador CAD",
];

export type Sector = string;

export const DEFAULT_SECTORS: string[] = [
  "Industrial",
  "Operacional",
  "Logística",
  "Administrativo",
  "Gestão",
  "Comunicação",
  "Línguas",
  "Doméstico",
  "Social",
  "Tecnologias de Informação (IT)",
  "Saúde, Segurança e Ambiente (QHSE)",
  "Construção Civil & Montagem",
];

export const SECTORS: string[] = DEFAULT_SECTORS;

export const CATEGORIES_BY_SECTOR: Record<string, string[]> = {
  Industrial: [
    "Segurança Industrial (HSSE)",
    "Petróleo & Gás (Upstream / Downstream)",
    "Eletricidade Industrial",
    "Mecânica Industrial",
    "Soldadura e Caldeiraria",
    "Instrumentação e Automação",
    "Regras Cardeais de Segurança",
    "Manutenção Preventiva e Preditiva",
    "Espaços Confinados e Trabalho em Altura",
    "Primeiros Socorros Industriais",
    "Tubagens e Válvulas",
    "Hidráulica e Pneumática",
  ],
  Operacional: [
    "Operação de Empilhadores",
    "Rigging e Movimentação de Cargas",
    "Condução Defensiva e Pesados",
    "Operações Portuárias e Marítimas",
    "Operação de Geradores e Motores",
    "Segurança em Máquinas e Ferramentas",
    "Controle de Derrames e Contaminação",
    "Limpeza Técnica e Descontaminação",
  ],
  Logística: [
    "Gestão de Armazém e Estoques",
    "Cadeia de Suprimentos (Supply Chain)",
    "Controle de Inventário e FIFO/FEFO",
    "Embalagem, Etiquetagem e Acondicionamento",
    "Desembaraço Aduaneiro em Angola",
    "Gestão de Frotas e Roteirização",
    "Materiais Perigosos (HAZMAT)",
  ],
  Administrativo: [
    "Administração Geral",
    "Recursos Humanos e Folha de Pagamento",
    "Legislação Laboral Angolana (LGT 12/23)",
    "Contabilidade e Finanças",
    "Gestão de Documentos e Arquivo",
    "Secretariado Executivo",
    "Compras e Aquisições (Procurement)",
    "Auditoria Interna e Compliance",
  ],
  Gestão: [
    "Liderança e Gestão de Equipas",
    "Gestão de Projetos (PMI / Ágil)",
    "Gestão da Qualidade (ISO 9001)",
    "Planejamento Estratégico",
    "Gestão de Riscos Corporativos",
    "Gestão Orçamental e Custos",
    "Supervisão de Turno e Operações",
  ],
  Comunicação: [
    "Atendimento ao Cliente e Call Center",
    "Comunicação Corporativa",
    "Relações Públicas e Imprensa",
    "Resolução de Conflitos e Mediação",
    "Marketing e Redes Sociais",
  ],
  Línguas: [
    "Inglês Técnico para Petróleo & Gás",
    "Inglês Geral (Nível Básico a Avançado)",
    "Francês Técnico e Corporativo",
    "Português Empresarial e Redação Oficial",
  ],
  Doméstico: [
    "Governança e Hotelaria",
    "Higiene e Manipulação de Alimentos (HACCP)",
    "Lavandaria Industrial",
    "Cozinha e Nutrição",
  ],
  Social: [
    "Responsabilidade Social e Sustentabilidade",
    "Relações com a Comunidade Local",
    "Psicologia Organizacional",
    "Inclusão e Diversidade",
  ],
};

export const ALL_CATEGORIES = Object.values(CATEGORIES_BY_SECTOR).flat();

export const SECTORS_AND_CATEGORIES = Object.entries(CATEGORIES_BY_SECTOR).map(
  ([sector, categories]) => ({
    sector,
    categories,
  })
);

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "essay"
  | "image_based"
  | "visual_drawing";

export type DifficultyLevel = "Fácil" | "Médio" | "Difícil";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  testId: string;
  statement: string;
  type: QuestionType;
  points: number;
  difficulty: DifficultyLevel;
  order: number;
  options?: QuestionOption[];
  correctAnswer?: string; // id for option or 'true'/'false'
  evaluationCriteria?: string; // For essay questions
  imageUrl?: string;
  legalSource?: string; // Citation of official law or norm (e.g. LGT Lei 12/23)
  verificationDate?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  sector: Sector;
  category: string;
  difficulty: DifficultyLevel;
  recommendedSeniority: SeniorityLevel;
  passingScore: number; // e.g. 70
  durationMinutes: number; // e.g. 45
  maxAttempts: number; // e.g. 1
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  sourceMaterial?: string; // Text source / manual / procedure used as basis
  sourceFiles?: { name: string; size: string; content?: string }[]; // Uploaded reference files
}

export interface RetestAuthorization {
  candidateId: string;
  testId: string;
  authorizedAt: string;
  authorizedBy: string;
  notes?: string;
}

export type DocumentType = "BI" | "Passaporte";

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  documentNumber: string; // BI or Passport
  documentType: DocumentType;
  phone?: string;
  jobTitle: string;
  sector: Sector;
  seniority: SeniorityLevel;
  isActive: boolean;
  accessPassword?: string; // Credential set by admin
  assignedTestIds?: string[]; // Tests previously authorized by admin for this candidate
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  role: Role;
  candidateProfile?: Candidate;
}

export interface Answer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  drawingData?: string; // Data URL of canvas
  awardedScore?: number;
  isCorrect?: boolean;
  feedback?: string;
  evaluatedAt?: string;
}

export interface SecurityEvent {
  id: string;
  attemptId: string;
  eventType: "tab_switch" | "window_blur" | "inactivity" | "copy_attempt";
  description: string;
  timestamp: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  candidateId: string;
  attemptNumber: number;
  status: "in_progress" | "completed" | "terminated_security" | "terminated_timeout";
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;
  score: number;
  maxScore: number;
  percentage: number;
  isApproved: boolean;
  answers: Record<string, Answer>;
  securityEvents: SecurityEvent[];
}

export interface Result {
  id: string;
  attemptId: string;
  candidateId: string;
  testId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: "Apto" | "Não Apto";
  status: "published" | "pending_review";
  adminNotes?: string;
  publishedAt: string;
}

export interface AiReport {
  id: string;
  attemptId: string;
  candidateId: string;
  summary: string;
  strengths: string[];
  toImprove: string[];
  categoryAnalysis: {
    category: string;
    scorePercentage: number;
    level: string;
    comment: string;
  }[];
  recommendations: string[];
  dissertativeNotes?: string;
  aiDisclaimer: string;
  isReviewed?: boolean;
  generatedAt: string;
}
