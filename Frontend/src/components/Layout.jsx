import React, { useEffect, useMemo } from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom';
import { useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import axios from 'axios'
import { Circle, Clock, TrendingUp, CheckCircle, Percent, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const Layout = ({ onLogout, user }) => {

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setError] = useState(null);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false); // Changed to control right panel collapse

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null)

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const { data } = await axios.get('http://localhost:4000/api/tasks/gp', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const arr = Array.isArray(data) ? data : Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data?.data) ? data.data : []
      console.log("Fetched tasks from backend:", arr);
      setTasks(arr)
    }
    catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      if (err.response?.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  }, [onLogout])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const stats = useMemo(() => {
    const completeTasks = tasks.filter(t => t.completed === true || t.completed === 1 || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'yes')).length
    const totalCount = tasks.length;
    const pendingCount = totalCount - completeTasks;
    const completionPercentage = totalCount ? Math.round((completeTasks / totalCount) * 100) : 0
    return {
      totalCount, completeTasks, pendingCount, completionPercentage
    }
  }, [tasks])

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className={`bg-${color}-50 p-4 rounded-lg border-l-4 border-${color}-500`}>
      <div className='flex items-center gap-3'>
        <div className={`p-2 bg-${color}-100 text-${color}-600 rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className='text-sm text-gray-600'>{title}</p>
          <p className='text-xl font-bold text-gray-800'>{value}</p>
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='loader mb-4'>
      </div>
    </div>
  )

  if (err) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <p className='text-red-600 mb-4'>Error Loading tasks</p>
        <p className='text-grey-600 mb-4'>{err}</p>
        <button onClick={fetchTasks} className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition'>Try Again</button>
      </div>
    </div>
  )

  return (
    <div className='h-screen overflow-y-scroll no-scrollbar bg-gray-100 flex flex-col'>
      <Navbar user={user} onLogout={onLogout} />
      <Sidebar user={user} tasks={tasks} />
      
      {/* Main Content Area */}
      <div className='ml-0 xl:ml-64 lg:ml-64 md:ml-16 pt-16 transition-all duration-300 flex-1 flex '>
        {/* Main Content - Expands when stats are collapsed */}
        <div className={`transition-all duration-300 ${
          isStatsCollapsed ? 'w-full' : 'w-full xl:w-8/12 lg:w-8/12'
        }`}>
          <div className='p-3 sm:p-4 md:p-6'>
            <Outlet context={{ tasks, refreshTasks: fetchTasks }} />
          </div>
        </div>

        {/* Statistics Panel - Collapsible to right */}
        <div className={`bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ${
          isStatsCollapsed 
            ? 'w-0 opacity-0 overflow-hidden' 
            : 'w-full xl:w-4/12 lg:w-4/12 opacity-100'
        }`}>
          {/* Collapse/Expand Button */}
          <div className='p-4 border-b border-gray-200 flex items-center justify-between bg-white'>
            <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-blue-600' />
              Task Statistics
            </h3>
            <button
              onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700'
              title={isStatsCollapsed ? 'Show Statistics' : 'Hide Statistics'}
            >
              {isStatsCollapsed ? (
                <PanelLeftOpen className='w-4 h-4' />
              ) : (
                <PanelLeftClose className='w-4 h-4' />
              )}
            </button>
          </div>

          {/* Statistics Content */}
          <div className='p-4 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto'>
            {/* Quick Stats Overview */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-blue-50 p-4 rounded-lg text-center'>
                <div className='text-2xl font-bold text-blue-600'>{stats.totalCount}</div>
                <div className='text-sm text-blue-500 mt-1'>Total</div>
              </div>
              <div className='bg-green-50 p-4 rounded-lg text-center'>
                <div className='text-2xl font-bold text-green-600'>{stats.completeTasks}</div>
                <div className='text-sm text-green-500 mt-1'>Done</div>
              </div>
              <div className='bg-yellow-50 p-4 rounded-lg text-center'>
                <div className='text-2xl font-bold text-yellow-600'>{stats.pendingCount}</div>
                <div className='text-sm text-yellow-500 mt-1'>Pending</div>
              </div>
              <div className='bg-purple-50 p-4 rounded-lg text-center'>
                <div className='text-2xl font-bold text-purple-600'>{stats.completionPercentage}%</div>
                <div className='text-sm text-purple-500 mt-1'>Progress</div>
              </div>
            </div>

            {/* Progress Section */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <div className='flex justify-between items-center mb-3'>
                <span className='text-sm font-medium text-gray-700'>Completion Progress</span>
                <span className='text-sm text-gray-500'>{stats.completionPercentage}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-3'>
                <div 
                  className='h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700' 
                  style={{ width: `${stats.completionPercentage}%` }}
                ></div>
              </div>
              <div className='flex justify-between text-xs text-gray-500 mt-2'>
                <span>{stats.completeTasks} completed</span>
                <span>{stats.pendingCount} remaining</span>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className='space-y-4'>
              <h4 className='text-sm font-semibold text-gray-800 border-b pb-2'>Detailed Overview</h4>
              
              <StatCard 
                title="Total Tasks" 
                value={stats.totalCount} 
                icon={<Circle className='w-5 h-5' />} 
                color="blue"
              />
              <StatCard 
                title="Completed Tasks" 
                value={stats.completeTasks} 
                icon={<CheckCircle className='w-5 h-5' />} 
                color="green"
              />
              <StatCard 
                title="Pending Tasks" 
                value={stats.pendingCount} 
                icon={<Clock className='w-5 h-5' />} 
                color="yellow"
              />
              <StatCard 
                title="Completion Rate" 
                value={`${stats.completionPercentage}%`} 
                icon={<Percent className='w-5 h-5' />} 
                color="purple"
              />
            </div>

            {/* Recent Activity */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h4 className='text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                <Clock className='w-4 h-4 text-yellow-600' />
                Recent Activity
              </h4>
              <div className='space-y-3'>
                {tasks.slice(0, 4).map(task => (
                  <div key={task.id || task._id} className='flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>{task.title}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'No date'}
                      </p>
                    </div>  
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.completed ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className='text-center text-gray-500 py-4'>
                    <Clock className='w-8 h-8 text-yellow-600 mx-auto mb-2' />
                    <p className='text-sm'>No recent activity</p>
                    <p className='text-xs'>Tasks will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show Statistics Button when collapsed */}
        {isStatsCollapsed && (
          <button
            onClick={() => setIsStatsCollapsed(false)}
            className='fixed right-4 top-30 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110'
            title='Show Statistics'
          >
            <TrendingUp className='w-5 h-5' />
          </button>
        )}
      </div>
    </div>
  )
}

export default Layout