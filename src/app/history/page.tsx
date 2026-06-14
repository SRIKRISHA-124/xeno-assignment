'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Activity, 
  CheckCircle,
  Eye,
  MousePointerClick,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  intent: string;
  segment_filters: any;
  channel: 'whatsapp' | 'sms' | 'email';
  message_template: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [expandedStats, setExpandedStats] = useState<any>(null);
  const [expandedStatuses, setExpandedStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleExpand = async (campaignId: string) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null);
      setExpandedStats(null);
      setExpandedStatuses([]);
      return;
    }

    setExpandedCampaignId(campaignId);
    setLoadingDetailId(campaignId);
    setExpandedStats(null);
    setExpandedStatuses([]);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/status`);
      const data = await res.json();
      if (data.success) {
        setExpandedStats(data.stats);
        setExpandedStatuses(data.statuses);
      }
    } catch (e) {
      console.error("Error fetching campaign details:", e);
    } finally {
      setLoadingDetailId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-outfit">Campaign History</h2>
          <p className="text-sm text-zinc-400">Review, audit, and analyze your historic marketing campaign segments.</p>
        </div>
        <button 
          onClick={fetchCampaigns}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Campaigns Listing */}
      <div className="space-y-4">
        {loading && campaigns.length === 0 ? (
          <div className="glass-panel p-12 text-center text-zinc-500 rounded-xl">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
            Loading campaign runs...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-panel p-12 text-center text-zinc-500 rounded-xl">
            <History className="w-8 h-8 text-zinc-655 mx-auto mb-3" />
            <h4 className="font-bold text-zinc-400 mb-1">No Campaign History Found</h4>
            <p className="text-xs leading-relaxed max-w-sm mx-auto">
              You haven't dispatched any campaigns yet. Visit the AI Campaign Agent chat tab to trigger your first delivery run!
            </p>
          </div>
        ) : (
          campaigns.map((camp) => {
            const isExpanded = expandedCampaignId === camp.id;
            return (
              <div 
                key={camp.id} 
                className={`glass-panel rounded-xl overflow-hidden border transition-all duration-300 ${
                  isExpanded ? 'border-indigo-500/40 ring-1 ring-indigo-500/10' : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Summary Row */}
                <div 
                  onClick={() => handleToggleExpand(camp.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border uppercase font-extrabold text-[10px] ${
                      camp.channel === 'whatsapp' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' :
                      camp.channel === 'sms' ? 'bg-amber-950/40 text-amber-400 border-amber-900/40' :
                      'bg-indigo-950/40 text-indigo-400 border-indigo-900/40'
                    }`}>
                      {camp.channel === 'whatsapp' ? 'WA' : camp.channel}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-white text-sm">{camp.name}</h4>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{camp.intent}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-xs">
                    <div className="hidden sm:block text-right">
                      <span className="text-zinc-500 font-medium">Launch Date</span>
                      <p className="text-zinc-300 font-semibold mt-0.5">{new Date(camp.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-zinc-500 font-medium">Status</span>
                      <p className="mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          camp.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' :
                          camp.status === 'sending' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40 animate-pulse' :
                          'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {camp.status}
                        </span>
                      </p>
                    </div>

                    <div className="text-zinc-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section Detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-850 p-6 space-y-6 bg-zinc-950/20">
                    {loadingDetailId === camp.id ? (
                      <div className="py-6 text-center text-zinc-500 flex items-center justify-center gap-2 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        Fetching delivery outcomes from database...
                      </div>
                    ) : (
                      <>
                        {/* 1. Metric stats */}
                        {expandedStats && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Audience Reach</span>
                              <span className="text-xl font-bold text-white mt-1 block">{expandedStats.total}</span>
                            </div>
                            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Delivered</span>
                              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                                {expandedStats.delivered} <span className="text-xs text-zinc-500 font-medium">({expandedStats.deliveryRate.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Opened</span>
                              <span className="text-xl font-bold text-indigo-400 mt-1 block">
                                {expandedStats.opened} <span className="text-xs text-zinc-500 font-medium">({expandedStats.openRate.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Clicked (CTR)</span>
                              <span className="text-xl font-bold text-purple-400 mt-1 block">
                                {expandedStats.clicked} <span className="text-xs text-zinc-500 font-medium">({expandedStats.clickRate.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 col-span-2 md:col-span-1">
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Bounces/Failed</span>
                              <span className="text-xl font-bold text-rose-400 mt-1 block">{expandedStats.failed}</span>
                            </div>
                          </div>
                        )}

                        {/* 2. Message Copy Content */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Message Content Template</span>
                          <div className="p-4 bg-zinc-900/70 border border-zinc-850 rounded-lg text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                            {camp.message_template}
                          </div>
                        </div>

                        {/* 3. Segment Filter Logic */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Audience Segment JSON</span>
                          <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-[10px] text-zinc-400 font-mono">
                            {JSON.stringify(camp.segment_filters, null, 2)}
                          </pre>
                        </div>

                        {/* 4. Recipient status table list */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Recipient Log Stream</span>
                          
                          <div className="overflow-hidden rounded-lg border border-zinc-850 bg-zinc-900/20 max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-zinc-850 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/20">
                                  <th className="py-2 px-4">Customer</th>
                                  <th className="py-2 px-4">Contact</th>
                                  <th className="py-2 px-4">City</th>
                                  <th className="py-2 px-4">Last Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-900 text-zinc-400">
                                {expandedStatuses.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-4 text-center text-zinc-650">No delivery reports available yet.</td>
                                  </tr>
                                ) : (
                                  expandedStatuses.map((ds) => (
                                    <tr key={ds.id} className="hover:bg-zinc-900/30">
                                      <td className="py-2 px-4 font-semibold text-zinc-200">{ds.customer_name}</td>
                                      <td className="py-2 px-4">
                                        <span className="block font-medium">{ds.customer_email}</span>
                                        <span className="text-[10px] text-zinc-500">{ds.customer_phone}</span>
                                      </td>
                                      <td className="py-2 px-4">{ds.customer_city}</td>
                                      <td className="py-2 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                          ds.status === 'clicked' ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                                          ds.status === 'opened' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50' :
                                          ds.status === 'delivered' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                                          ds.status === 'failed' ? 'bg-rose-950/40 text-rose-400 border-rose-900/50' :
                                          'bg-zinc-800 text-zinc-450 border-zinc-750'
                                        }`}>
                                          {ds.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
