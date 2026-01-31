
import React, { useState } from 'react';
import { Subject } from '../types';
import { calculatePercentage, getStatusColor, calculateRequiredClasses, calculateWhatIfPercentage, calculateBunkableClasses } from '../utils/attendanceUtils';

interface SubjectCardProps {
  subject: Subject;
  onMark: (id: string, type: 'present' | 'absent') => void;
  onUndo: (id: string) => void;
  onEdit: (subject: Subject) => void;
  onClick: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onMark, onUndo, onEdit, onClick }) => {
  const [extraClasses, setExtraClasses] = useState(0);
  const percentage = calculatePercentage(subject.present, subject.total);
  const required = calculateRequiredClasses(subject.present, subject.total);
  const bunkable = calculateBunkableClasses(subject.present, subject.total);
  const whatIfPerc = calculateWhatIfPercentage(subject.present, subject.total, extraClasses);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div className="cursor-pointer flex-1" onClick={() => onClick(subject)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }}></span>
            <h3 className="font-bold text-lg text-gray-800 leading-tight">
              {subject.name}
            </h3>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(subject); }}
              className="text-gray-300 hover:text-indigo-500 transition-colors p-1"
            >
              <i className="fas fa-pen text-xs"></i>
            </button>
          </div>
          {subject.teacherName && (
            <p className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
              <i className="fas fa-user-tie text-[10px]"></i> Prof. {subject.teacherName}
            </p>
          )}
          <p className="text-sm text-gray-500 font-semibold">{subject.present} / {subject.total} attended</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${getStatusColor(percentage)}`}>
            {percentage}%
          </div>
        </div>
      </div>

      {/* Timetable Display */}
      {subject.schedule && subject.schedule.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {subject.schedule.map((s, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-100 text-[10px] px-2 py-1 rounded-lg text-gray-600 font-bold flex items-center gap-1">
              <i className="far fa-clock text-gray-300"></i>
              {daysOfWeek[s.day]} {s.time}
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out ${percentage >= 75 ? 'bg-green-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          {percentage >= 75 ? (
            <div className="flex flex-col">
              <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                <i className="fas fa-check-circle"></i>
                Safe Zone!
              </p>
              <p className="text-[10px] text-gray-400">
                You can bunk <span className="text-indigo-500 font-black">{bunkable}</span> more classes.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                <i className="fas fa-exclamation-triangle"></i>
                Below 75%
              </p>
              <p className="text-[10px] text-gray-400">
                Attend next <span className="text-red-500 font-black">{required}</span> classes to recover.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* What-If Simulator */}
      <div className="bg-indigo-50/50 rounded-2xl p-4 mb-4 border border-indigo-100/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">What-If Simulator 🧪</span>
          <span className="text-xs font-black text-indigo-600">
            {extraClasses > 0 ? `+${extraClasses} Classes: ${whatIfPerc}%` : "Preview Attendance"}
          </span>
        </div>
        <input 
          type="range" 
          min="0" max="15" 
          value={extraClasses}
          onChange={(e) => setExtraClasses(parseInt(e.target.value))}
          className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <p className="text-[9px] text-indigo-300 mt-2 font-medium">If I attend next {extraClasses} classes consecutively...</p>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onMark(subject.id, 'present')}
          className="flex-1 bg-green-500 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-plus"></i> Present
        </button>
        <button 
          onClick={() => onMark(subject.id, 'absent')}
          className="flex-1 bg-red-50 text-red-600 border border-red-100 py-3.5 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-times"></i> Absent
        </button>
        <button 
          onClick={() => onUndo(subject.id)}
          className="px-4 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl active:scale-95 transition-all"
          title="Undo last entry"
          disabled={subject.history.length === 0}
        >
          <i className="fas fa-undo"></i>
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;
