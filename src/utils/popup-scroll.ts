// Multiple dialogs may overlap; only the last one to close restores page scrolling.
const owners = new Set<HTMLDialogElement>();
let previousOverflow = '';
let previousScroll = 0;

export function lockPopupScroll(dialog: HTMLDialogElement) {
  if (owners.has(dialog)) return;
  if (!owners.size) {
    previousOverflow = document.documentElement.style.overflow;
    previousScroll = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
  }
  owners.add(dialog);
}

export function unlockPopupScroll(dialog: HTMLDialogElement) {
  if (!owners.delete(dialog) || owners.size) return;
  document.documentElement.style.overflow = previousOverflow;
  window.scrollTo({ top: previousScroll, behavior: 'instant' });
}
