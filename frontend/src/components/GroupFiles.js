import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, ExternalLink, AlertCircle } from 'lucide-react';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Composant GroupFiles - Interface de partage de fichiers pour un groupe
 * @param {string} groupId - ID du groupe
 * @param {string} userId - ID de l'utilisateur connecté
 * @param {boolean} isDark - Mode sombre
 * @param {boolean} isAdmin - L'utilisateur est-il admin du groupe?
 */
export function GroupFiles({ groupId, userId, isDark = true, isAdmin = false }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFile, setNewFile] = useState({
    file_name: '',
    file_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // Charger les fichiers du groupe
  const loadFiles = useCallback(async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/files`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Impossible de charger les fichiers');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUploadFile = async (e) => {
    e.preventDefault();
    
    if (!newFile.file_name.trim() || !newFile.file_url.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          file_name: newFile.file_name.trim(),
          file_url: newFile.file_url.trim()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(prev => [data, ...prev]);
      setNewFile({ file_name: '', file_url: '' });
      setShowUploadForm(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Impossible de partager le fichier');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/files/${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Impossible de supprimer le fichier');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Chargement des fichiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* En-tête avec bouton d'upload */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          📁 Fichiers partagés
        </h3>
        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
              ${isDark 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }
            `}
          >
            <Upload className="w-4 h-4" />
            Partager un fichier
          </button>
        )}
      </div>

      {/* Zone d'erreur */}
      {error && (
        <div className={`
          mb-4 p-3 rounded-lg border flex items-center gap-2
          ${isDark 
            ? 'bg-red-900/20 border-red-500/30 text-red-400' 
            : 'bg-red-100 border-red-300 text-red-700'
          }
        `}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulaire d'upload */}
      {showUploadForm && (
        <div className={`
          mb-6 p-4 rounded-lg border
          ${isDark 
            ? 'bg-slate-700/50 border-slate-600' 
            : 'bg-gray-50 border-gray-300'
          }
        `}>
          <form onSubmit={handleUploadFile} className="space-y-3">
            <div>
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Nom du fichier
              </label>
              <input
                type="text"
                value={newFile.file_name}
                onChange={(e) => setNewFile(prev => ({ ...prev, file_name: e.target.value }))}
                placeholder="Ex: Cours de mathématiques"
                disabled={isUploading}
                className={`
                  w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${isDark
                    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                maxLength={255}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                URL du fichier
              </label>
              <input
                type="url"
                value={newFile.file_url}
                onChange={(e) => setNewFile(prev => ({ ...prev, file_url: e.target.value }))}
                placeholder="https://..."
                disabled={isUploading}
                className={`
                  w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${isDark
                    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                maxLength={2048}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Lien OneDrive, Google Drive, ou tout autre lien de partage
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isUploading}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                  ${isDark 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isUploading ? 'Partage...' : 'Partager'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setNewFile({ file_name: '', file_url: '' });
                  setError(null);
                }}
                disabled={isUploading}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all
                  ${isDark 
                    ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des fichiers */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className={`
            text-center py-12
            ${isDark ? 'text-slate-400' : 'text-gray-600'}
          `}>
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg font-semibold mb-2">Aucun fichier</p>
            <p className="text-sm">Partagez le premier fichier avec votre groupe !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const isOwnFile = file.user_id === userId;
              const canDelete = isOwnFile || isAdmin;
              
              return (
                <div
                  key={file.id}
                  className={`
                    p-4 rounded-lg border group hover:shadow-md transition-all
                    ${isDark 
                      ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' 
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {file.file_name}
                      </h4>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Partagé le {formatDate(file.uploaded_at)}
                      </p>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          inline-flex items-center gap-1 text-sm font-medium hover:underline
                          ${isDark ? 'text-indigo-400' : 'text-indigo-600'}
                        `}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ouvrir le fichier
                      </a>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className={`
                          p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
                          ${isDark 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                          }
                        `}
                        title="Supprimer ce fichier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
