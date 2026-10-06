import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'TMC Pre-Task Planning',
  description: 'Record your pre-task plan and review it with the TMC Safety Agent',
  appleWebApp: { capable: true, title: 'Pre-Task Plan', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
