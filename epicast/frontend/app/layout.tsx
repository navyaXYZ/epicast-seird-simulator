import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project EpiCast | SEIRD+W Advanced Epidemiological Intelligence System',
  description:
    'Real-time coupled non-linear ODE epidemiological simulator with dynamic Rt feedback, ICU saturation mortality amplification, and automated policy intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
