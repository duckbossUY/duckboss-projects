import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

export default function IdeaInput({ onSubmit, isLoading }: IdeaInputProps) {
  const [idea, setIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim() && !isLoading) {
      onSubmit(idea.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="space-y-2">
            <label htmlFor="idea" className="block text-sm font-medium text-stone-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Project Idea
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your IT project idea here. e.g., 'A web application for a local library to manage book checkouts, user accounts, and inventory tracking.'"
              className="w-full min-h-[140px] p-4 text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!idea.trim() || isLoading}
              className="inline-flex items-center justify-center px-6 py-3 font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Timeline...
                </>
              ) : (
                <>
                  Generate Timeline
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
