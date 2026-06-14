'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  RefreshCw, 
  Sparkles, 
  Send, 
  ArrowRight,
  TrendingDown,
  Mail,
  Smartphone,
  Check,
  XCircle,
  Clock,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface Campaign {
  id: string;
  name: string;
  intent: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: string;
  created_at: string;
}

interface Metrics {
  totalRevenue: number;
  totalCustomers: number;
  totalCampaigns: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface Callback {
  id: string;
  campaign_id: string;
  customer_name: string;
  status: string;
  updated_at: string;
  customer_city: string;
}

const AI_INSIGHTS = [
  {
    insight: "Inactive shoppers in Mumbai and Delhi increased by 14% over the last 30 days.",
    action: "Launch a targeted WhatsApp win-back campaign offering ₹500 off.",
    impact: "Estimated +18% conversion lift & ₹1.2L in reclaimed GMV."
  },
  {
    insight: "High-spending customers (AOV > ₹10,000) opened SMS campaigns less frequently this month.",
    action: "Switch channel to WhatsApp and include personalized VIP invitation templates.",
    impact: "Estimated +22% open rate increase and stronger brand loyalty."
  },
  {
    insight: "Email delivery rates dropped by 8.4% due to spam filter updates in Gmail/Yahoo.",
    action: "Switch transactional discount campaigns to SMS with shortlinks.",
    impact: "Estimated +10% delivery rate and instant customer notification."
  },
  {
    insight: "Bangalore customer segment shows 2.4x higher purchase frequency than other regions.",
    action: "Launch a weekend flash-sale SMS campaign for Bangalore shoppers.",
    impact: "Estimated +15% surge in order volume within 48 hours."
  }
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentCallbacks, setRecentCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<typeof AI_INSIGHTS>(AI_INSIGHTS);
  const [insightIndex, setInsightIndex] = useState(0);
  const [refreshingInsight, setRefreshingInsight] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setCampaigns(data.campaigns);
        setRecentCallbacks(data.recentCallbacks);
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
      }
    } catch (e) {
      console.error("Error fetching dashboard metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 10 seconds to show live webhook callbacks moving in real time!
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshInsight = () => {
    setRefreshingInsight(true);
    setTimeout(() => {
      setInsightIndex((prev) => (prev + 1) % insights.length);
      setRefreshingInsight(false);
    }, 450);
  };

  // Mock revenue chart data (aggregated monthly sales for ₹)
  const revenueChartData = [
    { name: 'Jul 25', revenue: 420000 },
    { name: 'Aug 25', revenue: 480000 },
    { name: 'Sep 25', revenue: 510000 },
    { name: 'Oct 25', revenue: 620000 },
    { name: 'Nov 25', revenue: 590000 },
    { name: 'Dec 25', revenue: 780000 },
    { name: 'Jan 26', revenue: 840000 },
    { name: 'Feb 26', revenue: 910000 },
    { name: 'Mar 26', revenue: 1100000 },
    { name: 'Apr 26', revenue: 1050000 },
    { name: 'May 26', revenue: 1250000 },
    { name: 'Jun 26', revenue: 1420000 }
  ];

  const currentInsight = insights[insightIndex] || AI_INSIGHTS[0];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-sm text-zinc-400">Proactive campaign recommendations and real-time delivery performance.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </button>
      </div>

      {/* AI Insight Today (Top Section) */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/60 p-6 shadow-xl shadow-indigo-500/5 animate-slide-up">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div className={`transition-all duration-300 ${refreshingInsight ? 'opacity-0 transform translate-x-4' : 'opacity-100'}`}>
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">AI Insight Today</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{currentInsight.insight}</h3>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Suggested Action</span>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{currentInsight.action}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Expected Impact</span>
                  <p className="text-sm font-semibold text-indigo-200 mt-1">{currentInsight.impact}</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleRefreshInsight}
            disabled={refreshingInsight}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white transition hover:bg-zinc-800 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingInsight ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Revenue (GMV)</span>
            <h4 className="text-2xl font-bold text-white">
              {metrics ? `₹${(metrics.totalRevenue / 100000).toFixed(2)}L` : '₹0.00'}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% from last month</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <span className="text-lg font-bold text-zinc-400">₹</span>
          </div>
        </div>

        {/* Card 2: Total Customers */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Reachable Aud.</span>
            <h4 className="text-2xl font-bold text-white">
              {metrics ? metrics.totalCustomers.toLocaleString() : '500'}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8 new customers today</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <Users className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

        {/* Card 3: Conversion Click Rate */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Avg. CTR (Conversion)</span>
            <h4 className="text-2xl font-bold text-white">
              {metrics ? `${metrics.clickRate.toFixed(1)}%` : '24.2%'}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2.1% campaign average</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <MessageSquare className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

        {/* Card 4: Campaigns Launched */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Active Campaigns</span>
            <h4 className="text-2xl font-bold text-white">
              {metrics ? metrics.totalCampaigns : '1'}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Running delivery agents</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <Send className="w-5 h-5 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Annual GMV Growth</h3>
              <p className="text-xs text-zinc-500">Monthly gross merchandise value in Indian Rupees (₹).</p>
            </div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/50 border border-indigo-900/60 px-2 py-0.5 rounded">
              LTM (Last 12m)
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${v/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Delivery status monitor */}
        <div className="glass-panel p-6 rounded-xl shadow-lg flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Live Activity Stream</h3>
            <p className="text-xs text-zinc-500">Real-time callbacks rolling in from Channel Service.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[260px]">
            {recentCallbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs">
                <Clock className="w-8 h-8 mb-2 text-zinc-700" />
                <span>Waiting for campaign delivery logs...</span>
              </div>
            ) : (
              recentCallbacks.map((cb) => (
                <div key={cb.id} className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs animate-slide-up">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-zinc-200">{cb.customer_name}</p>
                    <p className="text-[10px] text-zinc-500">{cb.customer_city} • {new Date(cb.updated_at).toLocaleTimeString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    cb.status === 'clicked' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/60' :
                    cb.status === 'opened' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60' :
                    cb.status === 'delivered' ? 'bg-blue-950/40 text-blue-400 border-blue-900/60' :
                    cb.status === 'failed' ? 'bg-rose-950/40 text-rose-400 border-rose-900/60' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {cb.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Campaigns & CTA Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Recent Campaigns</h3>
              <p className="text-xs text-zinc-500">Summary statistics for your latest marketing runs.</p>
            </div>
            <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Channel</th>
                  <th className="py-2.5">Launch Time</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500">
                      No campaigns launched yet. Head over to the AI Agent to get started!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-zinc-900/30">
                      <td className="py-3 font-semibold text-white">{camp.name}</td>
                      <td className="py-3 capitalize">
                        <span className="flex items-center gap-1.5">
                          {camp.channel === 'whatsapp' && <span className="text-emerald-400 font-medium">WhatsApp</span>}
                          {camp.channel === 'sms' && <span className="text-amber-400 font-medium">SMS</span>}
                          {camp.channel === 'email' && <span className="text-indigo-400 font-medium">Email</span>}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400">{new Date(camp.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          camp.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                          camp.status === 'sending' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50 animate-pulse' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Campaign Agent quick entry banner */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between shadow-lg relative bg-gradient-to-br from-indigo-950/20 via-zinc-900 to-zinc-950 border-indigo-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="space-y-2 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white text-base mt-2">Chat with ReachIQ</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Launch personalized hyper-segmented campaigns in seconds. Simply describe your goal in natural language and watch the agent build filters, generate copies, and launch!
            </p>
          </div>

          <div className="mt-6 space-y-2.5 relative z-10">
            <Link 
              href="/campaign" 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/25 transition"
            >
              Open AI Campaign Agent
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
