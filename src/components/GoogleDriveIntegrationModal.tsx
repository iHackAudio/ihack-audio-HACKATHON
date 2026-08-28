import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { X, HardDrive, Download, Upload, Check, AlertTriangle, RefreshCw, Folder } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Add Drive scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

interface GoogleDriveIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceFiles: any[];
}

export default function GoogleDriveIntegrationModal({ isOpen, onClose, workspaceFiles }: GoogleDriveIntegrationModalProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u: User | null) => {
      if (u) {
        if (cachedAccessToken) {
          setNeedsAuth(false);
          setUser(u);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          setNeedsAuth(true);
        }
      } else {
        cachedAccessToken = null;
        setNeedsAuth(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to get access token from Firebase Auth');
      }
      cachedAccessToken = credential.accessToken;
      setUser(result.user);
      setNeedsAuth(false);
    } catch (err) {
      console.error('Login failed:', err);
      showStatus('error', 'Authentication failed');
    } finally {
      isSigningIn = false;
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    cachedAccessToken = null;
    setNeedsAuth(true);
    setUser(null);
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const saveWorkspaceToDrive = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to export the workspace to Google Drive? This will create a new folder with your project files.'
    );
    if (!confirmed) return;

    if (!cachedAccessToken) {
      showStatus('error', 'Not authenticated');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Fetch story bible json
      const res = await fetch('/api/story-bible');
      let bibleData = {};
      if (res.ok) {
        bibleData = await res.json();
      }

      // 2. Create a folder in Google Drive
      const folderMetadata = {
        name: `JARVIS_Workspace_${Date.now()}`,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderMetadata),
      });

      if (!folderRes.ok) {
        throw new Error('Failed to create folder');
      }

      const folderData = await folderRes.json();
      const folderId = folderData.id;

      // Helper function to upload a file to Drive
      const uploadFileToDrive = async (filename: string, content: string, contentType: string = 'text/plain') => {
        const fileMetadata = {
          name: filename,
          parents: [folderId],
        };
        
        const boundary = 'foo_bar_baz';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(fileMetadata) +
          delimiter +
          `Content-Type: ${contentType}\r\n\r\n` +
          content +
          closeDelimiter;

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cachedAccessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${filename}`);
        }
      };

      // 3. Upload story_bible.json to the folder
      await uploadFileToDrive('story_bible.json', JSON.stringify(bibleData, null, 2), 'application/json');

      // 4. Upload core system files
      const coreFiles = [
        'JARVIS.md',
        'SESSION.md',
        'SYSTEM.md',
        'SYSTEM_ARCHITECTURE.md',
        'WORKFLOW_CHECKLIST.md',
        'plan.md'
      ];

      for (const filename of coreFiles) {
        try {
          const fileRes = await fetch(`/api/system-files/content/${encodeURIComponent(filename)}`);
          if (fileRes.ok) {
            const fileData = await fileRes.json();
            if (fileData && fileData.content) {
              await uploadFileToDrive(filename, fileData.content, 'text/markdown');
            }
          }
        } catch (err) {
          console.warn(`Could not upload ${filename}`, err);
        }
      }

      showStatus('success', 'Workspace successfully exported to Google Drive!');
    } catch (err: any) {
      console.error(err);
      showStatus('error', `Failed to export: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0d1322] border border-sky-500/30 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            Google Drive Integration
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMessage && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 rounded-lg ${
            statusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {statusMessage.text}
          </div>
        )}

        <div className="space-y-4">
          {needsAuth ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <p className="text-xs text-slate-300 max-w-sm">
                Connect your Google Drive account to backup and manage your J.A.R.V.I.S. workspace files, Story Bibles, and scripts directly to the cloud.
              </p>
              
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="gsi-material-button bg-white text-slate-700 font-medium px-4 py-2 rounded shadow hover:bg-slate-50 transition flex items-center gap-3 disabled:opacity-70 cursor-pointer"
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-white rounded-full">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block'}}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#080d17] p-4 rounded-lg border border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Connected as</span>
                  <span className="text-sm font-bold text-white">{user?.displayName || user?.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-xs hover:bg-slate-800 transition"
                >
                  Disconnect
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={saveWorkspaceToDrive}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-sky-500/10 border-2 border-sky-500/30 rounded-xl hover:bg-sky-500/20 text-sky-300 transition-all font-bold text-sm disabled:opacity-50"
                >
                  {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {isUploading ? 'Exporting to Drive...' : 'Export Story Bible to Google Drive'}
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  This will create a new folder in your Google Drive and upload the active Story Bible JSON.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
