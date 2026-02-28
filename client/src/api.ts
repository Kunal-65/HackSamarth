const API_BASE = '';
const SUPABASE_URL = 'https://oacrkyglmucseqwjczew.supabase.com';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hY3JreWdsbXVjc2Vxd2pjemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTUyOTYsImV4cCI6MjA4NzE3MTI5Nn0.n0dXRZLS9szKHq03p3EWTFklqHjiIjyCC9Mbcn8bFVM';
const PROJECT_ID = 'project-001';

export async function ingestFile(text: string) {
  const res = await fetch(`${API_BASE}/api/requirements/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, project_id: PROJECT_ID })
  });
  if (!res.ok) {
    throw new Error('Failed to ingest file');
  }
  return res.json();
}

export async function detectConflicts() {
  const res = await fetch(`${API_BASE}/api/requirements/detect-conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: PROJECT_ID })
  });
  if (!res.ok) {
    throw new Error('Failed to detect conflicts');
  }
  return res.json();
}

export async function generateBRD() {
  const res = await fetch(`${API_BASE}/api/requirements/generate-brd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: PROJECT_ID })
  });
  if (!res.ok) {
    throw new Error('Failed to generate BRD');
  }
  return res.json();
}

export async function fetchRequirements() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/requirements?project_id=eq.${PROJECT_ID}&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!res.ok) {
    throw new Error('Database error. Check Supabase credentials');
  }
  return res.json();
}
