import React, { useState, useRef } from 'react';
import { uploadXMLFiles } from '../../services/xmlUpload';
import Loading from '../common/Loading';

const UploadXML = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setResults(null);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const xmlFiles = droppedFiles.filter(file => 
      file.type === 'text/xml' || 
      file.type === 'application/xml' || 
      file.name.toLowerCase().endsWith('.xml')
    );
    
    if (xmlFiles.length !== droppedFiles.length) {
      setError('Apenas arquivos XML são aceitos');
      return;
    }
    
    setFiles(xmlFiles);
    setResults(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Selecione pelo menos um arquivo XML');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadXMLFiles(files);
      setResults(response.data);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-xml">
      <div className="upload-section">
        <h2>Upload de Arquivos XML</h2>
        
        {/* Área de Drop */}
        <div 
          className={`drop-zone ${files.length > 0 ? 'has-files' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-content">
            <div className="upload-icon">
              <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p>Clique ou arraste arquivos XML aqui</p>
            <small>Arquivos suportados: .xml (máximo 5MB cada)</small>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xml,application/xml,text/xml"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <div className="file-list">
            <div className="file-list-header">
              <h3>Arquivos Selecionados ({files.length})</h3>
              <button 
                type="button" 
                className="btn-secondary btn-sm"
                onClick={clearAll}
              >
                Limpar Todos
              </button>
            </div>
            
            <div className="files">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <div className="file-icon">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-remove"
                    onClick={() => removeFile(index)}
                    title="Remover arquivo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="upload-actions">
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Processando...' : `Fazer Upload (${files.length} arquivo${files.length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {uploading && (
          <div className="upload-loading">
            <Loading />
            <p>Processando arquivos XML...</p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="alert alert-error">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="upload-results">
            <div className="results-summary">
              <h3>Resultados do Processamento</h3>
              <p>{results.message}</p>
            </div>
            
            <div className="results-details">
              {results.results.map((result, index) => (
                <div 
                  key={index} 
                  className={`result-item ${result.success ? 'success' : 'error'}`}
                >
                  <div className="result-status">
                    {result.success ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M10,9H14V13H10V9Z" />
                      </svg>
                    )}
                  </div>
                  <div className="result-details">
                    <strong>{result.filename}</strong>
                    {result.success ? (
                      <div className="success-details">
                        <p>Nota {result.data.nota} - {result.data.fornecedor}</p>
                        <p>{result.data.itens} item(s) processado(s)</p>
                      </div>
                    ) : (
                      <div className="error-details">
                        <p className="error-message">{result.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadXML;
