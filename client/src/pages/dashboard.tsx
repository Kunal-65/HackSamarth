import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sidebar, MainContent, RightPanel } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileUpload, FileItem } from "@/components/ui/file-upload";
import { StatsCard } from "@/components/stats-card";
import { 
  useRequirements, 
  useIngestFile, 
  useDetectConflicts, 
  useGenerateBRD 
} from "@/hooks/use-requirements";
import { 
  Bot, 
  Layers, 
  AlertTriangle, 
  Users, 
  Filter, 
  FileText, 
  Download,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FilterType = 'All' | 'Functional' | 'Non-Functional' | 'Conflicts';
type SourceType = 'Email' | 'Slack' | 'Transcripts';

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [activeSources, setActiveSources] = useState<SourceType[]>(['Email', 'Slack', 'Transcripts']);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, status: 'processing' | 'done'}[]>([]);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>("");

  const { data: requirements, isLoading: isLoadingReqs, isRefetching } = useRequirements();
  const ingestFile = useIngestFile();
  const detectConflicts = useDetectConflicts();
  const generateBRD = useGenerateBRD();

  const handleSourceToggle = (source: SourceType) => {
    setActiveSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleFileUpload = async (text: string, filename: string) => {
    setUploadedFiles(prev => [{ name: filename, status: 'processing' }, ...prev]);
    try {
      await ingestFile.mutateAsync(text);
      setUploadedFiles(prev => prev.map(f => f.name === filename ? { ...f, status: 'done' } : f));
    } catch (e) {
      setUploadedFiles(prev => prev.filter(f => f.name !== filename));
    }
  };

  const handleGenerate = async () => {
    const result = await generateBRD.mutateAsync();
    setGeneratedMarkdown(result.markdown);
  };

  const handleDownload = () => {
    if (!generatedMarkdown) return;
    const blob = new Blob([generatedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BRD-project-001.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredRequirements = requirements?.filter(req => {
    // Filter by Source
    if (!activeSources.includes(req.source as SourceType)) return false;

    // Filter by Type/Status
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Conflicts') return req.has_conflict;
    return req.type === activeFilter;
  });

  const stats = {
    total: requirements?.length || 0,
    conflicts: requirements?.filter(r => r.has_conflict).length || 0,
    stakeholders: 4 // Hardcoded as requested
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* === LEFT SIDEBAR === */}
      <Sidebar className="p-6 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">BRD Agent</h1>
            <p className="text-xs text-muted-foreground">Project-001</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Ingest Sources</h3>
          </div>
          
          <FileUpload 
            onUpload={handleFileUpload} 
            isUploading={ingestFile.isPending} 
          />

          <div className="space-y-2">
            <AnimatePresence>
              {uploadedFiles.map((file, i) => (
                <FileItem key={i} name={file.name} status={file.status} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Active Channels</h3>
          <div className="flex flex-col gap-2">
            {(['Email', 'Slack', 'Transcripts'] as SourceType[]).map(source => (
              <Button
                key={source}
                variant="ghost"
                onClick={() => handleSourceToggle(source)}
                className={`justify-between w-full h-10 px-3 hover:bg-white/5 transition-all ${activeSources.includes(source) ? 'bg-white/5 border border-white/10' : 'opacity-50'}`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeSources.includes(source) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`} />
                  {source}
                </span>
                {activeSources.includes(source) && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
              </Button>
            ))}
          </div>
        </div>
      </Sidebar>

      {/* === MAIN CONTENT === */}
      <MainContent>
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Requirements</h2>
            <Badge variant="secondary" className="px-2 py-0.5 h-6">
              {requirements?.length || 0}
            </Badge>
            {isRefetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2 border-white/10 hover:bg-white/5 hover:text-white transition-colors"
              onClick={() => detectConflicts.mutate()}
              disabled={detectConflicts.isPending}
            >
              {detectConflicts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              Detect Conflicts
            </Button>
            
            <Button 
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
              onClick={handleGenerate}
              disabled={generateBRD.isPending}
            >
              {generateBRD.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate BRD
            </Button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/5 w-fit">
            {(['All', 'Functional', 'Non-Functional', 'Conflicts'] as FilterType[]).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                  px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                  ${activeFilter === filter 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
                `}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-hidden px-8 pb-8">
          <div className="h-full rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col shadow-2xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-6 pl-2">Requirement</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Source</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* Table Body */}
            <ScrollArea className="flex-1">
              <div className="flex flex-col">
                {isLoadingReqs ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    <p className="text-muted-foreground">Syncing requirements...</p>
                  </div>
                ) : filteredRequirements?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-2">
                    <Filter className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No requirements found matching criteria.</p>
                  </div>
                ) : (
                  filteredRequirements?.map((req, idx) => (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group"
                    >
                      <div className="col-span-6 pl-2 text-sm text-foreground/90 font-medium leading-relaxed group-hover:text-foreground">
                        {req.text}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={`
                          ${req.type === 'Functional' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                        `}>
                          {req.type}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        {req.source}
                      </div>
                      <div className="col-span-2">
                        {req.has_conflict ? (
                          <Badge variant="destructive" className="gap-1 pl-1.5 animate-in fade-in zoom-in">
                            <AlertTriangle className="h-3 w-3" />
                            Conflict
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </MainContent>

      {/* === RIGHT SIDEBAR === */}
      <RightPanel className="p-6 gap-6">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Project Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <StatsCard 
            label="Total" 
            value={stats.total} 
            icon={Layers} 
            className="col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02]"
          />
          <StatsCard 
            label="Conflicts" 
            value={stats.conflicts} 
            icon={AlertTriangle} 
            className="border-amber-500/20 bg-amber-500/5"
            trend={stats.conflicts > 0 ? "Action Needed" : "All Clear"}
          />
          <StatsCard 
            label="Stakeholders" 
            value={stats.stakeholders} 
            icon={Users}
          />
        </div>

        <Separator className="bg-white/10" />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Document Preview
            </h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={handleDownload}
              disabled={!generatedMarkdown}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-6 overflow-y-auto custom-scrollbar">
            {generatedMarkdown ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-4 opacity-50">
                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 border-dashed">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No Document Generated</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Ingest requirements and resolve conflicts to generate the BRD.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </RightPanel>
    </div>
  );
}
