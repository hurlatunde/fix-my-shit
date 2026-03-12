import fs from 'fs';

export function updateStateAfterPlan(
  statePath: string,
  phaseNum: number,
  plansCompleted: number,
  totalPlansInPhase: number
): void {
  if (!fs.existsSync(statePath)) return;
  let content = fs.readFileSync(statePath, 'utf-8');
  const now = new Date().toISOString().slice(0, 19) + 'Z';
  const date = new Date().toISOString().slice(0, 10);

  if (content.includes('last_updated:')) {
    content = content.replace(/last_updated:\s*"[^"]*"/, `last_updated: "${now}"`);
  }
  if (content.includes('last_activity:')) {
    content = content.replace(/last_activity:\s*[^\n]+/, `last_activity: ${date} — Phase ${phaseNum} plan ${plansCompleted}/${totalPlansInPhase} executed`);
  }
  if (content.includes('Plan: ') && content.includes(' of ') && content.includes(' in current phase')) {
    content = content.replace(/Plan:\s*\d+\s+of\s+\d+\s+in current phase/, `Plan: ${plansCompleted} of ${totalPlansInPhase} in current phase`);
  }

  fs.writeFileSync(statePath, content, 'utf-8');
}

/**
 * Update STATE.md after a full phase execution (all plans done).
 */
export function updateStateAfterPhaseComplete(statePath: string, phaseNum: number, totalPlansInPhase: number): void {
  updateStateAfterPlan(statePath, phaseNum, totalPlansInPhase, totalPlansInPhase);
}
