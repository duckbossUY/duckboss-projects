import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Issue } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { AlertCircle, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface IssuesListProps {
  projectId: string;
}

export default function IssuesList({ projectId }: IssuesListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    async function fetchIssues() {
      try {
        const q = query(collection(db, `projects/${projectId}/issues`));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIssues(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/issues`);
      } finally {
        setLoading(false);
      }
    }
    fetchIssues();
  }, [projectId]);

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const issueId = crypto.randomUUID();
    const newIssue: Issue = {
      id: issueId,
      projectId,
      createdAt: new Date().toISOString(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      status: 'open'
    };

    try {
      await setDoc(doc(db, `projects/${projectId}/issues`, issueId), newIssue);
      setIssues([newIssue, ...issues]);
      setNewTitle('');
      setNewDescription('');
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/issues/${issueId}`);
    }
  };

  const toggleStatus = async (issue: Issue) => {
    const newStatus = issue.status === 'open' ? 'closed' : 'open';
    try {
      await updateDoc(doc(db, `projects/${projectId}/issues`, issue.id), {
        status: newStatus
      });
      setIssues(issues.map(i => i.id === issue.id ? { ...i, status: newStatus } : i));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}/issues/${issue.id}`);
    }
  };

  const deleteIssue = async (issueId: string) => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      await deleteDoc(doc(db, `projects/${projectId}/issues`, issueId));
      setIssues(issues.filter(i => i.id !== issueId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/issues/${issueId}`);
    }
  };

  if (loading) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 mt-12">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          Project Issues
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4 mr-1"/> Add Issue</>}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200"
        >
          <form onSubmit={handleAddIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Issue Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Brief description of the issue"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Details (Optional)</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                placeholder="More context about the issue..."
                maxLength={2000}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Issue
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {issues.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-stone-500 border border-dashed border-stone-300 rounded-2xl">
            No issues reported yet.
          </div>
        ) : (
          issues.map(issue => (
            <div key={issue.id} className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex items-start gap-4 group">
              <button 
                onClick={() => toggleStatus(issue)}
                className="mt-0.5 text-stone-400 hover:text-blue-600 transition-colors shrink-0 focus:outline-none"
              >
                {issue.status === 'closed' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h4 className={`text-base font-medium truncate ${issue.status === 'closed' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                    {issue.title}
                  </h4>
                  <button
                    onClick={() => deleteIssue(issue.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {issue.description && (
                  <p className={`mt-2 text-sm ${issue.status === 'closed' ? 'text-stone-400' : 'text-stone-600'}`}>
                    {issue.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-stone-500">
                  <span className={`px-2 py-0.5 rounded-full ${issue.status === 'closed' ? 'bg-stone-100 text-stone-500' : 'bg-orange-100 text-orange-700'}`}>
                    {issue.status.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
