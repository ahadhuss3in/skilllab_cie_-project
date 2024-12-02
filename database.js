const fs = require('fs');
const path = require('path');

// File paths
const habitsFile = path.join(__dirname, 'habits.json');
const progressFile = path.join(__dirname, 'progress.json');

// Initialize files if they don't exist
if (!fs.existsSync(habitsFile)) fs.writeFileSync(habitsFile, JSON.stringify([]));
if (!fs.existsSync(progressFile)) fs.writeFileSync(progressFile, JSON.stringify([]));

// Helper function to read data from a file
function readFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Helper function to write data to a file
function writeFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Add a habit
function addHabit(name, daily_goal) {
  return new Promise((resolve, reject) => {
    const habits = readFile(habitsFile);
    const newHabit = { id: habits.length + 1, name, daily_goal, active: true, created_at: new Date().toISOString() };
    habits.push(newHabit);
    writeFile(habitsFile, habits);
    resolve(newHabit);
  });
}

// Update habit progress
function updateHabitProgress(habitId) {
  return new Promise((resolve, reject) => {
    const progress = readFile(progressFile);
    const date = new Date().toISOString().split('T')[0];
    const existing = progress.find((p) => p.habit_id === habitId && p.date === date);

    if (existing) {
      existing.status = true;
    } else {
      progress.push({ habit_id: parseInt(habitId), date, status: true });
    }

    writeFile(progressFile, progress);
    resolve({ habit_id: parseInt(habitId), date, status: true });
  });
}

// Fetch all habits with their status for the current day
function getHabits() {
  return new Promise((resolve, reject) => {
    const habits = readFile(habitsFile);
    const progress = readFile(progressFile);
    const date = new Date().toISOString().split('T')[0];

    const result = habits.map((habit) => {
      const todayProgress = progress.find((p) => p.habit_id === habit.id && p.date === date);
      return {
        id: habit.id,
        name: habit.name,
        daily_goal: habit.daily_goal,
        completed: todayProgress ? todayProgress.status : false,
      };
    });

    resolve(result);
  });
}

// Generate weekly report
function getWeeklyReport() {
  return new Promise((resolve, reject) => {
    const habits = readFile(habitsFile);
    const progress = readFile(progressFile);
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);

    const result = habits.map((habit) => {
      const weeklyProgress = [];
      for (let d = new Date(lastWeek); d <= today; d.setDate(d.getDate() + 1)) {
        const date = d.toISOString().split('T')[0];
        const dayProgress = progress.find((p) => p.habit_id === habit.id && p.date === date);
        weeklyProgress.push(dayProgress ? dayProgress.status : false);
      }
      return { habit: habit.name, weekly_progress: weeklyProgress };
    });

    resolve(result);
  });
}

// Fetch incomplete habits
function getIncompleteHabits() {
  return new Promise((resolve, reject) => {
    const habits = readFile(habitsFile);
    const progress = readFile(progressFile);
    const date = new Date().toISOString().split('T')[0];

    const incomplete = habits.filter((habit) => {
      const todayProgress = progress.find((p) => p.habit_id === habit.id && p.date === date);
      return !todayProgress || !todayProgress.status;
    });

    resolve(incomplete);
  });
}
const getWeeklyCompletionData = async () => {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - i);
    return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  });

  const habits = habitData.habits;
  const weeklyReport = habits.map((habit) => {
    const weeklyProgress = last7Days.map((date) => {
      const completedOnDate = habit.completions.some((completion) => completion.date === date);
      return completedOnDate;
    });
    return { habit: habit.name, weeklyProgress };
  });

  return weeklyReport;
};

module.exports = {
  addHabit,
  updateHabitProgress,
  getHabits,
  getWeeklyReport,
  getIncompleteHabits,
};
