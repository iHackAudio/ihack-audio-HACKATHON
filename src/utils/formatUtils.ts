export function formatSafeText(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.description) {
      return val.category ? `[${val.category}] ${val.description}` : val.description;
    }
    if (val.text) {
      return val.category ? `[${val.category}] ${val.text}` : val.text;
    }
    if (val.suggestion) {
      return val.category ? `[${val.category}] ${val.suggestion}` : val.suggestion;
    }
    if (val.critique) {
      return val.category ? `[${val.category}] ${val.critique}` : val.critique;
    }
    if (val.issue) {
      return val.fix ? `${val.issue}: ${val.fix}` : val.issue;
    }
    if (val.title) {
      return val.description ? `${val.title}: ${val.description}` : val.title;
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}
