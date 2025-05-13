import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import AISummary from "../pages/AISummary";

function Dashboard() {
  const token = localStorage.getItem("authToken");
  const decodedToken = JSON.parse(atob(token.split('.')[1]));
  const userId = decodedToken.id;

  // Replace with actual logic to get the logged-in user's ID
  const [tasks, setTasks] = useState({
    task: [],
    inProgress: [],
    complete: [],
  });
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "Medium",
    deadline: "",
  });
  const [editingTask, setEditingTask] = useState(null);

  // Fetch tasks from backend

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:5001/api/tasks/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      // Group by status
      const grouped = {
        task: [],
        inProgress: [],
        complete: [],
      };

      data.forEach((t) => {
        if (grouped[t.status]) {
          grouped[t.status].push(t);
        }
      });

      setTasks(grouped);
    };
    fetchTasks();
  }, []);




  // Add a new task
  const handleAddTask = async () => {
    if (newTask.title.trim() && newTask.deadline) {
      const payload = { ...newTask, status: "task", userId };
      const res = await fetch(`http://localhost:5001/api/tasks/newTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const saved = await res.json();
      setTasks((prev) => ({
        ...prev,
        task: [...(prev?.task || []), saved],
      }));

      setNewTask({ title: "", priority: "Medium", deadline: "" });
    }
  };

  // Move task to another section
  const handleMoveTask = async (taskId, targetStatus) => {
    const task = Object.values(tasks)
      .flat()
      .find((t) => t._id === taskId);
    if (!task) return;
    const res = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: targetStatus }),
    });

    const updated = await res.json();
    const updatedTasks = { task: [], inProgress: [], complete: [] };
    Object.values(tasks)
      .flat()
      .forEach((t) => {
        if (t._id === taskId) updatedTasks[updated.status].push(updated);
        else updatedTasks[t.status].push(t);
      });
    setTasks(updatedTasks);
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    const updated = { task: [], inProgress: [], complete: [] };
    Object.values(tasks)
      .flat()
      .forEach((t) => {
        if (t._id !== taskId) updated[t.status].push(t);
      });
    setTasks(updated);
  };

  // Start editing a task
  const startEditing = (task, section) => {
    setEditingTask({ ...task, section });
  };

  // Update task
  const handleUpdateTask = async () => {
    const res = await fetch(
      `http://localhost:5001/api/tasks/${editingTask._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingTask.title,
          priority: editingTask.priority,
          deadline: editingTask.deadline,
        }),
      }
    );

    const updated = await res.json();
    const updatedTasks = { task: [], inProgress: [], complete: [] };
    Object.values(tasks)
      .flat()
      .forEach((t) => {
        if (t._id === updated._id) updatedTasks[updated.status].push(updated);
        else updatedTasks[t.status].push(t);
      });
    setTasks(updatedTasks);
    setEditingTask(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      tasks.task.forEach((task) => {
        const deadline = new Date(task.deadline).getTime();
        if (deadline - now <= 86400000 && deadline > now) {
          alert(`Reminder: Task "${task.title}" is due tomorrow!`);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const sectionTitles = {
    task: "📌 To Do",
    inProgress: "⏳ In Progress",
    complete: "✅ Completed",
  };

  return (
    <div className="dashboard">
      <h2>🧠 Task Dashboard</h2>

      <div className="task-form">
        <h3>{editingTask ? "Edit Task" : "Add New Task"}</h3>
        <div className="form-fields">
          <input
            type="text"
            placeholder="Task Title"
            value={editingTask ? editingTask.title : newTask.title}
            onChange={(e) =>
              editingTask
                ? setEditingTask({ ...editingTask, title: e.target.value })
                : setNewTask({ ...newTask, title: e.target.value })
            }
          />
          <select
            value={editingTask ? editingTask.priority : newTask.priority}
            onChange={(e) =>
              editingTask
                ? setEditingTask({ ...editingTask, priority: e.target.value })
                : setNewTask({ ...newTask, priority: e.target.value })
            }
          >
            <option value="High">🔥 High</option>
            <option value="Medium">🌤️ Medium</option>
            <option value="Low">🧊 Low</option>
          </select>
          <input
            type="date"
            value={editingTask ? editingTask.deadline : newTask.deadline}
            onChange={(e) =>
              editingTask
                ? setEditingTask({ ...editingTask, deadline: e.target.value })
                : setNewTask({ ...newTask, deadline: e.target.value })
            }
          />
          {editingTask ? (
            <button onClick={handleUpdateTask}>💾 Update</button>
          ) : (
            <button onClick={handleAddTask}>➕ Add</button>
          )}
        </div>
      </div>
       <div className="task-sections">
  {Object.keys(tasks).map((section) => (
    <div className="section" key={section}>
    
    </div>
  ))}
</div>

<AISummary tasks={tasks} />

      <div className="task-sections">
        {Object.keys(tasks).map((section) => (
          <div className="section" key={section}>
            <h4>{sectionTitles[section]}</h4>
            {tasks[section].length === 0 ? (
              <p className="empty-text">No tasks</p>
            ) : (
              <ul>
                {tasks[section].map((task) => (
                  <li key={task._id}>
                    <div className="task-details">
                      <strong>{task.title}</strong>
                      <span
                        className={`priority ${task.priority?.toLowerCase?.() || "medium"
                          }`}
                      >
                        {task.priority || "Medium"}
                      </span>

                      <span className="date">📅 {task.deadline}</span>
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {section !== "complete" && (
                        <button
                          className="move-btn"
                          onClick={() =>
                            handleMoveTask(
                              task._id,
                              section === "task" ? "inProgress" : "complete"
                            )
                          }
                        >
                          ➡️ {section === "task" ? "In Progress" : "Complete"}
                        </button>
                      )}
                      <button
                        className="move-btn"
                        onClick={() => startEditing(task, section)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="move-btn"
                        style={{ backgroundColor: "#e53935" }}
                        onClick={() => handleDeleteTask(task._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                    
                  </li>
                ))}
              </ul>
            )}
          </div>
          
        ))}
       
      </div>
    </div>
    
  );

  
}

export default Dashboard;