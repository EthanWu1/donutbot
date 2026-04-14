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
  const url = `${baseUrl}${pathTemplate.replace('{user}', encodeURIComponent(user))}`;
  const data = await apiCall(url, apiKey);
  
  const val = getByPath({ result: data }, balancePath) ?? getByPath(data, balancePath);
  const num = Number(val);
  
  if (!Number.isFinite(num)) return 0;
  return Math.trunc(num);
}

module.exports = { getUserBalance };