import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onUpload: (text: string, filename: string) => Promise<void>;
  isUploading: boolean;
}

export function FileUpload({ onUpload, isUploading }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        await onUpload(text, file.name);
      }
    };
    reader.readAsText(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt', '.md', '.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/5 p-8 transition-all duration-300 hover:border-primary/50 hover:bg-white/10",
        isDragActive && "border-primary bg-primary/5",
        isUploading && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:scale-110 group-hover:text-primary transition-all duration-300" />
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {isUploading ? "Processing..." : "Drop files to ingest"}
          </p>
          <p className="text-xs text-muted-foreground">
            Support for TXT, MD, JSON
          </p>
        </div>
      </div>
    </div>
  );
}

interface FileItemProps {
  name: string;
  status: 'processing' | 'done' | 'error';
  onClick?: () => void;
}

export function FileItem({ name, status, onClick }: FileItemProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
        <File className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {status === 'processing' ? 'Analyzing content...' : status === 'done' ? 'Ingestion complete' : 'Ingestion failed'}
        </p>
      </div>
      {status === 'processing' ? (
        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
      ) : status === 'done' ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-500" />
      )}
    </motion.div>
  );
}
