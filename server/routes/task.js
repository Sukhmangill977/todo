// routes/task.route.js
import express from 'express';
import Task from '../models/Task.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get tasks for a specific user
router.get('/:userId', verifyToken, async (req, res) => {
  console.log("test")
  const { userId } = req.params;

  // Optional: check if the userId matches the logged-in user
  if (req.user.id !== userId) {
    return res.status(403).json({ message: 'Unauthorized access to tasks.' });
  }

  try {
    const tasks = await Task.find({ userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task
router.post('/newTask', verifyToken, async (req, res) => {
  console.log("userud",req.user.id)

  const { title, priority, deadline, status } = req.body;
  try {
    const newTask = new Task({
      title,
      priority,
      deadline,
      status,
      userId: req.user.id, // Use the authenticated user's ID
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update task
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id }, // ensure only user's task can be updated
      updates,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete task
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Task.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
