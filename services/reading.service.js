function clampProgress(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function getPreviewContent(fullText, previewPercent = 12) {
  if (!fullText || typeof fullText !== 'string') return '';

  const minChars = 1200;
  const charLimit = Math.max(minChars, Math.floor((fullText.length * previewPercent) / 100));
  const preview = fullText.slice(0, charLimit);

  // Avoid cutting in the middle of a sentence where possible.
  const lastSentenceEnd = Math.max(preview.lastIndexOf('. '), preview.lastIndexOf('\n\n'));
  if (lastSentenceEnd > 600) {
    return preview.slice(0, lastSentenceEnd + 1).trim();
  }

  return preview.trim();
}

module.exports = {
  clampProgress,
  getPreviewContent
};
