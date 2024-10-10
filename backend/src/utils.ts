import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { TrendingTopic } from './types';

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

export function ensureId(item: TrendingTopic): TrendingTopic {
    if (!item.id) {
      // 生成一个以 'g-' 开头的 UUID，以区分自动生成的 ID
      item.id = 'g-' + uuidv4();
    } else if (!/^\d+$/.test(item.id)) {
      // 如果 ID 不是纯数字，也生成一个新的 ID
      item.id = 'g-' + uuidv4();
    }
    return item;
  }
  
  export function ensureIdsForItems(items: TrendingTopic[]): TrendingTopic[] {
    return items.map(ensureId);
  }