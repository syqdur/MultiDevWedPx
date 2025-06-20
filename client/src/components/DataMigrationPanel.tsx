import React, { useState, useEffect } from 'react';
import { Shield, Database, Users, ArrowRight, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface DataMigrationPanelProps {
  isDarkMode: boolean;
  onClose: () => void;
}

interface MigrationStats {
  mediaItemsMigrated: number;
  commentsMigrated: number;
  likesMigrated: number;
  storiesMigrated: number;
  errors: string[];
}

interface MigrationStatus {
  hasSecureData: boolean;
  hasLegacyData: boolean;
  migrationNeeded: boolean;
}

export const DataMigrationPanel: React.FC<DataMigrationPanelProps> = ({
  isDarkMode,
  onClose
}) => {
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    checkCurrentMigrationStatus();
  }, []);

  const checkCurrentMigrationStatus = async () => {
    try {
      const { checkMigrationStatus } = await import('../services/dataMigrationService');
      
      // Beispiel-Benutzer-ID für Status-Check
      if (selectedUserId) {
        const status = await checkMigrationStatus(selectedUserId);
        setMigrationStatus(status);
      }
    } catch (error) {
      console.error('Migration status check failed:', error);
    }
  };

  const startUserMigration = async () => {
    if (!selectedUserId.trim()) {
      addToLog('❌ Bitte geben Sie eine Benutzer-ID ein');
      return;
    }

    setIsMigrating(true);
    setMigrationStats(null);
    addToLog(`🔄 Starte Migration für Benutzer: ${selectedUserId}`);

    try {
      const { migrateUserDataToSecureStructure } = await import('../services/dataMigrationService');
      
      const stats = await migrateUserDataToSecureStructure(selectedUserId);
      setMigrationStats(stats);
      
      addToLog(`✅ Migration abgeschlossen für ${selectedUserId}`);
      addToLog(`📊 Migriert: ${stats.mediaItemsMigrated} Medien, ${stats.commentsMigrated} Kommentare, ${stats.likesMigrated} Likes, ${stats.storiesMigrated} Stories`);
      
      if (stats.errors.length > 0) {
        stats.errors.forEach(error => addToLog(`⚠️ ${error}`));
      }

      // Status nach Migration aktualisieren
      await checkCurrentMigrationStatus();
      
    } catch (error: any) {
      addToLog(`❌ Migration fehlgeschlagen: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const startFullSystemMigration = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNUNG: Vollständige System-Migration\n\n' +
      'Dies wird ALLE Benutzerdaten von der unsicheren globalen Struktur zur sicheren benutzer-isolierten Struktur migrieren.\n\n' +
      'Möchten Sie fortfahren?'
    );

    if (!confirmed) return;

    setIsMigrating(true);
    addToLog('🚀 Starte vollständige System-Migration...');

    try {
      const { migrateAllUsersToSecureStructure } = await import('../services/dataMigrationService');
      
      await migrateAllUsersToSecureStructure();
      addToLog('🎉 Vollständige System-Migration abgeschlossen!');
      
    } catch (error: any) {
      addToLog(`❌ System-Migration fehlgeschlagen: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setMigrationLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLog = () => {
    setMigrationLog([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <div>
                <h2 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🔒 Sicherheits-Migration
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Migration zur benutzer-isolierten Datenstruktur
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Schließen
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Warning Section */}
          <div className={`p-4 rounded-lg mb-6 ${
            isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
              <div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-red-300' : 'text-red-800'
                }`}>
                  🚨 KRITISCHE SICHERHEITSLÜCKE IDENTIFIZIERT
                </h3>
                <ul className={`text-sm space-y-1 ${
                  isDarkMode ? 'text-red-200' : 'text-red-700'
                }`}>
                  <li>• Alle Benutzerdaten sind in globalen Collections gespeichert</li>
                  <li>• Keine Datenisolation zwischen Benutzern</li>
                  <li>• Cross-User Data Leakage möglich</li>
                  <li>• Firebase Security Rules fehlen</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Migration Status */}
          {migrationStatus && (
            <div className={`p-4 rounded-lg mb-6 ${
              isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                📊 Migrations-Status für Benutzer: {selectedUserId}
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    migrationStatus.hasSecureData 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                      : (isDarkMode ? 'text-red-400' : 'text-red-600')
                  }`}>
                    {migrationStatus.hasSecureData ? '✅' : '❌'}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sichere Daten
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    migrationStatus.hasLegacyData 
                      ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                      : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                  }`}>
                    {migrationStatus.hasLegacyData ? '⚠️' : '✅'}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Legacy Daten
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    migrationStatus.migrationNeeded 
                      ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                      : (isDarkMode ? 'text-green-400' : 'text-green-600')
                  }`}>
                    {migrationStatus.migrationNeeded ? '🔄' : '✅'}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Migration nötig
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Migration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Single User Migration */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Users className="w-5 h-5" />
                Einzelbenutzer-Migration
              </h4>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Benutzer-ID eingeben..."
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={startUserMigration}
                    disabled={isMigrating || !selectedUserId.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      isMigrating || !selectedUserId.trim()
                        ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')
                        : (isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600')
                    } text-white`}
                  >
                    {isMigrating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    Migrieren
                  </button>
                  
                  <button
                    onClick={checkCurrentMigrationStatus}
                    disabled={isMigrating || !selectedUserId.trim()}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    Status prüfen
                  </button>
                </div>
              </div>
            </div>

            {/* Full System Migration */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Database className="w-5 h-5" />
                Vollständige System-Migration
              </h4>
              
              <div className="space-y-3">
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Migriert alle Benutzer automatisch zur sicheren Datenstruktur.
                </p>
                
                <button
                  onClick={startFullSystemMigration}
                  disabled={isMigrating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    isMigrating
                      ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isMigrating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  System-Migration starten
                </button>
              </div>
            </div>
          </div>

          {/* Migration Stats */}
          {migrationStats && (
            <div className={`p-4 rounded-lg mb-6 ${
              isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                ✅ Migrations-Ergebnisse
              </h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {migrationStats.mediaItemsMigrated}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Medien
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {migrationStats.commentsMigrated}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Kommentare
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {migrationStats.likesMigrated}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Likes
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {migrationStats.storiesMigrated}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Stories
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Migration Log */}
          <div className={`rounded-lg border ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h4 className={`font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📋 Migrations-Log
              </h4>
              <button
                onClick={clearLog}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Löschen
              </button>
            </div>
            <div className={`p-4 max-h-60 overflow-y-auto ${
              isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              {migrationLog.length === 0 ? (
                <p className={`text-sm italic ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Keine Log-Einträge vorhanden
                </p>
              ) : (
                <div className="space-y-1">
                  {migrationLog.map((logEntry, index) => (
                    <div
                      key={index}
                      className={`text-sm font-mono ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {logEntry}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};