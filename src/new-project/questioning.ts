import inquirer from 'inquirer';

export interface QuestioningAnswers {
  goal: string;
  constraints: string;
  outOfScope: string;
  projectName: string;
}

export async function runQuestioning(): Promise<QuestioningAnswers> {
  const answers = await inquirer.prompt<QuestioningAnswers>([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (short title):',
      default: 'My Project',
    },
    {
      type: 'input',
      name: 'goal',
      message: 'What are you building? (goals, problem it solves):',
    },
    {
      type: 'input',
      name: 'constraints',
      message: 'Constraints? (tech stack, timeline, platform):',
      default: 'None specified',
    },
    {
      type: 'input',
      name: 'outOfScope',
      message: 'What is explicitly out of scope for v1?',
      default: 'Nothing defined yet',
    },
  ]);
  return answers;
}
