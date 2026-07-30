export interface Task {
  id: string;
  name: string;
  description: string;
  durationDays: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
}

export interface ProjectTimeline {
  projectName: string;
  summary: string;
  milestones: Milestone[];
}

export interface Project {
  id: string;
  ownerId: string;
  createdAt: string | Date;
  idea: string;
  timeline: ProjectTimeline;
  completedTasks: string[];
}

export interface Issue {
  id: string;
  projectId: string;
  createdAt: string | Date;
  title: string;
  description: string;
  status: 'open' | 'closed';
}
