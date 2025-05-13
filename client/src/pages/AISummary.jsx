import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

function AISummary({ tasks }) {
  const totalTasks = tasks.task.length + tasks.inProgress.length + tasks.complete.length;

  const summaryText = () => {
    if (totalTasks === 0) return "You haven't added any tasks yet. Let's get started! 🚀";

    const parts = [];
    if (tasks.task.length) parts.push(`${tasks.task.length} to-do`);
    if (tasks.inProgress.length) parts.push(`${tasks.inProgress.length} in progress`);
    if (tasks.complete.length) parts.push(`${tasks.complete.length} completed`);

    return `📊 You currently have ${totalTasks} tasks: ${parts.join(", ")}.`;
  };

  const chartData = [
    { name: "To Do", value: tasks.task.length },
    { name: "In Progress", value: tasks.inProgress.length },
    { name: "Completed", value: tasks.complete.length },
  ];

  return (
    <div style={{
      marginTop: "2rem",
      padding: "1rem",
      borderTop: "1px solid #ccc",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px"
    }}>
      <h3>🧠 Summary</h3>
      <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>{summaryText()}</p>

      {totalTasks > 0 && (
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default AISummary;
