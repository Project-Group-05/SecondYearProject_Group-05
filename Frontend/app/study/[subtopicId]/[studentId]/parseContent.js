export function parseSections(markdown) {
  const normalized = markdown
    .replace(/(\S)(#{2,3}\s)/g, '$1\n$2')
    .replace(/(#{2,3}\s+\S[^\n]*?)([a-z])([A-Z][a-z])/g, '$1$2\n$3')
    .replace(/(\S)(\*\*\d+\.\s)/g, '$1\n$2');

  // Strategy 1: markdown headings (## or ###), numbered or not
  let matches = [...normalized.matchAll(/\n?#{2,3}\s+([^\n]+)/g)];
  let stripTitle = (t) => t.replace(/\*\*/g, '').trim();

  // Strategy 2: bold numbered lines like **1. Title**
  if (matches.length === 0) {
    matches = [...normalized.matchAll(/\n?\*\*(\d+)\.\s*([^*\n]+)\*\*/g)];
    stripTitle = (t, m) => m[2].trim();
  }

  if (matches.length === 0) {
    return [{ title: 'Overview', badge: 'Concept 1 of 1', body: normalized.trim() }];
  }

  // ---- NEW: explicit topic/content separator ----
  // Given a heading match (current), the next heading match (or undefined),
  // and the full normalized string, returns a clean { topic, content } pair.
  const splitTopicAndContent = (current, next, fullText) => {
    const titleRaw = current[2] !== undefined ? current[2] : current[1];
    const topic = titleRaw
      .trim()
      .replace(/\*\*/g, '')
      .replace(/[:–-]+$/, '')
      .trim();

    const startIdx = current.index + current[0].length;
    const endIdx = next ? next.index : fullText.length;
    const content = fullText.slice(startIdx, endIdx).trim();

    return { topic, content };
  };
  // -------------------------------------------------

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const { topic, content } = splitTopicAndContent(current, next, normalized);

    if (content) {
      sections.push({ title: topic, body: content });
    }
  }

  return sections.map((s, i) => ({ ...s, badge: `Concept ${i + 1} of ${sections.length}` }));
}

// Exported standalone so it can be reused/tested independently of parseSections.
export function splitTopicAndContent(headingMatch, nextHeadingMatch, fullText) {
  const titleRaw = headingMatch[2] !== undefined ? headingMatch[2] : headingMatch[1];
  const topic = titleRaw
    .trim()
    .replace(/\*\*/g, '')
    .replace(/[:–-]+$/, '')
    .trim();

  const startIdx = headingMatch.index + headingMatch[0].length;
  const endIdx = nextHeadingMatch ? nextHeadingMatch.index : fullText.length;
  const content = fullText.slice(startIdx, endIdx).trim();

  return { topic, content };
}