//global.d.ts
declare module 'playwright-extra' {
  import type { BrowserType } from 'playwright';

  export interface Plugin {
    name: string;
    [key: string]: any;
  }

  export interface PlaywrightExtra extends BrowserType {
    use(plugin: Plugin): PlaywrightExtra;
  }

  export const chromium: PlaywrightExtra;
  export const firefox: PlaywrightExtra;
  export const webkit: PlaywrightExtra;
}

declare module 'puppeteer-extra-plugin-stealth' {
  const StealthPlugin: any;
  export default StealthPlugin;
}


