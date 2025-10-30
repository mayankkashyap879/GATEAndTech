export function calculateSpamScore(text: string): number {
  let score = 0;

  if (text.length < 3) {
    score += 50;
  }

  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlPattern) || [];
  if (urls.length > 3) {
    score += 30;
  } else if (urls.length > 1) {
    score += 15;
  }

  const capsPattern = /[A-Z]/g;
  const capsCount = (text.match(capsPattern) || []).length;
  const capsRatio = capsCount / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    score += 25;
  }

  const repeatedCharsPattern = /(.)\1{4,}/g;
  if (repeatedCharsPattern.test(text)) {
    score += 20;
  }

  const spamKeywords = ['buy now', 'click here', 'limited offer', 'act now', 'free money', 'winner', 'congratulations'];
  const lowerText = text.toLowerCase();
  for (const keyword of spamKeywords) {
    if (lowerText.includes(keyword)) {
      score += 15;
    }
  }

  return Math.min(score, 100);
}

export function isSpam(text: string, threshold: number = 50): boolean {
  return calculateSpamScore(text) >= threshold;
}
