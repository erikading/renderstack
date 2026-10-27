import MediaModel from '../models/media.model';
import { Media, MediaResponse } from '../types/types';
import { deleteObject } from '../utils/storage.util';

/**
 * Converts bytes to a human-readable string
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

/**
 * Creates a media document for a file that has already been uploaded to storage
 * @param media - the media object to be created
 **/
const addMedia = async (media: Media): Promise<MediaResponse> => {
  try {
    // Only store metadata + storage key/URL in MongoDB
    const mediaToSave = {
      filepathLocationClient: media.filepathLocationClient,
      filepathLocation: media.filepathLocation,
      user: media.user,
      fileSize: media.fileSize,
    };

    const mediaDoc = new MediaModel(mediaToSave);
    const savedMedia = await mediaDoc.save();

    if (!savedMedia) {
      throw new Error('Failed to add media');
    }

    return savedMedia;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Deletes a media document and its file in storage
 * @param filepathLocation of the media (the storage key)
 * @returns the deleted media document
 */
const deleteMedia = async (filepathLocation: string): Promise<MediaResponse> => {
  try {
    // Decode URL-encoded characters (like %2F → /)
    const decodedPath = decodeURIComponent(filepathLocation);

    // Find and delete the document
    const deleted = await MediaModel.findOneAndDelete({ filepathLocation: decodedPath });

    if (!deleted) {
      return { error: 'Media not found' };
    }

    await deleteObject(deleted.filepathLocation);

    return deleted; // or return { success: true }
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export default { addMedia, deleteMedia, formatFileSize };
