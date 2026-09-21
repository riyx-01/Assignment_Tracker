import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AssignmentModal({ isOpen, onClose, onSave, editingAssignment }) {
  const [formData, setFormData] = useState({
    subject: '', title: '', instructor: '', instructions: '',
    totalMarks: '', startDate: '', deadline: '', status: 'Pending'
  });

  useEffect(() => {
    if (editingAssignment) {
      setFormData(editingAssignment);
    } else {
      setFormData({
        subject: '', title: '', instructor: '', instructions: '',
        totalMarks: '', startDate: '', deadline: '', status: 'Pending'
      });
    }
  }, [editingAssignment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white border border-gray-100 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e581a2] to-[#ffb4c8]">{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium" placeholder="e.g. Case Study" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
              <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium" placeholder="e.g. Big Data Analytics" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Instructor</label>
              <input type="text" value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Instructions / Requirements</label>
              <textarea value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none min-h-[80px] font-medium" placeholder="e.g. Upload PDF" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Total Marks</label>
              <input type="number" step="0.1" value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
              <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
              <input required type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full bg-[#ececec] border-none rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-[#e581a2] outline-none font-medium" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#e581a2] to-[#ffb4c8] hover:opacity-90 rounded-full transition-opacity shadow-[0_4px_15px_rgba(229,129,162,0.3)]">Save Assignment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
