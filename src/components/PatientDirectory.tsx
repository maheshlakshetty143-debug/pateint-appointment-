import React, { useState, useMemo } from 'react';
import { Patient, Appointment, Practitioner, MedicalHistoryEntry } from '../types/clinical';
import { formatDateShort, formatDateLong, formatTime12h } from '../utils/timeHelpers';
import { StatusIndicator, getVisitTypeLabel } from './StatusIndicator';
import {
  Search,
  UserPlus,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  Shield,
  X,
  Stethoscope,
  Edit3,
  CheckCircle2,
  Plus,
  HeartPulse,
  Pill,
  Scissors,
  Bookmark,
  CalendarDays,
  Repeat,
} from 'lucide-react';

interface PatientDirectoryProps {
  patients: Patient[];
  appointments: Appointment[];
  practitioners: Practitioner[];
  onOpenBookModal: (date?: string, time?: string, doctorId?: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  appointments,
  practitioners,
  onOpenBookModal,
  onSelectAppointment,
  onAddPatient,
  onUpdatePatient,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Quick entry for adding a medical history note
  const [isAddingHistoryEntry, setIsAddingHistoryEntry] = useState(false);
  const [newEntryCategory, setNewEntryCategory] = useState<MedicalHistoryEntry['category']>('Past Condition');
  const [newEntryDate, setNewEntryDate] = useState('2026-10-14');
  const [newEntryNote, setNewEntryNote] = useState('');
  const [newEntryClinician, setNewEntryClinician] = useState('Attending Physician');

  // Inline editable medical history notes state
  const [isEditingHistoryNotes, setIsEditingHistoryNotes] = useState(false);
  const [historyNotesDraft, setHistoryNotesDraft] = useState('');

  // New patient registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1988-05-15');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say'>('Female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [insurance, setInsurance] = useState('');
  const [policyNum, setPolicyNum] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronic, setChronic] = useState('');
  const [newPatientMedHistory, setNewPatientMedHistory] = useState('');

  // Edit patient profile state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editInsurance, setEditInsurance] = useState('');
  const [editPolicyNum, setEditPolicyNum] = useState('');
  const [editAllergies, setEditAllergies] = useState('');
  const [editChronic, setEditChronic] = useState('');
  const [editMedHistoryNotes, setEditMedHistoryNotes] = useState('');

