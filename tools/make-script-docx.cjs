// Собирает Word-документ с полным текстом озвучки на английском: node tools/make-script-docx.cjs
const fs = require('fs'), vm = require('vm'), path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, Footer, PageNumber } = require('docx');

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/content.js'), 'utf8'), ctx);
const M = ctx.window.MUSEUM, LANG = 'en';
const byId = Object.fromEntries(M.items.map(i => [i.id, i]));
const words = t => t.trim().split(/\s+/).length;
const mmss = w => { const s = Math.round(w / 150 * 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const INK = '2B2118', GOLD = '8A6A1F', GREY = '6B6258';

const sections = [
  { id: 'exhibition-waiting', n: '', title: M.exhibition[LANG], text: M.intro[LANG], label: 'Introduction to the exhibition' },
  ...['hall-left', 'regalia', 'yatagan', 'medicine-chests', 'death-mask',
      'hall-right', 'jewellery', 'prince-mihailo', 'ljubica-hair', 'order-milos', 'draga-monogram',
      'hall-medieval'].map(id => ({ id, n: byId[id].n, title: byId[id].title[LANG], text: byId[id].text[LANG], hall: byId[id].type === 'hall' }))
];

const children = [];
children.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 60 }, children: [new TextRun({ text: 'SERBIAN HISTORICAL MUSEUM', bold: true, size: 20, color: GOLD, characterSpacing: 40 })] }));
children.push(new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 80 }, children: [new TextRun({ text: 'Audio guide script', font: 'Georgia', size: 56, bold: true, color: INK })] }));
children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `${M.exhibition[LANG]} · English narration`, font: 'Georgia', size: 28, italics: true, color: GREY })] }));

const total = sections.reduce((a, s) => a + words(s.text), 0);
children.push(new Paragraph({ spacing: { after: 120 }, border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 8 } }, children: [
  new TextRun({ text: `${sections.length} recordings · about ${words(sections.map(s => s.text).join(' ')) } words · roughly ${mmss(total)} minutes at a calm pace (150 words per minute).`, size: 22, color: GREY })] }));
children.push(new Paragraph({ spacing: { after: 360 }, children: [
  new TextRun({ text: 'Notes for the narrator. ', bold: true, size: 22, color: INK }),
  new TextRun({ text: 'Read each section as a separate file, in the order shown. Say the title first, then pause for a moment before the text. Read “I” in a ruler’s name as “the First” (Peter the First, Alexander the First). A pronunciation guide is at the end. This is a draft translation and should be proofread before recording.', size: 22, color: INK })] }));

for (const s of sections) {
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 360, after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D9CDB4', space: 4 } },
    children: [new TextRun({ text: (s.n ? `${s.n}  ·  ` : '') + s.title, font: 'Georgia', bold: true, size: 32, color: INK })] }));
  const meta = `File: ${s.id}.en.mp3   ·   ${words(s.title + '. ' + s.text)} words   ·   about ${mmss(words(s.title + '. ' + s.text))}` + (s.n ? `   ·   Plaque ${s.n}` : '');
  children.push(new Paragraph({ keepNext: true, spacing: { after: 140 }, children: [new TextRun({ text: meta, size: 18, color: GOLD, bold: true })] }));
  s.text.split(String.fromCharCode(10, 10)).forEach(p => children.push(new Paragraph({ spacing: { after: 160, line: 340 }, children: [new TextRun({ text: p, font: 'Georgia', size: 24, color: INK })] })));
}

// pronunciation guide
const pron = [
  ['Karađorđe', 'KAH-rah-JOR-jeh'], ['Karađorđević', 'kah-rah-JOR-jeh-vitch'], ['Obrenović', 'oh-BREH-noh-vitch'],
  ['Miloš', 'MEE-losh'], ['Mihailo (Michael)', 'mee-HAH-ee-loh'], ['Draga', 'DRAH-gah'], ['Ljubica', 'LYOO-bee-tsah'],
  ['Dimitrije Avramović', 'dee-MEE-tree-yeh ah-VRAH-moh-vitch'], ['Vuk Karadžić', 'VOOK KAH-rah-jitch'],
  ['Borisavljević', 'boh-ree-SAHV-lyeh-vitch'], ['Nova Varoš', 'NOH-vah VAH-rosh'], ['Simić', 'SEE-mitch'],
  ['Goldštajn', 'GOLD-shtine'], ['Barthou', 'bar-TOO'], ['Marseille', 'mar-SAY'], ['yatagan', 'YAT-uh-gan'],
  ['Nemanjić', 'neh-MAH-nyitch'], ['Lazarević', 'LAH-zah-reh-vitch'], ['Branković', 'BRAHN-koh-vitch'],
  ['Vojislavljević', 'voy-ee-SLAHV-lyeh-vitch'], ['Kosovo', 'KOH-soh-voh'], ['Topčider', 'TOP-chee-der']
];
const W = [3400, 5626], cell = (t, i, head) => new TableCell({ width: { size: W[i], type: WidthType.DXA }, shading: head ? { type: ShadingType.CLEAR, fill: 'F1E8D3', color: 'auto' } : undefined,
  margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: t, size: 22, bold: !!head || i === 0, color: INK })] })] });
children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 160 }, children: [new TextRun({ text: 'Pronunciation guide', font: 'Georgia', bold: true, size: 32, color: INK })] }));
children.push(new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: W, rows: [new TableRow({ tableHeader: true, children: [cell('Name', 0, true), cell('Say it like', 1, true)] }),
  ...pron.map(([a, b]) => new TableRow({ cantSplit: true, children: [cell(a, 0), cell(b, 1)] }))] }));

const doc = new Document({
  creator: 'Serbian Historical Museum guide', title: 'Audio guide script (English)',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [{ id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true }, paragraph: { outlineLevel: 0 } }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Audio guide script · English · page ', size: 18, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GREY })] })] }) },
    children }]
});
const out = path.join(__dirname, '../docs/Audio-guide-script-EN.docx');
fs.mkdirSync(path.dirname(out), { recursive: true });
Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('written', out, b.length); });
