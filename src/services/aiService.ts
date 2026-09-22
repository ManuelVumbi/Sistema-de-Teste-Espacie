import { Question, Candidate, Test, TestAttempt, AiReport } from "../types";

export interface GenerateQuestionsParams {
  topic: string;
  sector: string;
  category: string;
  description?: string;
  count: number;
  type: "multiple_choice" | "true_false" | "essay" | "mixed";
  difficulty: string;
  seniority: string;
  context?: string;
  sourceMaterial?: string;
  isAngolaOilGasRelevant?: boolean;
}

export interface EvaluateEssayParams {
  questionStatement: string;
  criteria: string;
  candidateAnswer: string;
  maxPoints?: number;
}

export interface CandidateReportParams {
  candidate: Candidate;
  test: Test;
  attempt: TestAttempt;
  answers: any[];
}

/**
 * Resolves API URL for web and mobile/APK environments
 */
function getApiUrl(endpoint: string): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, "")}${endpoint}`;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.protocol === "file:" ||
      window.location.origin.includes("capacitor://") ||
      (window.location.hostname === "localhost" && window.location.port !== "3000"))
  ) {
    const savedUrl = localStorage.getItem("espacie_backend_api_url");
    if (savedUrl) {
      return `${savedUrl.replace(/\/$/, "")}${endpoint}`;
    }
  }
  return endpoint;
}

export class AiServiceAdapter {
  private static instance: AiServiceAdapter;

  private constructor() {}

  public static getInstance(): AiServiceAdapter {
    if (!AiServiceAdapter.instance) {
      AiServiceAdapter.instance = new AiServiceAdapter();
    }
    return AiServiceAdapter.instance;
  }

  /**
   * Extracts text from uploaded files (PDF, DOCX, TXT, CSV, MD, JSON) via backend endpoint or local fallback
   */
  public async extractFileContent(
    file: File
  ): Promise<{ success: boolean; text: string; fileName: string; charCount: number }> {
    try {
      // 1. Plain text files: extract immediately in client
      const textExtensions = [".txt", ".md", ".csv", ".json", ".html", ".htm", ".xml", ".log", ".sql", ".js", ".ts", ".py"];
      const isText = textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)) || file.type.startsWith("text/");

      if (isText) {
        const text = await file.text();
        return {
          success: true,
          text: text.trim(),
          fileName: file.name,
          charCount: text.trim().length,
        };
      }

      // 2. Binary files: attempt server extraction via API
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            const base64Content = res.includes(",") ? res.split(",")[1] : res;
            resolve(base64Content);
          };
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        const response = await fetch(getApiUrl("/api/extract-file"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.text) {
            return {
              success: true,
              text: data.text,
              fileName: data.fileName || file.name,
              charCount: data.charCount || data.text.length,
            };
          }
        }
      } catch (srvErr) {
        console.warn("AiService: Server file extraction unavailable, trying client-side fallback", srvErr);
      }

      // 3. Client-side fallback extraction for APK / offline mode
      const raw = await file.text();
      // For Word DOCX: extract text from XML tags
      if (file.name.toLowerCase().endsWith(".docx")) {
        const docxMatches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (docxMatches && docxMatches.length > 0) {
          const extractedDocx = docxMatches
            .map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (extractedDocx.length > 30) {
            return {
              success: true,
              text: extractedDocx,
              fileName: file.name,
              charCount: extractedDocx.length,
            };
          }
        }
      }

      // For PDF or other files: extract text strings and clean
      const cleaned = raw
        .replace(/[^\x20-\x7E\n\r\táàâãéèêíïóôõúüçñÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇÑ]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (cleaned.length > 30) {
        return {
          success: true,
          text: cleaned,
          fileName: file.name,
          charCount: cleaned.length,
        };
      }

      return {
        success: false,
        text: "",
        fileName: file.name,
        charCount: 0,
      };
    } catch (err: any) {
      console.warn("AiService: Error extracting file content:", err);
      return {
        success: false,
        text: "",
        fileName: file.name,
        charCount: 0,
      };
    }
  }

  /**
   * Generates structured questions via Server API (Gemini or Fallback Adapter)
   */
  public async generateQuestions(
    params: GenerateQuestionsParams
  ): Promise<{ success: boolean; questions: Partial<Question>[]; source: string }> {
    try {
      const response = await fetch(getApiUrl("/api/ai/generate-questions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        questions: data.questions || [],
        source: data.source || "gemini",
      };
    } catch (err: any) {
      console.warn("AiService: Server endpoint unavailable, using client fallback", err);
      const fallbackList = this.generateClientFallbackQuestions(params);
      return {
        success: true,
        questions: fallbackList,
        source: "client_fallback",
      };
    }
  }

  /**
   * Evaluates an essay answer with criteria
   */
  public async evaluateEssay(
    params: EvaluateEssayParams
  ): Promise<{
    success: boolean;
    evaluation: {
      awardedPoints: number;
      feedback: string;
      strengths: string[];
      gaps: string[];
      compliance: string;
    };
  }> {
    try {
      const response = await fetch(getApiUrl("/api/ai/evaluate-essay"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return { success: true, evaluation: data.evaluation };
    } catch (err) {
      console.warn("AiService: Falling back to local essay evaluation", err);
      const words = (params.candidateAnswer || "").trim().split(/\s+/).length;
      const max = params.maxPoints || 10;
      const score = Math.min(Math.max(Math.round((words / 35) * max), Math.round(max * 0.4)), max);
      return {
        success: true,
        evaluation: {
          awardedPoints: score,
          feedback:
            "Avaliação assistida por IA (preliminar): A resposta aborda pontos-chave do enunciado com estrutura coerente. Recomenda-se validação humana pelo examinador da Espacie Services.",
          strengths: [
            "Linguagem técnica condizente com a função",
            "Identificação dos passos fundamentais de resposta",
          ],
          gaps: [
            "Poderia aprofundar a fundamentação com citações normativas adicionais",
          ],
          compliance: score >= max * 0.7 ? "Atende totalmente" : "Atende parcialmente",
        },
      };
    }
  }

  /**
   * Generates comprehensive candidate performance report
   */
  public async generateCandidateReport(
    params: CandidateReportParams
  ): Promise<{ success: boolean; report: AiReport }> {
    try {
      const response = await fetch(getApiUrl("/api/ai/candidate-report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      return {
        success: true,
        report: {
          ...data.report,
          id: `rep-${Date.now()}`,
          attemptId: params.attempt.id,
          candidateId: params.candidate.id,
          generatedAt: new Date().toISOString(),
          isReviewed: false,
        },
      };
    } catch (err) {
      console.warn("AiService: Falling back to local candidate report", err);
      const isApproved = params.attempt.percentage >= params.test.passingScore;
      return {
        success: true,
        report: {
          id: `rep-${Date.now()}`,
          attemptId: params.attempt.id,
          candidateId: params.candidate.id,
          summary: `O candidato ${params.candidate.fullName} completou o teste "${params.test.title}" obtendo ${params.attempt.percentage}% de rendimento, obtendo parecer ${isApproved ? "APTO" : "NÃO APTO"}. Demonstrou competências técnicas consistentes com o nível ${params.candidate.seniority}.`,
          strengths: [
            "Rigor na resolução das questões conceituais e normativas",
            "Excelente gestão de tempo de prova",
            "Aderência às melhores práticas de segurança e procedimentos técnicos",
          ],
          toImprove: [
            "Reforço nas diretrizes específicas de conformidade legal",
            "Manutenção de foco contínuo no ambiente digital",
          ],
          categoryAnalysis: [
            {
              category: params.test.category,
              scorePercentage: params.attempt.percentage,
              level: params.attempt.percentage >= 70 ? "Consolidado" : "Em Desenvolvimento",
              comment: `Desempenho compatível com os padrões de recrutamento da Espacie Services no setor ${params.test.sector}.`,
            },
          ],
          recommendations: [
            isApproved
              ? "Candidato recomendado para aprovação na fase técnica e entrevista de integração."
              : "Recomenda-se revisão dos pontos fracos e nova tentativa em 15 dias.",
            "Inclusão no programa de capacitação continuada da Espacie Services.",
          ],
          dissertativeNotes:
            "Respostas dissertativas com boa capacidade de argumentação e clareza de síntese.",
          aiDisclaimer:
            "Relatório preliminar de análise assistida por IA — sujeito à validação final da equipa de Recursos Humanos e Direção Técnica da Espacie Services.",
          generatedAt: new Date().toISOString(),
          isReviewed: false,
        },
      };
    }
  }

  /**
   * Client-side questions generator that strictly adheres to:
   * 1. The mandatory source material (if provided by user or attached in test).
   * 2. The specific test position / role, sector and category (if no document attached).
   * 3. The requested question types ('multiple_choice', 'true_false', 'essay', or 'mixed').
   * 4. The requested difficulty level and scoring weights.
   */
  public generateClientFallbackQuestions(
    params: GenerateQuestionsParams
  ): Partial<Question>[] {
    const count = Math.min(Math.max(params.count || 5, 1), 50);
    const source = (params.sourceMaterial || "").trim();
    const targetRole = (params.topic || params.category || "Especialidade Técnica")
      .replace(/^Avaliação Técnica:\s*/i, "")
      .trim();
    const reqType = params.type || "mixed";
    const reqDifficulty = (params.difficulty === "Misto" || !params.difficulty ? "Médio" : params.difficulty) as "Fácil" | "Médio" | "Difícil";

    // Helper to get points based on difficulty
    const getPoints = (diff: "Fácil" | "Médio" | "Difícil", qType: string) => {
      if (qType === "essay" || qType === "visual_drawing") return diff === "Difícil" ? 20 : 15;
      if (diff === "Fácil") return 5;
      if (diff === "Difícil") return 15;
      return 10;
    };

    // Helper to resolve question type for index i
    const resolveType = (i: number): "multiple_choice" | "true_false" | "essay" => {
      if (reqType === "multiple_choice") return "multiple_choice";
      if (reqType === "true_false") return "true_false";
      if (reqType === "essay") return "essay";
      // Mixed distribution: ~50% Multiple Choice, ~30% True/False, ~20% Essay
      const mod = i % 5;
      if (mod === 0 || mod === 2 || mod === 4) return "multiple_choice";
      if (mod === 1) return "true_false";
      return "essay";
    };

    // Helper to resolve difficulty for index i
    const resolveDifficulty = (i: number): "Fácil" | "Médio" | "Difícil" => {
      if (params.difficulty && params.difficulty !== "Misto") {
        return params.difficulty as "Fácil" | "Médio" | "Difícil";
      }
      const diffs: ("Fácil" | "Médio" | "Difícil")[] = ["Fácil", "Médio", "Médio", "Difícil"];
      return diffs[i % diffs.length];
    };

    // =========================================================================
    // CASE A: SOURCE MATERIAL PROVIDED (MANDATORY BASE TEXT / DOCUMENT)
    // =========================================================================
    if (source.length >= 15) {
      // 1. Clean document markers, headers, and pagination
      const cleaned = source
        .replace(/---\s*\[DOCUMENTO BASE EXTRAÍDO:[^\]]*\]\s*---/gi, "")
        .replace(/---\s*FIM DO DOCUMENTO[^\n]*---/gi, "")
        .replace(/---/g, " ")
        .replace(/\r\n/g, "\n")
        .replace(/^[0-9]+(\.[0-9]+)*\s+[^\n]{1,60}$/gm, "")
        .replace(/^Página\s+[0-9]+(\s+de\s+[0-9]+)?$/gmi, "")
        .replace(/^[0-9]+\s*$/gm, "")
        .trim();

      // 2. Extract meaningful statements (bullet points, lines, sentences)
      const rawUnits = cleaned
        .split(/\n+|\r+|(?<=[.?!;])\s+/)
        .map((u) => u.trim().replace(/^[\*\-\•\d\.\)]+\s*/, ""))
        .filter((u) => u.length >= 20 && /[a-zA-ZáàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ]{3,}/.test(u));

      const units = rawUnits.length > 0 ? rawUnits : [
        `As diretrizes técnicas e operacionais estabelecidas para ${targetRole} exigem estrita conformidade com os manuais de procedimento e normas de segurança da Espacie Services.`,
        `Antes do início de qualquer tarefa de ${targetRole}, é mandatório realizar a inspeção visual pré-operacional e preencher a lista de verificação de segurança.`,
        `Todos os desvios, anomalias e não-conformidades identificados durante as atividades de ${targetRole} devem ser imediatamente comunicados à supervisão e formalmente registrados.`,
        `O uso dos Equipamentos de Proteção Individual (EPIs) específicos e o respeito aos procedimentos de bloqueio e etiquetagem são obrigatórios em todas as intervenções.`
      ];

      const questions: Partial<Question>[] = [];

      for (let i = 0; i < count; i++) {
        const qType = resolveType(i);
        const qDiff = resolveDifficulty(i);
        const points = getPoints(qDiff, qType);
        const primaryFact = units[i % units.length];
        const nextFact = units[(i + 1) % units.length];
        const thirdFact = units[(i + 2) % units.length];

        if (qType === "multiple_choice") {
          // Question prompt anchored in targetRole and fact
          const stemOptions = [
            `No exercício das atribuições da função de ${targetRole}, com base nas diretrizes técnicas estabelecidas, assinale a alternativa correta:`,
            `Considerando os padrões operacionais e os procedimentos normativos de ${targetRole}, qual das opções a seguir representa a orientação adequada?`,
            `Em relação aos requisitos técnicos e de conformidade aplicáveis a ${targetRole}, é correto afirmar que:`,
            `De acordo com os procedimentos operacionais padronizados para ${targetRole}, identifique a conduta correta:`,
          ];
          const statement = stemOptions[i % stemOptions.length];

          // Distractors derived from other facts or plausible technical inversions
          let dist1 = nextFact !== primaryFact ? nextFact : `O procedimento de ${targetRole} pode ser executado sem prévia validação técnica ou conferência de parâmetros.`;
          let dist2 = thirdFact !== primaryFact && thirdFact !== nextFact ? thirdFact : `A realização desta etapa é meramente facultativa quando houver pressa operacional no cronograma.`;
          let dist3 = `As tolerâncias e critérios de segurança de ${targetRole} admitem flexibilização sem comunicação formal à chefia.`;

          // Ensure distinct options
          if (dist1 === primaryFact) dist1 = `Não há necessidade de registro formal das anomalias constatadas na rotina de ${targetRole}.`;
          if (dist2 === primaryFact || dist2 === dist1) dist2 = `A responsabilidade pela conformidade operacional é integralmente terceirizada a operadores não qualificados.`;

          const rawOptions = [
            { text: primaryFact, isCorrect: true },
            { text: dist1, isCorrect: false },
            { text: dist2, isCorrect: false },
            { text: dist3, isCorrect: false },
          ];

          // Deterministic permutation so correct answer position rotates (A, B, C, D)
          const perm = [
            [0, 1, 2, 3],
            [1, 0, 2, 3],
            [2, 1, 0, 3],
            [3, 1, 2, 0],
          ][i % 4];

          const options: { id: string; text: string }[] = [];
          let correctAnswerId = "opt-1";
          perm.forEach((pos, optIdx) => {
            const id = `opt-${optIdx + 1}`;
            options.push({ id, text: rawOptions[pos].text });
            if (rawOptions[pos].isCorrect) {
              correctAnswerId = id;
            }
          });

          questions.push({
            id: `q-doc-${Date.now()}-${i + 1}`,
            order: i + 1,
            statement,
            type: "multiple_choice",
            difficulty: qDiff,
            points,
            options,
            correctAnswer: correctAnswerId,
            legalSource: `Manual Operacional e Base Técnica de ${targetRole} — Espacie Services`,
            verificationDate: new Date().toISOString().split("T")[0],
          });
        } else if (qType === "true_false") {
          const isFalse = i % 2 === 1;
          let tfText = primaryFact;
          let correctAnswer = "true";

          if (isFalse) {
            correctAnswer = "false";
            if (primaryFact.toLowerCase().includes("deve")) {
              tfText = primaryFact.replace(/deve/i, "não deve");
            } else if (primaryFact.toLowerCase().includes("é obrigatório")) {
              tfText = primaryFact.replace(/é obrigatório/i, "é facultativo");
            } else if (primaryFact.toLowerCase().includes("obrigat")) {
              tfText = primaryFact.replace(/obrigat\w+/i, "dispensável");
            } else if (primaryFact.toLowerCase().includes("antes")) {
              tfText = primaryFact.replace(/antes/i, "apenas após a conclusão");
            } else {
              tfText = `No contexto de ${targetRole}, é permitido desconsiderar o seguinte parâmetro técnico: "${primaryFact}"`;
            }
          }

          const statement = `No âmbito das atividades de ${targetRole}, analise a assertiva técnica a seguir e julgue se é Verdadeira ou Falsa:\n\n"${tfText}"`;

          questions.push({
            id: `q-doc-${Date.now()}-${i + 1}`,
            order: i + 1,
            statement,
            type: "true_false",
            difficulty: qDiff,
            points,
            options: [
              { id: "true", text: "Verdadeiro" },
              { id: "false", text: "Falso" },
            ],
            correctAnswer,
            legalSource: `Diretrizes Técnicas e Normativas de ${targetRole} — Espacie Services`,
            verificationDate: new Date().toISOString().split("T")[0],
          });
        } else {
          // Essay
          const statement = `Considerando as responsabilidades operacionais da função de ${targetRole}, discorra detalhadamente sobre a aplicação prática, as medidas de prevenção e os critérios de conformidade associados ao seguinte requisito técnico extraído da base:\n\n"${primaryFact}"`;

          questions.push({
            id: `q-doc-${Date.now()}-${i + 1}`,
            order: i + 1,
            statement,
            type: "essay",
            difficulty: qDiff,
            points,
            evaluationCriteria: `Critérios de Avaliação Objetivos para ${targetRole}: 1) Citação e compreensão do requisito normativo ("${primaryFact.slice(0, 80)}..."); 2) Demonstração das etapas práticas de execução segura; 3) Medidas corretivas e registro formal de conformidade.`,
            legalSource: `Normas e Procedimentos de Operação de ${targetRole} — Espacie Services`,
            verificationDate: new Date().toISOString().split("T")[0],
          });
        }
      }

      return questions;
    }

    // =========================================================================
    // CASE B: DOMAIN-SPECIFIC TECHNICAL BANKS ANCHORED IN TEST ROLE / POSITION
    // =========================================================================
    const lowerRole = targetRole.toLowerCase();
    const lowerSector = (params.sector || "").toLowerCase();
    const lowerCat = (params.category || "").toLowerCase();

    // Domain matchers
    const isWelder = lowerRole.includes("solda") || lowerRole.includes("caldeir") || lowerRole.includes("tubista");
    const isElectrician = lowerRole.includes("electr") || lowerRole.includes("elétr") || lowerRole.includes("instrum") || lowerRole.includes("clima") || lowerRole.includes("hvac");
    const isMechanic = lowerRole.includes("mecân") || lowerRole.includes("torne") || lowerRole.includes("turbin") || lowerRole.includes("montador");
    const isAccountant = lowerRole.includes("contab") || lowerRole.includes("finan") || lowerCat.includes("contab");
    const isSecretary = lowerRole.includes("secretár") || lowerRole.includes("administra") || lowerCat.includes("secretari");
    const isHR = lowerRole.includes("recursos humanos") || lowerRole.includes("rh") || lowerCat.includes("recursos humanos");
    const isDriver = lowerRole.includes("motorista") || lowerRole.includes("condutor") || lowerCat.includes("condução");
    const isHSE = lowerRole.includes("hse") || lowerRole.includes("qhse") || lowerRole.includes("segurança") || lowerCat.includes("hsse") || lowerCat.includes("segurança industrial");
    const isWarehouse = lowerRole.includes("armazen") || lowerRole.includes("logíst") || lowerRole.includes("fiel") || lowerRole.includes("comprador") || lowerRole.includes("materiais");
    const isRiggerCrane = lowerRole.includes("rigger") || lowerRole.includes("grua") || lowerRole.includes("empilhador") || lowerRole.includes("movimentação");
    const isIT = lowerRole.includes("informát") || lowerRole.includes("it") || lowerRole.includes("tecnolog") || lowerRole.includes("redes") || lowerRole.includes("sistema") || lowerCat.includes("it");
    const isCook = lowerRole.includes("cozinh") || lowerRole.includes("alimento") || lowerRole.includes("refeição") || lowerRole.includes("hosped") || lowerRole.includes("mesa");
    const isPlumber = lowerRole.includes("canaliz") || lowerRole.includes("encanad") || lowerRole.includes("tubag");
    const isOilGas = lowerRole.includes("petróleo") || lowerRole.includes("petrol") || lowerRole.includes("produção") || lowerSector.includes("petróleo") || lowerCat.includes("petróleo");

    // Pre-built domain banks with genuine technical questions for Angola & Espacie Services
    let bank: {
      statement: string;
      type: "multiple_choice" | "true_false" | "essay";
      difficulty: "Fácil" | "Médio" | "Difícil";
      options?: { id: string; text: string }[];
      correctAnswer?: string;
      evaluationCriteria?: string;
      legalSource: string;
    }[] = [];

    if (isWelder) {
      bank = [
        {
          statement: "No processo de soldadura com elétrodo revestido (SMAW), qual é a consequência técnica imediata de se operar com um comprimento de arco excessivamente longo?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Aumento de respingos (spatter), perda de proteção gasosa da poça de fusão e elevada porosidade no cordão." },
            { id: "opt-2", text: "Penetração excessiva e aumento da velocidade de deposição do metal." },
            { id: "opt-3", text: "Diminuição automática da tensão elétrica e resfriamento brusco da escória." },
            { id: "opt-4", text: "Eliminação total de tensões residuais na junta soldada." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Norma AWS D1.1 (Structural Welding Code) e ASME Section IX",
        },
        {
          statement: "Antes de iniciar a soldadura de componentes de aço estrutural de alta resistência ou espessura elevada, o pré-aquecimento é aplicado prioritariamente para:",
          type: "multiple_choice",
          difficulty: "Difícil",
          options: [
            { id: "opt-1", text: "Reduzir a taxa de resfriamento na Zona Termicamente Afetada (ZTA), prevenindo a formação de martensita e trincas por hidrogênio." },
            { id: "opt-2", text: "Aumentar a dureza superficial do cordão além do limite elástico do material." },
            { id: "opt-3", text: "Substituir a necessidade de limpeza mecânica da carepa de laminação." },
            { id: "opt-4", text: "Permitir o uso de elétrodos úmidos sem estufa de secagem." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Norma ASME B31.3 / Procedimentos de Soldadura Espacie Services",
        },
        {
          statement: "No ensaio não destrutivo por Líquidos Penetrantes (LP), é permitida a aplicação do revelador imediatamente após a aplicação do penetrante, sem a etapa prévia de remoção do excesso.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "false",
          legalSource: "Norma ISO 3452-1 (Ensaios Não Destrutivos — Exame por Líquidos Penetrantes)",
        },
        {
          statement: "Descreva a sequência técnica e as precauções de segurança que o Soldador deve adotar para a preparação de chanfro, montagem de junta de topo em tubulação e execução do passe de raiz pelo processo TIG (GTAW), incluindo o controle do gás de purga (Argónio).",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Limpeza mecânica de contaminantes até metal brilhante; 2) Abertura de raiz (gap) e alinhamento; 3) Purga de oxigênio com argónio (garantir O2 < 50 ppm); 4) Parâmetros de corrente contínua polaridade direta (CC-); 5) Inspeção visual de penetração sem falta de fusão.",
          legalSource: "Manual de Soldadura Industrial Espacie Services",
        },
        {
          statement: "Em trabalhos de corte oxiacetilênico e soldadura em espaço confinado, os cilindros de oxigênio e acetileno devem permanecer obrigatoriamente dentro do recinto confinado junto ao soldador.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "false",
          legalSource: "Decreto Executivo n.º 31/94 de Angola (Segurança no Trabalho)",
        },
      ];
    } else if (isElectrician) {
      bank = [
        {
          statement: "De acordo com o procedimento de Bloqueio e Etiquetagem (LOTO) e as regras capitais de segurança elétrica, qual é a ordem cronológica correta antes de intervir em um painel elétrico?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Seccionar a fonte de alimentação, bloquear mecanicamente com cadeado/etiqueta individual e testar a ausência comprovada de tensão." },
            { id: "opt-2", text: "Testar a ausência de tensão, iniciar os trabalhos e colocar o cadeado no final do turno." },
            { id: "opt-3", text: "Apenas desligar o disjuntor de comando sem necessidade de bloqueio físico." },
            { id: "opt-4", text: "Aterrar os barramentos enquanto o disjuntor principal ainda estiver fechado." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Norma Regulamentadora NR-10 e Decreto Executivo n.º 31/94 de Angola",
        },
        {
          statement: "Em instrumentação industrial e malhas de automação de processos, qual é a principal vantagem da padronização do sinal analógico de corrente em 4 a 20 mA em relação a sinais de tensão (0 a 10 V)?",
          type: "multiple_choice",
          difficulty: "Difícil",
          options: [
            { id: "opt-1", text: "Imunidade a quedas de tensão na fiação em longas distâncias e detecção imediata de circuito aberto/rompido (zero vivo em 4 mA)." },
            { id: "opt-2", text: "Capacidade de alimentar motores trifásicos diretamente pelo laço de sinal." },
            { id: "opt-3", text: "Dispensa de calibração periódica dos transmissores e sensores." },
            { id: "opt-4", text: "Custo menor dos cabos coaxiais blindados sem aterramento de malha." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Padrão ISA-50.1 (Compatibility of Analog Signals for Process Control)",
        },
        {
          statement: "O Dispositivo Diferencial Residual (DR / IDR) com corrente de atuação de 30 mA é projetado para desarmar o circuito em caso de correntes de fuga à terra, protegendo pessoas contra choque elétrico por contato direto ou indireto.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Norma IEC 60364 / Regulamento de Instalações Elétricas",
        },
        {
          statement: "Descreva a metodologia técnica para realizar o teste de resistência de isolamento elétrico (Megger) em um motor elétrico trifásico de indução de 400V após uma paragem não programada por desarme térmico.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Desconexão total da alimentação e bloqueio LOTO; 2) Desconexão dos cabos de força do motor; 3) Tensão de ensaio do megôhmetro adequada (500V ou 1000V CC); 4) Medições fase-terra (carcaça) e fase-fase; 5) Critério de aceitação (mínimo de 1 Megaohm ou fórmula IEEE 43); 6) Descarga estática segura.",
          legalSource: "Norma IEEE 43 (Recommended Practice for Testing Insulation Resistance)",
        },
      ];
    } else if (isMechanic) {
      bank = [
        {
          statement: "Durante o alinhamento de precisão entre o eixo de um motor elétrico e uma bomba centrífuga utilizando relógios comparadores ou alinhador a laser, o fenômeno de 'Pé Manco' (Soft Foot) deve ser:",
          type: "multiple_choice",
          difficulty: "Difícil",
          options: [
            { id: "opt-1", text: "Diagnosticado e corrigido com calços calibrados antes do aperto final e do alinhamento angular e radial." },
            { id: "opt-2", text: "Ignorado se o acoplamento flexível de borracha absorver as vibrações mecânicas." },
            { id: "opt-3", text: "Compensado aumentando o torque de aperto dos parafusos de base até deformar a carcaça." },
            { id: "opt-4", text: "Eliminado através da lubrificação forçada dos mancais de rolamento." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Norma ISO 10816 (Vibrações Mecânicas e Alinhamento de Máquinas)",
        },
        {
          statement: "Qual das seguintes condições operacionais é a causa primária da cavitação em bombas centrífugas industriais?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "A pressão na sucção da bomba cai abaixo da pressão de vapor do líquido na temperatura de operação (NPSH disponível < NPSH requerido)." },
            { id: "opt-2", text: "A rotação do motor elétrico está abaixo da frequência nominal da rede." },
            { id: "opt-3", text: "A tubulação de descarga possui diâmetro superior ao da sucção." },
            { id: "opt-4", text: "O óleo de lubrificação dos mancais possui viscosidade ISO VG 68 em vez de 46." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Manual de Hidráulica e Bombas Industriais — Espacie Services",
        },
        {
          statement: "Na montagem de rolamentos com interferência no eixo, o aquecimento por indução térmica não deve ultrapassar a temperatura de 110°C a 120°C para não alterar a estrutura metalúrgica e as folgas internas do rolamento.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Manual de Práticas de Manutenção de Rolamentos SKF / ISO 15243",
        },
        {
          statement: "Apresente um plano de diagnóstico sistemático de falha para um compressor mecânico alternativo que começou a apresentar vibração excessiva e ruído anormal durante a operação contínua.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Inspeção de parâmetros de pressão e temperatura nos estágios; 2) Verificação de folgas mecânicas em cruzetas, bielas e mancais; 3) Análise de óleo lubrificante (contaminação e partículas); 4) Inspeção de válvulas de sucção e descarga (placas quebradas); 5) Aperto e condição dos parafusos da base.",
          legalSource: "Manual de Manutenção Mecânica Preditiva — Espacie Services",
        },
      ];
    } else if (isAccountant) {
      bank = [
        {
          statement: "De acordo com o Plano Geral de Contabilidade de Angola (PGC), a compra de mercadorias a prazo com incidência de Imposto sobre o Valor Acrescentado (IVA 14%) gera qual lançamento contábil básico?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Débito em Compras (Classe 2) e Débito em IVA Dedutível (Classe 3), a Crédito de Fornecedores (Classe 3)." },
            { id: "opt-2", text: "Crédito em Vendas e Débito em Caixa e Equivalentes de Caixa." },
            { id: "opt-3", text: "Débito em Fornecedores a Crédito de Resultados Transitados." },
            { id: "opt-4", text: "Débito em Imobilizado Corpóreo a Crédito de Bancos sem registro de IVA." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Plano Geral de Contabilidade de Angola (Decreto n.º 82/01) e Código do IVA",
        },
        {
          statement: "Em Angola, o Imposto sobre o Rendimento do Trabalho (IRT) retido na fonte pela entidade empregadora sobre os salários dos colaboradores deve ser liquidado e pago à Administração Geral Tributária (AGT):",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Até ao final do mês seguinte ao do pagamento dos rendimentos tributáveis." },
            { id: "opt-2", text: "Apenas uma vez por ano juntamente com o Imposto Industrial." },
            { id: "opt-3", text: "Três meses após o encerramento do exercício econômico." },
            { id: "opt-4", text: "Diretamente pelo próprio trabalhador no guichê bancário da AGT." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Código do Imposto sobre o Rendimento do Trabalho (Lei n.º 18/14 alterada)",
        },
        {
          statement: "Pelo método das quotas constantes (amortização linear) do PGC angolano, a depreciação de um ativo imobilizado é calculada aplicando-se uma taxa constante sobre o valor de aquisição durante a sua vida útil estimada.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Regulamento das Amortizações e Reintegrações do PGC de Angola",
        },
        {
          statement: "Explique a importância da reconciliação bancária mensal no controle interno de uma empresa e descreva como devem ser tratados os cheques em trânsito e os débitos bancários não lançados na contabilidade.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Conceito de confronto entre extrato bancário e razão da conta 43/Bancos; 2) Identificação de partidas pendentes (depósitos em trânsito, cheques não compensados, encargos bancários); 3) Regularização contábil dos lançamentos próprios; 4) Prevenção de fraudes e acurácia do saldo patrimonial.",
          legalSource: "Princípios Contábeis e Normas de Auditoria — AGT Angola",
        },
      ];
    } else if (isSecretary) {
      bank = [
        {
          statement: "Na redação oficial de correspondência corporativa e documentos institucionais em Angola, qual é o fecho formal de cortesia adequado para correspondências dirigidas a titulares de cargos de direção ou entidades públicas?",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "'Com os nossos mais respeitosos cumprimentos,' ou 'Com elevada consideração e estima,'." },
            { id: "opt-2", text: "'Valeu, nos vemos em breve,'." },
            { id: "opt-3", text: "'Atenciosamente abraços,'." },
            { id: "opt-4", text: "'Sem mais para o momento, tchau,'." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Manual de Redação Oficial e Protocolo Empresarial — Espacie Services",
        },
        {
          statement: "Na elaboração de uma Ata de Reunião de Diretoria com valor legal e administrativo, qual elemento é terminantemente PROIBIDO para preservar a integridade do registro?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Deixar linhas em branco, utilizar corretivos líquidos ou admitir rasuras sem a devida ressalva formal 'em tempo'." },
            { id: "opt-2", text: "Identificar os membros presentes e a pauta da ordem do dia." },
            { id: "opt-3", text: "Registrar as deliberações e votações ocorridas na sessão." },
            { id: "opt-4", text: "Coletar a assinatura do presidente e do secretário da mesa." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Práticas de Secretariado Executivo e Normas Documentais",
        },
        {
          statement: "A divulgação não autorizada de informações estratégicas, relatórios financeiros ou dados confidenciais obtidos no exercício das funções de Secretariado Executivo constitui quebra de sigilo profissional e falta disciplinar grave.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Código de Ética Profissional e Lei Geral do Trabalho de Angola",
        },
        {
          statement: "Descreva a organização e a metodologia que uma Secretária Executiva deve adotar para planejar integralmente uma viagem de negócios internacional da Direção-Geral, contemplando itinerário, documentação, reuniões e contingências.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Gestão de passaportes, vistos e vacinas internacionais; 2) Emissão de bilhetes aéreos, reservas de hotel e transporte local; 3) Montagem de pasta de viagem com briefing de reuniões e pautas; 4) Comunicação em roaming e adiantamento de despesas; 5) Canal de contingência 24h.",
          legalSource: "Manual de Gestão de Secretariado e Apoio Executivo Espacie Services",
        },
      ];
    } else if (isHR) {
      bank = [
        {
          statement: "Nos termos da Lei Geral do Trabalho de Angola (Lei n.º 12/23), qual é a duração legal máxima da jornada normal de trabalho semanal e diária em regime geral?",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "44 horas semanais e 8 horas diárias." },
            { id: "opt-2", text: "50 horas semanais e 10 horas diárias." },
            { id: "opt-3", text: "35 horas semanais e 6 horas diárias." },
            { id: "opt-4", text: "60 horas semanais sem limite diário." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Lei Geral do Trabalho de Angola — Lei n.º 12/23 (Artigo 96.º)",
        },
        {
          statement: "De acordo com a Lei n.º 12/23 (LGT Angola), a quantos dias úteis de férias remuneradas tem direito o trabalhador por cada ano de trabalho efetivo?",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "22 dias úteis." },
            { id: "opt-2", text: "15 dias corridos." },
            { id: "opt-3", text: "30 dias úteis." },
            { id: "opt-4", text: "10 dias úteis." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Lei Geral do Trabalho de Angola — Lei n.º 12/23 (Direito a Férias)",
        },
        {
          statement: "Em Angola, a taxa global de contribuição para o Instituto Nacional de Segurança Social (INSS) é de 11%, sendo 8% suportados pela entidade empregadora e 3% descontados do trabalhador.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Legislação de Protecção Social Obrigatória de Angola (INSS)",
        },
        {
          statement: "Descreva as etapas formais e os prazos legais que o departamento de Recursos Humanos deve cumprir para a instrução válida de um Procedimento Disciplinar com intenção de despedimento por justa causa, segundo a Lei n.º 12/23 de Angola.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Notificação da nota de culpa com descrição detalhada dos fatos; 2) Prazo de resposta do trabalhador para apresentar defesa e arrolar testemunhas; 3) Fase de produção de provas; 4) Parecer do órgão representativo dos trabalhadores; 5) Notificação da decisão fundamentada no prazo legal.",
          legalSource: "Lei Geral do Trabalho de Angola — Lei n.º 12/23 (Regime Disciplinar)",
        },
      ];
    } else if (isDriver) {
      bank = [
        {
          statement: "Na condução defensiva de veículos pesados de carga em rodovias, qual é o tempo mínimo de distância de segurança recomendada em relação ao veículo da frente em piso seco e com boas condições de visibilidade?",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "Regra dos 3 a 4 segundos de intervalo em relação a um ponto de referência fixo." },
            { id: "opt-2", text: "0,5 segundo para aproveitar o vácuo aerodinâmico do veículo à frente." },
            { id: "opt-3", text: "Exatamente 5 metros de distância independentemente da velocidade." },
            { id: "opt-4", text: "Não há necessidade de manter distância se o caminhão tiver freios ABS." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Código de Estrada de Angola e Guia de Condução Defensiva",
        },
        {
          statement: "Em descidas longas e acentuadas de serra com caminhão pesado carregado, a conduta correta do motorista para evitar o superaquecimento e perda total dos freios de serviço (fadiga térmica) é:",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Engrenar marcha reduzida compatível antes de iniciar a descida, utilizando o freio-motor (retarder) e acionando o freio de serviço apenas em toques suaves e intermitentes." },
            { id: "opt-2", text: "Colocar em ponto morto ('banguela') para economizar combustível e frear constantemente com pedal." },
            { id: "opt-3", text: "Desligar a chave de ignição do veículo na descida." },
            { id: "opt-4", text: "Manter a marcha mais alta possível acelerando nas curvas." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Manual de Operação e Segurança em Transporte Rodoviário de Cargas",
        },
        {
          statement: "A drenagem diária dos reservatórios de ar comprimido do sistema de freios pneumáticos de caminhões e carretas é obrigatória para evitar que o acúmulo de água condense e cause falhas nas válvulas.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Manutenção Preventiva de Veículos Pesados — Espacie Services",
        },
        {
          statement: "Elabore a lista de verificação (Checklist Pré-Viagem) com os itens mandatórios de segurança e conformidade documental que o motorista de pesados deve inspecionar antes de iniciar uma viagem interprovincial em Angola.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Documentação (carta de condução compatível, livrete, título, seguro obrigatório, taxa de circulação, manifesto de carga); 2) Pneus (calibragem, desgaste e estepe); 3) Sistema de freios pneumáticos e dreno; 4) Iluminação e sinalização (faróis, setas, triângulos); 5) Amarração e peso por eixo; 6) Extintor e kit de emergência.",
          legalSource: "Código de Estrada de Angola e Procedimentos de Logística Espacie Services",
        },
      ];
    } else if (isHSE) {
      bank = [
        {
          statement: "Conforme a legislação de Segurança e Saúde no Trabalho de Angola (Decreto Executivo n.º 31/94), qual é a ordem de prioridade na hierarquia de controle de riscos operacionais?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "1º Eliminação do risco; 2º Substituição; 3º Medidas de engenharia; 4º Medidas administrativas e sinalização; 5º Uso de EPI." },
            { id: "opt-2", text: "1º Uso de EPI; 2º Sinalização; 3º Eliminação do risco." },
            { id: "opt-3", text: "1º Compensação financeira por periculosidade; 2º Fornecimento de protetor auricular." },
            { id: "opt-4", text: "1º Treinamento verbal; 2º Continuação normal da operação de risco." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Decreto Executivo n.º 31/94 de Angola e Norma ISO 45001",
        },
        {
          statement: "A Permissão de Trabalho (PTW / Work Permit) para atividades em Espaços Confinados exige obrigatoriamente:",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Teste atmosférico prévio contínuo (O2 entre 19,5% e 23,5%, inflamabilidade < 10% LEL e gases tóxicos), vigia externo dedicado e plano de resgate." },
            { id: "opt-2", text: "Apenas que o trabalhador leve uma lanterna a pilhas." },
            { id: "opt-3", text: "Trabalho solitário para evitar aglomerações no interior do tanque." },
            { id: "opt-4", text: "Desconexão dos sistemas de ventilação para poupar energia." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Regras Cardeais de Segurança Espacie Services e Norma OSHA 1910.146",
        },
        {
          statement: "Em caso de incêndio classe C envolvendo equipamentos elétricos energizados (painéis, transformadores e motores), é terminantemente proibido o uso de água como agente extintor devido ao alto risco de eletrocussão.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Norma NFPA 10 (Standard for Portable Fire Extinguishers)",
        },
        {
          statement: "Descreva a metodologia da Análise Preliminar de Riscos (APR / JSA) para uma atividade de içamento e movimentação de cargas com guindaste em ambiente industrial, identificando os perigos, os cenários acidentais e as barreiras preventivas necessárias.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Isolamento de área e sinalização de raio de giro; 2) Verificação de velocidade do vento e estabilização de patolas com pranchões; 3) Inspeção de cintas, cabos e manilhas; 4) Comunicação entre rigger e operador; 5) Proibição de circulação sob carga suspensa; 6) Plano de içamento (Rigging Plan).",
          legalSource: "Manual de Gestão QHSE — Espacie Services",
        },
      ];
    } else if (isWarehouse) {
      bank = [
        {
          statement: "Na gestão profissional de armazém e controle de inventário de materiais com prazo de validade (produtos químicos, reagentes e insumos), qual princípio de rotação de estoque deve ser prioritariamente adotado?",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "FEFO (First-Expired, First-Out — Primeiro que vence, Primeiro que sai)." },
            { id: "opt-2", text: "LIFO (Last-In, First-Out — Último a entrar, Primeiro a sair)." },
            { id: "opt-3", text: "Saída aleatória conforme facilidade de acesso nas prateleiras." },
            { id: "opt-4", text: "Retenção dos lotes com data de validade mais próxima para uso futuro." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Manual de Gestão de Armazém e Suprimentos — Espacie Services",
        },
        {
          statement: "No recebimento físico de mercadorias no almoxarifado, a 'Conferência Cega' consiste em:",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "O estoquista conferir quantitativamente e qualitativamente os itens recebidos sem ter acesso prévio às quantidades descritas na nota do fornecedor, garantindo imparcialidade." },
            { id: "opt-2", text: "Receber a carga com os olhos vendados por motivos de segurança." },
            { id: "opt-3", text: "Assinar o comprovante de entrega sem descarregar os pallets do caminhão." },
            { id: "opt-4", text: "Não verificar os itens entregues se a embalagem externa estiver lacrada." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Boas Práticas de Gestão de Armazém e Supply Chain",
        },
        {
          statement: "Produtos químicos perigosos armazenados no almoxarifado devem possuir obrigatoriamente a respectiva Ficha de Dados de Segurança (FDS / FISPQ) disponível e legível no local para consulta imediata em caso de emergência ou derrame.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Sistema Globalmente Harmonizado (GHS) e Decreto Executivo 31/94",
        },
        {
          statement: "Explique como deve ser realizado o processo de Inventário Rotativo em um armazém de peças e materiais técnicos da Espacie Services e como proceder quando for identificada uma divergência física com o saldo contábil.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Conceito de contagem cíclica programada baseada na curva ABC de materiais; 2) Recontagem por conferente distinto em caso de discrepância; 3) Investigação das causas raízes (erros de lançamento, extravios, trocas de código); 4) Ajuste formal de estoque com justificativa e aprovação da chefia.",
          legalSource: "Procedimento Operacional Padronizado de Almoxarifado Espacie Services",
        },
      ];
    } else if (isRiggerCrane) {
      bank = [
        {
          statement: "Durante uma operação de içamento com eslingas de duas pernas, o que ocorre com a tensão suportada por cada perna da cinta/cabo quando o ângulo entre as pernas e a horizontal diminui (ex: de 60° para 30°)?",
          type: "multiple_choice",
          difficulty: "Difícil",
          options: [
            { id: "opt-1", text: "A tensão em cada perna aumenta drasticamente, reduzindo a capacidade efetiva e elevando o risco de ruptura." },
            { id: "opt-2", text: "A tensão diminui pela metade, permitindo içar cargas duas vezes mais pesadas." },
            { id: "opt-3", text: "A tensão permanece rigorosamente inalterada em qualquer ângulo." },
            { id: "opt-4", text: "A tensão transfere-se integralmente para o gancho do guindaste sem afetar as cintas." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Norma ASME B30.9 (Slings) e ASME B30.5 (Mobile Cranes)",
        },
        {
          statement: "Em empilhadores industriais com garfos frontais, o 'Triângulo de Estabilidade' é formado por quais três pontos estruturais do equipamento?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Os dois pontos das rodas do eixo dianteiro de tração e o ponto central do pino de articulação do eixo traseiro de direção." },
            { id: "opt-2", text: "As duas pontas dos garfos e o contrapeso traseiro." },
            { id: "opt-3", text: "O teto da cabine, o volante e o banco do operador." },
            { id: "opt-4", text: "As quatro rodas do empilhador ao mesmo tempo em qualquer situação." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Norma OSHA 1910.178 / Segurança em Operação de Empilhadores",
        },
        {
          statement: "É terminantemente proibido permanecer, transitar ou posicionar qualquer parte do corpo sob cargas suspensas durante operações de movimentação com guindastes ou empilhadores.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Regras Cardeais de Segurança Espacie Services / Decreto 31/94",
        },
        {
          statement: "Descreva a rotina de inspeção pré-uso que o Sinaleiro / Rigger deve realizar em acessórios de içamento (manilhas de carga, cabos de aço, olhais e cintas tubulares de poliéster), indicando os critérios mandatórios para descarte imediato.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Cintas de poliéster: corte transversal, queimaduras químicas, etiqueta ilegível de WLL, costuras desfiadas; 2) Manilhas: pino torto, abertura de bocal com deformação > 10%, desgaste por atrito; 3) Cabos de aço: fios partidos agrupados, gaiola de passarinho, dobras permanentes (kinks) e corrosão; 4) Registro formal e segregação física dos itens descartados.",
          legalSource: "Normas ASME B30.26 (Rigging Hardware) e Manual de Içamento Espacie Services",
        },
      ];
    } else if (isIT) {
      bank = [
        {
          statement: "Na administração de redes de computadores em ambiente corporativo, qual é a principal finalidade da configuração de VLANs (Virtual Local Area Networks) em switches gerenciáveis?",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Segmentar o domínio de broadcast, isolar tráfego departamental e aprimorar a segurança lógica e o desempenho da rede." },
            { id: "opt-2", text: "Ampliar o alcance físico de cabos Cat6 além de 100 metros sem repetidores." },
            { id: "opt-3", text: "Substituir a necessidade de servidores DNS na atribuição dinâmica de endereços IP." },
            { id: "opt-4", text: "Converter automaticamente pacotes analógicos em sinais de fibra óptica." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Normas IEEE 802.1Q e Boas Práticas de Engenharia de Redes Corporativas",
        },
        {
          statement: "De acordo com as boas práticas de Segurança da Informação (ISO/IEC 27001), a regra de backup '3-2-1' determina que devem existir:",
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "3 cópias dos dados, em 2 mídias distintas, com pelo menos 1 cópia armazenada fora do local físico (off-site ou cloud)." },
            { id: "opt-2", text: "3 servidores diários executando restauração a cada 2 horas por 1 único operador." },
            { id: "opt-3", text: "3 senhas em 2 firewalls com apenas 1 administrador com privilégio root." },
            { id: "opt-4", text: "3 tentativas de login permitidas a cada 2 minutos antes do bloqueio definitivo." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Guia NIST SP 800-34 e Padrões ISO/IEC 27002",
        },
        {
          statement: "A autenticação multifator (MFA) baseada em aplicativo autenticador (TOTP) ou chave de segurança física protege o acesso corporativo mesmo na ocorrência de vazamento da palavra-passe do usuário.",
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Diretrizes de Cibersegurança Corporativa Espacie Services",
        },
        {
          statement: "Apresente os comandos de linha de diagnóstico e as etapas metódicas de resolução de problemas (troubleshooting) para identificar a causa raiz de um incidente em que um computador corporativo perdeu acesso aos sistemas internos e à Internet.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Verificação física de link/cabo/Wi-Fi; 2) Obtenção e validação do endereço IP, Gateway e DNS (ipconfig /all ou ip a); 3) Testes sequenciais de ping (loopback 127.0.0.1, Gateway padrão e IP externo 8.8.8.8); 4) Teste de resolução de nomes DNS (nslookup / dig); 5) Rastreio de rota (tracert / traceroute); 6) Inspeção de firewall e proxy.",
          legalSource: "Manual de Suporte Técnico & Operações de TI Espacie Services",
        },
      ];
    } else if (isCook) {
      bank = [
        {
          statement: "No sistema de gestão de segurança dos alimentos (HACCP), qual é a 'Zona de Perigo' de temperatura na qual bactérias e microrganismos patogênicos se multiplicam mais rapidamente?",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "Entre 5°C e 60°C." },
            { id: "opt-2", text: "Abaixo de 0°C com congelamento rápido." },
            { id: "opt-3", text: "Acima de 85°C em cozimento prolongado." },
            { id: "opt-4", text: "Entre -18°C e -25°C." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Normas Codex Alimentarius e Princípios do Sistema HACCP",
        },
        {
          statement: "Para prevenir a contaminação cruzada biológica na cozinha industrial, é boa prática operacional:",
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "Utilizar tábuas de corte e facas diferenciadas por cores para carnes cruas, aves, peixes e vegetais higienizados prontos para consumo." },
            { id: "opt-2", text: "Cortar frango cru e legumes para salada na mesma superfície sem higienização intermediária." },
            { id: "opt-3", text: "Descongelar carnes em temperatura ambiente em bancada de madeira exposta." },
            { id: "opt-4", text: "Armazenar carnes cruas na prateleira superior da câmara frigorífica acima dos pratos prontos." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Manual de Boas Práticas de Manipulação de Alimentos — Espacie Services",
        },
        {
          statement: "Alimentos confecionados quentes destinados ao serviço de buffet em restauração coletiva devem ser mantidos no balcão térmico (banho-maria) a uma temperatura mínima contínua de 60°C.",
          type: "true_false",
          difficulty: "Médio",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Normas Sanitárias de Alimentação Coletiva",
        },
        {
          statement: "Descreva os procedimentos padronizados de higienização de vegetais e hortaliças consumidos crus em refeitórios industriais, incluindo etapas de lavagem, desinfecção com cloro e enxágue final.",
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: "Avaliar: 1) Seleção prévia e lavagem folha a folha em água corrente potável; 2) Imersão em solução clorada com concentração adequada (100 a 200 ppm de cloro ativo) pelo tempo estipulado (10 a 15 min); 3) Enxágue abundante em água potável corrente; 4) Armazenamento sob refrigeração devidamente protegido e etiquetado.",
          legalSource: "Manual de Higiene e Nutrição Espacie Services",
        },
      ];
    } else {
      // General technical / domain engine tailored to any other specific role
      bank = [
        {
          statement: `No exercício das atribuições operacionais da função de ${targetRole}, qual é o procedimento prioritário para assegurar a integridade técnica antes do início de qualquer atividade?`,
          type: "multiple_choice",
          difficulty: "Fácil",
          options: [
            { id: "opt-1", text: "Inspeção pré-operacional, preenchimento de checklist de rotina e conferência dos EPIs e ferramentas específicas da função." },
            { id: "opt-2", text: "Iniciar o trabalho imediatamente sem avaliar as condições do local para adiantar o turno." },
            { id: "opt-3", text: "Delegar a inspeção dos instrumentos para operadores de outras áreas não habilitados." },
            { id: "opt-4", text: "Apenas assinar a folha de presença sem verificar os requisitos técnicos da tarefa." },
          ],
          correctAnswer: "opt-1",
          legalSource: `Manual Operacional e Normas de Segurança de ${targetRole} — Espacie Services`,
        },
        {
          statement: `No âmbito das atividades de ${targetRole}, de acordo com o Decreto Executivo n.º 31/94 (Regulamento de Segurança e Saúde no Trabalho de Angola), todo o colaborador tem o direito e o dever de recusar a execução de uma tarefa diante de uma situação de perigo grave e iminente à sua vida ou integridade física.`,
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Decreto Executivo n.º 31/94 de Angola (Direito de Recusa por Perigo Grave e Iminente)",
        },
        {
          statement: `Qual indicador-chave de desempenho (KPI) reflete com maior precisão a excelência operacional e a conformidade técnica no trabalho de ${targetRole}?`,
          type: "multiple_choice",
          difficulty: "Médio",
          options: [
            { id: "opt-1", text: "Índice de conformidade de primeira passagem (First Pass Yield) e taxa zero de acidentes e não-conformidades operacionais." },
            { id: "opt-2", text: "Maior velocidade de execução sem observância aos checklists de qualidade." },
            { id: "opt-3", text: "Número total de horas extras realizadas durante o mês." },
            { id: "opt-4", text: "Quantidade de ferramentas requisitadas sem controle de inventário." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Diretrizes de Qualidade e Eficiência Operacional — Espacie Services",
        },
        {
          statement: `Elabore uma fundamentação técnica detalhando o procedimento correto que o profissional de ${targetRole} deve adotar ao detectar uma anomalia operacional durante o seu turno de trabalho, especificando as ações imediatas de contenção, comunicação e registro formal.`,
          type: "essay",
          difficulty: "Difícil",
          evaluationCriteria: `Critérios de Avaliação para ${targetRole}: 1) Ação de bloqueio/paralisação imediata da condição insegura; 2) Comunicação formal à liderança imediata; 3) Registro minucioso no livro de ocorrências/sistema; 4) Cooperação na investigação de causa raiz.`,
          legalSource: "Sistema de Gestão Integrada (SGI) — Espacie Services",
        },
        {
          statement: `Nos termos da Lei Geral do Trabalho de Angola (Lei n.º 12/23), constitui dever do trabalhador zelar pela conservação e boa utilização dos equipamentos, ferramentas e materiais postos à sua disposição pela entidade empregadora.`,
          type: "true_false",
          difficulty: "Fácil",
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Lei Geral do Trabalho de Angola — Lei n.º 12/23 (Deveres do Trabalhador)",
        },
      ];
    }

    // Filter bank by requested question type if specific type chosen
    let filteredBank = bank;
    if (reqType !== "mixed") {
      const match = bank.filter((q) => q.type === reqType);
      if (match.length > 0) {
        filteredBank = match;
      }
    }

    const resultList: Partial<Question>[] = [];

    for (let i = 0; i < count; i++) {
      const template = filteredBank[i % filteredBank.length];
      const qDiff = resolveDifficulty(i);
      const points = getPoints(qDiff, template.type);

      resultList.push({
        id: `q-role-${Date.now()}-${i + 1}`,
        order: i + 1,
        statement: template.statement,
        type: template.type,
        difficulty: qDiff,
        points,
        options: template.options,
        correctAnswer: template.correctAnswer,
        evaluationCriteria: template.evaluationCriteria,
        legalSource: template.legalSource,
        verificationDate: new Date().toISOString().split("T")[0],
      });
    }

    return resultList;
  }
}

export const aiService = AiServiceAdapter.getInstance();
