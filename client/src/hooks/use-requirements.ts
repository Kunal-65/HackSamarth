import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as api from "../api";

const PROJECT_ID = "project-001";

export interface Requirement {
  id: number;
  text: string;
  type: string;
  source: string;
  has_conflict: boolean;
  conflict_note?: string;
  stakeholder?: string;
  project_id: string;
  created_at?: string;
}

export interface IngestResponse {
  success: boolean;
  message?: string;
}

export interface ConflictResponse {
  conflicts_found: number;
}

export interface GenerateResponse {
  brd_markdown: string;
}

function mapSupabaseRequirement(row: Record<string, unknown>): Requirement {
  return {
    id: row.id as number,
    text: (row.req_text as string) || "",
    type: (row.req_type as string) || "",
    source: (row.source as string) || "",
    has_conflict: (row.has_conflict as boolean) || false,
    conflict_note: row.conflict_note as string | undefined,
    stakeholder: row.stakeholder as string | undefined,
    project_id: (row.project_id as string) || "",
    created_at: row.created_at as string | undefined,
  };
}

export function useRequirements() {
  return useQuery({
    queryKey: ["requirements", PROJECT_ID],
    queryFn: async () => {
      try {
        const data = await api.fetchRequirements();
        if (!Array.isArray(data)) {
          return [];
        }
        return data.map(mapSupabaseRequirement) as Requirement[];
      } catch (error) {
        console.error("Failed to fetch requirements:", error);
        throw error;
      }
    },
    refetchInterval: 5000,
  });
}

export function useIngestFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileText: string) => {
      try {
        const result = await api.ingestFile(fileText);
        return result as IngestResponse;
      } catch (error) {
        toast({ 
          title: "Error", 
          description: "n8n not reachable. Run npx n8n in your terminal", 
          variant: "destructive" 
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "File Ingested", description: "Processing requirements..." });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["requirements", PROJECT_ID] });
      }, 3000);
    },
    onError: () => {
      // Error toast already shown in mutationFn
    }
  });
}

export function useDetectConflicts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      try {
        const result = await api.detectConflicts();
        return result as ConflictResponse;
      } catch (error) {
        toast({ 
          title: "Error", 
          description: "n8n not reachable. Run npx n8n in your terminal", 
          variant: "destructive" 
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Conflicts detected", description: "Conflicts have been flagged." });
      queryClient.invalidateQueries({ queryKey: ["requirements", PROJECT_ID] });
    },
    onError: () => {
      // Error toast already shown in mutationFn
    }
  });
}

export function useGenerateBRD() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      try {
        const result = await api.generateBRD();
        return result as GenerateResponse;
      } catch (error) {
        toast({ 
          title: "Error", 
          description: "n8n not reachable. Run npx n8n in your terminal", 
          variant: "destructive" 
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "BRD Generated", description: "Document is ready for review." });
    },
    onError: () => {
      // Error toast already shown in mutationFn
    }
  });
}
