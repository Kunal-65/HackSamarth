import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get(api.requirements.list.path, async (req, res) => {
    // Basic GET endpoint for UI compatibility
    const projectId = req.query.project_id as string || 'project-001';
    
    // Quick parse of "eq.project-001" from Supabase mock format if present
    const actualProjectId = projectId.startsWith('eq.') ? projectId.split('.')[1] : projectId;
    
    const reqs = await storage.getRequirements(actualProjectId);
    res.json(reqs);
  });

  app.post(api.requirements.ingest.path, async (req, res) => {
    try {
      const input = api.requirements.ingest.input.parse(req.body);
      
      // Simple mock AI ingestion logic (in real life, this would call OpenAI)
      const sentences = input.text.split(/(?<=[.?!])\s+/);
      
      for (const sentence of sentences) {
        if (sentence.trim().length > 10) {
          const type = sentence.toLowerCase().includes("must") || sentence.toLowerCase().includes("shall") 
            ? "Functional" : "Non-Functional";
            
          await storage.addRequirement({
            text: sentence.trim(),
            type,
            source: "Transcripts",
            has_conflict: false,
            project_id: input.project_id,
          });
        }
      }
      
      res.json({ success: true, message: "Ingested successfully" });
    } catch (err) {
      res.status(400).json({ success: false, message: "Invalid input" });
    }
  });

  app.post(api.requirements.detectConflicts.path, async (req, res) => {
    try {
      const input = api.requirements.detectConflicts.input.parse(req.body);
      const reqs = await storage.getRequirements(input.project_id);
      
      let conflictsFound = 0;
      
      // Randomly flag ~10% as conflicts for demo
      for (const r of reqs) {
        if (Math.random() < 0.1 && !r.has_conflict) {
          await storage.updateRequirement(r.id, { has_conflict: true });
          conflictsFound++;
        }
      }
      
      res.json({ conflicts_found: conflictsFound });
    } catch (err) {
      res.status(400).json({ conflicts_found: 0 });
    }
  });

  app.post(api.requirements.generateBrd.path, async (req, res) => {
    try {
      const input = api.requirements.generateBrd.input.parse(req.body);
      const reqs = await storage.getRequirements(input.project_id);
      
      const functional = reqs.filter(r => r.type === 'Functional');
      const nonFunctional = reqs.filter(r => r.type === 'Non-Functional');
      
      const markdown = `
# Business Requirement Document
## Project: ${input.project_id}

### 1. Introduction
This document outlines the functional and non-functional requirements.

### 2. Functional Requirements
${functional.map((r, i) => `- **FR-${String(i+1).padStart(2, '0')}**: ${r.text} ${r.has_conflict ? '(CONFLICT)' : ''}`).join('\n')}

### 3. Non-Functional Requirements
${nonFunctional.map((r, i) => `- **NFR-${String(i+1).padStart(2, '0')}**: ${r.text} ${r.has_conflict ? '(CONFLICT)' : ''}`).join('\n')}

### 4. Conclusion
Generated automatically.
`;
      
      res.json({ brd_markdown: markdown });
    } catch (err) {
      res.status(400).json({ brd_markdown: "Error generating BRD" });
    }
  });

  return httpServer;
}
