/** All email copy and presentation live here; no transport or persistence code. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

export function renderGratitudeEmail(letter: { message: string; anonymous: boolean; senderName: string }) {
  const signature = letter.anonymous ? 'Твой тайный Дед Мороз' : letter.senderName;
  // Preserve the original plain-text letter, including its copy and spacing.
  const text = `${letter.message}\n\nС наилучшими пожеланиями,\n${signature}\n\nПраздничная почта ГЕРОФАРМ`;
  return {
    subject: 'Вам письмо благодарности · ГЕРОФАРМ',
    text,
    // Minimal HTML equivalent of the existing unstyled letter. Future branding,
    // colors, images and copy can be changed here without touching the handler.
    html: `<!doctype html><html lang="ru"><head><meta charset="utf-8"></head><body><div style="white-space: pre-wrap">${escapeHtml(text)}</div></body></html>`,
  };
}
