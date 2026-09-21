import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { isEmergency, formatDisplayDate } from '../utils/dates';

export default function EmergencyBanner({ assignments }) {
  const emergencies = assignments.filter(a => a.status !== 'Completed' && isEmergency(a.deadline));

  if (emergencies.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-white/70 backdrop-blur-md shadow-sm border border-[#e581a2]/30 rounded-3xl p-6 md:p-8 mb-12">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#fce3ec] text-[#e581a2] rounded-xl shadow-sm">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-2xl tracking-tight">Critical Action Required</h2>
              <p className="text-gray-500 font-medium text-sm mt-0.5">Tasks due within 48 hours</p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emergencies.map(a => (
            <div key={a.id} className="bg-white border border-[#fce3ec] p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="font-bold text-gray-900 text-lg truncate" title={a.title}>{a.title}</p>
                <p className="text-xs text-gray-500 font-bold tracking-wider uppercase mt-1.5 truncate">{a.subject}</p>
              </div>
              <div className="flex items-center gap-2 text-[#e581a2] mt-5 bg-[#fce3ec] w-fit px-3 py-1.5 rounded-lg font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatDisplayDate(a.deadline)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
