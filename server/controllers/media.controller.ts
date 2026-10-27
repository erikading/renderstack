import express, { Response, Request } from 'express';
import multer from 'multer';
import mediaService from '../services/media.service';
import { Media, FakeSOSocket } from '../types/types';
import path from 'path';
import { getPublicUrl, uploadObject } from '../utils/storage.util';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB, matches the client-side limit

// Files are held in memory and then sent to the R2 bucket
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const mediaController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Creates a media document
   */
  router.post('/create', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const { user } = req.body;

      // console.log('req file:', file);
      // console.log('req user:', user);

      if (!file) {
        return res.status(400).json({ error: 'File missing' });
      } else if (!user) {
        return res.status(400).json({ error: 'User missing' });
        // } else if (!filepathLocation) {
        //   return res.status(400).json({ error: 'Filepath missing' });
      }

      // Usernames become part of the object key, so strip anything that isn't path-safe
      const safeUser = String(user).replace(/[^a-zA-Z0-9_-]/g, '_');
      const key = `userData/${safeUser}/${Date.now()}${path.extname(file.originalname)}`;

      await uploadObject(key, file.buffer, file.mimetype);

      const media: Media = {
        filepathLocation: key,
        filepathLocationClient: getPublicUrl(key),
        user,
        fileSize: mediaService.formatFileSize(file.size),
      };

      // console.log('saved for client filepath:', media.filepathLocationClient);

      const newMedia = await mediaService.addMedia(media);

      if ('error' in newMedia) {
        throw new Error(newMedia.error);
      }

      res.status(200).json(newMedia);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * Deletes a media document, given filepath of the media
   */
  router.delete('/delete/:filepathLocation?', async (req: Request, res: Response) => {
    try {
      const { filepathLocation } = req.params;

      if (!filepathLocation) {
        return res.status(400).json({ error: 'Filepath missing' });
      }

      const deleted = await mediaService.deleteMedia(filepathLocation);

      if ('error' in deleted) {
        throw new Error(deleted.error);
      }

      res.status(200).json(deleted);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
};

export default mediaController;
