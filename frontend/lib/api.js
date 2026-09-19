export const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('CUSTOM_API_URL')) {
    return window.localStorage.getItem('CUSTOM_API_URL').replace(/\/+$/, '');
  }
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost) {
      if (!url || url.includes('onrender.com')) {
        return 'http://127.0.0.1:8000';
      }
      return url.replace(/\/+$/, '');
    }
  }
  return (url || 'https://medical-symptom-analysis-disease-46je.onrender.com').replace(/\/+$/, '');
};

export const request = async (endpoint, options = {}) => {
  const primaryUrl = getApiUrl();
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

  // Candidate URLs to attempt (Primary URL, then secondary fallbacks)
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const candidateUrls = [primaryUrl];

  if (isLocalhost) {
    if (!candidateUrls.includes('http://127.0.0.1:8000')) candidateUrls.push('http://127.0.0.1:8000');
    if (!candidateUrls.includes('http://localhost:8000')) candidateUrls.push('http://localhost:8000');
    if (!candidateUrls.includes('https://medical-symptom-analysis-disease-46je.onrender.com')) {
      candidateUrls.push('https://medical-symptom-analysis-disease-46je.onrender.com');
    }
  } else {
    if (!candidateUrls.includes('https://medical-symptom-analysis-disease-46je.onrender.com')) {
      candidateUrls.push('https://medical-symptom-analysis-disease-46je.onrender.com');
    }
  }

  let response;
  let lastErr;
  let activeUrl = primaryUrl;

  for (const targetUrl of candidateUrls) {
    activeUrl = targetUrl;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(`${targetUrl}${formattedEndpoint}`, config);
        // If request returned a status other than 404 / 502 connection drop, break
        if (response.ok || (response.status !== 404 && response.status !== 502 && response.status !== 503)) {
          lastErr = null;
          break;
        }
        lastErr = new Error(`Server status ${response.status}`);
      } catch (err) {
        lastErr = err;
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    if (response && response.ok) break;
  }

  if (!response) {
    throw new Error(
      `Cannot connect to Backend API at [${primaryUrl}]. Please ensure the backend server is running (e.g. uvicorn main:app on port 8000).`
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

    if (response.status === 404) {
      errorMsg = `Endpoint Not Found (404): [${formattedEndpoint}]. Please check if your backend service is running and up to date.`;
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



