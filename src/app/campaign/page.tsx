'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  Zap, 
  AlertTriangle, 
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';

interface AICampaignWorkflow {
  name: string;
  channel: 'whatsapp' | 'sms' | 'email';
  message_template: string;
  segment_filters: {
    city?: string;
    minSpent?: number;
    maxSpent?: number;
    inactiveDays?: number;
  };
  best_send_time: string;
  expected_open_rate: number;
  confidence_score: {
    audience_quality: { score: number; reason: string };
    message_strength: { score: number; reason: string };
    channel_match: { score: number; reason: string };
    overall: number;
  };
  audience_explanation: {
    summary: string;
    factors: {
      spending_pattern: string;
      purchase_frequency: string;
      inactivity: string;
      conversion_probability: string;
    };
  };
}

interface Message {
  sender: 'user' | 'assistant' | 'system';
  text: string;
  workflow?: AICampaignWorkflow;
  reachCount?: number;
  customersPreview?: any[];
  isLaunchSuccess?: boolean;
  campaignId?: string;
}

export default function AICampaignAgent() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your AI Campaign Agent. Type a campaign goal in natural language (e.g. *\"Send a WhatsApp campaign to customers in Mumbai who spent more than ₹3000 in the last 6 months offering them a 10% coupon\"*) and I will handle the segmentation, copies, timing recommendation, and tracking."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Campaign launch status tracking state
  const [activeTrackingCampaignId, setActiveTrackingCampaignId] = useState<string | null>(null);
  const [trackingStats, setTrackingStats] = useState<any>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<AICampaignWorkflow | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, loadingStep, trackingStats]);

  // Polling campaign status fallback
  const startStatusPolling = (campaignId: string) => {
    // Clear any existing poll
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/status`);
        const data = await res.json();
        if (data.success) {
          setTrackingStats(data.stats);
          setTrackingLogs(data.statuses.slice(0, 15)); // show top 15 logs

          // If all deliveries are completed/failed, we can slow down or stop polling
          const pending = data.statuses.filter((s: any) => s.status === 'pending').length;
          const sent = data.statuses.filter((s: any) => s.status === 'sent').length;
          if (pending === 0 && sent === 0 && data.statuses.length > 0) {
            console.log("All callbacks processed. Stopping live status polling.");
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          }
        }
      } catch (err) {
        console.error("Error polling campaign status:", err);
      }
    };

    poll(); // run immediately once
    pollingIntervalRef.current = setInterval(poll, 3000); // then every 3 seconds
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userPrompt = inputText;
    setInputText('');

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: userPrompt }]);
    setLoading(true);
    setLoadingStep(1);

    // Simulate thinking steps
    const stepTimer1 = setTimeout(() => setLoadingStep(2), 1200);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 2400);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const data = await response.json();
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (data.success) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `I have analyzed customer order histories and prepared a campaign draft. Here is your Campaign Intelligence Card.`,
          workflow: data.workflow,
          reachCount: data.reach_count,
          customersPreview: data.customers_preview
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `Failed to compile segment rules: ${data.error || 'Unknown error'}`
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Error connecting to AI Server. Please ensure Next.js is configured properly.`
      }]);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  // Trigger improve dialog advice
  const handleImproveCampaign = (workflow: AICampaignWorkflow) => {
    setMessages(prev => [...prev, {
      sender: 'system',
      text: `Campaign Refinement Advice:
• To increase Message Strength (currently ${workflow.confidence_score.message_strength.score}/100), try adding a deadline incentive (e.g. "valid only for 48 hours") or changing the call to action.
• To improve Audience Quality (currently ${workflow.confidence_score.audience_quality.score}/100), restrict the segment by location (e.g. "Mumbai customers") or set the spending threshold higher (e.g. "spent > ₹10,000").
• Recommended Channel: ${workflow.channel.toUpperCase()} is already selected because it has the highest historical responsiveness for this user class.`
    }]);
  };

  // Launch Campaign
  const handleLaunchCampaign = async (workflow: AICampaignWorkflow) => {
    setLoading(true);
    setLoadingStep(4); // Launching Campaign
    
    try {
      const response = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflow })
      });
      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `🚀 Campaign successfully launched! Created Campaign ID: **${data.campaign.id}**. Contacted Channel Service: ${data.channelServiceContacted ? 'Yes' : 'No'}. Delivery tracking is now active.`,
          isLaunchSuccess: true,
          campaignId: data.campaign.id
        }]);

        // Start tracking statuses
        setActiveTrackingCampaignId(data.campaign.id);
        startStatusPolling(data.campaign.id);
      } else {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `❌ Campaign Launch Failed: ${data.error}`
        }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `❌ Launch connection error: ${e.message}`
      }]);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const openExplanationModal = (workflow: AICampaignWorkflow) => {
    setActiveWorkflow(workflow);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Pane: Chat Console */}
      <div className="flex-1 flex flex-col h-full border-r border-border bg-[#09090b]">
        {/* Chat Title */}
        <div className="p-4 border-b border-border bg-[#0c0c0e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
            <h2 className="font-bold text-white text-sm">Campaign Copilot Active</h2>
          </div>
          <span className="text-xs text-zinc-500 font-semibold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            Next.js + Gemini Flash
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : msg.sender === 'system'
                    ? 'bg-zinc-900 border border-amber-500/30 text-amber-200 rounded-tl-none text-xs font-mono whitespace-pre-wrap'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
              }`}>
                {/* Standard Message text */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                {/* If AI returns structured Workflow layout */}
                {msg.workflow && (
                  <div className="mt-4 space-y-4 border-t border-zinc-800/80 pt-4">
                    {/* Header: Campaign Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-900/60">
                        {msg.workflow.channel.toUpperCase()} Recommend
                      </span>
                      <span className="text-xs text-zinc-400">
                        Best time: <strong>{msg.workflow.best_send_time}</strong>
                      </span>
                    </div>

                    {/* Reach & Filters */}
                    <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-bold text-white">{msg.reachCount} customers selected</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed italic mt-1">"{msg.workflow.audience_explanation.summary}"</p>
                      
                      {/* Factor trigger */}
                      <button 
                        onClick={() => openExplanationModal(msg.workflow!)}
                        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-all"
                      >
                        Why were these users selected? <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expected message template preview */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Message Copy Draft</span>
                      <div className="p-3 rounded-lg bg-zinc-950/90 border border-zinc-850 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {msg.workflow.message_template}
                      </div>
                    </div>

                    {/* Campaign Confidence Score Card */}
                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-zinc-950/40 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          Campaign Score Card
                        </span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-lg font-extrabold text-indigo-400 glow-text-indigo">{msg.workflow.confidence_score.overall}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">/100</span>
                        </div>
                      </div>

                      {/* Progress Metrics list */}
                      <div className="space-y-2.5">
                        {/* 1. Audience Quality */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Audience Quality</span>
                            <span className="font-bold text-white">{msg.workflow.confidence_score.audience_quality.score}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400" style={{ width: `${msg.workflow.confidence_score.audience_quality.score}%` }}></div>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 italic leading-tight">{msg.workflow.confidence_score.audience_quality.reason}</p>
                        </div>

                        {/* 2. Message Strength */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Message Strength</span>
                            <span className="font-bold text-white">{msg.workflow.confidence_score.message_strength.score}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${msg.workflow.confidence_score.message_strength.score}%` }}></div>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 italic leading-tight">{msg.workflow.confidence_score.message_strength.reason}</p>
                        </div>

                        {/* 3. Channel Match */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-400">Channel Match</span>
                            <span className="font-bold text-white">{msg.workflow.confidence_score.channel_match.score}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${msg.workflow.confidence_score.channel_match.score}%` }}></div>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 italic leading-tight">{msg.workflow.confidence_score.channel_match.reason}</p>
                        </div>

                        {/* 4. Expected Open rate */}
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-zinc-900">
                          <span className="text-zinc-400">Expected Open Rate</span>
                          <span className="font-bold text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded">
                            {msg.workflow.expected_open_rate}%
                          </span>
                        </div>
                      </div>

                      {/* Score Action buttons */}
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleImproveCampaign(msg.workflow!)}
                          className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                        >
                          Improve Campaign
                        </button>
                        <button 
                          onClick={() => handleLaunchCampaign(msg.workflow!)}
                          className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Launch Anyway
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* If tracking trigger details */}
                {msg.isLaunchSuccess && msg.campaignId && (
                  <button
                    onClick={() => {
                      setActiveTrackingCampaignId(msg.campaignId!);
                      startStatusPolling(msg.campaignId!);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-950/40 text-xs font-bold text-indigo-400 transition"
                  >
                    View Live Campaign Progress
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* AI Loader feedback steps */}
          {loading && (
            <div className="flex justify-start animate-slide-up">
              <div className="max-w-[80%] rounded-2xl p-4 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none space-y-3">
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>ReachIQ Copilot processing...</span>
                </div>
                
                <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${loadingStep >= 1 ? 'bg-indigo-500' : 'bg-zinc-700'}`}></span>
                    <span className={loadingStep >= 1 ? 'text-zinc-200' : 'text-zinc-500'}>
                      {loadingStep >= 2 ? '✓' : '•'} Analyzing customer & order tables
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${loadingStep >= 2 ? 'bg-indigo-500' : 'bg-zinc-700'}`}></span>
                    <span className={loadingStep >= 2 ? 'text-zinc-200' : 'text-zinc-500'}>
                      {loadingStep >= 3 ? '✓' : '•'} Generating segmentation rules
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${loadingStep >= 3 ? 'bg-indigo-500' : 'bg-zinc-700'}`}></span>
                    <span className={loadingStep >= 3 ? 'text-zinc-200' : 'text-zinc-500'}>
                      {loadingStep >= 4 ? '✓' : '•'} Customizing personalized copy & scores
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSendPrompt} className="p-4 border-t border-border bg-[#0c0c0e] flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="Describe your campaign (e.g. 'Text Bangalore customers who haven't ordered in 90 days offering 20% off')"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/25 transition disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Pane: Live Campaign Delivery Monitor */}
      <div className="w-96 flex flex-col h-full bg-[#0c0c0e]">
        <div className="p-4 border-b border-border bg-[#09090b] flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Live Delivery Console
          </h2>
          <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 uppercase">
            {process.env.SUPABASE_URL ? 'Realtime Sub' : 'Polling Sub'}
          </span>
        </div>

        {activeTrackingCampaignId ? (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
            {/* Tracking Header */}
            <div>
              <span className="text-[10px] text-indigo-400 uppercase font-extrabold tracking-widest">Active Campaign ID</span>
              <h3 className="text-sm font-bold text-zinc-200 mt-0.5 font-mono truncate">{activeTrackingCampaignId}</h3>
            </div>

            {/* Funnel Progress metrics */}
            {trackingStats && (
              <div className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Recipients</span>
                    <p className="text-xl font-bold text-white">{trackingStats.total}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Delivered</span>
                    <p className="text-xl font-bold text-emerald-400">{trackingStats.delivered} <span className="text-xs text-zinc-500">({trackingStats.deliveryRate.toFixed(0)}%)</span></p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Opened</span>
                    <p className="text-xl font-bold text-indigo-400">{trackingStats.opened} <span className="text-xs text-zinc-500">({trackingStats.openRate.toFixed(0)}%)</span></p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Clicked</span>
                    <p className="text-xl font-bold text-purple-400">{trackingStats.clicked} <span className="text-xs text-zinc-500">({trackingStats.clickRate.toFixed(0)}%)</span></p>
                  </div>
                </div>

                {/* Progress bars stack */}
                <div className="pt-2 space-y-1.5">
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-900">
                    <div className="bg-blue-500" style={{ width: `${(trackingStats.sent / trackingStats.total) * 100}%` }}></div>
                    <div className="bg-emerald-500" style={{ width: `${(trackingStats.delivered / trackingStats.total) * 100}%` }}></div>
                    <div className="bg-indigo-500" style={{ width: `${(trackingStats.opened / trackingStats.total) * 100}%` }}></div>
                    <div className="bg-purple-500" style={{ width: `${(trackingStats.clicked / trackingStats.total) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 font-medium">
                    <span>Sent</span>
                    <span>Deliv.</span>
                    <span>Open</span>
                    <span>Click</span>
                  </div>
                </div>
              </div>
            )}

            {/* Log listing */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Live Webhook Log Feed</span>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {trackingLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-650">
                    <Clock className="w-6 h-6 mb-1 text-zinc-800" />
                    <span>Awaiting callbacks...</span>
                  </div>
                ) : (
                  trackingLogs.map((log, index) => (
                    <div key={index} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-between text-xs animate-slide-up">
                      <div className="space-y-0.5 truncate pr-2">
                        <p className="font-semibold text-zinc-200 truncate">{log.customer_name}</p>
                        <p className="text-[10px] text-zinc-500">{log.customer_city || 'City'} • {new Date(log.updated_at).toLocaleTimeString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border shrink-0 ${
                        log.status === 'clicked' ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                        log.status === 'opened' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50' :
                        log.status === 'delivered' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                        log.status === 'failed' ? 'bg-rose-950/40 text-rose-400 border-rose-900/50' :
                        'bg-zinc-800 text-zinc-400 border-zinc-750'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-zinc-650" />
            </div>
            <h4 className="font-bold text-zinc-400 mb-1">No Active Campaigns</h4>
            <p className="max-w-[200px] leading-relaxed">
              Once you confirm and launch a campaign draft via chat, delivery status receipts will stream here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Explanatory Modal (Feature 2: Why Selected) */}
      {isModalOpen && activeWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-2xl animate-slide-up">
            {/* Close */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Content */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Audience Selection Analysis</h3>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Campaign Target Segment</span>
                </div>
              </div>

              {/* Segment summary */}
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-300">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">AI Targeting Intent</span>
                "{activeWorkflow.audience_explanation.summary}"
              </div>

              {/* Factor analysis details */}
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Audience Selection Factors</span>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Factor 1: Spending pattern */}
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-850 flex items-start gap-3">
                    <span className="text-xs font-extrabold text-indigo-400 mt-0.5 bg-indigo-950/40 border border-indigo-900/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Spending Pattern</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{activeWorkflow.audience_explanation.factors.spending_pattern}</p>
                    </div>
                  </div>

                  {/* Factor 2: Purchase frequency */}
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-850 flex items-start gap-3">
                    <span className="text-xs font-extrabold text-indigo-400 mt-0.5 bg-indigo-950/40 border border-indigo-900/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Purchase Frequency</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{activeWorkflow.audience_explanation.factors.purchase_frequency}</p>
                    </div>
                  </div>

                  {/* Factor 3: Inactivity */}
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-850 flex items-start gap-3">
                    <span className="text-xs font-extrabold text-indigo-400 mt-0.5 bg-indigo-950/40 border border-indigo-900/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Inactivity Status</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{activeWorkflow.audience_explanation.factors.inactivity}</p>
                    </div>
                  </div>

                  {/* Factor 4: Conversion lift */}
                  <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 flex items-start gap-3">
                    <span className="text-xs font-extrabold text-emerald-400 mt-0.5 bg-emerald-950/40 border border-emerald-900/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0">4</span>
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Predicted Conversion Probability</h4>
                        <span className="text-xs font-bold text-emerald-400">{activeWorkflow.audience_explanation.factors.conversion_probability}</span>
                      </div>
                      <p className="text-xs text-indigo-300/80 mt-1 leading-relaxed">Optimized targeting algorithm predicts positive conversion response based on matched historical profiles.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold hover:text-white hover:border-zinc-700 transition"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
