async function apiCall(url, apiKey) {
  const res = await fetch(url, {
    headers: { Authorization: apiKey }
  });
  
  const text = await res.text();
  if (!res.ok) throw new Error(`API error ${res.status}: ${text.slice(0, 120)}`);

  try {
    const json = JSON.parse(text);
    return json.result !== undefined ? json.result : json; 
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 120)}`);
  }
}

function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

async function getUserBalance({ baseUrl, pathTemplate, apiKey, user, balancePath }) {
  const rawUser = String(user || '').trim();
  const variants = [...new Set([rawUser, rawUser.toLowerCase()].filter(Boolean))];
  let fallbackBalance;
  let lastError;
  for (let i = 0; i < variants.length; i++) {
    const candidate = variants[i];
    const url = `${baseUrl}${pathTemplate.replace('{user}', encodeURIComponent(candidate))}`;
    try {
      const data = await apiCall(url, apiKey);
      const val = getByPath({ result: data }, balancePath) ?? getByPath(data, balancePath);
      const num = Number(val);
      const balance = Number.isFinite(num) ? Math.trunc(num) : 0;
      if (balance !== 0 || i === variants.length - 1) return balance;
      fallbackBalance = balance;
    } catch (e) {
      lastError = e;
    }
  }
  if (fallbackBalance !== undefined) return fallbackBalance;
  throw lastError || new Error('Balance lookup failed');
}

module.exports = { getUserBalance };
