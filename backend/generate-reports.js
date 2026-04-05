#!/usr/bin/env node
/**
 * Generate PDF Report Cards for all ridings.
 * Reads from api/mps.json. Outputs to reports/ridings/.
 * Usage: node generate-reports.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const API_DIR = path.join(__dirname, '..', 'api');

const COLORS = {
  red: '#D52B1E', gold: '#FFD700', text: '#1A1A1A', sub: '#5C5C5C',
  muted: '#8C8C8C', bg: '#F8F6F1', white: '#FFFFFF', border: '#E8E4DC',
  gradeA: '#1B5E20', gradeB: '#2E7D32', gradeC: '#B45309', gradeD: '#C2410C', gradeF: '#B71C1C',
};

function gradeColor(grade) {
  if (!grade) return COLORS.muted;
  if (grade.startsWith('A')) return COLORS.gradeA;
  if (grade.startsWith('B')) return COLORS.gradeB;
  if (grade.startsWith('C')) return COLORS.gradeC;
  if (grade.startsWith('D')) return COLORS.gradeD;
  return COLORS.gradeF;
}

// Category labels (no emoji — PDFKit can't render them)
const CAT_LABELS = {
  performance:  'MP Performance',
  investment:   'Federal Investment',
  electoral:    'Electoral Health',
  demographics: 'Demographics',
  expenses:     'MP Expenses',
  transfers:    'Federal Transfers',
};
const CAT_WEIGHTS = {
  investment: '50%', transfers: '35%', expenses: '15%',
  performance: 'Context', electoral: 'Context', demographics: 'Context',
};

function drawScoreBar(doc, x, y, width, score, label) {
  const barH = 20;
  const textY = y + (barH - 8.5) / 2;  // vertically center 8.5px text in bar
  doc.roundedRect(x, y, width, barH, 4).fill('#ECEAE4');
  if (score != null && score > 0) {
    const fillW = Math.max(8, (score / 100) * width);
    const color = score >= 80 ? COLORS.gradeA : score >= 60 ? COLORS.gradeB : score >= 40 ? COLORS.gradeC : score >= 20 ? COLORS.gradeD : COLORS.gradeF;
    doc.roundedRect(x, y, fillW, barH, 4).fill(color);
  }
  doc.fontSize(8.5).fillColor(COLORS.white).font('Helvetica-Bold')
     .text(label, x + 8, textY, { width: width - 44 });
  if (score != null) {
    doc.fontSize(9).fillColor(COLORS.text).font('Helvetica-Bold')
       .text(`${score}`, x + width - 32, textY, { width: 28, align: 'right' });
  }
}

// Standard page footer
function drawPageFooter(doc, W) {
  doc.moveTo(180, 710).lineTo(432, 710).lineWidth(0.5).stroke('#D0CBC2');
  doc.fontSize(7).fillColor('#A9A49C').font('Helvetica')
     .text('bangforyourduck.ca  \u00b7  Independent  \u00b7  Nonpartisan  \u00b7  Community-supported', 50, 720, { align: 'center', width: W });
}

// Source verification button — styled CTA that links to the original data
function drawSourceButton(doc, y, label, url, W) {
  const btnW = Math.min(doc.font('Helvetica-Bold').fontSize(8).widthOfString(label) + 32, 320);
  const btnX = 306 - btnW / 2;
  const btnH = 22;
  // Rounded pill background
  doc.roundedRect(btnX, y, btnW, btnH, btnH / 2).fill('#D52B1E');
  // White text centered in pill
  doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold')
     .text(label, btnX, y + 6, { width: btnW, align: 'center', link: url });
  doc.font('Helvetica');
  return y + btnH + 4;
}

function generateRidingPDF(riding, allRidings, outputPath, { voteRecords, spendingData, expenseData } = {}) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50, bufferPages: true });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const W = 512; // 612 - 2*50
  const cats = riding.categories;

  // ════════ PAGE 1: COVER ════════════════════════════════════════════════
  // Red stripe
  doc.rect(0, 0, 612, 6).fill(COLORS.red);

  // Brand wordmark — generous top margin, refined tracking
  doc.fontSize(11).fillColor(COLORS.muted).font('Helvetica')
     .text('BANG FOR YOUR DUCK', 50, 72, { align: 'center', width: W, characterSpacing: 4 });

  // Thin decorative rule
  doc.moveTo(250, 96).lineTo(362, 96).lineWidth(0.5).stroke('#D0CBC2');

  // Riding name — large, bold, centered with breathing room
  const nameSize = riding.name.length > 28 ? 26 : riding.name.length > 20 ? 30 : 34;
  doc.fontSize(nameSize).fillColor(COLORS.text).font('Helvetica-Bold')
     .text(riding.name, 50, 116, { align: 'center', width: W, lineGap: 4 });

  // Calculate where the name ends for dynamic spacing
  const nameBottom = 116 + doc.heightOfString(riding.name, { width: W, fontSize: nameSize }) + 12;

  // MP + party + province — lighter weight, spaced pipes
  const mpLine = `${riding.mpName || 'Vacant'}  \u00b7  ${riding.mpParty || ''}  \u00b7  ${riding.province}`;
  doc.fontSize(12).fillColor(COLORS.sub).font('Helvetica')
     .text(mpLine, 50, nameBottom, { align: 'center', width: W });

  // ── Grade circle — vertically centered on remaining space ──
  const circleR = 60;
  const circleY = nameBottom + 80;
  const cx = 306;

  // Outer subtle shadow ring
  doc.circle(cx, circleY, circleR + 2).fill('#E8E4DC');
  // Main grade circle
  doc.circle(cx, circleY, circleR).fill(gradeColor(riding.grade));

  // Grade letter — precisely centered using font metrics
  // PDFKit text y is the baseline-top, so we offset to visually center
  const gradeText = riding.grade;
  const gradeFontSize = gradeText.length > 1 ? 44 : 52;
  const gradeTextW = doc.font('Helvetica-Bold').fontSize(gradeFontSize).widthOfString(gradeText);
  const gradeTextX = cx - gradeTextW / 2;
  // Vertical center: circle center - half of cap height (approx 0.35 * fontSize)
  const gradeTextY = circleY - gradeFontSize * 0.38;
  doc.fontSize(gradeFontSize).fillColor(COLORS.white).font('Helvetica-Bold')
     .text(gradeText, gradeTextX, gradeTextY, { lineBreak: false });

  // Score below circle
  const belowCircle = circleY + circleR + 16;
  // Score: "33 / 100" — single centered line, mixed weight
  doc.fontSize(18).fillColor(COLORS.text).font('Helvetica-Bold')
     .text(`${riding.composite} / 100`, 50, belowCircle, { align: 'center', width: W });

  doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
     .text('COMPOSITE SCORE', 50, belowCircle + 24, { align: 'center', width: W, characterSpacing: 2.5 });

  // Duck score — elegant secondary metric
  const duckY = belowCircle + 56;
  if (riding.duckScore != null) {
    doc.moveTo(240, duckY).lineTo(372, duckY).lineWidth(0.5).stroke('#D0CBC2');
    doc.fontSize(10).fillColor(COLORS.sub).font('Helvetica')
       .text(`Bang for Your Duck:  ${riding.duckGrade}  \u00b7  ${riding.duckScore}/100`, 50, duckY + 12, { align: 'center', width: W });
    doc.fontSize(8).fillColor(COLORS.muted)
       .text('Value for federal tax dollars flowing into this riding', 50, duckY + 28, { align: 'center', width: W });
  }

  // ── Footer zone — pinned to bottom ──
  // Population
  if (riding.population) {
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
       .text(`Population: ${riding.population.toLocaleString('en-CA')}`, 50, 620, { align: 'center', width: W });
  }

  // Report date
  doc.fontSize(8).fillColor(COLORS.muted)
     .text(`Report generated ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 642, { align: 'center', width: W });

  // Sources — two lines, tighter
  doc.fontSize(6.5).fillColor('#A9A49C')
     .text('Sources: Elections Canada \u00b7 OpenParliament.ca \u00b7 Infrastructure Canada \u00b7 Open Canada Grants & Contributions \u00b7 House of Commons \u00b7 StatsCan 2021', 50, 664, { align: 'center', width: W })
     .text('Governments publish the data. We collect it, score it, and present it in one place.', 50, 676, { align: 'center', width: W });

  // Bottom bar
  doc.moveTo(180, 700).lineTo(432, 700).lineWidth(0.5).stroke('#D0CBC2');
  doc.fontSize(7.5).fillColor(COLORS.muted)
     .text('bangforyourduck.ca', 50, 710, { align: 'center', width: W, link: 'https://bangforyourduck.ca', characterSpacing: 1 });
  doc.fontSize(6.5).fillColor('#A9A49C')
     .text('Full methodology & terms: bangforyourduck.ca/methodology', 50, 726, { align: 'center', width: W });

  // ════════ PAGE 2: ABOUT THIS REPORT ═══════════════════════════════════
  doc.addPage();
  doc.rect(0, 0, 612, 6).fill(COLORS.red);

  doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('About This Report', 50, 40);
  doc.moveTo(50, 66).lineTo(562, 66).lineWidth(0.5).stroke('#D0CBC2');

  let mY = 82;
  const sectionGap = 10;   // between sections
  const headGap = 14;      // heading → body
  const bodyOpts = { width: W, lineGap: 3 };

  // Helper: draw a section with heading + body
  function aboutSection(heading, body) {
    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold')
       .text(heading, 50, mY);
    mY += headGap;
    doc.fontSize(8.5).fillColor(COLORS.sub).font('Helvetica')
       .text(body, 50, mY, bodyOpts);
    mY += doc.heightOfString(body, { ...bodyOpts, fontSize: 8.5 }) + sectionGap;
    doc.moveTo(50, mY).lineTo(562, mY).lineWidth(0.25).stroke('#E8E4DC');
    mY += sectionGap;
  }

  aboutSection('Editorial Disclaimer',
    'Bang for Your Duck is an independent, nonpartisan editorial project. Scores and grades represent opinions based on publicly available government data. This report is not legal, financial, or political advice. We are not affiliated with any political party, government body, or lobby group.');

  aboutSection('How We Grade',
    'This report grades your riding \u2014 not your MP personally \u2014 on measurable dollar flows: federal investment received (50%), federal transfers allocated (35%), and the cost of representation (15%). Context categories like MP Work, Electoral Health, and Demographics are shown but do not factor into the composite grade.');

  aboutSection('What We Don\u2019t Measure',
    'No model captures the full picture of parliamentary representation. Constituency casework, committee influence, speech quality, legislative amendments, caucus advocacy, and riding-level service delivery are important but not quantifiable from publicly available data at scale. Our scores are a starting point for conversation, not the final word.');

  aboutSection('Structural Factors',
    'Scores are affected by factors outside any MP\u2019s direct control: geography (travel costs are higher for remote ridings), government vs. opposition status (governing MPs have more influence over spending), provincial transfer formulas (all ridings in a province share the same transfer score), population density, and urban vs. rural characteristics. A low score reflects federal spending patterns, not an MP\u2019s dedication.');

  aboutSection('For MPs and Staff',
    'We grade ridings, not individuals. If any data in this report is inaccurate, we want to know. Email corrections@bangforyourduck.ca with the riding name, the data point in question, the correct figure, and supporting documentation. We review all correction requests and will update scores if warranted.');

  // Data sources — styled as a compact list
  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('Data Sources', 50, mY);
  mY += headGap;
  doc.fontSize(7.5).fillColor(COLORS.muted).font('Helvetica');
  const aboutSources = [
    'Infrastructure Canada Open Data (infrastructure.gc.ca)',
    'Open Canada Grants & Contributions (open.canada.ca)',
    'OpenParliament.ca \u2014 Session 45-1',
    'Elections Canada \u2014 45th General Election',
    'House of Commons Proactive Disclosure (ourcommons.ca)',
    'Statistics Canada \u2014 2021 Census of Population',
    'Department of Finance \u2014 Major Federal Transfers 2023-24',
  ];
  for (const src of aboutSources) {
    doc.text('  \u2022  ' + src, 58, mY, { width: W - 8 });
    mY += 12;
  }

  // Methodology link
  mY += 14;
  doc.fontSize(9).fillColor(COLORS.red).font('Helvetica-Bold')
     .text('Full methodology: bangforyourduck.ca/methodology', 50, mY, { align: 'center', width: W, link: 'https://bangforyourduck.ca/methodology/' });

  // Page footer
  doc.moveTo(180, 710).lineTo(432, 710).lineWidth(0.5).stroke('#D0CBC2');
  doc.fontSize(7).fillColor('#A9A49C').font('Helvetica')
     .text('bangforyourduck.ca  \u00b7  Independent  \u00b7  Nonpartisan  \u00b7  Community-supported', 50, 720, { align: 'center', width: W });

  // ════════ PAGE 3: SCORE BREAKDOWN ═════════════════════════════════════
  doc.addPage();
  doc.rect(0, 0, 612, 6).fill(COLORS.red);

  doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('Score Breakdown', 50, 40);
  doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
     .text(`${riding.name}  \u00b7  ${riding.mpName || 'Vacant'}`, 50, 64);

  doc.moveTo(50, 80).lineTo(562, 80).lineWidth(0.5).stroke('#D0CBC2');

  const categories = ['investment', 'transfers', 'expenses', 'performance', 'electoral', 'demographics'];
  let catY = 95;

  for (const key of categories) {
    const data = cats[key];
    const score = data?.score;
    const grade = data?.grade || 'N/A';

    doc.fontSize(12).fillColor(COLORS.text).font('Helvetica-Bold')
       .text(CAT_LABELS[key], 50, catY);
    doc.fontSize(8).fillColor('#A9A49C').font('Helvetica')
       .text(`Weight: ${CAT_WEIGHTS[key]}`, 400, catY + 3, { width: 162, align: 'right' });

    drawScoreBar(doc, 50, catY + 20, W, score, `${grade}  \u00b7  ${score != null ? score + '/100' : 'No data'}`);

    let metricsY = catY + 46;
    const sep = '   \u00b7   ';
    doc.fontSize(8).fillColor(COLORS.sub).font('Helvetica');

    if (key === 'performance' && data) {
      const parts = [];
      if (data.voteParticipationPct != null) parts.push(`Votes: ${data.voteParticipationPct}%`);
      if (data.billsIntroduced != null) parts.push(`Bills: ${data.billsIntroduced}`);
      if (data.speechesCount != null) parts.push(`Speeches: ${data.speechesCount}`);
      if (data.isOpposition) parts.push('(+5 opposition bonus)');
      if (parts.length) doc.text(parts.join(sep), 58, metricsY);
      metricsY += parts.length ? 14 : 0;
    } else if (key === 'electoral' && data) {
      const parts = [];
      if (data.voterTurnoutPct != null) parts.push(`Turnout: ${data.voterTurnoutPct}%`);
      if (data.marginOfVictoryPct != null) parts.push(`Margin: ${data.marginOfVictoryPct}%`);
      if (data.candidatesCount != null) parts.push(`Candidates: ${data.candidatesCount}`);
      if (parts.length) doc.text(parts.join(sep), 58, metricsY);
      metricsY += parts.length ? 14 : 0;
    } else if (key === 'demographics' && data) {
      const parts = [];
      if (data.medianHouseholdIncome != null) parts.push(`Income: $${data.medianHouseholdIncome.toLocaleString('en-CA')}`);
      if (data.unemploymentRate != null) parts.push(`Unemployment: ${data.unemploymentRate}%`);
      if (data.postsecondaryRate != null) parts.push(`Post-secondary: ${data.postsecondaryRate}%`);
      if (parts.length) doc.text(parts.join(sep), 58, metricsY);
      metricsY += parts.length ? 14 : 0;
    } else if (key === 'transfers' && data) {
      const parts = [];
      if (data.totalTransfersPerCapita != null) parts.push(`Total: $${data.totalTransfersPerCapita}/person`);
      if (data.chtPerCapita != null) parts.push(`CHT: $${data.chtPerCapita}`);
      if (data.equalizationPerCapita != null) parts.push(data.equalizationPerCapita > 0 ? `Equalization: $${data.equalizationPerCapita}` : 'No equalization');
      if (parts.length) doc.text(parts.join(sep), 58, metricsY);
      metricsY += parts.length ? 14 : 0;
    }

    catY = metricsY + 18;
    doc.moveTo(50, catY - 6).lineTo(562, catY - 6).lineWidth(0.25).stroke('#E8E4DC');
  }

  // Formula arithmetic
  const invS = cats.investment?.score ?? 0;
  const traS = cats.transfers?.score ?? 0;
  const expS = cats.expenses?.score ?? 0;
  const invC = Math.round(invS * 0.50);
  const traC = Math.round(traS * 0.35);
  const expC = Math.round(expS * 0.15);
  catY += 4;
  doc.moveTo(50, catY).lineTo(562, catY).lineWidth(1.5).stroke(COLORS.text);
  catY += 10;
  doc.fontSize(10).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('Grade Calculation:', 50, catY);
  doc.fontSize(9).fillColor(COLORS.sub).font('Helvetica')
     .text(`(${invS} x 0.50) + (${traS} x 0.35) + (${expS} x 0.15) = ${invC} + ${traC} + ${expC} = ${riding.composite}/100`, 180, catY + 1);
  catY += 16;
  doc.fontSize(8).fillColor(COLORS.muted)
     .text('Grade = dollars flowing into your riding vs the cost of representation. Performance, electoral, and demographics are shown as context only.', 50, catY, { width: W });

  drawPageFooter(doc, W);

  // ════════ PAGE 3: HOW YOUR MP VOTED ════════════════════════════════════
  if (voteRecords) {
    const ridingKey = riding.name + '|' + riding.province;
    const record = voteRecords[ridingKey];
    if (record && record.votes) {
      doc.addPage();
      doc.rect(0, 0, 612, 6).fill(COLORS.red);

      doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold')
         .text('How Your MP Voted', 50, 40);
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
         .text(`${riding.mpName}  \u00b7  ${record.voted} of ${record.totalVotes || record.total || 94} votes attended  \u00b7  ${record.participationPct || Math.round(record.voted / (record.totalVotes || record.total || 94) * 100)}% participation`, 50, 64);
      doc.moveTo(50, 80).lineTo(562, 80).lineWidth(0.5).stroke('#D0CBC2');

      // Clickable hint
      doc.fontSize(7).fillColor('#1565C0').font('Helvetica')
         .text('Vote numbers are clickable \u2014 click any # to view the full vote on OpenParliament.ca', 50, 84, { align: 'right', width: W });

      let vY = 96;
      const pageBottom = 700;
      const rowH = 15;
      let rowIndex = 0;

      // Table header
      function drawVoteHeader() {
        doc.rect(46, vY - 2, W + 8, 14).fill('#F5F3EE');
        doc.fontSize(7).fillColor('#A9A49C').font('Helvetica-Bold');
        doc.text('#', 50, vY); doc.text('DATE', 72, vY); doc.text('BILL', 130, vY); doc.text('DESCRIPTION', 185, vY); doc.text('RESULT', 420, vY); doc.text('VOTE', 495, vY);
        vY += 16;
        doc.font('Helvetica');
        rowIndex = 0;
      }
      drawVoteHeader();

      let firstVoteOnPage = true;  // draw callout on first vote of each page

      for (const v of record.votes) {
        // Page break if needed
        if (vY > pageBottom) {
          drawPageFooter(doc, W);
          doc.addPage();
          doc.rect(0, 0, 612, 6).fill(COLORS.red);
          doc.fontSize(14).fillColor(COLORS.text).font('Helvetica-Bold')
             .text('How Your MP Voted (continued)', 50, 25);
          vY = 50;
          drawVoteHeader();
          firstVoteOnPage = true;
        }

        // Zebra stripe — subtle alternating row background
        if (rowIndex % 2 === 0) {
          doc.rect(46, vY - 2, W + 8, rowH).fill('#FAFAF8');
        }
        rowIndex++;

        const ballotColor = v.ballot === 'Yes' ? COLORS.gradeA : v.ballot === 'No' ? COLORS.gradeF : v.ballot === 'Paired' ? COLORS.muted : '#CC8800';
        const desc = v.description || v.label || '';
        const voteLink = v.number ? `https://openparliament.ca/votes/45-1/${v.number}/` : null;
        doc.fontSize(8).fillColor('#1565C0');
        doc.text(String(v.number || ''), 50, vY, { width: 20, link: voteLink });

        // Callout on first vote: circle around number only (hint text at top of page does the explaining)
        if (firstVoteOnPage && v.number) {
          firstVoteOnPage = false;
          doc.save();
          doc.circle(57, vY + 4, 10).lineWidth(1.2).strokeColor('#1565C0').stroke();
          doc.restore();
        }
        doc.fillColor(COLORS.muted).text(v.date ? v.date.substring(5) : '', 72, vY, { width: 55 });
        doc.fillColor(COLORS.text).font('Helvetica-Bold').text(v.bill || '\u2014', 130, vY, { width: 50 });
        doc.fontSize(7).fillColor(COLORS.sub).font('Helvetica').text(desc.substring(0, 42), 185, vY, { width: 230 });
        doc.fontSize(7).fillColor(COLORS.muted).text(v.result || '', 420, vY, { width: 65 });
        doc.fontSize(9).fillColor(ballotColor).font('Helvetica-Bold').text(v.ballot, 495, vY - 1, { width: 55 });
        doc.font('Helvetica');
        vY += rowH;
      }

      // Source attribution + verification button
      const mpSlug = (riding.mpName || '').toLowerCase().replace(/[^a-z\s-]/g, '').trim().replace(/\s+/g, '-');
      vY += 12;
      doc.fontSize(7.5).fillColor('#A9A49C').font('Helvetica')
         .text(`Source: OpenParliament.ca  \u00b7  Session 45-1  \u00b7  All ${record.totalVotes || record.total || 94} recorded votes`, 50, vY, { align: 'center', width: W });
      vY += 14;
      drawSourceButton(doc, vY, 'Verify votes on OpenParliament.ca \u2192', `https://openparliament.ca/politicians/${mpSlug}/`, W);
      drawPageFooter(doc, W);
    }
  }

  // ════════ PAGE 4: FEDERAL SPENDING IN YOUR RIDING ════════════════════
  if (spendingData) {
    const rs = spendingData[riding.ridingCode];
    if (rs && rs.totalFederal > 0) {
      doc.addPage();
      doc.rect(0, 0, 612, 6).fill(COLORS.red);

      // Per-capita ranking
      const allSpending = Object.entries(spendingData)
        .filter(([,v]) => v.totalFederal > 0)
        .map(([code, v]) => {
          const r = allRidings.find(r => r.ridingCode === code);
          const pop = r?.population || 100000;
          return { code, perCapita: v.totalFederal / pop };
        })
        .sort((a, b) => b.perCapita - a.perCapita);
      const spendRank = allSpending.findIndex(s => s.code === riding.ridingCode) + 1;

      doc.fontSize(22).fillColor(COLORS.text).font('Helvetica-Bold')
         .text('Federal Spending in Your Riding', 50, 30);
      doc.fontSize(14).fillColor(COLORS.gradeA).font('Helvetica-Bold')
         .text(`$${(rs.totalFederal / 1e6).toFixed(1)}M total federal investment`, 50, 58);
      doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica')
         .text(`Ranked #${spendRank} of ${allSpending.length} ridings by per-capita investment  |  Infrastructure Canada`, 50, 78);
      doc.moveTo(50, 96).lineTo(562, 96).stroke(COLORS.border);

      // Category breakdown
      if (rs.byCategory && Object.keys(rs.byCategory).length > 0) {
        let cY = 108;
        doc.fontSize(12).fillColor(COLORS.text).font('Helvetica-Bold')
           .text('Spending by Category', 50, cY);
        cY += 20;

        const sortedCats = Object.entries(rs.byCategory)
          .filter(([,v]) => v > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        for (const [cat, amount] of sortedCats) {
          const barW = Math.max(4, (amount / rs.totalFederal) * 350);
          const pct = Math.round(amount / rs.totalFederal * 100);
          doc.roundedRect(50, cY, 350, 12, 2).fill('#EEEBE5');
          doc.roundedRect(50, cY, barW, 12, 2).fill(COLORS.red);
          doc.fontSize(8).fillColor(COLORS.text).font('Helvetica')
             .text(cat, 410, cY + 1, { width: 120 });
          doc.text('$' + (amount / 1e6).toFixed(1) + 'M (' + pct + '%)', 530, cY + 1, { width: 50 });
          cY += 17;
        }
        cY += 10;
        doc.moveTo(50, cY).lineTo(562, cY).stroke('#F0EDE8');
        cY += 12;

        // Project list
        doc.fontSize(12).fillColor(COLORS.text).font('Helvetica-Bold')
           .text('Largest Projects', 50, cY);
        cY += 18;

        doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold');
        doc.text('PROJECT', 50, cY); doc.text('FEDERAL $', 380, cY); doc.text('CATEGORY', 450, cY);
        cY += 14;

        doc.font('Helvetica');
        for (const p of rs.projects.slice(0, 6)) {
          doc.fontSize(8).fillColor(COLORS.text);
          doc.text(p.title.substring(0, 55), 50, cY, { width: 320 });
          doc.fillColor(COLORS.gradeA).text('$' + (p.federal / 1e6).toFixed(1) + 'M', 380, cY, { width: 60 });
          doc.fontSize(7).fillColor(COLORS.muted).text((p.category || '').substring(0, 25), 450, cY, { width: 110 });
          cY += 12;
          // Recipient line
          if (p.recipient) {
            doc.fontSize(6).fillColor(COLORS.muted).text('Recipient: ' + p.recipient.substring(0, 60), 60, cY);
            cY += 10;
          }
          cY += 4;
        }

        if (rs.projects.length > 6) {
          doc.fontSize(8).fillColor(COLORS.muted).text('+ ' + (rs.projects.length - 6) + ' more projects', 50, cY + 5);
        }
      }

      doc.fontSize(7.5).fillColor('#A9A49C')
         .text('Source: Infrastructure Canada Open Data \u00b7 Open Canada Grants & Contributions', 50, 676, { align: 'center', width: W });
      drawSourceButton(doc, 690, 'View Infrastructure Canada project map \u2192', 'https://www.infrastructure.gc.ca/gmap-gcarte/index-eng.html', W);
      drawPageFooter(doc, W);
    }
  }

  // ════════ PAGE 5: MP EXPENSES ═════════════════════════════════════════
  if (expenseData) {
    const exp = expenseData[riding.ridingCode];
    if (exp && exp.totalQ3 > 0) {
      doc.addPage();
      doc.rect(0, 0, 612, 6).fill(COLORS.red);

      doc.fontSize(22).fillColor(COLORS.text).font('Helvetica-Bold')
         .text('MP Expense Report', 50, 30);
      doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica')
         .text(`${exp.mpName}  |  Q3 2025-26 (Oct-Dec 2025)  |  House of Commons Proactive Disclosure`, 50, 58);
      doc.moveTo(50, 78).lineTo(562, 78).stroke(COLORS.border);

      const expItems = [
        { label: 'Staff Salaries',     amount: exp.salaries,     pct: exp.totalQ3 > 0 ? Math.round(exp.salaries / exp.totalQ3 * 100) : 0 },
        { label: 'Travel',             amount: exp.travel,       pct: exp.totalQ3 > 0 ? Math.round(exp.travel / exp.totalQ3 * 100) : 0 },
        { label: 'Hospitality',        amount: exp.hospitality,  pct: exp.totalQ3 > 0 ? Math.round(exp.hospitality / exp.totalQ3 * 100) : 0 },
        { label: 'Contracts',          amount: exp.contracts,    pct: exp.totalQ3 > 0 ? Math.round(exp.contracts / exp.totalQ3 * 100) : 0 },
      ];

      let eY = 95;
      for (const item of expItems) {
        doc.fontSize(12).fillColor(COLORS.text).font('Helvetica-Bold')
           .text(item.label, 50, eY);
        doc.fontSize(12).fillColor(item.amount > 0 ? COLORS.text : COLORS.muted)
           .text('$' + Math.abs(item.amount).toLocaleString('en-CA'), 300, eY, { width: 120, align: 'right' });
        doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
           .text(item.pct + '% of total', 430, eY + 2);

        // Bar
        const barW = Math.max(0, (Math.abs(item.amount) / exp.totalQ3) * 400);
        doc.roundedRect(50, eY + 20, 400, 10, 2).fill('#EEEBE5');
        if (barW > 0) doc.roundedRect(50, eY + 20, barW, 10, 2).fill(COLORS.red);
        eY += 42;
      }

      doc.moveTo(50, eY).lineTo(562, eY).stroke(COLORS.text);
      eY += 8;
      doc.fontSize(14).fillColor(COLORS.text).font('Helvetica-Bold')
         .text('Q3 Total:', 50, eY);
      doc.text('$' + exp.totalQ3.toLocaleString('en-CA'), 300, eY, { width: 120, align: 'right' });
      doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica')
         .text('Annualized estimate: ~$' + exp.annualEstimate.toLocaleString('en-CA'), 50, eY + 22);

      doc.fontSize(7.5).fillColor('#A9A49C')
         .text('Source: House of Commons Proactive Disclosure  \u00b7  Q3 2025-26 (Oct\u2013Dec 2025)', 50, eY + 50, { align: 'center', width: W });
      drawSourceButton(doc, eY + 66, 'View Q3 2025-26 MP expenses on ourcommons.ca \u2192', 'https://www.ourcommons.ca/ProactiveDisclosure/en/members/2b0d1a58-f2f2-46c1-bdcd-c6076f38a32e', W);
      drawPageFooter(doc, W);
    }
  }

  // ════════ PAGE 6: COMPARISON + QUESTIONS ═══════════════════════════════
  doc.addPage();
  doc.rect(0, 0, 612, 6).fill(COLORS.red);

  doc.fontSize(22).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('How You Compare', 50, 30);

  const sorted = [...allRidings].sort((a, b) => b.composite - a.composite);
  const rank = sorted.findIndex(r => r.ridingCode === riding.ridingCode) + 1;
  const provRidings = sorted.filter(r => r.province === riding.province);
  const provRank = provRidings.findIndex(r => r.ridingCode === riding.ridingCode) + 1;

  doc.fontSize(13).fillColor(COLORS.text).font('Helvetica')
     .text(`National rank:  #${rank} of ${allRidings.length}`, 50, 62)
     .text(`Provincial rank (${riding.province}):  #${provRank} of ${provRidings.length}`, 50, 80);

  // Comparable ridings table
  doc.fontSize(16).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('Comparable Ridings', 50, 110);

  const comparables = provRidings
    .filter(r => r.ridingCode !== riding.ridingCode)
    .sort((a, b) => Math.abs(a.composite - riding.composite) - Math.abs(b.composite - riding.composite))
    .slice(0, 5);

  let tY = 135;
  doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold');
  doc.text('RIDING', 50, tY); doc.text('MP', 230, tY); doc.text('PARTY', 380, tY);
  doc.text('GRADE', 460, tY); doc.text('SCORE', 510, tY);
  tY += 14;
  doc.moveTo(50, tY).lineTo(562, tY).stroke(COLORS.border);
  tY += 6;

  // Highlighted row (your riding)
  doc.rect(46, tY - 3, W + 8, 18).fill('#FFF0EF');
  doc.fontSize(9).fillColor(COLORS.red).font('Helvetica-Bold');
  doc.text(riding.name.substring(0, 32), 50, tY);
  doc.text((riding.mpName || '').substring(0, 22), 230, tY);
  doc.text(riding.mpParty || '', 380, tY);
  doc.text(riding.grade, 460, tY);
  doc.text(`${riding.composite}`, 510, tY);
  tY += 22;

  doc.font('Helvetica').fillColor(COLORS.text);
  for (const c of comparables) {
    doc.fontSize(9);
    doc.text(c.name.substring(0, 32), 50, tY);
    doc.text((c.mpName || '').substring(0, 22), 230, tY);
    doc.text(c.mpParty || '', 380, tY);
    doc.fillColor(gradeColor(c.grade)).text(c.grade, 460, tY);
    doc.fillColor(COLORS.text).text(`${c.composite}`, 510, tY);
    tY += 18;
  }

  // Questions to ask your MP
  tY += 30;
  doc.fontSize(16).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('Questions to Ask Your MP', 50, tY);
  tY += 25;
  doc.fontSize(10).fillColor(COLORS.sub).font('Helvetica');

  const questions = [];
  if (!cats.performance?.score || cats.performance.score < 50)
    questions.push('How many House votes have you attended this session, and what is your participation rate compared to other MPs?');
  if (!cats.investment?.score || cats.investment.score < 50)
    questions.push('What federal infrastructure grants has this riding received in the past 3 years, and how does that compare to similar ridings?');
  if (cats.electoral?.voterTurnoutPct && cats.electoral.voterTurnoutPct < 65)
    questions.push(`Voter turnout in this riding was ${cats.electoral.voterTurnoutPct}%. What are you doing to encourage democratic participation?`);
  if (cats.demographics?.unemploymentRate && cats.demographics.unemploymentRate > 7)
    questions.push(`The unemployment rate here is ${cats.demographics.unemploymentRate}%. What federal programs are you advocating for to support job creation?`);
  if (cats.transfers?.equalizationPerCapita != null && cats.transfers.equalizationPerCapita === 0)
    questions.push('This province does not receive equalization payments. How are you ensuring federal investment still flows back to our community?');
  questions.push('What is your top priority for this riding in the next parliamentary session, and how will you measure success?');

  for (const q of questions) {
    const h = doc.heightOfString(`   ${q}`, { width: W - 20 });
    doc.text(`   ${q}`, 55, tY, { width: W - 20 });
    // Bullet
    doc.circle(60, tY + 5, 2.5).fill(COLORS.red);
    tY += h + 10;
  }

  // MP contact block
  tY += 20;
  doc.moveTo(50, tY).lineTo(562, tY).stroke(COLORS.border);
  tY += 12;
  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold')
     .text('MP or staff? Help us improve accuracy.', 50, tY);
  tY += 16;
  doc.fontSize(9).fillColor(COLORS.sub).font('Helvetica')
     .text('If any data in this report is inaccurate, visit bangforyourduck.ca/methodology or email corrections@bangforyourduck.ca with the riding name, the data point in question, and supporting documentation.', 50, tY, { width: W });

  drawPageFooter(doc, W);

  doc.end();
  return new Promise(resolve => stream.on('finish', resolve));
}

async function main() {
  console.log('[reports] Reading JSON data...');
  const mpsData = JSON.parse(fs.readFileSync(path.join(API_DIR, 'mps.json'), 'utf8'));
  const ridings = mpsData.ridings;

  let voteRecords = null, spendingData = null, expenseData = null;
  try { voteRecords = JSON.parse(fs.readFileSync(path.join(API_DIR, 'vote-records.json'), 'utf8')); } catch {}
  try { spendingData = JSON.parse(fs.readFileSync(path.join(API_DIR, 'riding-spending.json'), 'utf8')); } catch {}
  try { expenseData = JSON.parse(fs.readFileSync(path.join(API_DIR, 'mp-expenses.json'), 'utf8')); } catch {}

  console.log(`[reports] ${ridings.length} ridings | votes: ${voteRecords ? Object.keys(voteRecords).length : 0} | spending: ${spendingData ? Object.keys(spendingData).length : 0} | expenses: ${expenseData ? Object.keys(expenseData).length : 0}`);

  const ridingsDir = path.join(REPORTS_DIR, 'ridings');
  fs.mkdirSync(ridingsDir, { recursive: true });

  console.log('[reports] Generating PDFs...');
  let count = 0;
  for (const riding of ridings) {
    const slug = riding.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u2014\u2013\- ]/g, '').replace(/\s+/g, '-').toLowerCase();
    const filename = `${riding.ridingCode}-${slug}.pdf`;
    await generateRidingPDF(riding, ridings, path.join(ridingsDir, filename), { voteRecords, spendingData, expenseData });
    count++;
    if (count % 50 === 0) console.log(`  [${count}/${ridings.length}]`);
  }

  console.log(`\n[reports] Done: ${count} PDFs in reports/ridings/`);

  const index = ridings.map(r => ({
    code: r.ridingCode,
    name: r.name,
    file: `${r.ridingCode}-${r.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u2014\u2013\- ]/g, '').replace(/\s+/g, '-').toLowerCase()}.pdf`,
  }));
  fs.writeFileSync(path.join(REPORTS_DIR, 'index.json'), JSON.stringify(index));
}

main().catch(err => { console.error('[reports] Fatal:', err); process.exit(1); });
