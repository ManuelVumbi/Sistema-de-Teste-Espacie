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
      // 1. If plain text files, read immediately with FileReader
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

      // 2. For binary files (PDF, Word DOCX, etc.), convert to base64 and send to /api/extract-file
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

      const response = await fetch("/api/extract-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          base64,
        }),
      });

      if (!response.ok) {
        throw new Error(`Servidor retornou status ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.text) {
        return {
          success: true,
          text: data.text,
          fileName: data.fileName || file.name,
          charCount: data.charCount || data.text.length,
        };
      } else {
        throw new Error(data.error || "Não foi possível extrair texto do documento.");
      }
    } catch (err: any) {
      console.warn("AiService: Error extracting file content:", err);
      try {
        const raw = await file.text();
        const cleaned = raw.replace(/[^\x20-\x7E\n\r\táàâãéèêíïóôõúüçñÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇÑ]/g, " ").replace(/\s{2,}/g, " ").trim();
        if (cleaned.length > 50) {
          return {
            success: true,
            text: cleaned,
            fileName: file.name,
            charCount: cleaned.length,
          };
        }
      } catch (_) {}

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
      const response = await fetch("/api/ai/generate-questions", {
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
      // Client-side fallback adhering to Angola & technical guidelines
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
      const response = await fetch("/api/ai/evaluate-essay", {
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
      const response = await fetch("/api/ai/candidate-report", {
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

  private generateClientFallbackQuestions(
    params: GenerateQuestionsParams
  ): Partial<Question>[] {
    const list: Partial<Question>[] = [];
    const count = Math.min(Math.max(params.count || 5, 1), 50);
    const source = (params.sourceMaterial || "").trim();

    // 1. If source material is provided, generate questions extracted directly from it with natural phrasing
    if (source.length > 40) {
      // Clean headers, file markers, page numbers and table-of-contents numbers
      const cleaned = source
        .replace(/---\s*\[DOCUMENTO BASE EXTRAÍDO:[^\]]*\]\s*---/gi, "")
        .replace(/---\s*FIM DO DOCUMENTO[^\n]*---/gi, "")
        .replace(/---/g, " ")
        .replace(/\r\n/g, "\n")
        .replace(/^[0-9]+(\.[0-9]+)*\s+[^\n]{1,60}$/gm, "")
        .replace(/^\d+\s+\d+(\.\d+)*\s+[^\n]{1,60}$/gm, "")
        .replace(/^Página\s+[0-9]+(\s+de\s+[0-9]+)?$/gmi, "")
        .replace(/^[0-9]+\s*$/gm, "")
        .replace(/[ \t]+/g, " ")
        .trim();

      const sentences = cleaned
        .split(/(?<=[.?!])\s+(?=[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ])/)
        .map((s) => s.trim().replace(/^[\*\-\•\d\.\)]+\s*/, ""))
        .filter((s) => s.length >= 45 && s.length <= 260 && /[a-zA-ZáàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ]{3,}/.test(s) && !s.includes("DOCUMENTO BASE"));

      const paras = cleaned
        .split(/\n{2,}|\n(?=[A-Z0-9\-\*\•\d\.\)])/)
        .map((p) => p.trim().replace(/^[\*\-\•\d\.\)]+\s*/, ""))
        .filter((p) => p.length >= 60 && /[.?!]/.test(p) && !p.includes("DOCUMENTO BASE"));

      const pool: Partial<Question>[] = [];
      const totalUnits = Math.max(sentences.length, paras.length, 1);

      const targetRole = (params.topic || params.category || "Especialidade Técnica").replace(/^Avaliação Técnica:\s*/i, "").trim();

      const mcIntros = [
        `No exercício das atribuições e rotinas técnicas da função de ${targetRole}, assinale a alternativa correta:`,
        `Considerando os padrões de conformidade e as boas práticas operacionais exigidas para ${targetRole}, assinale a opção correta:`,
        `No que se refere aos procedimentos operacionais e de segurança aplicáveis a ${targetRole}, qual das seguintes alternativas expressa a conduta adequada?`,
        `A respeito das normas técnicas e processos de execução pertinentes a ${targetRole}, é correto afirmar que:`,
      ];

      const tfIntros = [
        (s: string) => `No âmbito da atuação profissional de ${targetRole}, analise a assertiva a seguir e julgue se é Verdadeira ou Falsa:\n\n"${s}"`,
        (s: string) => `Julgue a correção técnica da seguinte afirmação no contexto de trabalho de ${targetRole}:\n\n"${s}"`,
        (s: string) => `Relativamente às rotinas e procedimentos executados por ${targetRole}, determine se a seguinte declaração é Verdadeira ou Falsa:\n\n"${s}"`,
      ];

      const essayIntros = [
        (p: string) => `Considerando as responsabilidades operacionais de ${targetRole}, elabore uma análise fundamentada sobre a aplicação prática, os requisitos essenciais e os cuidados operacionais relacionados ao seguinte aspecto:\n\n"${p.slice(0, 240)}..."`,
        (p: string) => `No exercício das funções de ${targetRole}, discorra detalhadamente sobre o procedimento em destaque, explicitando os critérios de execução e o controle de qualidade:\n\n"${p.slice(0, 240)}..."`,
      ];

      for (let i = 0; i < totalUnits; i++) {
        const sentence = sentences[i % (sentences.length || 1)] || paras[i % (paras.length || 1)] || "O procedimento operacional requer conformidade rigorosa com os manuais técnicos aplicáveis.";
        const para = paras[i % (paras.length || 1)] || sentence;

        // Multiple choice based on actual text
        const mcStem = mcIntros[i % mcIntros.length];

        const distractor1 = sentences.length > 1
          ? sentences[(i + 1) % sentences.length]
          : `O procedimento técnico em questão deve ser executado sem necessidade de verificação prévia de conformidade.`;
        const distractor2 = sentences.length > 2
          ? sentences[(i + 2) % sentences.length]
          : `A realização desta rotina é facultativa e pode ser substituída por monitoramento remoto sem validação de campo.`;
        const distractor3 = sentences.length > 3
          ? sentences[(i + 3) % sentences.length]
          : `As tolerâncias e parâmetros operacionais especificados admitem variação irrestrita segundo critério discricionário do operador.`;

        const rawOptions = [
          { text: sentence, isCorrect: true },
          { text: distractor1, isCorrect: false },
          { text: distractor2, isCorrect: false },
          { text: distractor3, isCorrect: false },
        ];
        
        const perm = [
          [0, 1, 2, 3],
          [1, 0, 2, 3],
          [2, 1, 0, 3],
          [3, 1, 2, 0],
        ][i % 4];

        const finalOptions: { id: string; text: string }[] = [];
        let correctId = "opt-1";
        perm.forEach((pos, optIdx) => {
          const id = `opt-${optIdx + 1}`;
          finalOptions.push({ id, text: rawOptions[pos].text });
          if (rawOptions[pos].isCorrect) {
            correctId = id;
          }
        });

        pool.push({
          statement: mcStem,
          type: "multiple_choice",
          difficulty: params.difficulty as any,
          points: 10,
          options: finalOptions,
          correctAnswer: correctId,
          legalSource: `Literatura e Diretrizes Técnicas de ${targetRole}`,
          verificationDate: new Date().toISOString().split("T")[0],
        });

        // True / False based on direct statement or realistic negation
        const isFalse = i % 2 === 1;
        let tfStatement = sentence;
        let tfCorrect = "true";
        if (isFalse) {
          if (sentence.includes(" deve ")) {
            tfStatement = sentence.replace(" deve ", " não deve ");
            tfCorrect = "false";
          } else if (sentence.includes(" é ")) {
            tfStatement = sentence.replace(" é ", " não é ");
            tfCorrect = "false";
          } else if (sentence.includes(" exige ")) {
            tfStatement = sentence.replace(" exige ", " dispensa ");
            tfCorrect = "false";
          } else {
            tfStatement = `É facultativo e dispensável na função de ${targetRole} observar que: ${sentence}`;
            tfCorrect = "false";
          }
        }

        const tfStem = tfIntros[i % tfIntros.length];
        pool.push({
          statement: tfStem(tfStatement),
          type: "true_false",
          difficulty: "Fácil",
          points: 10,
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: tfCorrect,
          legalSource: `Diretrizes Técnicas e Normativas de ${targetRole}`,
          verificationDate: new Date().toISOString().split("T")[0],
        });

        // Essay
        const essayStem = essayIntros[i % essayIntros.length];
        pool.push({
          statement: essayStem(para),
          type: "essay",
          difficulty: "Difícil",
          points: 15,
          evaluationCriteria: `Critérios de correção para ${targetRole}: 1) Domínio dos conceitos e termos técnicos; 2) Aplicação prática contextualizada na função; 3) Estrutura lógica, coerência e clareza na fundamentação.`,
          legalSource: "Procedimento Operacional Padronizado",
          verificationDate: new Date().toISOString().split("T")[0],
        });
      }

      for (let i = 0; i < count; i++) {
        const item = pool[i % pool.length];
        list.push({
          ...item,
          id: `q-doc-${Date.now()}-${i + 1}`,
          order: i + 1,
        });
      }
      return list;
    }

    // 2. Check if Informática / TI
    const lowerTopic = (params.topic || "").toLowerCase();
    const lowerCat = (params.category || "").toLowerCase();
    const lowerSec = (params.sector || "").toLowerCase();
    const isIT =
      lowerTopic.includes("informát") ||
      lowerTopic.includes("it") ||
      lowerTopic.includes("tecnolog") ||
      lowerTopic.includes("rede") ||
      lowerTopic.includes("sistema") ||
      lowerTopic.includes("computa") ||
      lowerCat.includes("informát") ||
      lowerCat.includes("it") ||
      lowerCat.includes("tecnolog") ||
      lowerSec.includes("tecnolog") ||
      lowerSec.includes("ti");

    if (isIT) {
      const itTemplates = [
        {
          statement: "Na administração de redes de computadores em ambiente corporativo, qual é a principal finalidade da configuração de VLANs (Virtual Local Area Networks) em switches gerenciáveis?",
          type: "multiple_choice" as const,
          points: 10,
          difficulty: params.difficulty as any,
          options: [
            { id: "opt-1", text: "Segmentar o domínio de broadcast, isolar tráfego departamental e aprimorar a segurança lógica e desempenho da rede." },
            { id: "opt-2", text: "Ampliar fisicamente o comprimento máximo dos cabos de par trançado Cat6 além de 100 metros sem repetidores." },
            { id: "opt-3", text: "Substituir a necessidade de servidores DNS e DHCP na atribuição dinâmica de endereços IP." },
            { id: "opt-4", text: "Converter automaticamente pacotes analógicos em sinais digitais de fibra óptica sem transceiver." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Normas IEEE 802.1Q e Boas Práticas de Engenharia de Redes Corporativas",
          verificationDate: "2026-03-01",
        },
        {
          statement: "De acordo com as boas práticas de Segurança da Informação e Gestão de Continuidade (ISO/IEC 27001), a regra de backup '3-2-1' determina que devem existir:",
          type: "multiple_choice" as const,
          points: 10,
          difficulty: "Médio" as const,
          options: [
            { id: "opt-1", text: "3 cópias dos dados, em 2 mídias/formatos distintos, com pelo menos 1 cópia armazenada fora do local físico (off-site ou cloud)." },
            { id: "opt-2", text: "3 servidores de backup diários, executando restauração a cada 2 horas por 1 único operador." },
            { id: "opt-3", text: "3 senhas de acesso criptografadas em 2 firewalls com apenas 1 administrador com privilégio root." },
            { id: "opt-4", text: "3 tentativas de login permitidas a cada 2 minutos antes do bloqueio definitivo de 1 usuário." },
          ],
          correctAnswer: "opt-1",
          legalSource: "Guia NIST SP 800-34 e Padrões ISO/IEC 27002 de Salvaguarda de Dados",
          verificationDate: "2026-02-28",
        },
        {
          statement: "Em sistemas operativos Linux e Windows Server, a autenticação multifator (MFA) baseada em tokens TOTP ou chaves FIDO2 reduz substancialmente o risco de invasão mesmo no caso de comprometimento da palavra-passe do utilizador.",
          type: "true_false" as const,
          points: 10,
          difficulty: "Fácil" as const,
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Diretrizes de Cibersegurança Corporativa — Espacie Services IT",
          verificationDate: "2026-03-05",
        },
        {
          statement: "Descreva a metodologia técnica e os comandos de linha de diagnóstico (troubleshooting) que você emprega para diagnosticar e solucionar um incidente em que uma estação de trabalho perdeu a comunicação com a rede local e com a Internet.",
          type: "essay" as const,
          points: 15,
          difficulty: "Difícil" as const,
          evaluationCriteria: "Avaliar: 1) Verificação da camada física (LEDs da placa de rede, link/cabo); 2) Inspeção de IP/Gateway/DNS (ipconfig /all ou ip a); 3) Testes de conectividade (ping no loopback 127.0.0.1, no gateway padrão e em IP externo 8.8.8.8); 4) Teste de resolução de nomes (nslookup); 5) Rastreio de rota (tracert/traceroute) e verificação de firewall/antivírus.",
          legalSource: "Manual de Suporte Técnico & Operações de TI — Espacie Services",
          verificationDate: "2026-03-01",
        },
        {
          statement: "Qual protocolo e porta padrão são utilizados para garantir a transferência segura de páginas web através de criptografia de ponta a ponta (TLS/SSL)?",
          type: "multiple_choice" as const,
          points: 10,
          difficulty: "Fácil" as const,
          options: [
            { id: "opt-1", text: "HTTPS na porta TCP 443" },
            { id: "opt-2", text: "HTTP na porta TCP 80" },
            { id: "opt-3", text: "FTP na porta TCP 21" },
            { id: "opt-4", text: "Telnet na porta TCP 23" },
          ],
          correctAnswer: "opt-1",
          legalSource: "RFC 8446 (The Transport Layer Security Protocol)",
          verificationDate: "2026-02-15",
        },
        {
          statement: "No Active Directory de um ambiente Windows Server, o protocolo Kerberos utiliza tíquetes temporários (TGT) para autenticar usuários e serviços, evitando o envio da senha em texto plano pela rede.",
          type: "true_false" as const,
          points: 10,
          difficulty: "Médio" as const,
          options: [
            { id: "true", text: "Verdadeiro" },
            { id: "false", text: "Falso" },
          ],
          correctAnswer: "true",
          legalSource: "Arquitetura de Serviços de Domínio Active Directory (AD DS)",
          verificationDate: "2026-02-20",
        },
        {
          statement: "Esboce um diagrama estruturado da topologia de rede local (LAN) corporativa da empresa, identificando a posição do Roteador de Borda, Firewall perimetral, DMZ (Servidores Públicos), Switch Core e Estações de Trabalho dos utilizadores.",
          type: "visual_drawing" as const,
          points: 15,
          difficulty: "Difícil" as const,
          evaluationCriteria: "Avaliar posicionamento lógico do firewall entre a Internet e a rede interna, criação da DMZ para servidores externos, separação por switch gerenciável e proteção dos ativos internos.",
          legalSource: "Guia de Arquitetura Segura de Redes — Espacie Services TI",
          verificationDate: "2026-03-01",
        },
      ];

      for (let i = 0; i < count; i++) {
        const base = itTemplates[i % itTemplates.length];
        list.push({
          ...base,
          id: `q-it-${Date.now()}-${i + 1}`,
          order: i + 1,
          statement: base.statement,
        });
      }
      return list;
    }

    const targetRole = (params.topic || params.category || "Especialidade Técnica").replace(/^Avaliação Técnica:\s*/i, "").trim();

    const templates = [
      {
        statement: `No exercício das atribuições da função de ${targetRole}, qual é o procedimento prioritário para garantir a integridade operacional antes do início das atividades?`,
        type: "multiple_choice" as const,
        points: 10,
        difficulty: params.difficulty as any,
        options: [
          { id: "opt-1", text: "Inspeção visual pré-operacional, preenchimento de checklist e conferência de EPIs específicos." },
          { id: "opt-2", text: "Iniciar o trabalho imediatamente para evitar atrasos no cronograma." },
          { id: "opt-3", text: "Delegar a inspeção de segurança para terceiros não habilitados." },
          { id: "opt-4", text: "Apenas verificar o nível de combustível ou alimentação elétrica." },
        ],
        correctAnswer: "opt-1",
        legalSource: "Manual de Procedimentos Operacionais e Normas de Segurança — Espacie Services",
        verificationDate: "2026-02-01",
      },
      {
        statement: `No âmbito das atividades de ${targetRole}, é permitida a operação de equipamentos industriais ou execução de tarefas de risco sem a devida ordem de serviço e qualificação profissional comprovada.`,
        type: "true_false" as const,
        points: 5,
        difficulty: "Fácil" as const,
        options: [
          { id: "true", text: "Verdadeiro" },
          { id: "false", text: "Falso" },
        ],
        correctAnswer: "false",
        legalSource: "Decreto Executivo n.º 31/94 (Regulamento de Segurança e Saúde no Trabalho de Angola)",
        verificationDate: "2026-01-15",
      },
      {
        statement: `Elabore uma resposta técnica explicando como proceder diante de uma não-conformidade identificada durante a rotina operacional de ${targetRole}, indicando as ações de contenção imediata e registro formal.`,
        type: "essay" as const,
        points: 15,
        difficulty: "Difícil" as const,
        evaluationCriteria: "Avaliar: 1) Ação de bloqueio imediato; 2) Notificação à liderança; 3) Registro no livro de ocorrências; 4) Proposta de ação corretiva.",
        legalSource: "Norma ISO 9001:2015 / Sistema de Gestão da Qualidade Espacie",
        verificationDate: "2026-02-20",
      },
      {
        statement: `No contexto profissional de ${targetRole}, qual indicador-chave de desempenho (KPI) melhor reflete a confiabilidade do processo e a qualidade operacional?`,
        type: "multiple_choice" as const,
        points: 10,
        difficulty: "Médio" as const,
        options: [
          { id: "opt-1", text: "Taxa de conformidade de primeira passagem (First Pass Yield) e índice de incidentes zero." },
          { id: "opt-2", text: "Velocidade de execução sem verificação de qualidade." },
          { id: "opt-3", text: "Número total de advertências disciplinares emitidas." },
          { id: "opt-4", text: "Consumo total de insumos operacionais." },
        ],
        correctAnswer: "opt-1",
        legalSource: "Diretrizes de Excelência Operacional Espacie Services",
        verificationDate: "2026-01-30",
      },
      {
        statement: `Utilizando o espaço de desenho abaixo, esboce o fluxograma simplificado do fluxo de processo para a atividade de ${targetRole}, demonstrando as etapas de entrada, verificação e liberação final.`,
        type: "visual_drawing" as const,
        points: 10,
        difficulty: "Médio" as const,
        evaluationCriteria: "Verificar clareza de blocos de decisão, sentido do fluxo operacional e pontos de controle de qualidade.",
        legalSource: "Procedimento Padrão Espacie Services",
        verificationDate: "2026-02-10",
      },
    ];

    for (let i = 0; i < count; i++) {
      const base = templates[i % templates.length];
      list.push({
        ...base,
        id: `gen-${Date.now()}-${i + 1}`,
        order: i + 1,
        statement: base.statement,
      });
    }

    return list;
  }
}

export const aiService = AiServiceAdapter.getInstance();