  const doctorMap = useMemo(() => new Map(practitioners.map((d) => [d.id, d])), [practitioners]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.insuranceProvider.toLowerCase().includes(q) ||
        (p.medicalHistoryNotes || '').toLowerCase().includes(q)
    );
  }, [patients, search]);

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments
      .filter((a) => a.patientId === selectedPatient.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, selectedPatient]);

  // Handle open edit profile
  const handleOpenEditProfile = () => {
    if (!selectedPatient) return;
    setEditFirstName(selectedPatient.firstName);
    setEditLastName(selectedPatient.lastName);
    setEditDob(selectedPatient.dateOfBirth);
    setEditPhone(selectedPatient.phone);
    setEditEmail(selectedPatient.email);
    setEditAddress(selectedPatient.address || '');
    setEditInsurance(selectedPatient.insuranceProvider);
    setEditPolicyNum(selectedPatient.policyNumber);
    setEditAllergies(selectedPatient.allergies.join(', '));
    setEditChronic(selectedPatient.chronicConditions.join(', '));
    setEditMedHistoryNotes(selectedPatient.medicalHistoryNotes || '');
    setIsEditProfileModalOpen(true);
  };

  // Handle save edited profile
  const handleSaveEditedProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const updatedPatient: Patient = {
      ...selectedPatient,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      dateOfBirth: editDob,
      phone: editPhone.trim(),
      email: editEmail.trim(),
      address: editAddress.trim() || undefined,
      insuranceProvider: editInsurance.trim(),
      policyNumber: editPolicyNum.trim(),
      allergies: editAllergies
        ? editAllergies.split(',').map((s) => s.trim()).filter(Boolean)
        : ['None Reported'],
      chronicConditions: editChronic
        ? editChronic.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      medicalHistoryNotes: editMedHistoryNotes.trim(),
    };

    onUpdatePatient(updatedPatient);
    setIsEditProfileModalOpen(false);
  };

  // Handle save inline history notes
  const handleSaveHistoryNotes = () => {
    if (!selectedPatient) return;
    const updated: Patient = {
      ...selectedPatient,
      medicalHistoryNotes: historyNotesDraft.trim(),
    };
    onUpdatePatient(updated);
    setIsEditingHistoryNotes(false);
  };

  // Handle add structured history entry
  const handleAddHistoryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newEntryNote.trim()) return;

    const newEntry: MedicalHistoryEntry = {
      id: `mhe-${Date.now()}`,
      date: newEntryDate,
      category: newEntryCategory,
      note: newEntryNote.trim(),
      recordedBy: newEntryClinician.trim() || 'Attending Physician',
    };

    const updatedEntries = [newEntry, ...(selectedPatient.medicalHistoryEntries || [])];
    const updated: Patient = {
      ...selectedPatient,
      medicalHistoryEntries: updatedEntries,
    };

    onUpdatePatient(updated);
    setIsAddingHistoryEntry(false);
    setNewEntryNote('');
  };

  // Handle register new patient
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      alert('Patient name, contact number, and email address are required.');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dob,
      gender,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || undefined,
      allergies: allergies ? allergies.split(',').map((s) => s.trim()).filter(Boolean) : ['None Reported'],
      chronicConditions: chronic ? chronic.split(',').map((s) => s.trim()).filter(Boolean) : [],
      medicalHistoryNotes: newPatientMedHistory.trim() || 'Patient registered in clinical directory. Medical history interview completed.',
      medicalHistoryEntries: [],
      currentMedications: [],
      surgeries: [],
      insuranceProvider: insurance.trim() || 'Self-Pay',
      policyNumber: policyNum.trim() || 'N/A',
      emergencyContact: {
        name: 'Primary Contact',
        phone: phone.trim(),
        relation: 'Self',
      },
    };

    onAddPatient(newPatient);
    setSelectedPatientId(newPatient.id);
    setIsNewPatientModalOpen(false);

    // Reset inputs
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setInsurance('');
    setPolicyNum('');
    setAllergies('');
    setChronic('');
    setNewPatientMedHistory('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patient profiles by name, contact, email, MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 font-mono tabular-nums">
            {filteredPatients.length} Registered Profiles
          </span>
          <button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Patient Profile</span>
          </button>
        </div>
      </div>

      {/* Patient Directory Roster & Dedicated Profile View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900">Patients Roster</span>
            <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
              Click profile to inspect
            </span>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[750px] overflow-y-auto">
            {filteredPatients.map((pat) => {
              const isSelected = selectedPatient?.id === pat.id;
              const totalApts = appointments.filter((a) => a.patientId === pat.id).length;

              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    setSelectedPatientId(pat.id);
                    setIsEditingHistoryNotes(false);
                    setIsAddingHistoryEntry(false);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer space-y-1 ${
                    isSelected ? 'bg-blue-50/70 border-l-3 border-l-blue-900' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-900">
                      {pat.firstName} {pat.lastName}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-neutral-500">
                      {pat.mrn}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-600 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span>{pat.phone}</span>
                    </span>
                    <span>·</span>
                    <span>DOB: {pat.dateOfBirth}</span>
                  </div>

                  <p className="text-[11px] text-neutral-500 truncate">{pat.email}</p>

                  {pat.allergies.length > 0 && pat.allergies[0] !== 'None Reported' && (
                    <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1 pt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="truncate">Allergy: {pat.allergies.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Patient Profile & Medical History System (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-6">
          {selectedPatient ? (
            <>
              {/* Profile Header & Identity Info */}
              <div className="border-b border-neutral-200 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono tabular-nums text-neutral-500 font-semibold bg-neutral-100 px-2 py-0.5 rounded">
                        {selectedPatient.mrn}
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-xs text-neutral-600">{selectedPatient.gender}</span>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mt-1">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenEditProfile}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => onOpenBookModal()}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Schedule Visit</span>
                    </button>
                  </div>
                </div>

                {/* Core Profile Fields: Name, DOB, Contact Number, Email Address */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px] font-medium">Patient Name</span>
                    <span className="font-bold text-neutral-900 mt-0.5 block">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px] font-medium">Date of Birth</span>
                    <span className="font-mono tabular-nums text-neutral-900 mt-0.5 block font-semibold">
                      {selectedPatient.dateOfBirth}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px] font-medium">Contact Number</span>
                    <span className="font-mono tabular-nums text-neutral-900 mt-0.5 block font-semibold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span>{selectedPatient.phone}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 block text-[11px] font-medium">Email Address</span>
                    <span className="text-neutral-900 mt-0.5 block truncate font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3 text-neutral-400" />
                      <span className="truncate">{selectedPatient.email}</span>
                    </span>
                  </div>
                </div>

                {/* Additional Demographics Strip */}
                <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-600">
                  <span>Insurance: <strong className="text-neutral-900">{selectedPatient.insuranceProvider}</strong> ({selectedPatient.policyNumber})</span>
                  <span>·</span>
                  <span>Address: {selectedPatient.address || 'Not on file'}</span>
                  <span>·</span>
                  <span>Emergency: {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.phone})</span>
                </div>
              </div>

              {/* SECTION: Medical History Notes (Required Core Feature) */}
              <div className="p-4 bg-neutral-50/50 rounded-xl border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-900" />
                    <h3 className="text-sm font-bold text-neutral-900">
                      Medical History Notes & Clinical Narrative
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditingHistoryNotes ? (
                      <button
                        onClick={() => {
                          setHistoryNotesDraft(selectedPatient.medicalHistoryNotes || '');
                          setIsEditingHistoryNotes(true);
                        }}
                        className="text-xs font-semibold text-blue-800 hover:text-blue-900 cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update Notes</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingHistoryNotes(false)}
                          className="text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveHistoryNotes}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded cursor-pointer"
                        >
                          Save Notes
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!isEditingHistoryNotes ? (
                  <div className="bg-white p-3.5 rounded-lg border border-neutral-200 text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
                    {selectedPatient.medicalHistoryNotes || (
                      <span className="text-neutral-400 italic">
                        No medical history notes recorded yet. Click "Update Notes" to add history.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={historyNotesDraft}
                      onChange={(e) => setHistoryNotesDraft(e.target.value)}
                      placeholder="Enter comprehensive medical history: past illnesses, childhood diseases, family cardiovascular/cancer risks, lifestyle factors..."
                      className="w-full p-3 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                    />
                  </div>
                )}

                {/* Structured Medical History Timeline & Chronological Notes */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">
                      Chronological Medical Events & Notes ({selectedPatient.medicalHistoryEntries?.length || 0})
                    </span>
                    <button
                      onClick={() => setIsAddingHistoryEntry(!isAddingHistoryEntry)}
                      className="text-xs font-semibold text-blue-800 hover:text-blue-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medical Event</span>
                    </button>
                  </div>

                  {isAddingHistoryEntry && (
                    <form onSubmit={handleAddHistoryEntry} className="p-3 bg-blue-50/40 rounded-lg border border-blue-200 space-y-3 text-xs">
                      <span className="font-semibold text-blue-950 block">Record New Medical History Item</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-neutral-600 mb-1">Category</label>
                          <select
                            value={newEntryCategory}
                            onChange={(e) => setNewEntryCategory(e.target.value as any)}
                            className="w-full p-1.5 border border-neutral-300 rounded bg-white"
                          >
                            <option value="Past Condition">Past Condition</option>
                            <option value="Surgical History">Surgical History</option>
                            <option value="Family History">Family History</option>
                            <option value="Medication">Medication</option>
                            <option value="Clinical Note">Clinical Note</option>
                            <option value="Immunization">Immunization</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-600 mb-1">Event Date</label>
                          <input
                            type="date"
                            value={newEntryDate}
                            onChange={(e) => setNewEntryDate(e.target.value)}
                            className="w-full p-1.5 border border-neutral-300 rounded bg-white font-mono tabular-nums"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-600 mb-1">Clinician / Observer</label>
                          <input
                            type="text"
                            value={newEntryClinician}
                            onChange={(e) => setNewEntryClinician(e.target.value)}
                            placeholder="Dr. Name or Facility"
                            className="w-full p-1.5 border border-neutral-300 rounded bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-neutral-600 mb-1">Clinical Note Details</label>
                        <input
                          type="text"
                          required
                          value={newEntryNote}
                          onChange={(e) => setNewEntryNote(e.target.value)}
                          placeholder="e.g. Diagnosed with mild sleep apnea, completed CPAP titration study."
                          className="w-full p-2 border border-neutral-300 rounded bg-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingHistoryEntry(false)}
                          className="px-3 py-1 border border-neutral-300 rounded bg-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded cursor-pointer"
                        >
                          Add to Medical Record
                        </button>
                      </div>
                    </form>
                  )}

                  {/* History items list */}
                  <div className="space-y-2">
                    {(selectedPatient.medicalHistoryEntries || []).map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2.5 bg-white rounded-lg border border-neutral-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-950 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                              {entry.category}
                            </span>
                            <span className="font-mono tabular-nums text-neutral-500 text-[11px]">
                              {entry.date}
                            </span>
                          </div>
                          {entry.recordedBy && (
                            <span className="text-[11px] text-neutral-400">By: {entry.recordedBy}</span>
                          )}
                        </div>
                        <p className="text-neutral-800 pt-0.5">{entry.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Allergies, Chronic Conditions & Medications 3-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Allergies */}
                <div className="p-3.5 bg-white rounded-xl border border-neutral-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Allergies</span>
                  </div>
                  {selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== 'None Reported' ? (
                    <div className="text-rose-800 font-medium">
                      {selectedPatient.allergies.join(', ')}
                    </div>
                  ) : (
                    <span className="text-neutral-500">None reported</span>
                  )}
                </div>

                {/* Chronic Conditions */}
                <div className="p-3.5 bg-white rounded-xl border border-neutral-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <HeartPulse className="w-3.5 h-3.5 text-blue-700" />
                    <span>Chronic Diagnoses</span>
                  </div>
                  {selectedPatient.chronicConditions.length > 0 ? (
                    <div className="text-neutral-800 font-medium">
                      {selectedPatient.chronicConditions.join(', ')}
                    </div>
                  ) : (
                    <span className="text-neutral-500">None documented</span>
                  )}
                </div>

                {/* Medications */}
                <div className="p-3.5 bg-white rounded-xl border border-neutral-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <Pill className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Current Medications</span>
                  </div>
                  {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 ? (
                    <div className="text-neutral-800 space-y-0.5">
                      {selectedPatient.currentMedications.map((m, idx) => (
                        <p key={idx} className="truncate">{m}</p>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-500">No active prescriptions</span>
                  )}
                </div>
              </div>

              {/* Encounter & Appointment History Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span>Appointment Encounters History ({patientAppointments.length})</span>
                  </h3>
                  <button
                    onClick={() => onOpenBookModal()}
                    className="text-xs font-semibold text-blue-800 hover:text-blue-950 cursor-pointer"
                  >
                    + Schedule Next Visit
                  </button>
                </div>

                {patientAppointments.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic bg-neutral-50 p-4 rounded-lg text-center">
                    No clinical appointments recorded yet for this patient.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {patientAppointments.map((apt) => {
                      const doc = doctorMap.get(apt.practitionerId);

                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className="p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors cursor-pointer text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900">
                                {formatDateLong(apt.date)} · {formatTime12h(apt.time)}
                              </span>
                              {apt.isRecurring && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold text-[10px]">
                                  <Repeat className="w-2.5 h-2.5" />
                                  <span>Recurring Series ({apt.recurrence ? `${apt.recurrence.index}/${apt.recurrence.count}` : ''})</span>
                                </span>
                              )}
                            </div>
                            <StatusIndicator status={apt.status} />
                          </div>

                          <div className="flex items-center justify-between text-neutral-600">
                            <p>
                              Dr. {doc?.name.replace(/^Dr\.\s*/i, '')} · {doc?.department} ({apt.room})
                            </p>
                            <span className="text-[11px] text-neutral-500">{getVisitTypeLabel(apt.visitType)}</span>
                          </div>

                          <p className="text-neutral-800 font-medium">
                            {apt.chiefComplaint}
                          </p>

                          {apt.diagnosis && (
                            <p className="text-[11px] text-blue-950 bg-blue-50/60 p-1.5 rounded border border-blue-100 font-mono">
                              Clinical Diagnosis: {apt.diagnosis}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-neutral-400">
              <User className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-xs font-medium text-neutral-600">Select a patient profile to inspect</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Patient Profile Modal */}
      {isEditProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h3 className="text-base font-bold text-neutral-900">Edit Patient Profile</h3>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedProfile} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded"
                />
              </div>

              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">Medical History Notes Section</label>
                <textarea
                  rows={4}
                  value={editMedHistoryNotes}
                  onChange={(e) => setEditMedHistoryNotes(e.target.value)}
                  placeholder="Record patient medical history notes, past conditions, surgeries, and family medical background..."
                  className="w-full p-2.5 border border-neutral-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Insurance Carrier</label>
                  <input
                    type="text"
                    value={editInsurance}
                    onChange={(e) => setEditInsurance(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Policy Number</label>
                  <input
                    type="text"
                    value={editPolicyNum}
                    onChange={(e) => setEditPolicyNum(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">Allergies (comma separated)</label>
                <input
                  type="text"
                  value={editAllergies}
                  onChange={(e) => setEditAllergies(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded"
                />
              </div>

              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  value={editChronic}
                  onChange={(e) => setEditChronic(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded cursor-pointer shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Patient Profile Modal */}
      {isNewPatientModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h3 className="text-base font-bold text-neutral-900">Create New Patient Profile</h3>
              <button
                onClick={() => setIsNewPatientModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1 font-semibold">Medical History Notes Section</label>
                <textarea
                  rows={3}
                  value={newPatientMedHistory}
                  onChange={(e) => setNewPatientMedHistory(e.target.value)}
                  placeholder="Record initial medical history, prior chronic conditions, surgeries, and allergies..."
                  className="w-full p-2.5 border border-neutral-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Insurance Carrier</label>
                  <input
                    type="text"
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    placeholder="e.g. BCBS, Aetna"
                    className="w-full px-3 py-2 border border-neutral-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 mb-1 font-semibold">Policy Number</label>
                  <input
                    type="text"
                    value={policyNum}
                    onChange={(e) => setPolicyNum(e.target.value)}
                    placeholder="POL-123456"
                    className="w-full px-3 py-2 border border-neutral-300 rounded font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPatientModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded cursor-pointer shadow-xs"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
