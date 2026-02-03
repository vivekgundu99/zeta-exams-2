// backend/routes/tasks.js - COMPLETE TASKS API
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');
const cacheService = require('../services/cacheService');

// 🔥 GET: Get all tasks (active + completed) with stats
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📋 GET /api/tasks - User:', req.user.userId);

    // 🔥 Try cache first
    const cachedTasks = await cacheService.getTasks(req.user.userId);
    
    if (cachedTasks) {
      console.log('✅ Serving tasks from cache');
      return res.json({
        success: true,
        ...cachedTasks
      });
    }

    // 🔥 Fetch from database
    let userTasks = await Task.findOne({ userId: req.user.userId }).lean();

    // Create if doesn't exist
    if (!userTasks) {
      console.log('⚠️ Creating new tasks document for user');
      userTasks = await Task.create({
        userId: req.user.userId,
        activeTasks: [],
        completedTasks: []
      });
    }

    const stats = {
      active: userTasks.activeTasks.length,
      completed: userTasks.completedTasks.length,
      overdue: userTasks.activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
      dueToday: userTasks.activeTasks.filter(t => {
        if (!t.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      }).length,
      availableSlots: 10 - userTasks.activeTasks.length,
      completedSlotsRemaining: 6000 - userTasks.completedTasks.length
    };

    const responseData = {
      activeTasks: userTasks.activeTasks || [],
      completedTasks: userTasks.completedTasks || [],
      stats
    };

    // 🔥 Cache for 5 minutes
    await cacheService.setTasks(req.user.userId, responseData, 300);

    res.json({
      success: true,
      ...responseData
    });

  } catch (error) {
    console.error('💥 Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// 🔥 POST: Add new task
router.post('/add', authenticate, async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    console.log('➕ POST /api/tasks/add:', { title, dueDate });

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    if (title.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Task title must not exceed 50 characters'
      });
    }

    // Get or create user tasks
    let userTasks = await Task.findOne({ userId: req.user.userId });

    if (!userTasks) {
      userTasks = new Task({
        userId: req.user.userId,
        activeTasks: [],
        completedTasks: []
      });
    }

    // Add task
    const taskId = userTasks.addTask(title, dueDate);
    await userTasks.save();

    // 🔥 Invalidate cache
    await cacheService.invalidateTasks(req.user.userId);

    console.log('✅ Task added successfully:', taskId);

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      taskId,
      stats: userTasks.getStats()
    });

  } catch (error) {
    console.error('💥 Add task error:', error);
    
    if (error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add task',
      error: error.message
    });
  }
});

// 🔥 PUT: Edit task
router.put('/edit/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, dueDate } = req.body;

    console.log('✏️ PUT /api/tasks/edit:', { taskId, title, dueDate });

    const userTasks = await Task.findOne({ userId: req.user.userId });

    if (!userTasks) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found'
      });
    }

    const updatedTask = userTasks.editTask(taskId, { title, dueDate });
    await userTasks.save();

    // 🔥 Invalidate cache
    await cacheService.invalidateTasks(req.user.userId);

    console.log('✅ Task updated successfully');

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('💥 Edit task error:', error);

    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// 🔥 DELETE: Delete active task
router.delete('/delete/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('🗑️ DELETE /api/tasks/delete:', taskId);

    const userTasks = await Task.findOne({ userId: req.user.userId });

    if (!userTasks) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found'
      });
    }

    userTasks.deleteTask(taskId);
    await userTasks.save();

    // 🔥 Invalidate cache
    await cacheService.invalidateTasks(req.user.userId);

    console.log('✅ Task deleted successfully');

    res.json({
      success: true,
      message: 'Task deleted successfully',
      stats: userTasks.getStats()
    });

  } catch (error) {
    console.error('💥 Delete task error:', error);

    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// 🔥 POST: Complete task
router.post('/complete/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('✅ POST /api/tasks/complete:', taskId);

    const userTasks = await Task.findOne({ userId: req.user.userId });

    if (!userTasks) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found'
      });
    }

    const completedTask = userTasks.completeTask(taskId);
    await userTasks.save();

    // 🔥 Invalidate cache
    await cacheService.invalidateTasks(req.user.userId);

    console.log('✅ Task completed successfully');

    res.json({
      success: true,
      message: 'Task completed successfully! 🎉',
      task: completedTask,
      stats: userTasks.getStats()
    });

  } catch (error) {
    console.error('💥 Complete task error:', error);

    if (error.message.includes('Maximum 6000')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
});

// 🔥 DELETE: Delete completed task
router.delete('/completed/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('🗑️ DELETE /api/tasks/completed:', taskId);

    const userTasks = await Task.findOne({ userId: req.user.userId });

    if (!userTasks) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found'
      });
    }

    userTasks.deleteCompletedTask(taskId);
    await userTasks.save();

    // 🔥 Invalidate cache
    await cacheService.invalidateTasks(req.user.userId);

    console.log('✅ Completed task deleted successfully');

    res.json({
      success: true,
      message: 'Completed task deleted successfully',
      stats: userTasks.getStats()
    });

  } catch (error) {
    console.error('💥 Delete completed task error:', error);

    if (error.message === 'Completed task not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete completed task',
      error: error.message
    });
  }
});

// 🔥 GET: Get tasks statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userTasks = await Task.findOne({ userId: req.user.userId });

    if (!userTasks) {
      return res.json({
        success: true,
        stats: {
          active: 0,
          completed: 0,
          overdue: 0,
          dueToday: 0,
          availableSlots: 10,
          completedSlotsRemaining: 6000
        }
      });
    }

    res.json({
      success: true,
      stats: userTasks.getStats()
    });

  } catch (error) {
    console.error('💥 Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

module.exports = router;