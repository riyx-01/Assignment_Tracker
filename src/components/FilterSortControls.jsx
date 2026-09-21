import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';

export default function FilterSortControls({ filter, setFilter, sort, setSort }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-sm">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Filter className="w-5 h-5 text-gray-400 shrink-0" />
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border border-gray-700 outline-none"
        >
          <option value="All">All Assignments</option>
          <option value="Emergency">Emergency (Due &lt; 48h)</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
        </select>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <ArrowUpDown className="w-5 h-5 text-gray-400 shrink-0" />
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value)}
          className="bg-gray-800 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border border-gray-700 outline-none"
        >
          <option value="Deadline">Nearest Deadline First</option>
          <option value="Subject">Subject-wise</option>
          <option value="Marks">Highest Marks First</option>
        </select>
      </div>
    </div>
  );
}
