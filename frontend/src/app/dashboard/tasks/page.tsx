// frontend/src/app/dashboard/tasks/page.tsx - COMPLETE TASKS MANAGEMENT
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import { tasksAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Task {
  taskId: string;
  title: string;
  dueDate: string | null;
  createdAt: string;
  completedAt?: string;
}

interface TaskStats {
  active: number;
  completed: number;
  overdue: number;
  dueToday: number;
  availableSlots: number;
  completedSlotsRemaining: number;
}

export default function TasksPage() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit Task Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading tasks...');
      
      const response = await tasksAPI.getTasks();
      
      if (response.data.success) {
        setActiveTasks(response.data.activeTasks || []);
        setCompletedTasks(response.data.completedTasks || []);
        setStats(response.data.stats);
        console.log('✅ Tasks loaded:', response.data.stats);
      }
    } catch (error: any) {
      console.error('💥 Load tasks error:', error);
      toast.error(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter task title');
      return;
    }

    if (newTaskTitle.trim().length > 50) {
      toast.error('Task title must not exceed 50 characters');
      return;
    }

    try {
      setAdding(true);
      
      const response = await tasksAPI.addTask({
        title: newTaskTitle.trim(),
        dueDate: newTaskDueDate || null
      });

      if (response.data.success) {
        toast.success('✅ Task added successfully!');
        setNewTaskTitle('');
        setNewTaskDueDate('');
        setShowAddModal(false);
        await loadTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;

    if (!editTitle.trim()) {
      toast.error('Please enter task title');
      return;
    }

    if (editTitle.trim().length > 50) {
      toast.error('Task title must not exceed 50 characters');
      return;
    }

    try {
      setUpdating(true);
      
      const response = await tasksAPI.editTask(editingTask.taskId, {
        title: editTitle.trim(),
        dueDate: editDueDate || null
      });

      if (response.data.success) {
        toast.success('✅ Task updated successfully!');
        setShowEditModal(false);
        setEditingTask(null);
        await loadTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setShowEditModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await tasksAPI.deleteTask(taskId);
      
      if (response.data.success) {
        toast.success('🗑️ Task deleted');
        await loadTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await tasksAPI.completeTask(taskId);
      
      if (response.data.success) {
        toast.success('🎉 Task completed!');
        await loadTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleDeleteCompletedTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this completed task?')) return;

    try {
      const response = await tasksAPI.deleteCompletedTask(taskId);
      
      if (response.data.success) {
        toast.success('🗑️ Completed task deleted');
        await loadTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete completed task');
    }
  };

  const getTaskDueStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (due < now) {
      return { status: 'overdue', color: 'text-red-600 dark:text-red-400', label: '⚠️ Overdue' };
    } else if (due >= today && due < tomorrow) {
      return { status: 'today', color: 'text-orange-600 dark:text-orange-400', label: '📅 Due Today' };
    } else {
      return { status: 'upcoming', color: 'text-blue-600 dark:text-blue-400', label: '📆 Upcoming' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📝 My Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your daily tasks and track your productivity
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={stats?.availableSlots === 0}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Tasks</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.overdue}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.dueToday}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Due Today</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Limits Info */}
      {stats && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700">
          <CardBody className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Task Limits</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Active: {stats.availableSlots}/{10} slots available • 
                    Completed: {stats.completedSlotsRemaining}/{6000} remaining
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Active Tasks */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Active Tasks ({activeTasks.length}/10)
          </h2>
        </CardHeader>
        <CardBody>
          {activeTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">No active tasks</p>
              <Button onClick={() => setShowAddModal(true)} size="sm">
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => {
                const dueStatus = getTaskDueStatus(task.dueDate);
                
                return (
                  <div
                    key={task.taskId}
                    className="flex items-start justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleCompleteTask(task.taskId)}
                          className="mt-1 w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-center group"
                        >
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 question-text">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              Created: {formatDate(task.createdAt)}
                            </span>
                            {task.dueDate && dueStatus && (
                              <span className={`font-medium ${dueStatus.color}`}>
                                {dueStatus.label}: {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.taskId)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Completed Tasks ({completedTasks.length}/6000)
          </h2>
        </CardHeader>
        <CardBody>
          {completedTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No completed tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTasks.slice(0, 20).map((task) => (
                <div
                  key={task.taskId}
                  className="flex items-start justify-between gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 bg-green-500 dark:bg-green-600 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700 dark:text-gray-300 line-through">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Completed: {formatDate(task.completedAt || task.createdAt)}
                          </span>
                          {task.dueDate && (
                            <span className="text-gray-500 dark:text-gray-400">
                              Was due: {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCompletedTask(task.taskId)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {completedTasks.length > 20 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                  Showing 20 of {completedTasks.length} completed tasks
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewTaskTitle('');
          setNewTaskDueDate('');
        }}
        title="Add New Task"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Input
              label="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={50}
              helperText={`${newTaskTitle.length}/50 characters`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              onClick={handleAddTask}
              isLoading={adding}
              disabled={!newTaskTitle.trim() || adding}
            >
              Add Task
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setNewTaskTitle('');
                setNewTaskDueDate('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        title="Edit Task"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Input
              label="Task Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={50}
              helperText={`${editTitle.length}/50 characters`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              onClick={handleEditTask}
              isLoading={updating}
              disabled={!editTitle.trim() || updating}
            >
              Update Task
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}