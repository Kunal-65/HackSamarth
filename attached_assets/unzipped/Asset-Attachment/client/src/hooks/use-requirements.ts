import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// === CONSTANTS ===
// Replace these with your actual Supabase details or environment variables
const SUPABASE_URL = "https://YOUR_SUPABASE_URL/rest/v1";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";
const PROJECT_ID = "project-001";
const WEBHOOK_BASE = "http://localhost:5678/webhook";

// === TYPES ===
export interface Requirement {
  id: number;
  text: string;
  type: string;
  source: string;
  has_conflict: boolean;
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
  markdown: string;
}

// === HOOKS ===

// Fetch Requirements from Supabase
export function useRequirements() {
  return useQuery({
    queryKey: ["requirements", PROJECT_ID],
    queryFn: async () => {
      // NOTE: In a real app, use the Supabase JS client. 
      // Fetching via REST as requested for simplicity in this generated output.
      const res = await fetch(`${SUPABASE_URL}/requirements?project_id=eq.${PROJECT_ID}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        // If the user hasn't set up Supabase yet, return mock data so the UI looks good
        if (SUPABASE_URL.includes("YOUR_SUPABASE_URL")) {
          console.warn("Supabase not configured. Returning mock data.");
          return mockRequirements;
        }
        throw new Error("Failed to fetch requirements from Supabase");
      }
      
      return (await res.json()) as Requirement[];
    },
    // Refresh frequently to simulate real-time updates without WS for now
    refetchInterval: 5000, 
  });
}

// Upload/Ingest File
export function useIngestFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileText: string) => {
      const res = await fetch(`${WEBHOOK_BASE}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: fileText, 
          project_id: PROJECT_ID 
        }),
      });
      
      if (!res.ok) {
        // Mock success if webhook is not running
        if (WEBHOOK_BASE.includes("localhost")) {
            console.warn("Webhook not reachable. Simulating success.");
            await new Promise(r => setTimeout(r, 1500)); // Simulate delay
            return { success: true };
        }
        throw new Error("Ingest failed");
      }
      return (await res.json()) as IngestResponse;
    },
    onSuccess: () => {
      toast({ title: "File Ingested", description: "Processing requirements..." });
      // Wait a bit for processing before refreshing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["requirements", PROJECT_ID] });
      }, 3000);
    },
    onError: (err) => {
      toast({ 
        title: "Ingest Failed", 
        description: err.message || "Could not upload file.", 
        variant: "destructive" 
      });
    }
  });
}

// Detect Conflicts
export function useDetectConflicts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${WEBHOOK_BASE}/detect-conflicts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: PROJECT_ID }),
      });

      if (!res.ok) {
         if (WEBHOOK_BASE.includes("localhost")) {
            console.warn("Webhook not reachable. Simulating success.");
            await new Promise(r => setTimeout(r, 2000));
            return { conflicts_found: 2 };
        }
        throw new Error("Conflict detection failed");
      }
      return (await res.json()) as ConflictResponse;
    },
    onSuccess: () => {
      toast({ title: "Analysis Complete", description: "Conflicts have been flagged." });
      queryClient.invalidateQueries({ queryKey: ["requirements", PROJECT_ID] });
    },
    onError: (err) => {
      toast({ 
        title: "Detection Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  });
}

// Generate BRD
export function useGenerateBRD() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${WEBHOOK_BASE}/generate-brd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: PROJECT_ID }),
      });

      if (!res.ok) {
         if (WEBHOOK_BASE.includes("localhost")) {
            console.warn("Webhook not reachable. Simulating success.");
            await new Promise(r => setTimeout(r, 4000));
            return { markdown: mockMarkdown };
        }
        throw new Error("BRD Generation failed");
      }
      return (await res.json()) as GenerateResponse; // Expects { markdown: string }
    },
    onSuccess: () => {
      toast({ title: "BRD Generated", description: "Document is ready for review." });
    },
    onError: (err) => {
      toast({ 
        title: "Generation Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  });
}

// === MOCK DATA FOR DEMO ===
const mockRequirements: Requirement[] = [
  { id: 1, text: "The system shall allow users to upload PDF documents.", type: "Functional", source: "Email", has_conflict: false, project_id: "project-001" },
  { id: 2, text: "The system must respond within 200ms for all API calls.", type: "Non-Functional", source: "Slack", has_conflict: true, project_id: "project-001" },
  { id: 3, text: "Response time should be under 500ms.", type: "Non-Functional", source: "Transcripts", has_conflict: true, project_id: "project-001" },
  { id: 4, text: "Users must be able to export reports to CSV.", type: "Functional", source: "Email", has_conflict: false, project_id: "project-001" },
  { id: 5, text: "Data must be encrypted at rest using AES-256.", type: "Non-Functional", source: "Slack", has_conflict: false, project_id: "project-001" },
];

const mockMarkdown = `
# Business Requirement Document
## Project: BRD Agent

### 1. Introduction
This document outlines the functional and non-functional requirements for the automated agent system.

### 2. Scope
The system will ingest unstructured text from various sources and convert them into structured requirements.

### 3. Functional Requirements
- **FR-01**: The system shall support PDF, DOCX, and TXT file uploads.
- **FR-02**: Users can filter requirements by source.

### 4. Non-Functional Requirements
- **NFR-01**: System availability must be 99.9%.
- **NFR-02**: All data must be encrypted in transit and at rest.

### 5. Conclusion
This document serves as the primary reference for the development team.
`;
