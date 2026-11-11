import { fortuneHeading, fortuneSignature } from '../content/fortunes';
import paperCard from '../assets/fortune/paper-card.svg';

function wrapLines(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  return [...lines, line];
}

export async function downloadFortuneCard(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');

  const bodyFont = '500 44px "Advent STIX", Georgia, serif';
  const headingFont = '700 21px "Advent Inter", sans-serif';
  const signatureFont = 'italic 500 26px "Advent Inter", sans-serif';
  const paper = new Image();
  paper.src = paperCard;
  await Promise.all([
    paper.decode(),
    document.fonts.load(bodyFont, text),
    document.fonts.load(headingFont, fortuneHeading),
    document.fonts.load(signatureFont, fortuneSignature),
  ]);

  context.font = bodyFont;
  const lines = wrapLines(context, text, 608);
  const lineHeight = 53;
  const bodyTop = 133;
  const signatureTop = bodyTop + lines.length * lineHeight + 22;
  canvas.height = signatureTop + 81;

  context.drawImage(paper, 0, 0, canvas.width, canvas.height);
  context.textBaseline = 'top';
  context.fillStyle = '#a7280b';
  context.font = headingFont;
  context.fillText(fortuneHeading.toLocaleUpperCase('ru-RU'), 56, 63);
  context.fillStyle = '#623c28';
  context.font = bodyFont;
  lines.forEach((line, index) => context.fillText(line, 56, bodyTop + index * lineHeight));
  context.fillStyle = '#a7280b';
  context.font = signatureFont;
  context.fillText(fortuneSignature, 56, signatureTop);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not export card');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'пожелание-герофарм-2027.png';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
