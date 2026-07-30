import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ProjectTimeline, Project, Task, Milestone } from '../types';
import { CheckCircle2, Clock, CalendarDays, CheckSquare, Square, Pencil, Trash2, Plus, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface TimelineViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export default function TimelineView({ project, onUpdateProject }: TimelineViewProps) {
  const { timeline } = project;
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(project.completedTasks || []));
  
  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [addingToMilestoneId, setAddingToMilestoneId] = useState<string | null>(null);
  
  // Form State
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDuration, setTaskDuration] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCompletedTasks(new Set(project.completedTasks || []));
  }, [project.completedTasks]);

  const toggleTask = async (taskId: string) => {
    const next = new Set(completedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setCompletedTasks(next);
    
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        completedTasks: Array.from(next)
      });
      onUpdateProject({ ...project, completedTasks: Array.from(next) });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
      setCompletedTasks(completedTasks);
    }
  };

  const startAddingTask = (milestoneId: string) => {
    setAddingToMilestoneId(milestoneId);
    setEditingTaskId(null);
    setTaskName('');
    setTaskDesc('');
    setTaskDuration(1);
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setAddingToMilestoneId(null);
    setTaskName(task.name);
    setTaskDesc(task.description);
    setTaskDuration(task.durationDays);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setAddingToMilestoneId(null);
  };

  const saveTask = async (milestoneId: string) => {
    if (!taskName.trim()) return;
    setIsSaving(true);
    
    try {
      const newTimeline = { ...timeline };
      const mIndex = newTimeline.milestones.findIndex(m => m.id === milestoneId);
      if (mIndex === -1) return;

      if (addingToMilestoneId) {
        const newTask: Task = {
          id: crypto.randomUUID(),
          name: taskName.trim(),
          description: taskDesc.trim(),
          durationDays: Math.max(1, taskDuration)
        };
        newTimeline.milestones[mIndex].tasks.push(newTask);
      } else if (editingTaskId) {
        const tIndex = newTimeline.milestones[mIndex].tasks.findIndex(t => t.id === editingTaskId);
        if (tIndex !== -1) {
          newTimeline.milestones[mIndex].tasks[tIndex] = {
            ...newTimeline.milestones[mIndex].tasks[tIndex],
            name: taskName.trim(),
            description: taskDesc.trim(),
            durationDays: Math.max(1, taskDuration)
          };
        }
      }

      await updateDoc(doc(db, 'projects', project.id), {
        timeline: newTimeline
      });
      onUpdateProject({ ...project, timeline: newTimeline });
      cancelEdit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (milestoneId: string, taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const newTimeline = { ...timeline };
      const mIndex = newTimeline.milestones.findIndex(m => m.id === milestoneId);
      if (mIndex === -1) return;
      
      newTimeline.milestones[mIndex].tasks = newTimeline.milestones[mIndex].tasks.filter(t => t.id !== taskId);
      
      const newCompleted = new Set(completedTasks);
      newCompleted.delete(taskId);

      await updateDoc(doc(db, 'projects', project.id), {
        timeline: newTimeline,
        completedTasks: Array.from(newCompleted)
      });
      
      onUpdateProject({ 
        ...project, 
        timeline: newTimeline,
        completedTasks: Array.from(newCompleted) 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
    }
  };

  const totalDays = timeline.milestones.reduce((acc, ms) => {
    return acc + ms.tasks.reduce((tAcc, task) => tAcc + task.durationDays, 0);
  }, 0);

  const totalTasks = timeline.milestones.reduce((acc, ms) => acc + ms.tasks.length, 0);
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks.size / totalTasks) * 100);

  const renderTaskForm = (milestoneId: string) => (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 ml-8 mt-2"
    >
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Task Name</label>
        <input
          type="text"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g., Set up database schema"
          autoFocus
        />
      </div>
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <input
            type="text"
            value={taskDesc}
            onChange={e => setTaskDesc(e.target.value)}
            className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Brief details..."
          />
        </div>
        <div className="w-full sm:w-32">
          <label className="block text-sm font-medium text-stone-700 mb-1">Duration (days)</label>
          <input
            type="number"
            min="1"
            value={taskDuration}
            onChange={e => setTaskDuration(parseInt(e.target.value) || 1)}
            className="w-full p-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={cancelEdit}
          className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-100 rounded-md hover:bg-stone-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => saveTask(milestoneId)}
          disabled={!taskName.trim() || isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-4">
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight">
          {timeline.projectName}
        </h2>
        <p className="text-lg text-stone-600 leading-relaxed">
          {timeline.summary}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2 text-sm font-medium text-stone-600 bg-stone-50 px-3 py-1.5 rounded-full w-fit">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Estimated total duration: <strong>{totalDays} days</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-stone-600 bg-stone-50 px-3 py-1.5 rounded-full w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{timeline.milestones.length} Milestones</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-stone-600">Project Progress ({completedTasks.size}/{totalTasks} tasks)</span>
            <span className="text-stone-900">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-6">
        {timeline.milestones.map((milestone, mIndex) => {
          const milestoneDuration = milestone.tasks.reduce((acc, t) => acc + t.durationDays, 0);
          
          return (
            <motion.div 
              key={milestone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (mIndex * 0.1) }}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
            >
              {/* Milestone Header */}
              <div className="bg-stone-50/80 px-6 py-5 border-b border-stone-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {mIndex + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-stone-900">
                        {milestone.name}
                      </h3>
                    </div>
                    <p className="text-stone-600 ml-9">{milestone.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-stone-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-stone-100">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span>{milestoneDuration} days</span>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-6">
                <ul className="space-y-2">
                  {milestone.tasks.map((task) => {
                    const isCompleted = completedTasks.has(task.id);
                    const isEditing = editingTaskId === task.id;
                    
                    if (isEditing) {
                      return <li key={task.id}>{renderTaskForm(milestone.id)}</li>;
                    }

                    return (
                      <li key={task.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className="flex-shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded text-stone-400 hover:text-blue-600 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className={`text-base font-medium truncate transition-colors ${isCompleted ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                              {task.name}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-medium text-stone-500 bg-white px-2.5 py-1 rounded-md shadow-sm border border-stone-200">
                                {task.durationDays}d
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEditingTask(task)}
                                  className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Edit Task"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteTask(milestone.id, task.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className={`mt-1 text-sm line-clamp-2 transition-colors ${isCompleted ? 'text-stone-400' : 'text-stone-500'}`}>
                            {task.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                
                {/* Add Task Button or Form */}
                <div className="mt-4">
                  {addingToMilestoneId === milestone.id ? (
                    renderTaskForm(milestone.id)
                  ) : (
                    <button
                      onClick={() => startAddingTask(milestone.id)}
                      className="ml-8 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
