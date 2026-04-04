/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  Database, 
  HelpCircle, 
  ChevronRight, 
  Activity, 
  Dna, 
  Network, 
  Microscope, 
  Share2, 
  Download, 
  TrendingUp, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  ExternalLink, 
  Terminal as TerminalIcon,
  Cpu,
  ShieldCheck,
  Rocket,
  History,
  Sparkles,
  PlayCircle,
  Maximize2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

/**
 * Utility for merging Tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type View = 'dashboard' | 'automation' | 'synthesis' | 'references' | 'details';

interface AnalysisItem {
  id: string;
  title: string;
  type: string;
  time: string;
  status: 'Active Synthesis' | 'Folded' | 'Completed';
  icon: React.ReactNode;
}

interface SynthesisResult {
  id: string;
  geneId: string;
  source: string;
  mappedGene: string;
  confidence: number;
  status: 'success' | 'warning';
}

interface Reference {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  abstract: string;
  tags: string[];
}

// --- Mock Data ---
const RECENT_ANALYSES: AnalysisItem[] = [
  { id: '1', title: 'MAPK Signaling Cascade', type: 'Pathways', time: '24m ago', status: 'Active Synthesis', icon: <Network className="w-5 h-5" /> },
  { id: '2', title: 'P53 Tumor Suppressor Complex', type: 'Protein Structure', time: '2h ago', status: 'Folded', icon: <Microscope className="w-5 h-5" /> },
  { id: '3', title: 'BRCA2 Variant Mapping', type: 'Genomics', time: '5h ago', status: 'Completed', icon: <Dna className="w-5 h-5" /> },
];

const REFERENCES: Reference[] = [
  {
    id: '1',
    title: 'BRCA1 and the cellular response to DNA damage.',
    authors: 'Scully R, Chen J, Plug A, et al.',
    journal: 'Science',
    year: 2023,
    doi: '10.1126/science.272.5259.123',
    abstract: 'BRCA1 is a nuclear phosphoprotein that is expressed in many tissues and is required for normal development. Mutations in BRCA1 predispose women to breast and ovarian cancer.',
    tags: ['DNA Repair', 'Cancer', 'BRCA1']
  },
  {
    id: '2',
    title: 'Mapping BRCA1 mutation landscapes in clinical cohorts.',
    authors: 'Chen J, et al.',
    journal: 'Nature Genetics',
    year: 2024,
    doi: '10.1038/ng.1234',
    abstract: 'We report the results of a large-scale study of BRCA1 mutations in a clinical cohort of over 10,000 patients. We identify several new variants and characterize their functional impact.',
    tags: ['Genomics', 'Clinical', 'Mutation']
  },
  {
    id: '3',
    title: 'Functional analysis of human tumor suppressors.',
    authors: 'Miki Y, et al.',
    journal: 'Cancer Res.',
    year: 2022,
    doi: '10.1158/0008-5472.CAN-22-0001',
    abstract: 'Tumor suppressor genes play a critical role in preventing cancer development. We perform a functional analysis of several key tumor suppressors, including BRCA1 and TP53.',
    tags: ['Tumor Suppressor', 'TP53', 'Functional Analysis']
  },
  {
    id: '4',
    title: 'The role of MAPK signaling in genomic stability.',
    authors: 'Smith A, et al.',
    journal: 'Cell Reports',
    year: 2023,
    doi: '10.1016/j.celrep.2023.112345',
    abstract: 'MAPK signaling is a key regulator of cell growth and division. We show that MAPK signaling also plays a role in maintaining genomic stability by regulating DNA repair.',
    tags: ['MAPK', 'Signaling', 'Genomic Stability']
  }
];

const SYNTHESIS_RESULTS: SynthesisResult[] = [
  { id: '1', geneId: 'BRCA1', source: 'Reactome', mappedGene: 'HGNC:1100', confidence: 0.98, status: 'success' },
  { id: '2', geneId: 'TP53', source: 'STRING', mappedGene: 'HGNC:11998', confidence: 0.94, status: 'success' },
  { id: '3', geneId: 'EGFR', source: 'KEGG', mappedGene: 'HGNC:3236', confidence: 0.87, status: 'success' },
  { id: '4', geneId: 'APOE', source: 'Reactome', mappedGene: 'HGNC:613', confidence: 0.99, status: 'success' },
  { id: '5', geneId: 'UNKNOWN_VAR_A1', source: 'Unmapped', mappedGene: 'No Mapping Found', confidence: 0.12, status: 'warning' },
];

const THROUGHPUT_DATA = [
  { time: '08:00', val: 45 },
  { time: '09:00', val: 52 },
  { time: '10:00', val: 48 },
  { time: '11:00', val: 70 },
  { time: '12:00', val: 65 },
  { time: '13:00', val: 82 },
  { time: '14:00', val: 94 },
];

const EXPRESSION_DATA = [
  { tissue: 'Brain', level: 85 },
  { tissue: 'Heart', level: 42 },
  { tissue: 'Liver', level: 68 },
  { tissue: 'Lung', level: 55 },
  { tissue: 'Kidney', level: 30 },
  { tissue: 'Muscle', level: 12 },
];

// --- Components ---

const Sidebar = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => {
  const navItems = [
    { id: 'pathways', label: 'Pathways', icon: <Network className="w-5 h-5" />, view: 'synthesis' as View },
    { id: 'proteins', label: 'Proteins', icon: <Microscope className="w-5 h-5" />, view: 'automation' as View },
    { id: 'genes', label: 'Genes', icon: <Dna className="w-5 h-5" />, view: 'synthesis' as View },
    { id: 'nih', label: 'NIH Mapping', icon: <Activity className="w-5 h-5" />, view: 'details' as View },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 pt-20 pb-8 px-4 z-40">
      <div className="mb-10 px-2">
        <h2 className="font-headline font-black text-[#002045] text-xl tracking-tight">Bio-Automation</h2>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">Clinical Precision v2.4</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.filter(item => item.id !== 'nih').map((item) => (
          <button
            key={item.id}
            onClick={() => item.view && setView(item.view)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              (item.view === activeView) 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-200/50'
            )}
          >
            {item.icon}
            <span className="font-body text-xs font-semibold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-200">
          {navItems.filter(item => item.id === 'nih').map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.view);
                // If we are already on details, we might want to ensure a gene is selected
                // but for now just switching view is what the button does.
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border-2",
                activeView === 'details'
                  ? "bg-blue-50 border-blue-600 text-blue-700 shadow-md"
                  : "bg-white border-blue-100 text-blue-600 hover:border-blue-400 shadow-sm"
              )}
            >
              <Activity className="w-5 h-5" />
              <span className="font-body text-xs font-bold uppercase tracking-widest">NIH Mapping</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-auto space-y-4">
        <button className="w-full bg-gradient-to-br from-[#002045] to-[#1a365d] text-white py-3 rounded-xl font-headline font-bold text-sm shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]">
          New Analysis
        </button>
        <div className="pt-6 border-t border-slate-200 space-y-1">
          <button className="w-full flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-[#002045] transition-colors">
            <Database className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Database Status</span>
          </button>
          <button className="w-full flex items-center gap-3 px-2 py-2 text-slate-500 hover:text-[#002045] transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Help</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const TopNav = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => {
  const menuItems: { id: View, label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'automation', label: 'Automation' },
    { id: 'synthesis', label: 'Synthesis' },
    { id: 'references', label: 'References' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
      <div className="flex justify-between items-center px-6 py-3 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-12">
          <span className="text-xl font-bold tracking-tighter text-[#002045] font-headline">Editorial Bioinformatics</span>
          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`font-headline text-sm font-medium transition-all pb-1 border-b-2 ${
                  activeView === item.id 
                    ? 'text-blue-700 border-blue-700' 
                    : 'text-slate-500 border-transparent hover:text-blue-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search sequences..." 
              className="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 w-64"
            />
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-[#002045]" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-[#002045]" />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200">
            <img 
              src="https://picsum.photos/seed/scientist/100/100" 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

const DashboardView = ({ setView }: { setView: (v: View) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* Hero Section */}
      <section className="relative rounded-[2rem] overflow-hidden p-12 lg:p-20 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#002045] opacity-90"></div>
          <img 
            src="https://picsum.photos/seed/dna/1920/1080?blur=4" 
            alt="DNA Pattern" 
            className="w-full h-full object-cover mix-blend-overlay opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002045]/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-tight font-headline">
            Navigate the <span className="text-blue-200">Human Interactome</span>
          </h1>
          <p className="text-blue-100/80 text-lg lg:text-xl font-body mb-10 max-w-2xl mx-auto leading-relaxed">
            Access high-fidelity genomic data and pathway automation tools in a unified bioinformatics workspace.
          </p>

          <div className="relative w-full group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white flex items-center p-2 rounded-2xl shadow-xl">
              <Search className="text-slate-400 ml-4 w-5 h-5" />
              <input 
                type="text" 
                className="w-full border-none focus:ring-0 bg-transparent py-4 px-4 text-slate-900 font-body text-lg placeholder:text-slate-400"
                placeholder="Search pathways, proteins, or gene IDs..."
              />
              <button className="bg-[#002045] text-white px-8 py-4 rounded-xl font-bold tracking-tight hover:opacity-90 transition-all active:scale-95">
                Search Hub
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {['Reactome', 'KEGG', 'STRING'].map((db) => (
              <button key={db} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 px-6 py-2 rounded-full transition-all text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3 h-3" />
                {db}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#002045] font-headline">System Throughput</h3>
              <p className="text-slate-500 text-sm mt-1">Real-time genomic alignment processing speed (TFLOPS).</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={THROUGHPUT_DATA}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-[#002045] font-headline mb-6">Recent Analysis</h3>
            <div className="space-y-4">
              {RECENT_ANALYSES.map((item) => (
                <div key={item.id} className="group flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{item.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors">
              View All History
            </button>
          </div>

          <div className="bg-[#002045] p-8 rounded-[2rem] text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 opacity-80 font-headline">System Capacity</h3>
              <div className="text-5xl font-extrabold tracking-tighter mb-2">94.2<span className="text-xl opacity-50 ml-1">TFLOPS</span></div>
              <p className="text-sm text-blue-100/70 leading-snug">Current cluster processing power dedicated to sequence alignment.</p>
            </div>
            <Rocket className="absolute bottom-0 right-0 w-32 h-32 opacity-10 -mb-4 -mr-4" />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="flex flex-wrap items-center gap-6 py-6 px-8 bg-slate-100 rounded-3xl">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Integrations</span>
        {[
          { label: 'NCBI Database', color: 'bg-slate-800', initial: 'NC' },
          { label: 'UniProt', color: 'bg-blue-600', initial: 'UP' },
          { label: 'KEGG Genes', color: 'bg-emerald-700', initial: 'KG' },
          { label: 'Ensembl', color: 'bg-purple-600', initial: 'EN' },
        ].map((int) => (
          <div key={int.label} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className={`w-6 h-6 rounded-full ${int.color} flex items-center justify-center text-[10px] text-white font-bold`}>
              {int.initial}
            </div>
            <span className="text-sm font-medium text-[#002045]">{int.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const AutomationView = () => {
  const [logs, setLogs] = useState<string[]>([
    'INITIALIZING_ENGINE: Loading Bio-Automation sequence patterns...',
    'CONNECT: Authenticating with NIH Human Gene Database... SUCCESS.',
    'FETCH: Querying Reactome for [TP53] pathway dependencies.',
    'PROCESS: Mapping protein structures (ID: 7X82-B) against synthesized dataset.',
    'RECONCILE: Found 12 matching intersections in STRING cluster 4.',
    'UPDATING: Dashboard progress indicators... OK.',
    'SYNTHESIS: Calculating folding probability matrix for isoform-6_beta...',
    'STREAM: Pushing telemetry to local clinical node.',
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLogs = [
        `ANALYSIS_TICK: Heartbeat confirmed at ${new Date().toLocaleTimeString()}`,
        `RECONCILE_STEP: Comparing node ${Math.floor(Math.random() * 1000)} with reference cluster`,
        `DATA_STREAM: Received ${Math.floor(Math.random() * 500)} KB from NIH-GDC`,
        `CACHE_HIT: Sequence segment ${Math.random().toString(36).substring(7).toUpperCase()} found in local memory`,
      ];
      setLogs(prev => [...prev.slice(-15), newLogs[Math.floor(Math.random() * newLogs.length)]]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-emerald-100 text-emerald-700">Live Analysis</span>
            <span className="text-slate-500 text-xs tracking-wide">ID: HLX-992-BETA</span>
          </div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#002045]">Helix OS Automation</h1>
          <p className="text-slate-500 max-w-xl mt-2">Integrating multi-omic datasets from global repositories. Synthesis engine performing high-fidelity protein mapping.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-[#002045] hover:bg-slate-50 transition-colors">
            Cancel Analysis
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-[#002045] text-white font-semibold shadow-md active:scale-95 transition-transform">
            Preview Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-headline text-sm font-bold text-[#002045] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Retrieval Progress
            </h3>
            <div className="space-y-8">
              {[
                { label: 'Reactome API', progress: 82, sub: 'Fetching signal transduction...', speed: '2.4 MB/s' },
                { label: 'KEGG Database', progress: 45, sub: 'Metabolic mapping...', speed: '1.8 MB/s' },
                { label: 'STRING Interactions', progress: 0, sub: 'Queued for reconciliation', speed: '0.0 KB/s', waiting: true },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">{item.label}</label>
                    <span className={`text-xs font-bold ${item.waiting ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {item.waiting ? 'Waiting' : `${item.progress}%`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      className={`h-full rounded-full ${item.waiting ? 'bg-slate-300' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{item.sub}</span>
                    <span>{item.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#002045] p-6 rounded-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-headline text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                NIH Integration
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <Network className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight">Active Connection</div>
                  <div className="text-[10px] opacity-70">Latency: 14ms | NIH-GDC-S3</div>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">Synchronizing human reference genome GRCh38.p14. Direct fiber link active.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#1a1a2e] p-1 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="bg-[#252545] px-4 py-2 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400/40"></div>
                </div>
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest ml-4">Helix-Synthesizer_Terminal.v2</span>
              </div>
              <span className="text-[10px] text-blue-200 opacity-50">UTF-8 // GENOMIC-ENCODING</span>
            </div>
            <div className="flex-1 p-6 font-mono text-xs leading-relaxed overflow-y-auto space-y-2 text-blue-100/80">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="opacity-40 select-none">[14:22:{String(i).padStart(2, '0')}]</span>
                  <span className={log.includes('DEBUG') ? 'text-emerald-400' : ''}>{log}</span>
                </div>
              ))}
              <div className="flex gap-4">
                <span className="opacity-40 select-none">[14:22:31]</span>
                <span className="w-2 h-4 bg-blue-400 animate-pulse"></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Synthesis Accuracy', val: '99.998%', sub: '±0.002% Margin', color: 'text-emerald-600' },
              { label: 'Processing Load', val: '64.2 Gflops', sub: 'Cluster: ALPHA-7', color: 'text-blue-600' },
              { label: 'Threads Active', val: '1,024', sub: 'All Systems Nominal', color: 'text-emerald-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{stat.label}</label>
                <div className="text-2xl font-black text-[#002045] font-headline">{stat.val}</div>
                <div className={`text-[10px] font-bold mt-1 ${stat.color}`}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SynthesisView = ({ setView, onGeneSelect }: { setView: (v: View) => void, onGeneSelect: (id: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">Active Synthesis</span>
            <span className="text-slate-500 text-xs font-medium">Batch ID: #HELIX-2024-092</span>
          </div>
          <h1 className="text-4xl font-extrabold font-headline text-[#002045] tracking-tight mb-2">Helix OS Synthesis Results</h1>
          <p className="text-slate-500 max-w-2xl leading-relaxed">Integrated cross-database mapping of genomic variants against human reference proteomes.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-100 text-[#002045] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
            <Share2 className="w-4 h-4" /> Share Findings
          </button>
          <button className="bg-[#002045] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-xl flex flex-col justify-between shadow-sm border border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mapping Precision</p>
            <h3 className="text-3xl font-bold font-headline text-[#002045]">99.82%</h3>
          </div>
          <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[99.82%]"></div>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Mappings</p>
          <h3 className="text-3xl font-bold font-headline text-[#002045]">12,408</h3>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +42 today
          </p>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alerts</p>
          <h3 className="text-3xl font-bold font-headline text-red-600">3</h3>
          <p className="text-xs text-slate-500 font-medium mt-2">Unmapped sequences</p>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              <Filter className="w-3 h-3" /> Filter by Source
            </button>
            <button className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              <Activity className="w-3 h-3" /> Confidence Score
            </button>
          </div>
          <p className="text-xs font-medium text-slate-500">Showing 10 of 12,408 results</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protein/Gene ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Database</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mapped Human Gene (NIH)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SYNTHESIS_RESULTS.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold font-headline tracking-tight ${res.status === 'warning' ? 'text-red-600' : 'text-[#002045]'}`}>
                        {res.geneId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">P51587</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${res.status === 'warning' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      <span className="text-sm font-medium text-slate-900">{res.source}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-sm font-semibold ${res.status === 'warning' ? 'text-slate-400 italic' : 'text-blue-700 underline underline-offset-4 decoration-slate-200 hover:decoration-blue-700'}`}>
                      {res.mappedGene}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${res.status === 'warning' ? 'text-red-600' : 'text-slate-900'}`}>
                        {res.confidence}
                      </span>
                      <div className="w-16 h-1 bg-slate-100 rounded-full">
                        <div className={`h-full rounded-full ${res.status === 'warning' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${res.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => onGeneSelect(res.geneId)}
                      className="px-4 py-2 text-[10px] font-bold bg-[#002045] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-1 shadow-sm ml-auto"
                    >
                      <Search className="w-3 h-3" /> NIH Search
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-blue-50/50 backdrop-blur-sm border border-blue-100 p-8 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-xl font-bold font-headline text-[#002045] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" /> Synthesis Insights
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              The synthesis identified a significant cluster of variants related to TP53 in the current batch. Cross-referencing STRING and KEGG databases reveals a potential pathway disruption in DNA repair mechanisms.
            </p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-blue-700 font-mono">Reactome v87</span>
              </div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-blue-700 font-mono">Last Sync: 12m ago</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-100/30 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
          <h4 className="text-sm font-bold font-headline text-[#002045] uppercase tracking-widest mb-6">External Databases</h4>
          <div className="space-y-4">
            {[
              { label: 'NCBI Gene', icon: <Microscope className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700' },
              { label: 'UniProt KB', icon: <Network className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
              { label: 'ClinVar Mapping', icon: <Activity className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
            ].map((db) => (
              <button key={db.label} className="w-full flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-md transition-all group border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${db.color}`}>
                    {db.icon}
                  </div>
                  <span className="text-xs font-bold text-[#002045]">{db.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-700 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const DetailsView = ({ geneId }: { geneId: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Verified Mapping</span>
            <span className="text-slate-500 text-xs font-medium">Instance ID: NIH-7729-ALPHA</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#002045] font-headline">{geneId} Mapping Details</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">Cross-reference analysis between Helix internal sequencing database and NIH National Center for Biotechnology Information (NCBI) human gene records.</p>
          
          <div className="mt-6">
            <button 
              onClick={() => window.open(`https://www.ncbi.nlm.nih.gov/gene/?term=${geneId}`, '_blank')}
              className="group flex items-center gap-3 px-8 py-4 bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-blue-800 hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Launch NIH Search for {geneId}</span>
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-slate-100 text-[#002045] font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors">
            Export Report
          </button>
          <button className="px-5 py-2.5 bg-[#002045] text-white font-semibold text-sm rounded-xl shadow-md hover:opacity-90">
            Update Record
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg text-[#002045]">Helix Core Source</h3>
            <Database className="text-blue-700 w-5 h-5" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Sequence Identifier</p>
              <p className="font-mono text-sm text-[#002045] font-semibold">HXP_009283741.2</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Locus Tag</p>
                <p className="text-sm text-[#002045] font-semibold">BRCA1_INTERNAL_7</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Confidence Score</p>
                <p className="text-sm text-emerald-600 font-bold">99.8%</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Phenotype Associations</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 bg-white text-[10px] rounded border border-slate-200 text-slate-700 font-medium">Early-Onset Predisposition</span>
                <span className="px-2 py-1 bg-white text-[10px] rounded border border-slate-200 text-slate-700 font-medium">DNA Repair Pathway</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline font-bold text-lg text-[#002045]">Tissue Expression Profile: {geneId}</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Relative expression levels across human tissues (RPKM)</p>
            </div>
            <Activity className="text-blue-700 w-5 h-5" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EXPRESSION_DATA} layout="vertical" margin={{ right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="tissue" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  width={60}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '10px'
                  }}
                />
                <Bar dataKey="level" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#64748b', fontSize: 10, fontWeight: 700 }}>
                  {EXPRESSION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.level > 60 ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-headline font-bold text-[#002045]">Protein-Protein Interaction Map</h3>
              <p className="text-xs text-slate-500">Source: STRING v12.0 Analysis</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-lg">
              <Maximize2 className="w-4 h-4 text-blue-700" />
            </button>
          </div>
          <div className="relative flex-1 min-h-[400px] bg-slate-900 overflow-hidden">
            <img 
              src="https://picsum.photos/seed/network/1200/800" 
              alt="PPI Map" 
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            <div className="absolute bottom-6 left-6 p-4 bg-white/90 backdrop-blur rounded-lg shadow-xl border border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[#002045]">Interaction Nodes</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> <span className="text-[10px] font-medium">BRCA1 (Target)</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> <span className="text-[10px] font-medium">BARD1 (Confirmed)</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> <span className="text-[10px] font-medium">TP53 (Pathway)</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-headline font-bold text-[#002045]">Pathway Architecture</h3>
            <p className="text-xs text-slate-500">Reactome: R-HSA-174403</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="relative rounded-lg overflow-hidden h-48 bg-slate-100 group cursor-pointer">
              <img 
                src="https://picsum.photos/seed/pathway/600/400" 
                alt="Pathway" 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#002045]/20 flex items-center justify-center">
                <PlayCircle className="text-white w-12 h-12" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#002045] uppercase tracking-tighter mb-3">Enriched Functions</p>
              <ul className="space-y-3">
                {[
                  { label: 'Homology-directed repair', p: '1.2e-14', active: true },
                  { label: 'Cell cycle checkpoint', p: '3.5e-09', active: true },
                  { label: 'Apoptosis Regulation', p: '0.04', active: false },
                ].map((f) => (
                  <li key={f.label} className="flex items-start gap-3">
                    {f.active ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{f.label}</p>
                      <p className="text-[10px] text-slate-500">P-value: {f.p}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="font-headline font-bold text-xl text-[#002045]">Peer-Reviewed References</h3>
          <div className="flex-1 h-[1px] bg-slate-100"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'PUBMED: 3412567', title: 'BRCA1 and the cellular response to DNA damage.', meta: 'Scully R, et al. Science (2023)' },
            { id: 'PMC: 9022384', title: 'Mapping BRCA1 mutation landscapes in clinical cohorts.', meta: 'Chen J, et al. Nature Genetics (2024)' },
            { id: 'DOI: 10.1038/s415', title: 'Functional analysis of human tumor suppressors.', meta: 'Miki Y, et al. Cancer Res. (2022)' },
          ].map((ref) => (
            <div key={ref.id} className="p-5 bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all group cursor-pointer">
              <p className="text-[10px] font-bold text-blue-700 mb-2">{ref.id}</p>
              <p className="text-sm font-semibold text-[#002045] group-hover:text-blue-700 transition-colors mb-4 leading-snug">{ref.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{ref.meta}</span>
                <button className="flex items-center gap-1 text-[10px] font-bold text-blue-700 group-hover:underline">
                  VIEW SOURCE <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Glass Component */}
      <div className="fixed bottom-8 right-8 bg-white/80 backdrop-blur-md p-4 rounded-full shadow-2xl border border-white/20 flex items-center gap-6 pr-8 z-50">
        <div className="flex -space-x-2">
          <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://picsum.photos/seed/a1/100/100" alt="A1" referrerPolicy="no-referrer" />
          <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://picsum.photos/seed/a2/100/100" alt="A2" referrerPolicy="no-referrer" />
        </div>
        <div className="h-6 w-[1px] bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-[10px] font-bold text-[#002045] uppercase tracking-widest">3 Analysts Viewing</p>
        </div>
        <button className="ml-4 p-2 bg-[#002045] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const ReferencesView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredReferences = REFERENCES.filter(ref => 
    ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ref.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ref.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold font-headline text-[#002045] tracking-tight mb-2">Scientific References</h1>
          <p className="text-slate-500 max-w-2xl leading-relaxed">Curated database of peer-reviewed literature and clinical studies relevant to your current analysis.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filter references..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredReferences.map((ref) => (
          <motion.div 
            key={ref.id}
            layout
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">{ref.doi}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ref.journal} • {ref.year}</span>
                </div>
                <h3 className="text-xl font-bold font-headline text-[#002045] group-hover:text-blue-700 transition-colors leading-tight">
                  {ref.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium italic">{ref.authors}</p>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                  {ref.abstract}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {ref.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded border border-slate-100 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-row md:flex-col gap-3 justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-[#002045] text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#002045] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Source
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredReferences.length === 0 && (
          <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No references found matching your search.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeView, setView] = useState<View>('dashboard');
  const [selectedGene, setSelectedGene] = useState<string | null>(null);

  const handleGeneSelect = (geneId: string) => {
    setSelectedGene(geneId);
    setView('details');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-body text-[#191c1e]">
      <Sidebar activeView={activeView} setView={setView} />
      <TopNav activeView={activeView} setView={setView} />
      
      <main className="ml-64 pt-24 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DashboardView setView={setView} />
            </motion.div>
          )}
          {activeView === 'automation' && (
            <motion.div key="automation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AutomationView />
            </motion.div>
          )}
          {activeView === 'synthesis' && (
            <motion.div key="synthesis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SynthesisView setView={setView} onGeneSelect={handleGeneSelect} />
            </motion.div>
          )}
          {activeView === 'details' && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DetailsView geneId={selectedGene || 'BRCA1'} />
            </motion.div>
          )}
          {activeView === 'references' && (
            <motion.div key="references" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReferencesView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}
