import React from 'react';
import { TimetableSlot } from '../types';
import { Calendar, Clock, MapPin, Play, BookOpen, UserCheck } from 'lucide-react';

interface TimetableViewProps {
  timetable: TimetableSlot[];
  onStartSession: (classId: string, subjectId: string, room: string) => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({ timetable, onStartSession }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Timetable</h2>
          <p className="text-sm text-slate-500">Weekly teaching schedule and class venue assignments</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
            Semester 4 & 6 (2025–26)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {timetable.map((slot) => (
          <div
            key={slot.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {slot.dayOfWeek}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">{slot.room}</span>
              </div>

              <h4 className="text-base font-bold text-slate-900">{slot.subjectName}</h4>
              <p className="text-xs text-indigo-600 font-semibold mt-0.5">{slot.subjectCode}</p>
              <p className="text-xs text-slate-500 font-medium mt-2">{slot.className}</p>

              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{slot.startTime} - {slot.endTime}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => onStartSession(slot.classId, slot.subjectId, slot.room)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Launch Attendance</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
