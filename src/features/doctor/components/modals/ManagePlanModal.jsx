import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Dumbbell, Repeat, Clock, FileText } from 'lucide-react';
import { getPatientRoutine, updatePatientRoutine } from '../../services/doctorService';

const ManagePlanModal = ({ isOpen, onClose, patientId, patientName }) => {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    duration: '',
    notes: ''
  });

  // Load existing routine when modal opens
  useEffect(() => {
    if (isOpen && patientId) {
      loadRoutine();
    }
  }, [isOpen, patientId]);

  const loadRoutine = async () => {
    setLoading(true);
    try {
      const routine = await getPatientRoutine(patientId);
      if (routine && routine.exercises) {
        setExercises(routine.exercises);
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
    
    setExercises([...exercises, { ...newExercise, id: Date.now() }]);
    setNewExercise({ name: '', sets: '', reps: '', duration: '', notes: '' });
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePatientRoutine(patientId, {
        exercises: exercises,
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
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900">Manage Care Plan</h2>
              <p className="text-sm font-medium text-slate-500">Assigning exercises for <span className="text-blue-600">{patientName}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            
            {/* Add New Exercise Form */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Plus className="w-4 h-4 text-blue-600" /> Add New Exercise
              </h3>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <div className="relative">
                    <Dumbbell className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Exercise Name (e.g. Knee Extension)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    placeholder="Sets"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    placeholder="Reps"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <button 
                    onClick={handleAddExercise}
                    disabled={!newExercise.name}
                    className="w-full h-full bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200 active:scale-95"
                  >
                    Add
                  </button>
                </div>
                <div className="col-span-12">
                   <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Clinician Notes / Instructions (Optional)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newExercise.notes}
                      onChange={(e) => setNewExercise({...newExercise, notes: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Plan List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-slate-400" /> Current Routine ({exercises.length})
                </h3>
                {exercises.length > 0 && (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                    {exercises.length} Exercises Assigned
                  </span>
                )}
              </div>
              
              {exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Dumbbell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">No exercises assigned yet.</p>
                  <p className="text-slate-400 text-xs">Use the form above to build a plan.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {exercises.map((ex, idx) => (
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