
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Subject } from '../types';
import { calculatePercentage } from '../utils/attendanceUtils';
import { COLORS } from '../constants';

interface AnalyticsProps {
  subjects: Subject[];
}

const Analytics: React.FC<AnalyticsProps> = ({ subjects }) => {
  const barData = subjects.map(s => ({
    name: s.name,
    percentage: calculatePercentage(s.present, s.total),
    color: s.color
  }));

  const totalPresent = subjects.reduce((acc, s) => acc + s.present, 0);
  const totalAbsent = subjects.reduce((acc, s) => acc + (s.total - s.present), 0);
  const overallPercentage = calculatePercentage(totalPresent, totalPresent + totalAbsent);
  
  const pieData = [
    { name: 'Present', value: totalPresent, color: COLORS.PRESENT },
    { name: 'Absent', value: totalAbsent, color: COLORS.ABSENT },
  ];

  // Best & Worst Analysis
  const sortedSubjects = [...subjects].sort((a, b) => 
    calculatePercentage(b.present, b.total) - calculatePercentage(a.present, a.total)
  );
  
  const bestSubject = sortedSubjects[0];
  const worstSubject = sortedSubjects[sortedSubjects.length - 1];

  // For trend, we'd ideally aggregate history across all subjects by date.
  const trendData = subjects[0]?.history.map((h, i) => ({
    index: i + 1,
    attendance: calculatePercentage(
      subjects[0].history.slice(0, i + 1).filter(e => e.type === 'present').length,
      i + 1
    )
  })) || [];

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-400">
        <i className="fas fa-chart-line text-5xl mb-4"></i>
        <p>Add subjects to see analytics</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 animate-fadeIn pb-24">
      {/* Overview Card */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-lg font-medium opacity-80 mb-1 flex items-center justify-between">
          Overall Attendance
          <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Live</span>
        </h2>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-black">
            {overallPercentage}%
          </span>
          <span className={`mb-1 text-xs px-2 py-0.5 rounded-full font-bold ${overallPercentage >= 75 ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
            {overallPercentage >= 75 ? 'Safe ✅' : 'Risk ⚠️'}
          </span>
        </div>
        <div className="w-full bg-indigo-800 rounded-full h-3 mb-2">
          <div 
            className="bg-white h-full rounded-full transition-all duration-1000" 
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-indigo-200">Total Classes tracked: {totalPresent + totalAbsent}</p>
      </div>

      {/* Subject Insights Brain 🧠 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-3xl border border-green-100 shadow-sm">
          <span className="text-[10px] font-bold text-green-600 uppercase mb-2 block">Most Attended</span>
          <h4 className="font-bold text-gray-800 truncate">{bestSubject.name}</h4>
          <p className="text-2xl font-black text-green-600">{calculatePercentage(bestSubject.present, bestSubject.total)}%</p>
          <p className="text-[10px] text-green-700 mt-1">Excellent consistency! 🌟</p>
        </div>
        <div className="bg-red-50 p-4 rounded-3xl border border-red-100 shadow-sm">
          <span className="text-[10px] font-bold text-red-600 uppercase mb-2 block">At Highest Risk</span>
          <h4 className="font-bold text-gray-800 truncate">{worstSubject.name}</h4>
          <p className="text-2xl font-black text-red-600">{calculatePercentage(worstSubject.present, worstSubject.total)}%</p>
          <p className="text-[10px] text-red-700 mt-1">Needs attention! 🛑</p>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <i className="fas fa-chart-bar text-indigo-500"></i>
          Subject Comparison
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="percentage" radius={[0, 10, 10, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Pie Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <i className="fas fa-chart-pie text-pink-500"></i>
          Total Distribution
        </h3>
        <div className="h-64 flex items-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-10px] text-center pointer-events-none">
            <span className="block text-[10px] text-gray-400 uppercase font-bold">Total</span>
            <span className="text-xl font-black text-gray-700 leading-none">{totalPresent + totalAbsent}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
