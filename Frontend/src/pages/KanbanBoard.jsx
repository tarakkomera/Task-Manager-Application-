import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Calendar, Move, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const API_BASE = 'http://localhost:4000/api/tasks';

const KanbanBoard = () => {
  const { tasks, refreshTasks } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  // Helper function to determine task status based on your current data
  const getTaskStatus = (task) => {
    const isCompleted = [true, 1, 'yes'].includes(
      typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
    );
    
    if (isCompleted) return 'completed';
    
    // Check if task has in-progress status or other indicators
    if (task.status === 'in-progress' || task.status === 'in_progress') {
      return 'in-progress';
    }
    
    // You can add more logic here based on your data
    // For now, we'll assume tasks are either todo or in-progress based on some criteria
    // Let's use due date proximity or priority as indicators for "in progress"
    const today = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    
    if (dueDate && dueDate <= new Date(today.setDate(today.getDate() + 2))) {
      return 'in-progress'; // Tasks due soon are likely in progress
    }
    
    if (task.priority === 'high') {
      return 'in-progress'; // High priority tasks are likely being worked on
    }
    
    return 'todo'; // Default to todo
  };

  // Define Kanban columns based on task status
  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-blue-500',
      icon: <Clock className="w-4 h-4" />,
      tasks: tasks.filter(task => getTaskStatus(task) === 'todo')
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-yellow-50 border-yellow-200',
      headerColor: 'bg-yellow-500',
      icon: <PlayCircle className="w-4 h-4" />,
      tasks: tasks.filter(task => getTaskStatus(task) === 'in-progress')
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-500',
      icon: <CheckCircle2 className="w-4 h-4" />,
      tasks: tasks.filter(task => getTaskStatus(task) === 'completed')
    }
  ];

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    if (!draggedTask) return;

    try {
      const token = localStorage.getItem('token');
      let updatedTask = { ...draggedTask };

      // Update task based on target column
      if (columnId === 'completed') {
        updatedTask.completed = 'Yes';
        updatedTask.status = 'completed';
      } else if (columnId === 'todo') {
        updatedTask.completed = 'No';
        updatedTask.status = 'todo';
      } else if (columnId === 'in-progress') {
        updatedTask.completed = 'No';
        updatedTask.status = 'in-progress';
      }

      await fetch(`${API_BASE}/${draggedTask._id || draggedTask.id}/gp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTask),
      });

      refreshTasks();
      setDraggedTask(null);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const KanbanTaskCard = ({ task }) => {
    const isCompleted = [true, 1, 'yes'].includes(
      typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
    );

    const getPriorityColor = (priority) => {
      const colors = {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800", 
        high: "bg-red-100 text-red-800",
      };
      return colors[priority?.toLowerCase()] || "bg-gray-100 text-gray-800";
    };

    const getStatusColor = (status) => {
      const colors = {
        'todo': 'bg-blue-100 text-blue-800',
        'in-progress': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const taskStatus = getTaskStatus(task);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${
          isCompleted ? 'border-green-500' : 
          taskStatus === 'in-progress' ? 'border-yellow-500' : 'border-blue-500'
        } cursor-move hover:shadow-md transition-shadow mb-3`}
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className={`text-sm font-medium flex-1 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)} ml-2`}>
            {task.priority}
          </span>
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(taskStatus)}`}>
              {taskStatus === 'in-progress' ? 'In Progress' : 
               taskStatus === 'completed' ? 'Completed' : 'To Do'}
            </span>
            <Move className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      </div>
    );
  };

  const KanbanColumn = ({ column }) => (
    <div 
      className={`flex-1 min-w-[300px] rounded-lg border-2 ${column.color} p-4`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, column.id)}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${column.headerColor} text-white`}>
        <div className="flex items-center gap-2">
          {column.icon}
          <h3 className="font-semibold">{column.title}</h3>
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
            {column.tasks.length}
          </span>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          title="Add new task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {column.tasks.map(task => (
          <KanbanTaskCard key={task._id || task.id} task={task} />
        ))}
        
        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {column.icon}
            <p className="text-sm mt-2">No tasks in {column.title.toLowerCase()}</p>
            <p className="text-xs mt-1">Drag tasks here or click + to add</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
          <p className="text-gray-600">Drag and drop tasks to organize your workflow. Tasks are automatically sorted based on status, due dates, and priority.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {columns.map(column => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>

      {/* Task Modal */}
      <TaskModal 
        isOpen={showModal || !!selectedTask}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
          refreshTasks();
        }}
        taskToEdit={selectedTask}
        onSave={refreshTasks}
      />
    </div>
  );
};

export default KanbanBoard;