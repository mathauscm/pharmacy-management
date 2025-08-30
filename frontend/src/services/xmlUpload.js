import { api } from './api';

/**
 * Serviço para upload e processamento de arquivos XML
 */

/**
 * Fazer upload de múltiplos arquivos XML
 */
export async function uploadXMLFiles(files) {
  try {
    if (!files || files.length === 0) {
      throw new Error('Nenhum arquivo foi fornecido');
    }

    // Validar arquivos antes do upload
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const validation = validateXMLFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push({
          filename: file.name,
          error: validation.error
        });
      }
    }

    if (validFiles.length === 0) {
      throw new Error('Nenhum arquivo válido foi encontrado');
    }

    // Fazer upload dos arquivos válidos
    const response = await api.uploadFiles('/notas/upload', validFiles);

    // Se houve arquivos inválidos, adicionar aos resultados
    if (errors.length > 0) {
      if (!response.results) {
        response.results = [];
      }
      response.results.push(...errors.map(err => ({
        filename: err.filename,
        success: false,
        error: err.error
      })));
    }

    return response;
  } catch (error) {
    console.error('Erro no upload de XMLs:', error);
    throw error;
  }
}

/**
 * Fazer upload de um único arquivo XML
 */
export async function uploadXML(file) {
  try {
    const validation = validateXMLFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return await api.uploadFiles('/notas/upload', file);
  } catch (error) {
    console.error('Erro no upload de XML:', error);
    throw error;
  }
}

/**
 * Validar arquivo XML antes do upload
 */
export function validateXMLFile(file) {
  // Verificar se o arquivo existe
  if (!file) {
    return {
      isValid: false,
      error: 'Arquivo não encontrado'
    };
  }

  // Verificar tipo MIME
  const validMimeTypes = ['text/xml', 'application/xml'];
  const hasValidMimeType = validMimeTypes.includes(file.type);
  const hasValidExtension = file.name.toLowerCase().endsWith('.xml');

  if (!hasValidMimeType && !hasValidExtension) {
    return {
      isValid: false,
      error: 'Arquivo deve ser um XML válido'
    };
  }

  // Verificar tamanho (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Arquivo muito grande. Máximo 5MB'
    };
  }

  // Verificar se não está vazio
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Arquivo está vazio'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Obter informações de um arquivo
 */
export function getFileInfo(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    formattedSize: formatFileSize(file.size),
    isXML: validateXMLFile(file).isValid
  };
}

/**
 * Formatar tamanho do arquivo para exibição
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Verificar se o navegador suporta upload de arquivos
 */
export function supportsFileUpload() {
  return window.File && window.FileReader && window.FileList && window.Blob;
}

/**
 * Ler conteúdo de um arquivo como texto (para pré-visualização)
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    if (!supportsFileUpload()) {
      reject(new Error('Navegador não suporta leitura de arquivos'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsText(file);
  });
}
