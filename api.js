export function getApiBaseUrl() {
  const configuredBaseUrl =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//127.0.0.1:5000`;
    }
  }

  return 'http://127.0.0.1:5000';
}

export async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(
    text.includes('<!DOCTYPE')
      ? 'Backend API is not reachable. Start the backend server on port 5000.'
      : text || 'Unexpected server response'
  );
}

export function getFriendlyFetchError(error, fallbackMessage) {
  const message = error?.message || '';

  if (message === 'Failed to fetch' || message.includes('Load failed')) {
    return 'Cannot reach the backend API at http://127.0.0.1:5000. Start the backend server and try again.';
  }

  return message || fallbackMessage;
}
