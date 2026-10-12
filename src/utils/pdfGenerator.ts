import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Player, Round, TournamentSettings, PlayerStats } from '../types/chess';
import { rankPlayers } from './tiebreaks';

// Robust constructor resolvers for Vite ESM / CJS interop
const getJsPDF = (): any => {
  return (jsPDF as any).jsPDF || (jsPDF as any).default || jsPDF;
};

const getAutoTable = (): any => {
  return (autoTable as any).default || (autoTable as any).autoTable || autoTable;
};

/**
 * Universal browser download trigger with multiple fallback strategies
 */
export function downloadBlobFile(blob: Blob, filename: string): boolean {
  try {
    // Strategy 1: URL.createObjectURL on temporary DOM anchor
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        // cleanup ignore
      }
    }, 1500);

    return true;
  } catch (err) {
    console.warn('URL.createObjectURL download failed:', err);
    return false;
  }
}

/**
 * Generates and downloads FIDE Round Pairing PDF
 */
export function exportRoundToPDF(
  round: Round,
  players: Player[],
  statsMap: Map<string, PlayerStats>,
  settings: TournamentSettings
): boolean {
  try {
    const JsPDFClass = getJsPDF();
    const autoTableFn = getAutoTable();

    const doc = new JsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const playerMap = new Map(players.map(p => [p.id, p]));

    // Tournament Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.name, 14, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`PAIRINGS & RESULTS - ROUND ${round.roundNumber}`, 14, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Chief Arbiter: ${settings.chiefArbiter}  |  Location: ${settings.location}  |  Time Control: ${settings.timeControl}`, 14, 31);
    doc.text(`Date & Time: ${new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`, 14, 36);

    // Ensure pairings are sorted by boardNumber descending points
    const sortedPairings = [...round.pairings].sort((a, b) => a.boardNumber - b.boardNumber);

    // Clean Table Data with dedicated columns for Name, Rating, Points, Result
    const tableRows = sortedPairings.map(m => {
      const white = playerMap.get(m.whitePlayerId);
      const whitePts = statsMap.get(m.whitePlayerId)?.points ?? 0;
      const whiteTitle = white?.title && white.title !== 'None' ? `${white.title} ` : '';
      const whiteName = white ? `${whiteTitle}${white.name}` : 'Unknown';
      const whiteRtg = white ? white.rating.toString() : '-';

      let blackName = 'BYE (1.0 Pt)';
      let blackRtg = '-';
      let blackPtsStr = '-';

      if (m.blackPlayerId !== 'BYE') {
        const black = playerMap.get(m.blackPlayerId);
        const blackPts = statsMap.get(m.blackPlayerId)?.points ?? 0;
        const blackTitle = black?.title && black.title !== 'None' ? `${black.title} ` : '';
        blackName = black ? `${blackTitle}${black.name}` : 'Unknown';
        blackRtg = black ? black.rating.toString() : '-';
        blackPtsStr = blackPts.toFixed(1);
      }

      const resultStr = m.result === 'pending' ? '*' : m.result;

      return [
        m.boardNumber.toString(),
        whiteName,
        whiteRtg,
        whitePts.toFixed(1),
        resultStr,
        blackPtsStr,
        blackRtg,
        blackName,
      ];
    });

    autoTableFn(doc, {
      startY: 42,
      head: [[
        'Meja',
        'Pemain Putih (White)',
        'Rtg',
        'Poin',
        'Hasil',
        'Poin',
        'Rtg',
        'Pemain Hitam (Black)',
      ]],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        valign: 'middle',
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
        1: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
        2: { halign: 'right', cellWidth: 14 },
        3: { halign: 'center', cellWidth: 13, fontStyle: 'bold', textColor: [180, 83, 9] },
        4: { halign: 'center', cellWidth: 18, fontStyle: 'bold', fillColor: [241, 245, 249] },
        5: { halign: 'center', cellWidth: 13, fontStyle: 'bold', textColor: [180, 83, 9] },
        6: { halign: 'right', cellWidth: 14 },
        7: { halign: 'left', cellWidth: 48, fontStyle: 'bold' },
      },
    });

    // Footer & Arbiter Signature
    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('FIDE Swiss-System Pairing Regulations Compliant · Generated by ArbiterPro', 14, finalY + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('Chief Arbiter Signature:', 140, finalY + 14);
    doc.setDrawColor(160, 160, 160);
    doc.line(140, finalY + 28, 195, finalY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.chiefArbiter, 140, finalY + 33);

    const safeName = settings.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_Round_${round.roundNumber}_Pairings.pdf`;

    // Strategy A: Output blob and download
    const blob = doc.output('blob');
    const downloaded = downloadBlobFile(blob, filename);

    // Strategy B: doc.save fallback if browser supports
    if (!downloaded) {
      doc.save(filename);
    }

    return true;
  } catch (error) {
    console.error('Error generating round PDF:', error);
    alert('Terjadi kesalahan saat membuat PDF. Membuka mode cetak (Print to PDF)...');
    window.print();
    return false;
  }
}

/**
 * Generates and downloads Official FIDE Standings PDF
 */
export function exportStandingsToPDF(
  players: Player[],
  statsMap: Map<string, PlayerStats>,
  currentRoundNumber: number,
  settings: TournamentSettings
): boolean {
  try {
    const JsPDFClass = getJsPDF();
    const autoTableFn = getAutoTable();

    const doc = new JsPDFClass({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const rankedData = rankPlayers(players, statsMap);

    // Tournament Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.name, 14, 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`OFFICIAL FIDE STANDINGS & TIE-BREAKS AFTER ROUND ${currentRoundNumber}`, 14, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Chief Arbiter: ${settings.chiefArbiter}  |  Tie-breaks: Buchholz, Sonneborn-Berger, Direct Encounter, Most Wins`, 14, 31);
    doc.text(`Generated: ${new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`, 14, 36);

    // Table Data
    const tableRows = rankedData.map(r => {
      const p = r.player;
      const s = r.stats;
      const titleStr = p.title && p.title !== 'None' ? `${p.title} ` : '';
      const colDiffStr = s.colorDifference > 0 ? `+${s.colorDifference}` : `${s.colorDifference}`;

      return [
        s.rank.toString(),
        p.seed.toString(),
        `${titleStr}${p.name}`,
        p.federation || 'INA',
        p.rating.toString(),
        s.points.toFixed(1),
        s.buchholz.toFixed(1),
        s.buchholzCut1.toFixed(1),
        s.sonnebornBerger.toFixed(2),
        s.directEncounterScore.toFixed(1),
        s.progressiveScore.toFixed(1),
        s.wins.toString(),
        colDiffStr,
      ];
    });

    autoTableFn(doc, {
      startY: 42,
      head: [['Rk', 'Seed', 'Player Name', 'Fed', 'Rtg', 'Pts', 'BH', 'BH-1', 'SB', 'DE', 'Prog', 'Wins', 'Col Diff']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: 'middle',
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 12 },
        2: { cellWidth: 55, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 12 },
        4: { halign: 'right', cellWidth: 15 },
        5: { halign: 'right', cellWidth: 14, fontStyle: 'bold', textColor: [180, 83, 9] },
        6: { halign: 'right', cellWidth: 14 },
        7: { halign: 'right', cellWidth: 14 },
        8: { halign: 'right', cellWidth: 16 },
        9: { halign: 'right', cellWidth: 14 },
        10: { halign: 'right', cellWidth: 14 },
        11: { halign: 'center', cellWidth: 14 },
        12: { halign: 'center', cellWidth: 16 },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('FIDE Tie-break Calculations: BH = Buchholz | SB = Sonneborn-Berger | DE = Direct Encounter · ArbiterPro', 14, finalY + 12);

    doc.setFont('helvetica', 'bold');
    doc.text('Chief Arbiter Signature:', 220, finalY + 12);
    doc.setDrawColor(160, 160, 160);
    doc.line(220, finalY + 24, 275, finalY + 24);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.chiefArbiter, 220, finalY + 28);

    const safeName = settings.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_Round_${currentRoundNumber}_Standings.pdf`;

    // Strategy A: Output blob and download
    const blob = doc.output('blob');
    const downloaded = downloadBlobFile(blob, filename);

    // Strategy B: doc.save fallback
    if (!downloaded) {
      doc.save(filename);
    }

    return true;
  } catch (error) {
    console.error('Error generating standings PDF:', error);
    alert('Terjadi kesalahan saat membuat PDF. Membuka mode cetak (Print to PDF)...');
    window.print();
    return false;
  }
}
