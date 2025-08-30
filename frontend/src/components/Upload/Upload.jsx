import React, { useState } from 'react';

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Adicionar todos os arquivos ao FormData
      selectedFiles.forEach((file) => {
        formData.append('xmlFiles', file);
      });

      const response = await fetch('/api/notas/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert(`Upload concluído: ${data.message}`);
        setSelectedFiles([]);
        // Reset do input file
        const fileInput = document.querySelector('.file-input');
        if (fileInput) fileInput.value = '';
      } else {
        alert(`Erro no upload: ${data.message}`);
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="dashboard-header">
        <h1>Upload de XML</h1>
        <p>Faça upload dos arquivos XML de notas fiscais</p>
      </div>

      <div className="upload-section">
        <div className="upload-card">
          <h3>Selecionar Arquivos XML</h3>
          <input
            type="file"
            multiple
            accept=".xml"
            onChange={handleFileChange}
            className="file-input"
          />
          
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Arquivos selecionados:</h4>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="btn-upload"
          >
            {uploading ? 'Enviando...' : 'Fazer Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;