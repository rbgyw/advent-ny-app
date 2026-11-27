const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

export function futureLetterTemplate(body: string) {
  return {
    subject: 'Ваше письмо себе в будущее · ГЕРОФАРМ',
    text: `Письмо себе в будущее\n\n${body}\n\nС теплом,\nПраздничная почта ГЕРОФАРМ`,
    html: `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><title>Письмо себе в будущее</title></head><body style="font-family:Arial,sans-serif;color:#433126;background:#fff9ef;padding:24px"><main style="max-width:600px;margin:auto"><h1>Письмо себе в будущее</h1><p>Это послание вы сохранили для будущего себя.</p><div style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(body)}</div><p>С теплом,<br>Праздничная почта ГЕРОФАРМ</p></main></body></html>`,
  };
}
