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
  Search,
  Loader2,
  File,
  Clock,
  ChevronRight,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FilterType = 'All' | 'Functional' | 'Non-Functional' | 'Conflicts';
type SourceType = 'Email' | 'Slack' | 'Transcripts';

interface UploadedFile {
  name: string;
  status: 'processing' | 'done' | 'error';
  content?: string;
  timestamp: Date;
}

interface ActivityLog {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'processing';
  timestamp: Date;
}

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [activeSources, setActiveSources] = useState<SourceType[]>(['Email', 'Slack', 'Transcripts']);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>("");
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [activityId, setActivityId] = useState(0);

  const { data: requirements, isLoading: isLoadingReqs, isRefetching } = useRequirements();
  const ingestFile = useIngestFile();
  const detectConflicts = useDetectConflicts();
  const generateBRD = useGenerateBRD();

  const addActivity = (message: string, type: ActivityLog['type']) => {
    setActivityLog(prev => [{ id: activityId, message, type, timestamp: new Date() }, ...prev].slice(0, 10));
    setActivityId(prev => prev + 1);
  };

  const handleSourceToggle = (source: SourceType) => {
    setActiveSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleFileUpload = async (text: string, filename: string) => {
    const newFile: UploadedFile = { name: filename, status: 'processing', content: text, timestamp: new Date() };
    setUploadedFiles(prev => [newFile, ...prev]);
    setSelectedFile(newFile);
    addActivity(`Uploading "${filename}"...`, 'processing');
    try {
      await ingestFile.mutateAsync(text);
      setUploadedFiles(prev => prev.map(f => f.name === filename ? { ...f, status: 'done' } : f));
      addActivity(`"${filename}" ingested successfully`, 'success');
    } catch (e) {
      setUploadedFiles(prev => prev.map(f => f.name === filename ? { ...f, status: 'error' } : f));
      addActivity(`Failed to ingest "${filename}"`, 'error');
    }
  };

  const handleGenerate = async () => {
    addActivity('Generating BRD document...', 'processing');
    try {
      const result = await generateBRD.mutateAsync();
      setGeneratedMarkdown(result.brd_markdown);
      addActivity('BRD document generated successfully', 'success');
    } catch (e) {
      addActivity('Failed to generate BRD', 'error');
    }
  };

  const handleDetectConflicts = async () => {
    addActivity('Scanning for conflicts...', 'processing');
    try {
      await detectConflicts.mutateAsync();
      addActivity('Conflict detection complete', 'success');
    } catch (e) {
      addActivity('Failed to detect conflicts', 'error');
    }
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
    if (activeFilter === 'Functional') return req.type === 'functional';
    if (activeFilter === 'Non-Functional') return req.type === 'non_functional';
    return false;
  });

  const stats = {
    total: requirements?.length || 0,
    conflicts: requirements?.filter(r => r.has_conflict).length || 0,
    stakeholders: requirements ? new Set(requirements.map(r => r.stakeholder).filter(Boolean)).size : 0
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
                <FileItem 
                  key={i} 
                  name={file.name} 
                  status={file.status} 
                  onClick={() => setSelectedFile(file)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Activity Log</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activityLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent activity</p>
            ) : (
              activityLog.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                    log.type === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-white/5 text-muted-foreground'
                  }`}
                >
                  {log.type === 'success' && <CheckCircle2 className="h-3 w-3" />}
                  {log.type === 'error' && <AlertTriangle className="h-3 w-3" />}
                  {log.type === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {log.type === 'info' && <Activity className="h-3 w-3" />}
                  <span className="truncate">{log.message}</span>
                </motion.div>
              ))
            )}
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
              onClick={handleDetectConflicts}
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
                          ${req.type === 'functional' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                        `}>
                          {req.type === 'functional' ? 'Functional' : req.type === 'non_functional' ? 'Non-Functional' : req.type}
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
                        {req.has_conflict && req.conflict_note && (
                          <p className="text-xs text-red-400/70 mt-1">{req.conflict_note}</p>
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

        {/* File Content Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <File className="h-4 w-4 text-blue-400" />
              File Content
            </h3>
          </div>

          <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-4 overflow-y-auto custom-scrollbar max-h-48">
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <File className="h-3 w-3" />
                  <span className="font-medium">{selectedFile.name}</span>
                  {selectedFile.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {selectedFile.status === 'done' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                  {selectedFile.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-black/20 p-2 rounded-lg max-h-32 overflow-y-auto">
                  {selectedFile.content?.slice(0, 1000)}
                  {selectedFile.content && selectedFile.content.length > 1000 && '...'}
                  {!selectedFile.content && 'No content available'}
                </pre>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-2 opacity-50">
                <File className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Select a file to preview its content
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* BRD Document Preview */}
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
