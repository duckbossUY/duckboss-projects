import { useState } from 'react';
import IdeaInput from './components/IdeaInput';
import TimelineView from './components/TimelineView';
import Dashboard from './components/Dashboard';
import IssuesList from './components/IssuesList';
import { ProjectTimeline, Project } from './types';
import { Layout, Sparkles, ChevronLeft, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';

type ViewState = 'dashboard' | 'generator' | 'project';

export default function App() {
  const { user, signIn, logOut, loading: authLoading } = useAuth();
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (idea: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to generate timeline.');
      }

      const timeline: ProjectTimeline = await response.json();
      
      if (!user) throw new Error('You must be logged in to save a project.');
      
      const projectId = crypto.randomUUID();
      const project: Project = {
        id: projectId,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        idea,
        timeline,
        completedTasks: []
      };

      await setDoc(doc(db, 'projects', projectId), project);
      
      setCurrentProject(project);
      setView('project');
    } catch (err: any) {
      if (err.message && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.CREATE, 'projects');
      }
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center space-y-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-sm">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome to Project AI</h1>
          <p className="text-stone-600">Generate IT project timelines instantly and track your issues in one place.</p>
          <button
            onClick={signIn}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setView('dashboard'); setCurrentProject(null); }}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-900">
              Project AI
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {view === 'project' && (
              <button 
                onClick={() => { setView('dashboard'); setCurrentProject(null); }}
                className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </button>
            )}
            <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>
            <button
              onClick={logOut}
              className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1 sm:hidden" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard 
                onNewProject={() => setView('generator')} 
                onViewProject={(p) => { setCurrentProject(p); setView('project'); }} 
              />
            </motion.div>
          )}

          {view === 'generator' && (
            <motion.div 
              key="generator"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide uppercase mb-4">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Planning
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
                  From idea to <span className="text-blue-600">execution</span> in seconds.
                </h1>
                <p className="text-lg md:text-xl text-stone-600">
                  Describe your IT project and let our AI instantly generate a structured timeline with key milestones, tasks, and estimated durations.
                </p>
              </div>

              <div className="w-full">
                <IdeaInput onSubmit={handleGenerate} isLoading={isLoading} />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center max-w-2xl w-full mx-auto shadow-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'project' && currentProject && (
            <motion.div
              key="project"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
            >
              <TimelineView 
                project={currentProject} 
                onUpdateProject={(p) => setCurrentProject(p)} 
              />
              <IssuesList projectId={currentProject.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

