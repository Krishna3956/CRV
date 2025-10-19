// GitHub API utility with token support
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

export const fetchGitHub = async (url: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add authorization token if available
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  // Add default Accept header for GitHub API
  if (!headers['Accept']) {
    headers['Accept'] = 'application/vnd.github.v3.raw';
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
