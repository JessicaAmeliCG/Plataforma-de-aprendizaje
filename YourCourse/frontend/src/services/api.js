/**
 * api.js — Cliente HTTP para la API de YourCourse
 * Lee el JWT del Zustand persist store en localStorage automáticamente
 */

const BASE = '/api';

function getToken() {
  try {
    const raw = localStorage.getItem('yc_auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/**
 * upload — Para subida multipart/form-data (videos)
 * @param {string} path
 * @param {FormData} formData
 * @param {Function} onProgress — callback(percent: number)
 */
function upload(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const xhr   = new XMLHttpRequest();
    xhr.open('POST', `${BASE}${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data?.error?.message || `Error ${xhr.status}`));
      } catch {
        reject(new Error('Respuesta inválida del servidor.'));
      }
    };

    xhr.onerror = () => reject(new Error('Error de conexión.'));
    xhr.send(formData);
  });
}

/**
 * uploadPatch — Para reemplazar video en lección (PATCH multipart)
 */
function uploadPatch(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const xhr   = new XMLHttpRequest();
    xhr.open('PATCH', `${BASE}${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data?.error?.message || `Error ${xhr.status}`));
      } catch {
        reject(new Error('Respuesta inválida del servidor.'));
      }
    };

    xhr.onerror = () => reject(new Error('Error de conexión.'));
    xhr.send(formData);
  });
}

export const api = {
  get:         (path)                     => request('GET',    path),
  post:        (path, body)               => request('POST',   path, body),
  patch:       (path, body)               => request('PATCH',  path, body),
  put:         (path, body)               => request('PUT',    path, body),
  delete:      (path)                     => request('DELETE', path),
  upload:      (path, formData, onProg)   => upload(path, formData, onProg),
  uploadPatch: (path, formData, onProg)   => uploadPatch(path, formData, onProg),
};
