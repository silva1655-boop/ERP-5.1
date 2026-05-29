import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { serverTimestamp } from 'firebase/firestore';
import { auth, storage } from './firebase';

const safeName = name => name.replace(/[^a-zA-Z0-9._-]/g, '_');

async function uploadFile(file, companyId, entityType, entityId, folder) {
  const path = `companies/${companyId}/${entityType}/${entityId}/${folder}/${Date.now()}-${safeName(file.name)}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  return {
    url,
    path,
    uploadedBy: auth.currentUser?.uid || null,
    uploadedAt: serverTimestamp(),
    fileName: file.name,
    fileType: file.type,
  };
}

export const uploadEvidence = (file, companyId, entityType, entityId) => uploadFile(file, companyId, entityType, entityId, 'evidence');
export const uploadSignature = (file, companyId, entityType, entityId) => uploadFile(file, companyId, entityType, entityId, 'signatures');
export const deleteFile = path => deleteObject(ref(storage, path));
