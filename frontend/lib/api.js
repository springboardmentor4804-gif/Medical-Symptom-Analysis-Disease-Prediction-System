const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = rawApiUrl.replace(/\/+$/, '');

export const request = async (endpoint, options = {}) => {
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
    // If primary host fetch fails, try fallback between localhost and 127.0.0.1
    let fallbackUrl = null;
    if (API_URL.includes('localhost')) {
      fallbackUrl = API_URL.replace('localhost', '127.0.0.1');
    } else if (API_URL.includes('127.0.0.1')) {
      fallbackUrl = API_URL.replace('127.0.0.1', 'localhost');
    }

    if (fallbackUrl) {
      try {
        response = await fetch(`${fallbackUrl}${endpoint}`, config);
      } catch (fallbackErr) {
        throw new Error(`Unable to connect to backend server at ${API_URL}. Please ensure the backend server is running on http://127.0.0.1:8000.`);
      }
    } else {
      throw new Error(`Unable to connect to backend server at ${API_URL}. Please check your connection or backend server status.`);
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
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers });
    } catch (err) {
      const fallbackUrl = API_URL.includes('localhost')
        ? API_URL.replace('localhost', '127.0.0.1')
        : API_URL.replace('127.0.0.1', 'localhost');
      response = await fetch(`${fallbackUrl}${endpoint}`, { method: 'GET', headers });
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


