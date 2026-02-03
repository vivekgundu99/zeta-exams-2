// backend/models/Task.js - FIXED DUPLICATE KEY ERROR
const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true
    // REMOVED: unique: true (this was causing the error)
  },
  title: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const tasksSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  // 🔥 ACTIVE TASKS (Max 10)
  activeTasks: {
    type: [taskItemSchema],
    default: [],
    validate: {
      validator: function(tasks) {
        return tasks.length <= 10;
      },
      message: 'Maximum 10 active tasks allowed'
    }
  },
  // 🔥 COMPLETED TASKS (Max 6000)
  completedTasks: {
    type: [taskItemSchema],
    default: [],
    validate: {
      validator: function(tasks) {
        return tasks.length <= 6000;
      },
      message: 'Maximum 6000 completed tasks allowed. Delete old tasks to add new ones.'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 🔥 INDEX FOR FASTER QUERIES
tasksSchema.index({ userId: 1 });

// 🔥 METHOD: Add new task
tasksSchema.methods.addTask = function(title, dueDate = null) {
  if (this.activeTasks.length >= 10) {
    throw new Error('Maximum 10 active tasks allowed');
  }

  if (!title || title.trim().length === 0) {
    throw new Error('Task title is required');
  }

  if (title.trim().length > 50) {
    throw new Error('Task title must not exceed 50 characters');
  }

  const taskId = `TASK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  this.activeTasks.push({
    taskId,
    title: title.trim(),
    dueDate: dueDate ? new Date(dueDate) : null,
    createdAt: new Date()
  });

  this.lastUpdated = new Date();
  return taskId;
};

// 🔥 METHOD: Edit task
tasksSchema.methods.editTask = function(taskId, updates) {
  const task = this.activeTasks.find(t => t.taskId === taskId);
  
  if (!task) {
    throw new Error('Task not found');
  }

  if (updates.title !== undefined) {
    if (!updates.title || updates.title.trim().length === 0) {
      throw new Error('Task title is required');
    }
    if (updates.title.trim().length > 50) {
      throw new Error('Task title must not exceed 50 characters');
    }
    task.title = updates.title.trim();
  }

  if (updates.dueDate !== undefined) {
    task.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
  }

  this.lastUpdated = new Date();
  return task;
};

// 🔥 METHOD: Delete active task
tasksSchema.methods.deleteTask = function(taskId) {
  const index = this.activeTasks.findIndex(t => t.taskId === taskId);
  
  if (index === -1) {
    throw new Error('Task not found');
  }

  this.activeTasks.splice(index, 1);
  this.lastUpdated = new Date();
  return true;
};

// 🔥 METHOD: Complete task
tasksSchema.methods.completeTask = function(taskId) {
  const index = this.activeTasks.findIndex(t => t.taskId === taskId);
  
  if (index === -1) {
    throw new Error('Task not found');
  }

  // Check completed tasks limit
  if (this.completedTasks.length >= 6000) {
    throw new Error('Maximum 6000 completed tasks reached. Delete old completed tasks first.');
  }

  // Move to completed
  const task = this.activeTasks[index];
  task.completedAt = new Date();
  
  this.completedTasks.unshift(task); // Add to beginning (most recent first)
  this.activeTasks.splice(index, 1); // Remove from active
  
  this.lastUpdated = new Date();
  return task;
};

// 🔥 METHOD: Delete completed task
tasksSchema.methods.deleteCompletedTask = function(taskId) {
  const index = this.completedTasks.findIndex(t => t.taskId === taskId);
  
  if (index === -1) {
    throw new Error('Completed task not found');
  }

  this.completedTasks.splice(index, 1);
  this.lastUpdated = new Date();
  return true;
};

// 🔥 METHOD: Get active tasks count
tasksSchema.methods.getActiveCount = function() {
  return this.activeTasks.length;
};

// 🔥 METHOD: Get completed tasks count
tasksSchema.methods.getCompletedCount = function() {
  return this.completedTasks.length;
};

// 🔥 METHOD: Get overdue tasks
tasksSchema.methods.getOverdueTasks = function() {
  const now = new Date();
  return this.activeTasks.filter(task => {
    return task.dueDate && task.dueDate < now;
  });
};

// 🔥 METHOD: Get tasks stats
tasksSchema.methods.getStats = function() {
  const now = new Date();
  const overdue = this.getOverdueTasks().length;
  const dueToday = this.activeTasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return task.dueDate >= today && task.dueDate < tomorrow;
  }).length;

  return {
    active: this.activeTasks.length,
    completed: this.completedTasks.length,
    overdue,
    dueToday,
    availableSlots: 10 - this.activeTasks.length,
    completedSlotsRemaining: 6000 - this.completedTasks.length
  };
};

module.exports = mongoose.model('Task', tasksSchema);