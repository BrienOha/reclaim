import { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Hobby = Database['public']['Tables']['hobbies']['Row'];

export interface FreeTimeStatus {
  isUnlocked: boolean;
  overdueCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
  totalTodayTasks: number;
  suggestedHobby: Hobby | null;
  statusHeadline: string;
  statusSubtext: string;
}

export function computeFreeTimeStatus(tasks: Task[], hobbies: Hobby[]): FreeTimeStatus {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let overdueCount = 0;
  let dueTodayCount = 0;
  let completedTodayCount = 0;
  let totalTodayTasks = 0;

  tasks.forEach((task) => {
    if (!task.deadline) return;
    const deadlineDate = new Date(task.deadline);

    if (deadlineDate < startOfToday) {
      if (!task.is_completed) {
        overdueCount++;
      }
    } else if (deadlineDate >= startOfToday && deadlineDate <= endOfToday) {
      totalTodayTasks++;
      if (task.is_completed) {
        completedTodayCount++;
      } else {
        dueTodayCount++;
      }
    }
  });

  const isUnlocked = overdueCount === 0 && dueTodayCount === 0;

  // Pick a suggested hobby that has the lowest logged minutes or randomized
  const activeHobbies = hobbies.filter((h) => h.is_active);
  const suggestedHobby = activeHobbies.length > 0
    ? [...activeHobbies].sort((a, b) => a.total_minutes_logged - b.total_minutes_logged)[0]
    : null;

  let statusHeadline = "YOU'VE EARNED CREATION TIME! 🎉";
  let statusSubtext = "Your to-do list and deadlines are clear. Dive into your hobbies guilt-free.";

  if (!isUnlocked) {
    if (overdueCount > 0) {
      statusHeadline = `CREATION TIME LOCKED 🔒 (${overdueCount} Overdue)`;
      statusSubtext = `Clear your overdue deadlines first to earn guilt-free hobby time.`;
    } else {
      statusHeadline = `CREATION TIME LOCKED 🔒 (${dueTodayCount} Due Today)`;
      statusSubtext = `Finish today's ${dueTodayCount} remaining task(s) to unlock creation time!`;
    }
  }

  return {
    isUnlocked,
    overdueCount,
    dueTodayCount,
    completedTodayCount,
    totalTodayTasks,
    suggestedHobby,
    statusHeadline,
    statusSubtext,
  };
}
