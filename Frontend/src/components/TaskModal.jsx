import { AlignLeft, Calendar, CheckCircle, Flag, PlusCircle, Save, X, PlayCircle } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

const API_BASE = 'http://localhost:4000/api/tasks'

const DEFAULT_TASK = {
  title: '',
  description: '',
  priority: 'Low',
  dueDate: '',
  completed: 'No',
  status: 'todo',
  id: null,
}

const baseControlClasses =
    "w-full px-4 py-2.5 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm";
const priorityStyles = {
    Low: "bg-green-100 text-green-700 border-green-200",
    Medium: "bg-purple-100 text-purple-700 border-purple-200",
    High: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

const TaskModal = ({ isOpen, onClose, taskToEdit, onSave, onLogout }) => {
  
  const [taskData, setTaskData] = useState(DEFAULT_TASK)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
   if (!isOpen) return; 

    if (taskToEdit) {
      const normalized = taskToEdit.completed === 'Yes' || taskToEdit.completed === true ? 'Yes' : 'No'
      setTaskData({
        ...DEFAULT_TASK,
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority || 'Low',
        dueDate: taskToEdit.dueDate?.split('T')[0] || '',
        completed: normalized,
        status: taskToEdit.status || 'todo',
        id: taskToEdit._id,
      })
    } else {
      setTaskData(DEFAULT_TASK)
    }

    setError(null)
  }, [isOpen, taskToEdit])

  const handleChange = useCallback((e) =>{
    const{name,value} = e.target;
    setTaskData(prev => ({...prev,[name] :  value}));
  },[])

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No auth token found')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (taskData.dueDate < today) {
        setError('Due date cannot be in the past.')
        return
      }
      setLoading(true)
      setError(null)

      try {
        const isEdit = Boolean(taskData.id)
        const url = isEdit ? `${API_BASE}/${taskData.id}/gp` : `${API_BASE}/gp`
        const resp = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: getHeaders(),
          body: JSON.stringify(taskData),
        })

        if (!resp.ok) {
          if (resp.status === 401) return onLogout?.()
          const err = await resp.json()
          throw new Error(err.message || 'Failed to save task')
        }

        const saved = await resp.json()
        onSave?.(saved)
        onClose()
      } catch (err) {
        console.error(err)
        setError(err.message || 'An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    },
    [taskData, today, getHeaders, onLogout, onSave, onClose]
  )

  if(!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4'>
      <div className='bg-white border-green-100 rounded-xl max-w-md w-full shadow-lg relative p-6 animate-fadeIn'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-bold text-grey-800 flex items-center gap-2'>
            {taskData.id ? 
            
                <Save className='text-green-500 w-5 h-5' />
              
              :
              
                <PlusCircle className='text-green-600 w-5 h-5' />
          
            }
            {taskData.id ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-green-100 rounded-lg transition-colors text-grey-500 hover:text-blue-400'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && 
            <div className='text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100'>
              {error}
            </div>
          }
          <div>
            <label className='block text-sm font-medium text-grey-700 mb-1'>Task Title</label>
            <div className='flex items-center border border-green-100 focus-within:border-blue-500 transition-all duration-200'>
            <input
              type='text'
              name='title'
              value={taskData.title}
              onChange={handleChange}
              className='w-full border p-2 rounded'
              placeholder='Enter task title'
              required
            />
            </div>
          </div>
          <div>

          <label className='flex items-center gap-1 text-sm font-medium text-gray-700 mb-1'>
            <AlignLeft className='w-4 h-4 text-blue-500 to-green-600' /> Description
          </label>   
          <textarea name='description' rows='3'
          onChange={handleChange} value={taskData.description}
          className={baseControlClasses} placeholder='Add details about your task' />
          </div>
          
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='flex items-center gap-1 text-sm font-medium text-gray-700 mb-1'>
                <Flag className='w-4 h-4 text-blue-400 to-green-500' />
                Priority
              </label>
              <select name='priority' value={taskData.priority} onChange={handleChange}
              className={`${baseControlClasses} ${priorityStyles[taskData.priority]}`}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className='flex items-center gap-3 text-sm font-medium text-gray-700 mb-1'>
                <Calendar className='w-4 h-4 text-blue-500 to-green-600' />
                DueDate
              </label>
              <input type='date' name='dueDate' required min={today} value={taskData.dueDate}
              onChange={handleChange} className={baseControlClasses} />

            </div>
          </div>

          {/* Status Field - ADDED */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <PlayCircle className="w-4 h-4 text-blue-500" />
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'todo', label: 'To Do', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' }
              ].map(({ value, label, color }) => (
                <label key={value} className="flex items-center">
                  <input 
                    type="radio" 
                    name="status" 
                    value={value} 
                    checked={taskData.status === value}
                    onChange={handleChange} 
                    className="hidden"
                  />
                  <span className={`w-full text-center px-3 py-2 border rounded-lg text-sm font-medium cursor-pointer transition-all ${
                    taskData.status === value 
                      ? color + ' border-current' 
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className='flex items-center gap-1 text-sm font-medium text-gray-700 mb-2'>
              <CheckCircle className='w-4 h-4 text-blue-500 to-green-600' /> Status
            </label>
            <div className='flex gap-4'>
              {[{val: 'Yes', label:'Completed'},{val:'No',label:'In progress'}].map(({val,label}) =>(
                <label key={val} className='flex items-center'>
                  <input type='radio' name='completed' value={val} checked={taskData.completed === val}
                  onChange={handleChange} className='h-4 w-4 text-green-400 to-blue-600 focus:ring-green-500 border-gray-300 rounded' />
                  <span className='ml-2 text-sm text-gray-700'>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <button type='submit' disabled={loading}
          className='w-full bg-gradient-to-r from-green-700 to-blue-600 text-black font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:shadow-md transition-all duration-200'>
            {loading ? 'Saving...' : (taskData.id ? <>
              <Save className='w-4 h-4' /> Update Task
              </>:<>
              <PlusCircle className='w-4 h-4' /> Create Task
            </>)}
          </button>

        </form>
      </div>
    </div>
  )
}

export default TaskModal