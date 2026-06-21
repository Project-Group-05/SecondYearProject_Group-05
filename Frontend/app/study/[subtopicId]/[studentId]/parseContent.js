export function parseSections(markdown) {
  const normalized = markdown
    .replace(/(\S)(#{2,3}\s)/g, '$1\n$2')
    .replace(/(#{2,3}[^\n]+)(\S)/g, '$1\n$2')
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

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const titleRaw = current[2] !== undefined ? current[2] : current[1];
    const title = titleRaw.trim().replace(/\*\*/g, '').replace(/[:–-]+$/, '').trim();

    const startIdx = current.index + current[0].length;
    const endIdx = next ? next.index : normalized.length;
    const body = normalized.slice(startIdx, endIdx).trim();

    if (body) sections.push({ title, body });
  }

  return sections.map((s, i) => ({ ...s, badge: `Concept ${i + 1} of ${sections.length}` }));
}

