import React, { useRef, useState } from 'react';
import { Upload, FileAudio, FileVideo, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelected, 
  accept = "audio/*,video/*",
  maxSizeMB = 20
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max size is ${maxSizeMB}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors duration-300 ease-in-out cursor-pointer overflow-hidden group
          ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900 hover:border-blue-400 hover:bg-gray-800'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center animate-fadeIn">
             {selectedFile.type.startsWith('video') ? (
               <FileVideo className="w-16 h-16 text-blue-400 mb-4" />
             ) : (
               <FileAudio className="w-16 h-16 text-purple-400 mb-4" />
             )}
             <p className="text-lg font-medium text-gray-200">{selectedFile.name}</p>
             <p className="text-sm text-gray-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
             
             <button 
               onClick={clearFile}
               className="mt-6 p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors z-10"
             >
               <X className="w-5 h-5" />
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-6">
            <Upload className={`w-12 h-12 mb-4 transition-colors ${dragActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-400'}`} />
            <p className="mb-2 text-lg font-medium text-gray-300">
              <span className="text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">MP3, WAV, MP4, WEBM (Max {maxSizeMB}MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};