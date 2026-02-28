import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage.js';
import { api } from '../shared/routes.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const path = request.url || '';
  
  try {
    if (path.includes(api.requirements.list.path)) {
      const projectId = (request.query.project_id as string) || 'project-001';
      const actualProjectId = projectId.startsWith('eq.') ? projectId.split('.')[1] : projectId;
      const reqs = await storage.getRequirements(actualProjectId);
      return response.json(reqs);
    }
    
    if (path.includes(api.requirements.ingest.path) && request.method === 'POST') {
      const input = api.requirements.ingest.input.parse(request.body);
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
      
      return response.json({ success: true, message: "Ingested successfully" });
    }
    
    if (path.includes(api.requirements.detectConflicts.path) && request.method === 'POST') {
      const input = api.requirements.detectConflicts.input.parse(request.body);
      const reqs = await storage.getRequirements(input.project_id);
      
      let conflictsFound = 0;
      
      for (const r of reqs) {
        if (Math.random() < 0.1 && !r.has_conflict) {
          await storage.updateRequirement(r.id, { has_conflict: true });
          conflictsFound++;
        }
      }
      
      return response.json({ conflicts_found: conflictsFound });
    }
    
    if (path.includes(api.requirements.generateBrd.path) && request.method === 'POST') {
      const input = api.requirements.generateBrd.input.parse(request.body);
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
      
      return response.json({ brd_markdown: markdown });
    }
    
    return response.status(404).json({ message: 'Not found' });
  } catch (err) {
    console.error('API Error:', err);
    return response.status(500).json({ message: 'Internal server error' });
  }
}
