import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';
import { motion } from 'motion/react';
import { Plus, Folder, Calendar, Trash2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface DashboardProps {
  onNewProject: () => void;
  onViewProject: (project: Project) => void;
}

export default function Dashboard({ onNewProject, onViewProject }: DashboardProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'projects'),
          where('ownerId', '==', user.uid)
          // orderBy('createdAt', 'desc') // Requires a composite index, we can just sort in memory for now
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'projects');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-stone-500">Loading projects...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Your Projects</h2>
          <p className="text-stone-600">Manage your IT projects and track their progress.</p>
        </div>
        <button
          onClick={onNewProject}
          className="inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-12 text-center">
          <Folder className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">No projects yet</h3>
          <p className="text-stone-500 mb-6">Create your first project to get started.</p>
          <button
            onClick={onNewProject}
            className="inline-flex items-center justify-center px-4 py-2 font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => onViewProject(project)}
              className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative"
            >
              <button 
                onClick={(e) => handleDelete(e, project.id)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <h3 className="text-lg font-bold text-stone-900 mb-2 line-clamp-1 pr-8">
                {project.timeline.projectName}
              </h3>
              <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                {project.timeline.summary}
              </p>
              
              <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <div className="px-2 py-1 bg-stone-50 rounded-md">
                  {project.completedTasks?.length || 0} tasks completed
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
