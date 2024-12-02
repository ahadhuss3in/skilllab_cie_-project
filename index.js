const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const WebSocket = require("ws");
const {
  addHabit,
  updateHabitProgress,
  getHabits,
  getWeeklyReport,
  getIncompleteHabits,
} = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// REST API Endpoints
app.post("/habits", async (req, res) => {
  const { name, daily_goal } = req.body;
  if (!name || !daily_goal) {
    return res.status(400).json({ status: "error", data: null, error: "Name and daily_goal are required" });
  }
  const habit = await addHabit(name, daily_goal);
  res.json({ status: "success", data: habit, error: null });
});

app.put("/habits/:id", async (req, res) => {
  const habitId = req.params.id;
  const updated = await updateHabitProgress(habitId);
  res.json({ status: "success", data: updated, error: null });
});

app.get("/habits", async (req, res) => {
  const habits = await getHabits();
  res.json({ status: "success", data: habits, error: null });
});

app.get("/habits/report", async (req, res) => {
  const report = await getWeeklyReport();
  res.json({ status: "success", data: { weekly_report: report }, error: null });
});

// WebSocket Setup
const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();

// Handle WebSocket Connections
wss.on("connection", (ws) => {
  clients.add(ws);

  // Remove the client when it disconnects
  ws.on("close", () => {
    clients.delete(ws);
  });

  // Optionally handle incoming messages
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
  });
});

// Schedule Daily Reminders
cron.schedule("* * * * *", async () => {
  const incompleteHabits = await getIncompleteHabits();
  if (incompleteHabits.length > 0) {
    const reminderMessage = JSON.stringify({
      type: "reminder",
      message: "You have incomplete habits for today!",
      habits: incompleteHabits.map((habit) => habit.name),
    });

    // Send reminders to all connected clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(reminderMessage);
      }
    });

    console.log("Daily reminders sent via WebSocket.");
  } else {
    console.log("No incomplete habits. No reminders sent.");
  }
});

// Start HTTP Server and Attach WebSocket Server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Upgrade HTTP requests to WebSocket connections
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
