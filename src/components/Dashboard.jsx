import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Upload, Filter, ArrowUpDown } from 'lucide-react';
import { useAssignments } from '../hooks/useAssignments';
import EmergencyBanner from './EmergencyBanner';
import AssignmentCard from './AssignmentCard';
import AssignmentModal from './AssignmentModal';
import { isEmergency } from '../utils/dates';
import { triggerNotification } from '../utils/notifications';
import { isPast, parseISO } from 'date-fns';

export default function Dashboard() {
  const { assignments, addAssignment, updateAssignment, deleteAssignment, markCompleted, importData } = useAssignments();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Deadline');
  
  useEffect(() => {
    const emergencies = assignments.filter(a => a.status !== 'Completed' && isEmergency(a.deadline));
    if (emergencies.length > 0) {
      triggerNotification("Emergency Deadlines!", {
        body: `You have ${emergencies.length} assignments due within 48 hours.`,
      });
    }
  }, []);

  const handleSave = (assignment) => {
    if (assignment.id) {
      updateAssignment(assignment.id, assignment);
    } else {
      addAssignment(assignment);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assignments, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "assignments_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      const success = importData(e.target.result);
      if(success) alert("Import successful!");
      else alert("Invalid JSON file");
    };
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (filter === 'All') return true;
      if (filter === 'Completed') return a.status === 'Completed';
      
      const now = new Date('2026-09-21T00:00:00');
      const deadline = parseISO(a.deadline);
      const past = isPast(deadline) && now > deadline;

      if (filter === 'Emergency') return a.status !== 'Completed' && isEmergency(a.deadline);
      if (filter === 'Upcoming') return a.status !== 'Completed' && !past;
      if (filter === 'Expired') return a.status !== 'Completed' && past;
      
      return true;
    }).sort((a, b) => {
      if (sort === 'Deadline') return new Date(a.deadline) - new Date(b.deadline);
      if (sort === 'Subject') return a.subject.localeCompare(b.subject);
      if (sort === 'Marks') return (Number(b.totalMarks) || 0) - (Number(a.totalMarks) || 0);
      return 0;
    });
  }, [assignments, filter, sort]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 pt-24 lg:pt-32 pb-24">
      {/* Sticky Command Bar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl glass-pill rounded-full px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4 text-gray-500" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent text-sm text-gray-700 font-bold outline-none cursor-pointer appearance-none">
              <option value="All">All</option>
              <option value="Emergency">Emergency</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent text-sm text-gray-700 font-bold outline-none cursor-pointer appearance-none">
              <option value="Deadline">Nearest Deadline</option>
              <option value="Subject">Subject-wise</option>
              <option value="Marks">Highest Marks</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#fce3ec] hover:bg-[#ffb4c8] text-[#e581a2] hover:text-white rounded-full text-sm font-bold transition-colors" title="Import JSON">
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Import</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-bold transition-colors" title="Export JSON">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button onClick={() => { setEditingAssignment(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#e581a2] to-[#ffb4c8] text-white rounded-full text-sm font-bold shadow-[0_4px_15px_rgba(229,129,162,0.3)] transition-all transform hover:scale-105 hover:shadow-[0_6px_20px_rgba(229,129,162,0.4)]">
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <header className="text-center mb-16 mt-12 sm:mt-8">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 text-gradient pb-2 drop-shadow-sm">
          Assignment Tracker
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">Manage, sort, and conquer your academic workflow with precision.</p>
      </header>

      <main>
        <EmergencyBanner assignments={assignments} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
          {filteredAssignments.map((assignment, idx) => (
            <div key={assignment.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${(idx % 12) * 100}ms`, animationFillMode: 'both' }}>
              <AssignmentCard 
                assignment={assignment} 
                onEdit={handleEdit}
                onDelete={deleteAssignment}
                onComplete={markCompleted}
              />
            </div>
          ))}
        </div>
        
        {filteredAssignments.length === 0 && (
          <div className="text-center py-32 bg-white/50 rounded-3xl mt-8 border-dashed border-gray-300 border-2">
            <p className="text-2xl font-bold text-gray-800 mb-2">No assignments found</p>
            <p className="text-gray-500 font-medium">Time to relax, or try adjusting your filters.</p>
          </div>
        )}
      </main>

      <AssignmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingAssignment={editingAssignment}
      />
    </div>
  );
}
