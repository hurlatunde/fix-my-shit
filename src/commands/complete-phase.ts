import fs from 'fs';
import path from 'path';
import { getPhaseBase } from '../phases.js';

function getStatePath(fmsRoot: string): string {
  const base = getPhaseBase(fmsRoot);
  return path.join(base, 'STATE.md');
}

function getRoadmapPath(fmsRoot: string): string {
  const base = getPhaseBase(fmsRoot);
  return path.join(base, 'ROADMAP.md');
}

export function runCompletePhase(fmsRoot: string): void {
  const statePath = getStatePath(fmsRoot);
  const roadmapPath = getRoadmapPath(fmsRoot);
  if (!fs.existsSync(statePath) || !fs.existsSync(roadmapPath)) {
    console.log('STATE.md or ROADMAP.md not found.');
    return;
  }

  let stateContent = fs.readFileSync(statePath, 'utf-8');
  let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

  const phaseMatch = stateContent.match(/Phase:\s*(\d+)\s+of\s+\d+/);
  const currentPhase = phaseMatch ? parseInt(phaseMatch[1], 10) : 1;

  roadmapContent = roadmapContent.replace(
    new RegExp(`^(\\s*)- \\[ \\] \\*\\*Phase ${currentPhase}:`, 'm'),
    '$1- [x] **Phase ' + currentPhase + ':'
  );
  const padded = String(currentPhase).padStart(2, '0');
  roadmapContent = roadmapContent.replace(
    new RegExp(`^(\\s*)- \\[ \\] (${padded}-\\d+:.*)$`, 'gm'),
    (_, indent, rest) => `${indent}- [x] ${rest}`
  );
  const nextPhase = Math.min(currentPhase + 1, 6);
  stateContent = stateContent.replace(/completed_phases:\s*\d+/, `completed_phases: ${currentPhase}`);
  stateContent = stateContent.replace(/Phase:\s*\d+\s+of\s+(\d+)/, `Phase: ${nextPhase} of $1`);
  stateContent = stateContent.replace(/Plan:\s*\d+\s+of\s+\d+\s+in current phase/, 'Plan: 0 of 3 in current phase');
  const date = new Date().toISOString().slice(0, 10);
  stateContent = stateContent.replace(/last_activity:\s*[^\n]+/, `last_activity: ${date} — Phase ${currentPhase} complete`);
  stateContent = stateContent.replace(/Status:\s*[^\n]+/, 'Status: Ready to execute');
  stateContent = stateContent.replace(/\*\*Current focus:\*\*[^\n]+/, `**Current focus:** Phase ${nextPhase}`);

  fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');
  fs.writeFileSync(statePath, stateContent, 'utf-8');
  console.log('Phase', currentPhase, 'marked complete. Current phase is now', nextPhase);
}

export function runCompleteMilestone(fmsRoot: string): void {
  const statePath = getStatePath(fmsRoot);
  if (!fs.existsSync(statePath)) {
    console.log('STATE.md not found.');
    return;
  }
  let stateContent = fs.readFileSync(statePath, 'utf-8');
  const versionMatch = stateContent.match(/milestone_version:\s*([^\s\n]+)/);
  const current = versionMatch ? versionMatch[1] : 'v1.0';
  const next = current.replace(/(\d+)$/, (_, n) => String(parseInt(n, 10) + 1));
  stateContent = stateContent.replace(/milestone_version:\s*[^\s\n]+/, `milestone_version: ${next}`);
  stateContent = stateContent.replace(/Phase:\s*\d+\s+of/, 'Phase: 1 of');
  stateContent = stateContent.replace(/Plan:\s*\d+\s+of\s+\d+/, 'Plan: 0 of 3');
  const date = new Date().toISOString().slice(0, 10);
  stateContent = stateContent.replace(/last_activity:\s*[^\n]+/, `last_activity: ${date} — Milestone ${current} complete`);
  fs.writeFileSync(statePath, stateContent, 'utf-8');
  console.log('Milestone', current, 'complete. Next milestone:', next);
}
