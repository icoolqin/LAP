import { URL } from 'url';

export function extractMainDomain(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    const domainParts = hostname.split('.');

    // Remove subdomains like 'www', 'm', etc.
    if (domainParts.length >= 2) {
      return domainParts.slice(-2).join('.');
    } else {
      return hostname;
    }
  } catch (error) {
    return null;
  }
}
