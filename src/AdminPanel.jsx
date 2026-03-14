import React from 'react';
import { X } from 'lucide-react';

const AdminPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Panel de Administración</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-400 text-sm">Módulo de administración — próximamente disponible.</p>
      </div>
    </div>
  );
};

export default AdminPanel;
