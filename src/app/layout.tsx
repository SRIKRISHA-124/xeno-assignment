import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ReachIQ - AI-Native Mini CRM',
  description: 'Chat-first campaign agent, audience segment engine, and real-time marketing analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
      </head>
      <body className="bg-background text-foreground h-screen flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-[#0c0c0e] flex flex-col h-full shrink-0">
          {/* Logo Brand */}
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                ReachIQ
              </h1>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider glow-text-indigo">AI Native CRM</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </Link>

            <Link href="/campaign" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              AI Campaign Agent
            </Link>

            <Link href="/customers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Customers
            </Link>

            <Link href="/history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Campaign History
            </Link>

            <Link href="/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
              <svg className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </Link>
          </nav>

          {/* Connection Status badges */}
          <div className="p-4 border-t border-border bg-[#08080a] space-y-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">System Status</div>
            
            {/* Database Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Database:</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${process.env.SUPABASE_URL ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className={process.env.SUPABASE_URL ? 'text-emerald-400' : 'text-amber-400 font-medium'}>
                  {process.env.SUPABASE_URL ? 'Supabase' : 'Local JSON'}
                </span>
              </div>
            </div>

            {/* AI Engine Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">AI Model:</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${process.env.GEMINI_API_KEY ? 'bg-indigo-500 animate-pulse' : 'bg-blue-500'}`}></span>
                <span className={process.env.GEMINI_API_KEY ? 'text-indigo-400' : 'text-blue-400 font-medium'}>
                  {process.env.GEMINI_API_KEY ? 'Gemini 1.5' : 'Mock Engine'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
          {children}
        </main>
      </body>
    </html>
  );
}
