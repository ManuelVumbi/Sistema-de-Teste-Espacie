import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Candidate, Test, TestAttempt, Question, Result, AiReport } from "../types";

/**
 * Draws the official Espacie Services brand header on any jsPDF document page.
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

  // 3. Official Logo Badge Box (White Card)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 7, 24, 24, 3, 3, "F");

  // Stylized Espacie Emblem Curves inside the white badge
  // Upper wing - Navy #0A2540
  doc.setFillColor(10, 37, 64);
  doc.circle(24, 17, 7.5, "F");

  // Sky blue inner dynamic crescent
  doc.setFillColor(56, 189, 248);
  doc.circle(26, 15.5, 4.5, "F");

  // Core cutout
  doc.setFillColor(255, 255, 255);
  doc.circle(27, 14.5, 2.8, "F");

  // Subtle cross blade
  doc.setFillColor(2, 132, 199);
  doc.circle(21.5, 19.5, 2.2, "F");

  // 4. Espacie Services Typography
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Espacie", 41, 17);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 189, 248); // Sky Blue
  doc.text("SERVICES", 41, 22);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(title, 41, 27);
  doc.text(subtitle, 41, 32);

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
  aiReport?: AiReport
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
    "Luanda, República de Angola | www.espacie.co.ao",
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
