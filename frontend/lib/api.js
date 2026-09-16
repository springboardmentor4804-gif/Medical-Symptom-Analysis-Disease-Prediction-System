export const getApiUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url === 'http://localhost:8000' || url === 'http://127.0.0.1:8000') {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      url = 'https://medical-symptom-analysis-disease-46je.onrender.com';
    }
  }
  return (url || 'http://localhost:8000').replace(/\/+$/, '');
};

export const request = async (endpoint, options = {}) => {
  const API_URL = getApiUrl();
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
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
  try {
    response = await fetch(`${API_URL}${formattedEndpoint}`, config);
  } catch (fetchErr) {
    // Try HTTPS fallback if HTTP failed, or vice versa
    let fallbackUrl = null;
    if (API_URL.startsWith('http://')) {
      fallbackUrl = API_URL.replace('http://', 'https://');
    } else if (API_URL.includes('localhost')) {
      fallbackUrl = API_URL.replace('localhost', '127.0.0.1');
    }

    if (fallbackUrl) {
      try {
        response = await fetch(`${fallbackUrl}${formattedEndpoint}`, config);
      } catch (fallbackErr) {
        throw new Error(`Unable to connect to backend server at ${API_URL}. Please ensure the backend is active on Render.`);
      }
    } else {
      throw new Error(`Unable to connect to backend server at ${API_URL}. Please check your connection or backend server status on Render.`);
    }
  }

  if (!response.ok) {
    let errorMsg = 'Something went wrong';
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMsg = errorData.detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'object') {
        errorMsg = JSON.stringify(errorData.detail);
      } else if (errorData.message) {
        errorMsg = errorData.message;
      }
    } catch (e) {
      // response might not be json
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
        : API_URL.replace('localhost', '127.0.0.1');
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


