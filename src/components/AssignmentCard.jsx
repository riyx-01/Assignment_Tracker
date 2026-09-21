import React from 'react';
import { Calendar, Clock, BookOpen, User, CheckCircle2, Trash2, Edit2 } from 'lucide-react';
import { getStatusDetails, formatDisplayDate } from '../utils/dates';

export default function AssignmentCard({ assignment, onEdit, onDelete, onComplete }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const { level, text } = getStatusDetails(assignment.deadline, assignment.status);

  let bgClass = '';
  if (level === 'emergency') bgClass = 'emergency';
  if (level === 'success') bgClass = 'success';

  return (
    <div className="theme-card-wrapper h-full group">
      <div className={`theme-card-bg ${bgClass}`}></div>
      
      <div className="theme-card-content">
        <div className="flex justify-between items-start mb-6">
          <div className="max-w-[75%]">
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest bg-white/50 text-gray-900 shadow-sm backdrop-blur-sm mb-4`}>
              {text}
            </span>
            <h3 className="theme-title leading-snug break-words">{assignment.title}</h3>
            <p className="theme-meta text-sm mt-1.5 leading-relaxed">{assignment.subject}</p>
          </div>
          
          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 relative z-20">
            {assignment.status !== 'Completed' && (
              <button onClick={() => onComplete(assignment.id)} className="p-2 bg-white/60 hover:bg-emerald-100 text-emerald-600 rounded-xl shadow-sm transition-colors" title="Mark Completed">
                <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => onEdit(assignment)} className="p-2 bg-white/60 hover:bg-blue-100 text-blue-600 rounded-xl shadow-sm transition-colors" title="Edit">
              <Edit2 className="w-5 h-5" />
            </button>
            <button onClick={() => onDelete(assignment.id)} className="p-2 bg-white/60 hover:bg-rose-100 text-rose-600 rounded-xl shadow-sm transition-colors" title="Delete">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4 flex-grow">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-800 shrink-0" />
            <span className="theme-desc text-sm truncate" title={assignment.instructor}>{assignment.instructor || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-gray-800 shrink-0" />
            <span className="theme-desc text-sm truncate" title={assignment.instructions}>{assignment.instructions || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-800 shrink-0" />
            <span className="theme-desc text-sm">Marks: <strong className="font-bold">{assignment.totalMarks || '-'}</strong></span>
          </div>

          {assignment.details && (
            <div className="pt-2">
              <button 
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full py-1.5 px-3 bg-white/50 hover:bg-white/80 text-xs font-bold text-gray-700 rounded-xl flex items-center justify-between transition-colors border border-white/40 shadow-sm"
              >
                <span>{showDetails ? 'Hide Questions' : '📖 View Assignment Questions'}</span>
                <span className="text-[10px] bg-[#e581a2]/20 text-[#e581a2] px-1.5 py-0.5 rounded-full font-bold">
                  {showDetails ? '▲' : '▼'}
                </span>
              </button>
              {showDetails && (
                <div className="mt-2 p-3 bg-white/80 rounded-xl text-xs text-gray-800 border border-white/60 max-h-44 overflow-y-auto whitespace-pre-line leading-relaxed font-medium shadow-sm">
                  {assignment.details}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/20">
          <div className="flex justify-between text-xs mb-1 font-bold uppercase tracking-wider theme-desc">
            <span>{formatDisplayDate(assignment.startDate).split(' ')[0]}</span>
            <span>{formatDisplayDate(assignment.deadline)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
