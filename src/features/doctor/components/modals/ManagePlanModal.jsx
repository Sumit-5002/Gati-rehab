import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Dumbbell, Repeat, Clock, FileText, Pill, Trash, Target, ChevronRight } from 'lucide-react';
import {
  getPatientRoutine,
  updatePatientRoutine,
  getPatientMedications,
  addMedication,
  deleteMedication
} from '../../services/doctorService';
import { AVAILABLE_EXERCISES } from '../../../ai/utils/secondaryExercises';
import { useTheme } from '../../../../contexts/ThemeContext';

const ManagePlanModal = ({ isOpen, onClose, patientId, patientName }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    exerciseId: '',
    sets: '3',
    reps: '10',
    duration: '',
    notes: ''
  });
  const [planDetails, setPlanDetails] = useState({
    phase: 'Recovery Initiation',
    target: 'Mobility Restore',
    duration: '8 Weeks',
    observations: 'Focus on consistency over intensity.'
  });

  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const exerciseList = Object.entries(AVAILABLE_EXERCISES).map(([id, data]) => ({
    id,
    ...data
  }));

  const [meds, setMeds] = useState([]);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '', duration: '7' });

  // Load existing routine when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      loadRoutine();
      loadMeds();
    }
  }, [isOpen, patientId]);

  const loadMeds = async () => {
    const data = await getPatientMedications(patientId);
    setMeds(Array.isArray(data) ? data : []);
  };

  const handleAddMed = async () => {
    if (!newMed.name || !newMed.time || !newMed.duration) return;
    try {
      await addMedication(patientId, {
        ...newMed,
        duration: parseInt(newMed.duration),
        startDate: new Date()
      });
      setNewMed({ name: '', dosage: '', time: '', duration: '7' });
      loadMeds();
    } catch (err) {
      console.error("Error adding med:", err);
    }
  };

  const handleDeleteMed = async (id) => {
    try {
      await deleteMedication(id);
      loadMeds();
    } catch (err) {
      console.error("Error deleting med:", err);
    }
  };

  const loadRoutine = async () => {
    setLoading(true);
    try {
      const routine = await getPatientRoutine(patientId);
      if (routine) {
        setExercises(Array.isArray(routine.exercises) ? routine.exercises : []);
        setPlanDetails({
          phase: routine.phase || 'Recovery Initiation',
          target: routine.target || 'Mobility Restore',
          duration: routine.duration || '8 Weeks',
          observations: routine.observations || 'Focus on consistency over intensity.'
        });
      } else {
        setExercises([]);
      }
    } catch (error) {
      console.error("Error loading routine:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    if (!newExercise.name) return;

    // Use exerciseId as the primary ID to ensure correct lookup in workout session
    const uniqueId = newExercise.exerciseId || `custom-${Date.now()}`;
    setExercises([...exercises, { ...newExercise, id: uniqueId }]);
    setNewExercise({ name: '', exerciseId: '', sets: '3', reps: '10', duration: '', notes: '' });
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePatientRoutine(patientId, {
        exercises: exercises,
        ...planDetails,
        lastUpdated: new Date()
      });
      onClose();
    } catch (error) {
      console.error("Error saving routine:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>

          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-slate-50/50'}`}>
            <div>
              <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Manage Care Plan</h2>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Assigning exercises for <span className="text-blue-600">{patientName}</span></p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">

            {/* Plan Strategy Details */}
            <div className={`p-6 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`text-sm font-black mb-6 uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Target className="w-4 h-4 text-blue-600" /> Strategy Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase ml-1">Recovery Phase</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-slate-500' : 'bg-white border-slate-200'}`}
                    value={planDetails.phase}
                    onChange={(e) => setPlanDetails({ ...planDetails, phase: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase ml-1">Main Target</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-slate-500' : 'bg-white border-slate-200'}`}
                    value={planDetails.target}
                    onChange={(e) => setPlanDetails({ ...planDetails, target: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase ml-1">Total Duration</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-slate-500' : 'bg-white border-slate-200'}`}
                    value={planDetails.duration}
                    onChange={(e) => setPlanDetails({ ...planDetails, duration: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase ml-1">Clinical Observations / Guidance</label>
                <textarea
                  rows="3"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-slate-500' : 'bg-white border-slate-200'}`}
                  value={planDetails.observations}
                  onChange={(e) => setPlanDetails({ ...planDetails, observations: e.target.value })}
                />
              </div>
            </div>

            {/* Add New Exercise Form */}
            <div className="bg-slate-100/50 p-6 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Plus className="w-4 h-4 text-blue-600" /> Append Session Exercise
                </h3>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-6">
                    <div className="relative">
                      <Dumbbell className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <select
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer hover:border-blue-200 transition-all"
                        value={newExercise.exerciseId}
                        onChange={(e) => {
                          const selected = exerciseList.find(ex => ex.id === e.target.value);
                          if (selected) {
                            setNewExercise({
                              ...newExercise,
                              exerciseId: selected.id,
                              name: selected.name,
                              sets: selected.sets?.toString() || '3',
                              reps: selected.repsPerSet?.toString() || '10'
                            });
                          }
                        }}
                      >
                        <option value="" disabled>Select Exercise...</option>
                        {exerciseList.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input
                      type="text"
                      placeholder="Sets"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input
                      type="text"
                      placeholder="Reps"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <button
                      onClick={handleAddExercise}
                      disabled={!newExercise.name}
                      className="w-full h-full bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Medication Management */}
            <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <Pill className="w-4 h-4 text-rose-500" /> Prescribe Medication
                </h3>
                <div className="grid grid-cols-12 gap-3 mb-6">
                  <div className="col-span-12 md:col-span-4">
                    <input
                      type="text"
                      placeholder="Medication Name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <input
                      type="time"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                      value={newMed.time}
                      onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Days"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none text-right pr-12"
                        value={newMed.duration}
                        onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                        min="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400">Days</span>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <button
                      onClick={handleAddMed}
                      disabled={!newMed.name}
                      className="w-full h-full bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-rose-100"
                    >
                      Prescribe
                    </button>
                  </div>
                </div>

                {/* Current Meds List */}
                <div className="space-y-2">
                  {meds.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm border border-rose-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                          <Pill className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none mb-1">{med.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.dosage} • {med.time} Shift</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMed(med.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {meds.length === 0 && (
                    <p className="text-xs font-bold text-slate-400 text-center py-4 italic">No active medications prescribed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Plan List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-slate-400" /> Current Routine ({Array.isArray(exercises) ? exercises.length : 0})
                </h3>
                {Array.isArray(exercises) && exercises.length > 0 && (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                    {exercises.length} Exercises Assigned
                  </span>
                )}
              </div>

              {Array.isArray(exercises) && exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Dumbbell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">No exercises assigned yet.</p>
                  <p className="text-slate-400 text-xs">Use the list above to build a plan.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {Array.isArray(exercises) && exercises.map((ex, idx) => (
                    <div key={ex.id || idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-bold text-slate-900 truncate">{ex.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                            <Repeat className="w-3 h-3" /> {ex.sets} sets × {ex.reps} reps
                          </span>
                          {ex.notes && (
                            <span className="flex items-center gap-1 truncate max-w-full">
                              <FileText className="w-3 h-3" /> {ex.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Remove exercise"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Care Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePlanModal;