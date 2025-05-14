import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import AISummary from "../pages/AISummary";
import predefinedSuggestions from "../utils/taskSuggestions.js";

function Dashboard() {
  const token = localStorage.getItem("authToken");
  const decodedToken = JSON.parse(atob(token.split(".")[1]));
  const userId = decodedToken.id;
  const recognitionRef = useRef(null);
  const suggestionRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quickNote, setQuickNote] = useState(() => {return localStorage.getItem("quickNote") || "";});
  const [menuActive, setMenuActive] = useState(false); 
  const [tasks, setTasks] = useState({task: [],inProgress: [],complete: [],});
  const [newTask, setNewTask] = useState({title: "",priority: "Medium",deadline: "",});
  const [editingTask, setEditingTask] = useState(null);
  const username = decodedToken.username || decodedToken.name || "User";
  const firstLetter = username.charAt(0).toUpperCase();
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [userTask, setUserTask] = useState("");
  const [taskSteps, setTaskSteps] = useState("");

  const getSteps = async () => {
    setLoading(true);
    setError("");
    setSteps("");

    try {
      const response = await fetch("http://localhost:5002/suggest-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task }),
      });

      const data = await response.json();
      if (data.steps) {
        setSteps(data.steps);
      } else {
        setError("Could not fetch steps.");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      localStorage.setItem("quickNote", quickNote);
    }, [quickNote]);
  
    const handleToggleMenu = () => {
      setMenuActive(!menuActive);
    };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (editingTask) {
          setEditingTask((prev) => ({
            ...prev,
            title: prev.title + " " + transcript,
          }));
        } else {
          setNewTask((prev) => ({
            ...prev,
            title: prev.title + " " + transcript,
          }));
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("authToken");

      try {
        const res = await fetch(`http://localhost:5001/api/tasks/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to fetch tasks: ${res.status} - ${errorText}`);
          return; // Stop execution if not OK
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          return;
        }

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
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const saved = await res.json();
      setTasks((prev) => ({
        ...prev,
        task: [...(prev?.task || []), saved],
      }));

      setNewTask({ title: "", priority: "Medium", deadline: "" });
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const filtered = predefinedSuggestions.filter(s =>
      s.toLowerCase().includes(value.toLowerCase())
    );
    setNewTask({ ...newTask, title: value });
    setSuggestions(filtered);
    setShowSuggestions(value.length > 0 && filtered.length > 0);
  };

  const selectSuggestion = (suggestion) => {
    setNewTask({ ...newTask, title: suggestion });
    setShowSuggestions(false);
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
        Authorization: `Bearer ${token}`,
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
  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login"; // 
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
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
          Authorization: `Bearer ${token}`,
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
  


  useEffect(() => {
  localStorage.setItem("quickNote", quickNote);
}, [quickNote]);

  const startSpeechRecognition = () => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition not supported or initialized.");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Speech recognition failed to start:", e);
    }
  };
  // 🧠 AI Suggestion Logic
// New state


// Function to handle sending task
const getTaskSteps = async () => {
  if (!userTask.trim()) return;
  try {
    const response = await fetch("http://localhost:5002/suggest-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: userTask })
    });
    const data = await response.json();
    setTaskSteps(data.steps);
  } catch (error) {
    console.error("Error fetching steps:", error);
    setTaskSteps("❌ Failed to get suggestions.");
  }
};


  return (
    <div className="dashboard">
      <h2>🧠 Task Dashboard</h2>
     
      <div className="dashboard">
      <div className="hamburger-menu" onClick={handleToggleMenu}>
        <div className="bar1"></div>
        <div className="bar2"></div>
        <div className="bar3"></div>
      </div>
<div className="profile-icon">
  {firstLetter}
  <div className="tooltip">{username}</div>
</div>

      <div className={`side-menu ${menuActive ? "active" : ""}`}>
        <h3>Menu</h3>
        <div className="quick-notes-mobile">
          <h4>Quick Notes</h4>
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Write your notes..."
            style={{ width: "100%", height: "150px" }}
          ></textarea>
        </div>
      </div>

      <div className="task-form">
        <h3>{editingTask ? "Edit Task" : "Add New Task"}</h3>
        <div className="form-fields">
          <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative", flexDirection: "column" }}>

  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <input
      type="text"
      placeholder="Task Title"
      value={editingTask ? editingTask.title : newTask.title}
      onChange={(e) =>
        editingTask
          ? setEditingTask({ ...editingTask, title: e.target.value })
          : handleInputChange(e)
      }
      onFocus={() => setShowSuggestions(true)}
      style={{ flex: 1 }}
    />
    <button onClick={startSpeechRecognition}>🎤</button>
  </div>
  
        


  {/* 🔽 Suggestions Dropdown */}
  {showSuggestions && !editingTask && (
    <ul className="suggestion-box" ref={suggestionRef} style={{ margin: 0, padding: "8px", listStyle: "none", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff", zIndex: 1000 }}>
      {suggestions.map((s, idx) => (
        <li
          key={idx}
          onClick={() => selectSuggestion(s)}
          style={{ padding: "6px 10px", cursor: "pointer" }}
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
          {s}
        </li>
      ))}
    </ul>
  )}
</div>

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
          <div className="section" key={section}></div>
        ))}
      </div>

      <AISummary tasks={tasks} />
      <div className="quick-notes-box">
  <h4>📝 Quick Notes</h4>
  <textarea
    value={quickNote}
    onChange={(e) => setQuickNote(e.target.value)}
    placeholder="Type something..."
  />
</div>

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
                        className={`priority ${
                          task.priority?.toLowerCase?.() || "medium"
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
      <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>🧠 Smart Task Assistant</h2>

      <input
        type="text"
        placeholder="Enter a task like 'Build a to-do app in React'"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        style={{ width: "70%", padding: "0.5rem", marginBottom: "1rem" }}
      />
      <button
        onClick={getSteps}
        style={{
          padding: "0.9rem 1rem",
          marginLeft: "1rem",
          cursor: "pointer",
        }}
      >
        Suggest Steps
      </button>
      <div className="ai-steps">
  {taskSteps.split("\n").map((line, idx) => (
    <p key={idx}>{line}</p>
  ))}
</div>


      <div style={{ marginTop: "2rem" }}>
        {loading && <p>⏳ Thinking... Please wait.</p>}

        {error && <p style={{ color: "red" }}>{error}</p>}

        {steps && (
          <div style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
            <strong>Steps to complete:</strong>
            <p>{steps}</p>
          </div>
          
        )}
        <div className="dashboard-main">
        <div className="sign-out">
          <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    </div>
    </div>
    </div>   
    </div>
  );
}

export default Dashboard;
