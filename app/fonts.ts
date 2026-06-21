import { Newsreader, Hanken_Grotesk, DM_Mono } from 'next/font/google';

/**
 * Fonts via next/font/google. Each exposes a CSS variable consumed by the design
 * system tokens in globals.css:
 *   --font-display -> Newsreader (editorial serif headlines, incl. italic)
 *   --font-ui      -> Hanken Grotesk (interface)
 *   --font-mono    -> DM Mono (prices, tickets, counts)
 * These replace the bundle's @font-face declarations (dropped).
 */
export const display = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

export const ui = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
});

export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const fontVariables = `${display.variable} ${ui.variable} ${mono.variable}`;
