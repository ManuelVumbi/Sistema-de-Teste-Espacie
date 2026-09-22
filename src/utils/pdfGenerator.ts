import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Candidate, Test, TestAttempt, Question, Result, AiReport } from "../types";
import { ESPACIE_LOGO_BASE64 } from "../constants/logoData";

/**
 * Draws the official Espacie Services brand header on any jsPDF document page.
 * Uses the authentic Espacie Services corporate logo.
 */
function drawEspaciePdfHeader(
  doc: jsPDF,
  pageWidth: number,
  title: string,
  subtitle: string,
  rightBadge?: { text: string; isPositive: boolean }
) {
  // 1. Primary brand banner: Deep Navy (#0A2540)
  doc.setFillColor(10, 37, 64);
  doc.rect(0, 0, pageWidth, 38, "F");

  // 2. Secondary accent line: Sky Blue (#38BDF8)
  doc.setFillColor(56, 189, 248);
  doc.rect(0, 38, pageWidth, 2.5, "F");

  // 3. Official Logo Card with Real Espacie Services Logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 6, 44, 26, 3, 3, "F");

  try {
    doc.addImage(ESPACIE_LOGO_BASE64, "PNG", 14, 8, 40, 22);
  } catch (err) {
    // Graceful fallback
    doc.setFillColor(10, 37, 64);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ESPACIE", 18, 20);
  }

  // 4. Espacie Services Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Espacie Services", 60, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(56, 189, 248); // Sky Blue
  doc.text(title, 60, 22);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(subtitle, 60, 27);
  doc.text("Direção de Recursos Humanos e Operações Técnicas", 60, 32);

  // 5. Right Status Badge (if provided)
  if (rightBadge) {
    if (rightBadge.isPositive) {
      doc.setFillColor(14, 165, 233); // Sky Blue 500 for Apto
    } else {
      doc.setFillColor(225, 29, 72); // Rose 600 for Não Apto
    }
    doc.roundedRect(pageWidth - 46, 11, 34, 16, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(rightBadge.text, pageWidth - 29, 21.5, { align: "center" });

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(rightBadge.isPositive ? "CLASSIFICAÇÃO" : "AVALIAÇÃO", pageWidth - 29, 25, {
      align: "center",
    });
  }
}

export function generateIndividualPdf(
  candidate: Candidate,
  test: Test,
  attempt: TestAttempt,
  questions: Question[],
  result?: Result,
  aiReport?: AiReport,
  options?: { hideQuestionAudit?: boolean }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isApproved = attempt.isApproved || (result && result.classification === "Apto");

  // Draw Header with Espacie Branding
  drawEspaciePdfHeader(
    doc,
    pageWidth,
    "SISTEMA CORPORATIVO DE AVALIAÇÃO TÉCNICA E COMPETÊNCIAS",
    "Luanda, Angola",
    {
      text: isApproved ? "APTO" : "NÃO APTO",
      isPositive: isApproved,
    }
  );

  let y = 48;

  // Document Title
  doc.setFontSize(13);
  doc.setTextColor(10, 37, 64); // #0A2540
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO INDIVIDUAL DE DESEMPENHO TÉCNICO", 14, y);
  y += 5.5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Emitido em: ${new Date().toLocaleDateString("pt-AO")} às ${new Date().toLocaleTimeString(
      "pt-AO"
    )} | Tentativa #${attempt.attemptNumber} | Código: ESP-${attempt.id.substring(0, 8).toUpperCase()}`,
    14,
    y
  );
  y += 7;

  // Candidate and Test details table
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["DADOS DO CANDIDATO", "INFORMAÇÕES DA AVALIAÇÃO TÉCNICA"]],
    body: [
      [
        `Nome Completo: ${candidate.fullName}\nDocumento: ${candidate.documentType} nº ${candidate.documentNumber}\nE-mail: ${candidate.email}\nTelefone: ${candidate.phone || "Não informado"}`,
        `Avaliação: ${test.title}\nSetor: ${test.sector}\nCategoria Profissional: ${candidate.seniority}\nNota de Corte Exigida: ${test.passingScore}%`,
      ],
      [
        `Cargo / Função Pretendida:\n${candidate.jobTitle}`,
        `Resultado Obtido:\nPontuação: ${attempt.score} / ${attempt.maxScore} (${attempt.percentage}%)\nTempo Gasto: ${Math.round(attempt.timeSpentSeconds / 60)} min (Limite: ${test.durationMinutes} min)\nDecisão: ${isApproved ? "APTO PARA A FUNÇÃO" : "NÃO APTO (Abaixo da Nota de Corte)"}`,
      ],
    ],
    headStyles: {
      fillColor: [10, 37, 64], // #0A2540 Deep Navy
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (options?.hideQuestionAudit) {
    // CANDIDATE VIEW:
    // Confidentiality of individual questions & keys is preserved
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 44, 2.5, 2.5, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 37, 64);
    doc.text("SÍNTESE INSTITUCIONAL DE RENDIMENTO INDIVIDUAL", 20, y + 8);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(
      `• Total de Questões Avaliadas: ${questions.length} questões técnicas`,
      20,
      y + 16
    );
    doc.text(
      `• Pontuação Obtida: ${attempt.score} de ${attempt.maxScore} pontos possíveis (${attempt.percentage}%)`,
      20,
      y + 23
    );
    doc.text(
      `• Nota de Corte para Aprovação: ${test.passingScore}% (${Math.round((test.passingScore / 100) * attempt.maxScore)} pontos)`,
      20,
      y + 30
    );
    doc.text(
      `• Parecer Técnico Oficial: ${isApproved ? "APTO PARA A FUNÇÃO (Aprovado no Exame Técnico)" : "NÃO APTO (Abaixo da Nota de Corte)"}`,
      20,
      y + 37
    );

    y += 50;

    // Institutional Custody and Confidentiality Notice
    doc.setFillColor(240, 249, 255); // sky-50
    doc.setDrawColor(186, 230, 253); // sky-200
    doc.roundedRect(14, y, pageWidth - 28, 38, 2.5, 2.5, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text("PROTOCOLO DE CUSTÓDIA INSTITUCIONAL E INTEGRIDADE", 20, y + 8);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const splitNotice = doc.splitTextToSize(
      "A presente avaliação técnica foi submetida e homologada no sistema central da Espacie Services. Em observância às normas de segurança e integridade dos processos de recrutamento e seleção, as respostas individuais, alternativas e o gabarito oficial permanecem arquivados sob custódia e sigilo restrito da banca examinadora e da Direção de Recursos Humanos.",
      pageWidth - 40
    );
    doc.text(splitNotice, 20, y + 15);

    const subDate = attempt.completedAt || (result && result.publishedAt) || new Date().toISOString();
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Código de Autenticação: ESP-${attempt.id.substring(0, 12).toUpperCase()} | Submetido em: ${new Date(subDate).toLocaleString("pt-AO")}`,
      20,
      y + 32
    );

    y += 44;
  } else {
    // ADMIN VIEW:
    // Detailed breakdown of questions & answers with explicit Certas e Erradas audit
    let correctTotal = 0;
    let wrongTotal = 0;
    let partialTotal = 0;

    questions.forEach((q) => {
      const ans = attempt.answers[q.id];
      const awarded = ans?.awardedScore !== undefined ? ans.awardedScore : (ans?.isCorrect ? q.points : 0);
      const isCorr =
        q.type === "multiple_choice" || q.type === "true_false"
          ? ans?.selectedOptionId === q.correctAnswer || ans?.isCorrect === true
          : awarded >= q.points;
      const isWro =
        q.type === "multiple_choice" || q.type === "true_false"
          ? !ans?.selectedOptionId || ans?.selectedOptionId !== q.correctAnswer
          : awarded === 0;

      if (isCorr) correctTotal++;
      else if (!isCorr && !isWro && awarded > 0) partialTotal++;
      else wrongTotal++;
    });

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 37, 64);
    doc.text("AUDITORIA DA PROVA: IDENTIFICAÇÃO DE QUESTÕES CERTAS E ERRADAS", 14, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Total de Questões: ${questions.length}   |   Certas: ${correctTotal}   |   Erradas: ${wrongTotal}   |   Parciais: ${partialTotal}   |   Rendimento: ${attempt.percentage}%`,
      14,
      y
    );
    y += 4;

    const tableRows = questions.map((q, idx) => {
      const ans = attempt.answers[q.id];
      let respostaText = "-";
      if (q.type === "multiple_choice") {
        const opt = q.options?.find((o) => o.id === ans?.selectedOptionId);
        respostaText = opt ? opt.text : "Não respondida";
      } else if (q.type === "true_false") {
        respostaText =
          ans?.selectedOptionId === "true"
            ? "Verdadeiro"
            : ans?.selectedOptionId === "false"
            ? "Falso"
            : "Não respondida";
      } else if (q.type === "essay") {
        respostaText = ans?.textAnswer
          ? ans.textAnswer.length > 75
            ? ans.textAnswer.substring(0, 75) + "..."
            : ans.textAnswer
          : "Não respondida";
      } else if (q.type === "visual_drawing") {
        respostaText = ans?.drawingData ? "[Esquema técnico submetido]" : "Não respondida";
      } else {
        respostaText = ans?.selectedOptionId || "Respondida";
      }

      // Gabarito Oficial
      let gabaritoText = "-";
      if (q.type === "multiple_choice") {
        const opt = q.options?.find((o) => o.id === q.correctAnswer);
        gabaritoText = opt ? opt.text : q.correctAnswer || "-";
      } else if (q.type === "true_false") {
        gabaritoText = q.correctAnswer === "true" ? "Verdadeiro" : "Falso";
      } else if (q.type === "essay") {
        gabaritoText = q.evaluationCriteria
          ? q.evaluationCriteria.length > 70
            ? q.evaluationCriteria.substring(0, 70) + "..."
            : q.evaluationCriteria
          : "Critérios técnicos e conceituais";
      } else if (q.type === "visual_drawing") {
        gabaritoText = q.evaluationCriteria
          ? q.evaluationCriteria.length > 70
            ? q.evaluationCriteria.substring(0, 70) + "..."
            : q.evaluationCriteria
          : "Layout operacional e zonas";
      }

      const typeLabel =
        q.type === "multiple_choice"
          ? "M. Escolha"
          : q.type === "true_false"
          ? "V/F"
          : q.type === "essay"
          ? "Dissertativa"
          : "Visual";

      const awarded = ans?.awardedScore !== undefined ? ans.awardedScore : (ans?.isCorrect ? q.points : 0);
      const isCorr =
        q.type === "multiple_choice" || q.type === "true_false"
          ? ans?.selectedOptionId === q.correctAnswer || ans?.isCorrect === true
          : awarded >= q.points;
      const isWro =
        q.type === "multiple_choice" || q.type === "true_false"
          ? !ans?.selectedOptionId || ans?.selectedOptionId !== q.correctAnswer
          : awarded === 0;

      const statusLabel = isCorr ? "CERTA" : isWro ? "ERRADA" : "PARCIAL";
      const pontos = `${awarded} / ${q.points}`;

      return [
        `#${idx + 1}`,
        `${q.statement.length > 60 ? q.statement.substring(0, 60) + "..." : q.statement}\n[${typeLabel}]`,
        respostaText,
        gabaritoText,
        statusLabel,
        pontos,
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: "striped",
      head: [["#", "Questão / Enunciado", "Resposta do Candidato", "Gabarito Oficial", "Auditoria", "Pontos"]],
      body: tableRows,
      headStyles: {
        fillColor: [10, 37, 64],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [15, 23, 42],
        cellPadding: 2.8,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 54 },
        2: { cellWidth: 44 },
        3: { cellWidth: 44 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          if (data.cell.raw === "CERTA") {
            data.cell.styles.textColor = [16, 149, 100];
            data.cell.styles.fontStyle = "bold";
          } else if (data.cell.raw === "ERRADA") {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = "bold";
          } else if (data.cell.raw === "PARCIAL") {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // If there is AI analysis report
  if (aiReport) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 249, 255); // sky-50
    doc.setDrawColor(186, 230, 253); // sky-200
    doc.roundedRect(14, y, pageWidth - 28, 48, 2, 2, "FD");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 132, 199); // Sky blue 600
    doc.text("PARECER TÉCNICO & ANÁLISE DE COMPETÊNCIAS ESPACIE", 18, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    const splitSummary = doc.splitTextToSize(aiReport.summary, pageWidth - 36);
    doc.text(splitSummary, 18, y + 13);

    const strengthsText = "Pontos Fortes: " + aiReport.strengths.slice(0, 2).join("; ");
    const splitStrengths = doc.splitTextToSize(strengthsText, pageWidth - 36);
    doc.setFont("helvetica", "bold");
    doc.text(splitStrengths, 18, y + 26);

    const recText = "Recomendações: " + aiReport.recommendations.slice(0, 2).join("; ");
    const splitRec = doc.splitTextToSize(recText, pageWidth - 36);
    doc.setFont("helvetica", "normal");
    doc.text(splitRec, 18, y + 36);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(aiReport.aiDisclaimer, 18, y + 44);
    y += 54;
  }

  // Security events audit summary
  if (attempt.securityEvents && attempt.securityEvents.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text("REGISTO DO MONITOR DE INTEGRIDADE NO NAVEGADOR:", 14, y);
    y += 4;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    attempt.securityEvents.forEach((ev) => {
      doc.text(`• [${new Date(ev.timestamp).toLocaleTimeString()}] ${ev.description}`, 16, y);
      y += 4;
    });
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Espacie Services — Sistema Integrado de Avaliação Técnica | Documento Emitido Eletronicamente | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  doc.save(
    `Relatorio_Individual_${candidate.fullName.replace(/\s+/g, "_")}_${test.title.substring(0, 15)}.pdf`
  );
}

export function generateGeneralExecutivePdf(
  tests: Test[],
  candidates: Candidate[],
  results: Result[],
  attempts: TestAttempt[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner with Espacie Branding
  drawEspaciePdfHeader(
    doc,
    pageWidth,
    "RELATÓRIO EXECUTIVO CONSOLIDADO DE AVALIAÇÕES",
    "Direção de Recursos Humanos e Operações Técnicas | Luanda, Angola"
  );

  let y = 48;

  // Executive summary KPIs
  const totalCandidates = candidates.length;
  const totalTests = tests.length;
  const totalAttempts = attempts.length;
  const approvedResults = results.filter((r) => r.classification === "Apto").length;
  const approvalRate = results.length > 0 ? Math.round((approvedResults / results.length) * 100) : 0;
  const avgScore =
    results.length > 0
      ? Math.round((results.reduce((acc, r) => acc + r.percentage, 0) / results.length) * 10) / 10
      : 0;

  autoTable(doc, {
    startY: y,
    theme: "plain",
    body: [
      [
        `CANDIDATOS\n${totalCandidates}`,
        `PROVAS ATIVAS\n${totalTests}`,
        `AVALIAÇÕES\n${totalAttempts}`,
        `TAXA DE APROVAÇÃO\n${approvalRate}%`,
        `MÉDIA GERAL\n${avgScore}%`,
      ],
    ],
    bodyStyles: {
      fontSize: 9,
      fontStyle: "bold",
      textColor: [10, 37, 64],
      halign: "center",
      cellPadding: 4,
      fillColor: [240, 249, 255],
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Quadro de Honra - Top Melhores Desempenhos (Real system data)
  const topHonors = [...results]
    .sort((a, b) => b.percentage - a.percentage || b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((r, idx) => {
      const cand = candidates.find((c) => c.id === r.candidateId);
      const test = tests.find((t) => t.id === r.testId);
      return [
        `#${idx + 1}`,
        cand ? cand.fullName : "Candidato",
        cand ? `${cand.jobTitle} (${cand.seniority})` : "-",
        test ? test.title : "Avaliação",
        `${r.totalScore}/${r.maxScore} (${r.percentage}%)`,
        r.classification.toUpperCase(),
        new Date(r.publishedAt).toLocaleDateString("pt-AO"),
      ];
    });

  if (topHonors.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 37, 64);
    doc.text("QUADRO DE HONRA — TOP MELHORES DESEMPENHOS", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Pos.", "Candidato", "Função / Categoria", "Avaliação Técnica", "Pontuação", "Parecer", "Data"]],
      body: topHonors,
      headStyles: {
        fillColor: [14, 165, 233], // Sky Blue 500
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [15, 23, 42],
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
        4: { halign: "center", fontStyle: "bold" },
        5: { halign: "center", fontStyle: "bold" },
        6: { halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [240, 249, 255],
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Results Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.text("RESULTADOS CONSOLIDADOS POR CANDIDATO", 14, y);
  y += 4;

  const rows = results.map((res) => {
    const cand = candidates.find((c) => c.id === res.candidateId);
    const test = tests.find((t) => t.id === res.testId);
    return [
      cand ? cand.fullName : "N/A",
      cand ? `${cand.documentType} ${cand.documentNumber}` : "-",
      test ? test.title : "N/A",
      cand ? cand.seniority : "-",
      `${res.percentage}%`,
      res.classification,
      new Date(res.publishedAt).toLocaleDateString("pt-AO"),
    ];
  });

  autoTable(doc, {
    startY: y,
    theme: "striped",
    head: [["Candidato", "Documento", "Teste", "Categoria", "Nota", "Status", "Data"]],
    body: rows,
    headStyles: {
      fillColor: [10, 37, 64],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2.5,
    },
    columnStyles: {
      4: { halign: "center" },
      5: { halign: "center", fontStyle: "bold" },
      6: { halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Distribution by Sector & Category summary
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.text("DISTRIBUIÇÃO DE TESTES POR SETOR INDUSTRIAL", 14, y);
  y += 4;

  const sectorCounts: Record<string, number> = {};
  tests.forEach((t) => {
    sectorCounts[t.sector] = (sectorCounts[t.sector] || 0) + 1;
  });

  const sectorRows = Object.entries(sectorCounts).map(([sec, cnt]) => [
    sec,
    cnt.toString(),
    `${Math.round((cnt / (tests.length || 1)) * 100)}%`,
  ]);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Setor de Atividade", "Total de Testes", "Proporção"]],
    body: sectorRows,
    headStyles: {
      fillColor: [10, 37, 64],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Espacie Services — Relatório Executivo Geral | Documento Gerado em ${new Date().toLocaleDateString("pt-AO")} | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  doc.save(`Relatorio_Executivo_Geral_Espacie_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Generates an official executive and technical report for a specific job role (Cargo).
 */
export function generateJobRolePdf(
  roleName: string,
  tests: Test[],
  candidates: Candidate[],
  results: Result[],
  attempts: TestAttempt[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw Header with Espacie Branding
  drawEspaciePdfHeader(
    doc,
    pageWidth,
    "RELATÓRIO TÉCNICO DE AVALIAÇÃO POR CARGO",
    `Espacie Services | Cargo: ${roleName.toUpperCase()}`,
    { text: "CARGO", isPositive: true }
  );

  let y = 47;

  // Filter candidates matching this role (case-insensitive)
  const roleCandidates = candidates.filter(
    (c) => c.jobTitle && c.jobTitle.trim().toLowerCase() === roleName.trim().toLowerCase()
  );

  // Filter tests associated with this role
  const roleTests = tests.filter((t) => {
    const titleMatch = t.title.toLowerCase().includes(roleName.toLowerCase());
    const catMatch = t.category.toLowerCase().includes(roleName.toLowerCase());
    const candMatch = roleCandidates.some((c) => (c.assignedTestIds || []).includes(t.id));
    return titleMatch || catMatch || candMatch;
  });

  // Filter results for this role (either candidate's jobTitle matches, or test belongs to role)
  const roleResults = results.filter((r) => {
    const cand = candidates.find((c) => c.id === r.candidateId);
    if (cand && cand.jobTitle && cand.jobTitle.trim().toLowerCase() === roleName.trim().toLowerCase()) {
      return true;
    }
    const test = tests.find((t) => t.id === r.testId);
    if (test && (test.title.toLowerCase().includes(roleName.toLowerCase()) || test.category.toLowerCase().includes(roleName.toLowerCase()))) {
      return true;
    }
    return false;
  });

  // Determine primary sector
  const sector =
    roleCandidates.find((c) => c.sector)?.sector ||
    roleTests.find((t) => t.sector)?.sector ||
    "Operacional / Industrial";

  // KPIs
  const totalRegistered = roleCandidates.length;
  const totalEvaluated = roleResults.length;
  const aptoCount = roleResults.filter((r) => r.classification === "Apto").length;
  const nonAptoCount = totalEvaluated - aptoCount;
  const approvalRate = totalEvaluated > 0 ? Math.round((aptoCount / totalEvaluated) * 100) : 0;
  const avgScore =
    totalEvaluated > 0
      ? Math.round((roleResults.reduce((acc, r) => acc + r.percentage, 0) / totalEvaluated) * 10) / 10
      : 0;

  // Scope & Metadata Table
  autoTable(doc, {
    startY: y,
    theme: "plain",
    body: [
      [
        `CARGO / POSIÇÃO AVALIADA\n${roleName}`,
        `SETOR DE ATIVIDADE\n${sector}`,
        `BASE REGULAMENTAR\nLGT 12/23 & Dec. 31/94`,
        `DATA DE EMISSÃO\n${new Date().toLocaleDateString("pt-AO")}`,
      ],
    ],
    bodyStyles: {
      fontSize: 8.5,
      textColor: [10, 37, 64],
      fillColor: [241, 245, 249],
      cellPadding: 3.5,
      fontStyle: "bold",
      halign: "center",
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // KPI Dashboard Cards
  autoTable(doc, {
    startY: y,
    theme: "plain",
    body: [
      [
        `CANDIDATOS\n${totalRegistered}`,
        `AVALIAÇÕES\n${totalEvaluated}`,
        `APTOS\n${aptoCount} (${approvalRate}%)`,
        `NÃO APTOS\n${nonAptoCount}`,
        `MÉDIA TÉCNICA\n${avgScore}%`,
      ],
    ],
    bodyStyles: {
      fontSize: 8.5,
      fontStyle: "bold",
      textColor: [10, 37, 64],
      halign: "center",
      cellPadding: 3.5,
      fillColor: [240, 249, 255],
    },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // Section 1: Associated Technical Tests
  if (roleTests.length > 0) {
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 37, 64);
    doc.text("PROVAS TÉCNICAS E MÓDULOS REGISTADOS PARA O CARGO", 14, y);
    y += 3.5;

    const testRows = roleTests.map((t) => [
      t.title,
      t.sector,
      t.difficulty,
      `${t.passingScore}%`,
      `${t.durationMinutes} min`,
      t.isActive ? "Ativo" : "Inativo",
    ]);

    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Prova Técnica", "Setor", "Dificuldade", "Nota de Corte", "Duração", "Estado"]],
      body: testRows,
      headStyles: {
        fillColor: [10, 37, 64],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [15, 23, 42],
        cellPadding: 2,
      },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center", fontStyle: "bold" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 7;
  }

  // Section 2: Results Table (Ranking of Candidates for this Role)
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.text(`QUADRO CLASSIFICATIVO DOS CANDIDATOS — ${roleName.toUpperCase()}`, 14, y);
  y += 3.5;

  if (roleResults.length > 0) {
    const sortedResults = [...roleResults].sort(
      (a, b) => b.percentage - a.percentage || b.totalScore - a.totalScore
    );

    const candidateRows = sortedResults.map((r, idx) => {
      const cand = candidates.find((c) => c.id === r.candidateId);
      const test = tests.find((t) => t.id === r.testId);
      return [
        `#${idx + 1}`,
        cand ? cand.fullName : "Candidato",
        cand ? `${cand.documentType} ${cand.documentNumber}` : "-",
        cand ? cand.seniority : "-",
        test ? test.title : "-",
        `${r.totalScore}/${r.maxScore} (${r.percentage}%)`,
        r.classification.toUpperCase(),
        new Date(r.publishedAt).toLocaleDateString("pt-AO"),
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: "striped",
      head: [["Pos.", "Candidato", "Documento", "Categoria / Nível", "Prova Realizada", "Nota", "Parecer", "Data"]],
      body: candidateRows,
      headStyles: {
        fillColor: [14, 165, 233], // Sky Blue
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [15, 23, 42],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
        5: { halign: "center", fontStyle: "bold" },
        6: { halign: "center", fontStyle: "bold" },
        7: { halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    y = (doc as any).lastAutoTable.finalY + 7;
  } else {
    // Empty state notice
    autoTable(doc, {
      startY: y,
      theme: "plain",
      body: [
        [
          `Nenhuma avaliação concluída até o momento para o cargo de ${roleName}.\n` +
            (roleCandidates.length > 0
              ? `Existem ${roleCandidates.length} candidato(s) registado(s) neste cargo aguardando realização das provas técnicas agendadas.`
              : `Não constam candidatos ativos ou testes realizados para este cargo no período selecionado.`),
        ],
      ],
      bodyStyles: {
        fontSize: 8,
        textColor: [100, 116, 139],
        fillColor: [248, 250, 252],
        cellPadding: 5,
        halign: "center",
      },
    });

    y = (doc as any).lastAutoTable.finalY + 7;

    // List of registered candidates if any
    if (roleCandidates.length > 0) {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 37, 64);
      doc.text("CANDIDATOS REGISTADOS AGUARDANDO AVALIAÇÃO", 14, y);
      y += 3;

      const waitingRows = roleCandidates.map((c, i) => [
        `#${i + 1}`,
        c.fullName,
        `${c.documentType} ${c.documentNumber}`,
        c.seniority || "-",
        c.phone || c.email || "-",
        c.isActive ? "Ativo no Sistema" : "Inativo",
      ]);

      autoTable(doc, {
        startY: y,
        theme: "grid",
        head: [["Item", "Nome Completo", "Documento", "Nível / Senioridade", "Contato", "Status"]],
        body: waitingRows,
        headStyles: {
          fillColor: [100, 116, 139],
          textColor: [255, 255, 255],
          fontSize: 7.5,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
        },
      });

      y = (doc as any).lastAutoTable.finalY + 7;
    }
  }

  // Section 3: Seniority Level Breakdown (if space allows or add page)
  const seniorityMap: Record<string, { total: number; evaluated: number; aptos: number; scores: number[] }> = {};
  roleCandidates.forEach((c) => {
    const sen = c.seniority || "Geral";
    if (!seniorityMap[sen]) seniorityMap[sen] = { total: 0, evaluated: 0, aptos: 0, scores: [] };
    seniorityMap[sen].total += 1;
  });
  roleResults.forEach((r) => {
    const cand = candidates.find((c) => c.id === r.candidateId);
    const sen = cand?.seniority || "Geral";
    if (!seniorityMap[sen]) seniorityMap[sen] = { total: 0, evaluated: 0, aptos: 0, scores: [] };
    seniorityMap[sen].evaluated += 1;
    seniorityMap[sen].scores.push(r.percentage);
    if (r.classification === "Apto") seniorityMap[sen].aptos += 1;
  });

  if (Object.keys(seniorityMap).length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 37, 64);
    doc.text("DISTRIBUIÇÃO DE DESEMPENHO POR NÍVEL DE SENIORIDADE", 14, y);
    y += 3.5;

    const seniorityRows = Object.entries(seniorityMap).map(([sen, d]) => {
      const rate = d.evaluated > 0 ? `${Math.round((d.aptos / d.evaluated) * 100)}%` : "-";
      const avg =
        d.scores.length > 0
          ? `${Math.round((d.scores.reduce((a, b) => a + b, 0) / d.scores.length) * 10) / 10}%`
          : "-";
      return [sen, d.total.toString(), d.evaluated.toString(), d.aptos.toString(), rate, avg];
    });

    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Nível / Categoria Profissional", "Candidatos", "Avaliados", "Aptos", "Taxa de Aptidão", "Média Técnica"]],
      body: seniorityRows,
      headStyles: {
        fillColor: [10, 37, 64],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [15, 23, 42],
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center", fontStyle: "bold" },
        5: { halign: "center", fontStyle: "bold" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 7;
  }

  // Section 4: Formal Validation & Signatures
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.text("PARECER TÉCNICO E TERMO DE HOMOLOGAÇÃO", 14, y);
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const declarationText =
    `Certificamos que as avaliações de competências técnicas consolidadas neste relatório para o cargo de ${roleName.toUpperCase()} ` +
    `foram conduzidas em observância às normas de segurança da Espacie Services, matriz de qualificação técnica da indústria e ` +
    `em conformidade com a Lei Geral do Trabalho da República de Angola (Lei n.º 12/23) e o Decreto Executivo n.º 31/94. ` +
    `Os resultados aqui apurados expressam o índice de prontidão profissional dos candidatos submetidos ao processo seletivo e avaliativo.`;

  const splitDeclaration = doc.splitTextToSize(declarationText, pageWidth - 28);
  doc.text(splitDeclaration, 14, y);
  y += splitDeclaration.length * 3.8 + 12;

  // Signature lines
  const colWidth = (pageWidth - 40) / 2;
  const x1 = 14;
  const x2 = 14 + colWidth + 12;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x1 + colWidth, y);
  doc.line(x2, y, x2 + colWidth, y);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Responsável Técnico / Avaliador Especialista", x1 + colWidth / 2, y + 4, {
    align: "center",
  });
  doc.text("Direção de Recursos Humanos — Espacie Services", x2 + colWidth / 2, y + 4, {
    align: "center",
  });

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Assinatura & Carimbo Técnico", x1 + colWidth / 2, y + 7.5, { align: "center" });
  doc.text("Homologação Oficial de Quadro", x2 + colWidth / 2, y + 7.5, { align: "center" });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.2);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Espacie Services — Relatório Oficial por Cargo: ${roleName} | Documento Auditável | Gerado em ${new Date().toLocaleDateString("pt-AO")} | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  const safeFileName = roleName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Relatorio_Cargo_${safeFileName}_Espacie_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Generates an executive consolidated report analyzing all job roles (Cargos) in comparison.
 */
export function generateAllJobRolesPdf(
  roles: string[],
  tests: Test[],
  candidates: Candidate[],
  results: Result[],
  attempts: TestAttempt[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  drawEspaciePdfHeader(
    doc,
    pageWidth,
    "RELATÓRIO COMPARATIVO CONSOLIDADO POR CARGO",
    "Espacie Services — Análise Estratégica de Competências por Função",
    { text: "TODOS CARGOS", isPositive: true }
  );

  let y = 47;

  // Calculate table rows for all roles
  const tableRows = roles.map((role) => {
    const roleCandidates = candidates.filter(
      (c) => c.jobTitle && c.jobTitle.trim().toLowerCase() === role.trim().toLowerCase()
    );
    const roleResults = results.filter((r) => {
      const cand = candidates.find((c) => c.id === r.candidateId);
      if (cand && cand.jobTitle && cand.jobTitle.trim().toLowerCase() === role.trim().toLowerCase()) {
        return true;
      }
      const test = tests.find((t) => t.id === r.testId);
      return (
        test &&
        (test.title.toLowerCase().includes(role.toLowerCase()) ||
          test.category.toLowerCase().includes(role.toLowerCase()))
      );
    });

    const sec =
      roleCandidates.find((c) => c.sector)?.sector ||
      tests.find(
        (t) =>
          t.title.toLowerCase().includes(role.toLowerCase()) ||
          t.category.toLowerCase().includes(role.toLowerCase())
      )?.sector ||
      "Geral";

    const totalCand = roleCandidates.length;
    const totalEval = roleResults.length;
    const aptos = roleResults.filter((r) => r.classification === "Apto").length;
    const rate = totalEval > 0 ? `${Math.round((aptos / totalEval) * 100)}%` : "-";
    const avg =
      totalEval > 0
        ? `${Math.round((roleResults.reduce((a, b) => a + b.percentage, 0) / totalEval) * 10) / 10}%`
        : "-";

    return [role, sec, totalCand.toString(), totalEval.toString(), aptos.toString(), rate, avg];
  });

  // KPI Summary across all roles
  const evaluatedRolesCount = roles.filter((role) => {
    return results.some((r) => {
      const cand = candidates.find((c) => c.id === r.candidateId);
      return cand && cand.jobTitle && cand.jobTitle.trim().toLowerCase() === role.trim().toLowerCase();
    });
  }).length;

  autoTable(doc, {
    startY: y,
    theme: "plain",
    body: [
      [
        `TOTAL DE CARGOS MONITORIZADOS\n${roles.length} Cargos`,
        `CARGOS COM AVALIAÇÕES ATIVAS\n${evaluatedRolesCount} Cargos`,
        `TOTAL DE CANDIDATOS\n${candidates.length} Registados`,
        `TOTAL DE RESULTADOS\n${results.length} Provas`,
      ],
    ],
    bodyStyles: {
      fontSize: 8.5,
      textColor: [10, 37, 64],
      fillColor: [240, 249, 255],
      cellPadding: 3.5,
      fontStyle: "bold",
      halign: "center",
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 37, 64);
  doc.text("MATRIZ COMPARATIVA DE DESEMPENHO POR CARGO / FUNÇÃO", 14, y);
  y += 3.5;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Cargo / Função", "Setor", "Candidatos", "Avaliados", "Aptos", "Taxa Aptidão", "Média Técnica"]],
    body: tableRows,
    headStyles: {
      fillColor: [10, 37, 64],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [15, 23, 42],
      cellPadding: 2,
    },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center", fontStyle: "bold" },
      6: { halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.2);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Espacie Services — Relatório Comparativo Geral por Cargos | Gerado em ${new Date().toLocaleDateString("pt-AO")} | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  doc.save(`Relatorio_Comparativo_Cargos_Espacie_${new Date().toISOString().split("T")[0]}.pdf`);
}

