import React, { useState } from 'react';
import { Lock, Unlock, Download, Globe, Users, Shield, Settings } from 'lucide-react';
import { UserManagementModal } from './UserManagementModal';
import { DataMigrationPanel } from './DataMigrationPanel';

interface AdminPanelProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isDarkMode, 
  isAdmin, 
  onToggleAdmin
}) => {
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showDataMigration, setShowDataMigration] = useState(false);

  const handleAdminToggle = () => {
    const newAdminState = !isAdmin;
    onToggleAdmin(newAdminState);
    if (newAdminState) {
      setShowAdminTools(true);
    } else {
      setShowAdminTools(false);
    }
  };

  return (
    <>
      {/* Always visible admin toggle button */}
      <button
        onClick={handleAdminToggle}
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg transition-colors duration-300 z-50 ${
          isDarkMode
            ? isAdmin
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : isAdmin
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}
        title={isAdmin ? "Admin-Modus verlassen" : "Admin-Modus aktivieren"}
      >
        {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
      </button>

      {/* Admin controls when activated */}
      {isAdmin && (
        <div className="fixed bottom-20 left-4 flex flex-col gap-2 z-40">
          <button
            onClick={() => setShowUserManagement(true)}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
            title="User Management - Alle Benutzer und Galerien"
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowDataMigration(true)}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title="KRITISCH: Datenmigration für Sicherheit"
          >
            <Shield className="w-5 h-5" />
          </button>

          <button
            onClick={() => window.open('/deploy-security-rules.md', '_blank')}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
            title="Security Rules Anleitung"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={() => alert('Website-Einstellungen: Projekt läuft stabil!')}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
            title="Website-Status"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagementModal 
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Data Migration Panel */}
      {showDataMigration && (
        <DataMigrationPanel 
          isDarkMode={isDarkMode}
          onClose={() => setShowDataMigration(false)}
        />
      )}
    </>
  );
};