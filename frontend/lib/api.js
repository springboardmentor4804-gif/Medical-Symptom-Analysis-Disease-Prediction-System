export const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('CUSTOM_API_URL')) {
    return window.localStorage.getItem('CUSTOM_API_URL').replace(/\/+$/, '');
  }
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url && url.trim()) {
    return url.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  return 'https://medical-symptom-analysis-disease-46je.onrender.com';
};

export const request = async (endpoint, options = {}) => {
  const API_URL = getApiUrl();
  let token = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    token = window.localStorage.getItem('token');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let response;
  let lastErr;

  // Retry loop for Render cold-starts or network blips
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(`${API_URL}${formattedEndpoint}`, config);
      lastErr = null;
      if (response.ok || (response.status !== 502 && response.status !== 503 && response.status !== 504)) {
        break;
      }
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  if (lastErr || !response) {
    throw new Error(
      `Cannot connect to Backend API at [${API_URL}]. ${lastErr?.message || 'Server did not respond.'}`
    );
  }

  if (!response.ok) {
    let errorMsg = `Server error (${response.status}): Request failed at ${formattedEndpoint}.`;
    try {
      const clone = response.clone();
      try {
        const errorData = await clone.json();
        if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('; ');
        } else if (errorData.detail && typeof errorData.detail === 'object') {
          errorMsg = JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (jsonErr) {
        const textContent = await response.text();
        if (textContent.includes('<title>')) {
          const match = textContent.match(/<title>(.*?)<\/title>/i);
          if (match && match[1]) {
            errorMsg = `Server error (${response.status}): ${match[1].trim()}`;
          }
        } else if (textContent.trim()) {
          errorMsg = `Server error (${response.status}): ${textContent.slice(0, 150)}`;
        }
      }
    } catch (e) {
      // Ignore text extraction fallback failures
    }

    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  downloadFile: async (endpoint, defaultFilename = 'health_report.pdf') => {
    const API_URL = getApiUrl();
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let response;
    try {
      response = await fetch(`${API_URL}${formattedEndpoint}`, { method: 'GET', headers });
    } catch (err) {
      const fallbackUrl = API_URL.startsWith('http://')
        ? API_URL.replace('http://', 'https://')
        : 'http://127.0.0.1:8000';
      response = await fetch(`${fallbackUrl}${formattedEndpoint}`, { method: 'GET', headers });
    }
    if (!response.ok) {
      throw new Error('Failed to download PDF report');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};



