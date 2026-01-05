export const formatImageUrl = (url: string | undefined): string => {
  if (!url) return '';

  // Handle relative paths for machine images, assuming they are served by the frontend.
  if (url.startsWith('/machine_images/')) {
    return `${window.location.origin}${url}`;
  }

  const oldIp = 'http://172.20.10.2:3001';
  const newHost = 'http://localhost:3001';
  if (url.startsWith(oldIp)) {
    return url.replace(oldIp, newHost);
  }
  return url;
};
