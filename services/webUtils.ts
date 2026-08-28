
/**
 * Web Ingestion Node
 * Fetches external website content via CORS proxy and sanitizes it for the Neural Engine.
 */

export const fetchUrlContent = async (url: string): Promise<string> => {
  let html = '';
  
  // Validate URL
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  // Strategy 1: AllOrigins (JSON wrapper)
  const tryAllOrigins = async () => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Network handshake failed');
    const data = await response.json();
    if (!data.contents) throw new Error('No extracted content');
    return data.contents;
  };

  // Strategy 2: CORSProxy.io (Raw pipe)
  const tryCorsProxy = async () => {
    // Note: corsproxy.io appends the URL directly
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Network handshake failed');
    return await response.text();
  };

  try {
    try {
        html = await tryAllOrigins();
    } catch (e) {
        console.warn("Primary proxy (AllOrigins) failed, attempting failover...", e);
        html = await tryCorsProxy();
    }
    
    if (!html) throw new Error("Empty response from all proxies");

    // Parse HTML on the client side
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 1. Remove non-content noise
    const noiseSelectors = [
      'script', 'style', 'iframe', 'nav', 'footer', 'header', 'noscript', 
      'svg', 'form', 'button', 'input', 'select', 'textarea', 
      '.ad', '.ads', '.advertisement', '.social-share', '.cookie-consent',
      '[role="alert"]', '[role="banner"]', '[role="navigation"]', '[aria-hidden="true"]'
    ];
    
    noiseSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // 2. Target Main Content Area
    // We prioritize specific semantic containers to avoid sidebar garbage
    const contentRoot = doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('.content') || doc.body;
    
    // 3. Structural Extraction
    // Instead of innerText which flattens everything, we collect block elements
    // to preserve paragraph structure for the LLM.
    let structuredText = '';
    const textBlocks = contentRoot.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote');
    
    if (textBlocks.length > 0) {
        textBlocks.forEach(block => {
            const text = (block as HTMLElement).innerText.trim();
            // Filter out short navigational links/garbage that might have survived
            if (text.length > 10 || block.tagName.startsWith('H')) {
                structuredText += text + '\n\n';
            }
        });
    } else {
        // Fallback: If no semantic tags, grab mostly everything but clean it well
        structuredText = contentRoot.innerText;
    }

    // 4. Final Text Normalization
    const cleanText = structuredText
      .replace(/[ \t]+/g, ' ') // Collapse horizontal whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines to double breaks
      .trim();

    // 5. Limit context window (approx 4000 words / 25k chars)
    // We cut it off to prevent token overflow, keeping the beginning which is usually most relevant.
    return cleanText.substring(0, 25000);

  } catch (error: any) {
    console.error("Web Ingestion Failed:", error);
    throw new Error(`Could not read website: ${error.message || "Target blocked or unavailable"}`);
  }
};
