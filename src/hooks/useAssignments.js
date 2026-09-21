import { useState, useEffect } from 'react';

const SEED_DATA = [
  {
    id: 1,
    subject: "Big Data Analytics & Visualization Lab",
    title: "Tableau",
    instructor: "Priya Chandran",
    instructions: "Upload Pdf",
    totalMarks: 4.0,
    obtainedMarks: null,
    startDate: "2026-09-22T07:00",
    deadline: "2026-10-06T23:00",
    status: "Upcoming"
  },
  {
    id: 2,
    subject: "Big Data Analytics & Visualization (Theory)",
    title: "Case study",
    instructor: "Priya Chandran, SUHASINI KOTTUR",
    instructions: "Upload scanned copy",
    totalMarks: 5.0,
    obtainedMarks: null,
    startDate: "2026-09-16T07:00",
    deadline: "2026-09-23T23:00",
    status: "Pending" // Normalized status
  },
  {
    id: 3,
    subject: "Distributed System & Cloud Computing Lab",
    title: "Assignment 6",
    instructor: "Jyoti Kharade",
    instructions: "Upload pdf",
    totalMarks: 25.0,
    obtainedMarks: null,
    startDate: "2026-09-13T19:00",
    deadline: "2026-09-26T23:00",
    status: "Pending"
  },
  {
    id: 4,
    subject: "Distributed System & Cloud Computing Lab",
    title: "Assignment 7",
    instructor: "Jyoti Kharade",
    instructions: "Upload pdf",
    totalMarks: 25.0,
    obtainedMarks: null,
    startDate: "2026-09-20T07:00",
    deadline: "2026-09-30T23:00",
    status: "Pending"
  },
  {
    id: 5,
    subject: "Software Testing Quality Assurance Lab",
    title: "Assignment 3",
    instructor: "Shravani Pawar",
    instructions: "Upload Only PDF",
    totalMarks: 14.0,
    obtainedMarks: null,
    startDate: "2026-09-07T07:00",
    deadline: "2026-10-03T23:00",
    status: "Pending"
  }
];

export function useAssignments() {
  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem('tracker_assignments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local storage data", e);
      }
    }
    return SEED_DATA;
  });

  useEffect(() => {
    localStorage.setItem('tracker_assignments', JSON.stringify(assignments));
  }, [assignments]);

  // Listen for the custom event emitted by the Chrome Extension (sync.js)
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('tracker_assignments');
      if (saved) {
        try {
          setAssignments(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse synced data");
        }
      }
    };
    
    window.addEventListener('tracker_sync', handleSync);
    return () => window.removeEventListener('tracker_sync', handleSync);
  }, []);

  const addAssignment = (assignment) => {
    setAssignments(prev => [...prev, { ...assignment, id: Date.now() }]);
  };

  const updateAssignment = (id, updatedData) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
  };

  const deleteAssignment = (id) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const markCompleted = (id) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'Completed' } : a));
  };

  const importData = (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        setAssignments(parsed);
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON data");
    }
    return false;
  };

  return { assignments, addAssignment, updateAssignment, deleteAssignment, markCompleted, importData };
}
