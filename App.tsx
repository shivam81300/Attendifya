
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SubjectCard from './components/SubjectCard';
import Analytics from './components/Analytics';
import AIChat from './components/AIChat';
import { Subject, AppRoute, AppState, AttendanceEntry, SubjectSchedule } from './types';
import { storageService } from './services/storageService';
import { DEFAULT_SUBJECT_COLORS } from './constants';
import { analyzeAttendance } from './services/geminiService';
import { calculatePercentage } from './utils/attendanceUtils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(storageService.loadData());
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  
  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [subjectColorInput, setSubjectColorInput] = useState(DEFAULT_SUBJECT_COLORS[0]);
  const [scheduleInput, setScheduleInput] = useState<SubjectSchedule[]>([]);
  
  // New slot inputs
  const [newSlotDay, setNewSlotDay] = useState<number>(1); // Default Mon
  const [newSlotTime, setNewSlotTime] = useState<string>('09:00');

  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    storageService.saveData(state);
  }, [state]);

  const openAddModal = () => {
    setModalMode('add');
    setSubjectNameInput('');
    setTeacherNameInput('');
    setScheduleInput([]);
    setSubjectColorInput(DEFAULT_SUBJECT_COLORS[state.subjects.length % DEFAULT_SUBJECT_COLORS.length]);
  };

  const openEditModal = (subject: Subject) => {
    setModalMode('edit');
    setEditingSubjectId(subject.id);
    setSubjectNameInput(subject.name);
    setTeacherNameInput(subject.teacherName || '');
    setScheduleInput(subject.schedule || []);
    setSubjectColorInput(subject.color);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingSubjectId(null);
  };

  const addScheduleSlot = () => {
    setScheduleInput(prev => [...prev, { day: newSlotDay, time: newSlotTime }]);
  };

  const removeScheduleSlot = (index: number) => {
    setScheduleInput(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSubject = () => {
    if (!subjectNameInput.trim()) return;

    if (modalMode === 'add') {
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: subjectNameInput,
        teacherName: teacherNameInput,
        present: 0,
        total: 0,
        history: [],
        color: subjectColorInput,
        schedule: scheduleInput
      };
      setState(prev => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
    } else if (modalMode === 'edit' && editingSubjectId) {
      setState(prev => ({
        ...prev,
        subjects: prev.subjects.map(s => s.id === editingSubjectId ? { 
          ...s, 
          name: subjectNameInput, 
          teacherName: teacherNameInput,
          color: subjectColorInput,
          schedule: scheduleInput
        } : s)
      }));
    }
    closeModal();
  };

  const markAttendance = (id: string, type: 'present' | 'absent') => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => {
        if (s.id !== id) return s;
        const entry: AttendanceEntry = { id: Date.now().toString(), timestamp: Date.now(), type };
        return {
          ...s,
          present: type === 'present' ? s.present + 1 : s.present,
          total: s.total + 1,
          history: [...s.history, entry]
        };
      })
    }));
  };

  const undoLast = (id: string) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => {
        if (s.id !== id || s.history.length === 0) return s;
        const last = s.history[s.history.length - 1];
        return {
          ...s,
          present: last.type === 'present' ? s.present - 1 : s.present,
          total: s.total - 1,
          history: s.history.slice(0, -1)
        };
      })
    }));
  };

  const totalPresent = state.subjects.reduce((acc, s) => acc + s.present, 0);
  const totalClasses = state.subjects.reduce((acc, s) => acc + s.total, 0);
  const overallPerc = calculatePercentage(totalPresent, totalClasses);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderContent = () => {
    switch (route) {
      case AppRoute.HOME:
        return (
          <div className="p-4 space-y-4 pb-20">
            {/* Widget Area 📱 */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between aspect-square">
                <div className="flex justify-between items-start">
                  <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl text-sm">
                    <i className="fas fa-bullseye"></i>
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Overall</span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-800">{overallPerc}%</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Performance</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-3xl shadow-lg flex flex-col justify-between aspect-square text-white">
                <div className="flex justify-between items-start">
                  <span className="bg-white/20 p-2 rounded-xl text-sm">
                    <i className="fas fa-calendar-day"></i>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-200 uppercase">Today</span>
                </div>
                <div>
                  <h4 className="text-xl font-black">{totalPresent} / {totalClasses}</h4>
                  <p className="text-[10px] text-indigo-100 font-semibold uppercase">Total Success</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2 px-1">
              <h2 className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Your Schedule</h2>
              <button 
                onClick={openAddModal}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                <i className="fas fa-plus mr-1"></i> New Subject
              </button>
            </div>

            {state.subjects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <i className="fas fa-plus-circle text-4xl text-gray-200 mb-4"></i>
                <p className="text-gray-400 font-medium px-10">Start by adding your first subject to track attendance!</p>
              </div>
            ) : (
              state.subjects.map(s => (
                <SubjectCard 
                  key={s.id} 
                  subject={s} 
                  onMark={markAttendance} 
                  onUndo={undoLast} 
                  onEdit={openEditModal}
                  onClick={() => {}} 
                />
              ))
            )}

            {state.subjects.length > 0 && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-gray-800 text-sm">AI Insights 🧠</h3>
                  <i className="fas fa-sparkles text-indigo-400"></i>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed min-h-[40px]">
                  {aiSummary || 'Tap the button below to analyze your attendance patterns.'}
                </p>
                <button 
                  onClick={async () => {
                    setAiSummary('Synthesizing data...');
                    const tip = await analyzeAttendance(state.subjects);
                    setAiSummary(tip);
                  }}
                  className="mt-4 w-full bg-gray-50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Regenerate Analysis
                </button>
              </div>
            )}
          </div>
        );
      case AppRoute.ANALYTICS:
        return <Analytics subjects={state.subjects} />;
      case AppRoute.AI_CHAT:
        return <AIChat subjects={state.subjects} />;
      case AppRoute.DETAILS:
        return (
          <div className="p-6 pb-24">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Subject Statistics</h2>
            <div className="space-y-4">
              {state.subjects.map(s => {
                const perc = calculatePercentage(s.present, s.total);
                return (
                  <div key={s.id} className="bg-white p-4 rounded-3xl border flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 rounded-full" style={{ backgroundColor: s.color }}></div>
                      <div>
                        <div className="font-bold text-gray-800">{s.name}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Prof. {s.teacherName || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-lg ${perc >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                        {perc}%
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">{s.present}P / {s.total}T</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case AppRoute.SETTINGS:
        return (
          <div className="p-6 space-y-6 pb-24">
            <h2 className="text-2xl font-black text-gray-800">App Settings</h2>
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Primary Goal</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="50" max="100" 
                    value={state.goalPercentage}
                    onChange={(e) => setState(prev => ({ ...prev, goalPercentage: parseInt(e.target.value) }))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-indigo-50 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-black text-indigo-600 text-lg w-12">{state.goalPercentage}%</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <button 
                  onClick={() => {
                    if (window.confirm('Wipe all local attendance data?')) {
                      setState({ subjects: [], goalPercentage: 75 });
                      storageService.clearData();
                    }
                  }}
                  className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-trash-alt"></i> Wipe All Data
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      title={route === AppRoute.HOME ? 'Attendify' : route.charAt(0).toUpperCase() + route.slice(1).replace('-', ' ')} 
      activeRoute={route} 
      onNavigate={setRoute}
    >
      {renderContent()}

      {/* Add/Edit Subject Modal Overlay */}
      {modalMode && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full rounded-3xl p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-800 mb-6">
              {modalMode === 'add' ? 'New Subject' : 'Modify Subject'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Subject Name</label>
                <input 
                  type="text" 
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  placeholder="e.g. Theoretical Physics"
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Teacher / Professor</label>
                <input 
                  type="text" 
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Timetable Schedule 🕒</label>
                
                {/* Slot Addition UI */}
                <div className="bg-gray-50 p-3 rounded-2xl mb-3 border border-gray-100">
                   <div className="flex gap-2 mb-2">
                     <select 
                        value={newSlotDay}
                        onChange={(e) => setNewSlotDay(parseInt(e.target.value))}
                        className="flex-1 bg-white border-none rounded-xl px-2 py-2 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500"
                     >
                       {daysOfWeek.map((day, i) => <option key={i} value={i}>{day}</option>)}
                     </select>
                     <input 
                        type="time"
                        value={newSlotTime}
                        onChange={(e) => setNewSlotTime(e.target.value)}
                        className="flex-1 bg-white border-none rounded-xl px-2 py-2 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500"
                     />
                     <button 
                        onClick={addScheduleSlot}
                        className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-95"
                     >
                        <i className="fas fa-plus"></i>
                     </button>
                   </div>
                   <p className="text-[9px] text-gray-400 px-1 italic">Add multiple slots if a subject has more than one class on any day.</p>
                </div>

                {/* Slots List */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {scheduleInput.length === 0 ? (
                    <p className="text-center text-xs text-gray-300 py-2">No class slots added</p>
                  ) : (
                    scheduleInput.map((slot, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 px-3 py-2 rounded-xl flex justify-between items-center shadow-sm">
                        <span className="text-xs font-bold text-gray-700">
                          {daysOfWeek[slot.day]} at {slot.time}
                        </span>
                        <button 
                          onClick={() => removeScheduleSlot(idx)}
                          className="text-red-300 hover:text-red-500 p-1"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 ml-1">Subject Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SUBJECT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSubjectColorInput(color)}
                      className={`w-8 h-8 rounded-full transition-all ${subjectColorInput === color ? 'ring-4 ring-indigo-200 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={subjectColorInput}
                    onChange={(e) => setSubjectColorInput(e.target.value)}
                    className="w-8 h-8 p-0 border-none rounded-full cursor-pointer bg-transparent overflow-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <button 
                onClick={closeModal}
                className="flex-1 bg-gray-50 text-gray-400 font-bold py-3 rounded-2xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSubject}
                className="flex-2 bg-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-100 text-sm"
              >
                {modalMode === 'add' ? 'Add Subject' : 'Save Changes'}
              </button>
            </div>

            {modalMode === 'edit' && (
              <button 
                onClick={() => {
                  if (window.confirm('Remove this subject?')) {
                    setState(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== editingSubjectId) }));
                    closeModal();
                  }
                }}
                className="w-full mt-4 text-red-400 text-[10px] font-bold uppercase tracking-widest py-2 hover:text-red-600 transition-colors"
              >
                Delete Subject
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSS Transitions */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #6366f1;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </Layout>
  );
};

export default App;
