// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  priority: String,
  deadline: Date,
  status: { type: String, default: "task" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Task", taskSchema);
