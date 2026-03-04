/**
 * Build a curl command string from request parameters.
 */
export function generateCurl(method, url, headers, body, verbose = true) {
  let cmd = 'curl';
  if (verbose) cmd += ' -v';
  cmd += ` -X ${method}`;
  if (headers.trim()) {
    headers
      .split('\n')
      .filter(Boolean)
      .forEach((h) => {
        cmd += ` \\\n  -H '${h.trim()}'`;
      });
  }
  if (body.trim() && !['GET', 'HEAD', 'DELETE'].includes(method)) {
    cmd += ` \\\n  -d '${body.replace(/\n/g, '')}'`;
  }
  cmd += ` \\\n  '${url}'`;
  return cmd;
}

export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];

export const METHOD_COLORS = {
  GET: '#22d3ee',
  POST: '#a3e635',
  PUT: '#fbbf24',
  PATCH: '#c084fc',
  DELETE: '#f87171',
  HEAD: '#94a3b8',
};

/**
 * Copy text to clipboard — works in all contexts (no iframe restrictions locally).
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}
