import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import mediaService from '../../services/media.service';
import { DatabaseMedia } from '../../types/types';
import * as storage from '../../utils/storage.util';

jest.mock('fs');
jest.mock('../../utils/storage.util');
jest.mock('yaml', () => ({
  parse: jest.fn(() => ({ openapi: '3.0.0', info: { title: 'Mock API', version: '1.0.0' } })),
}));
jest.mock('../../services/media.service');

// Mock express-openapi-validator
jest.mock('express-openapi-validator', () => ({
  middleware: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock multer to avoid actual file writes in tests
jest.mock('multer', () => {
  const mockMulter: any = () => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.body = {
        ...req.body,
        user: 'media1_uploader',
      };

      req.file = {
        fieldname: 'file',
        originalname: 'dummy.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('dummy file content'),
        size: 13000,
      };
      next();
    }),
  });

  mockMulter.memoryStorage = jest.fn();

  return mockMulter;
});

// Mock media data
const mockMedia: DatabaseMedia = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
  filepathLocation: 'dummy/filepath',
  filepathLocationClient: '../dummy/filepath',
  user: 'test_user',
  fileSize: '13 KB',
};

// Service method spies
const addMediaSpy = jest.spyOn(mediaService, 'addMedia');
const deleteMediaSpy = jest.spyOn(mediaService, 'deleteMedia');

describe('POST /create', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (storage.uploadObject as jest.Mock).mockResolvedValue(undefined);
    (storage.getPublicUrl as jest.Mock).mockImplementation(
      (key: string) => `https://media.example.com/${key}`,
    );
  });

  test('should create a new media successfully', async () => {
    const createdMedia = {
      _id: new mongoose.Types.ObjectId(),
      filepathLocation: 'userData/media1_uploader/1234567890.txt',
      filepathLocationClient: 'https://media.example.com/userData/media1_uploader/1234567890.txt',
      user: 'media1_uploader',
      fileSize: '12.7 KB',
    };

    addMediaSpy.mockResolvedValueOnce(createdMedia);

    const response = await supertest(app)
      .post('/api/media/create')
      .field('user', 'media1_uploader')
      .attach('file', Buffer.from('dummy file content'), 'dummy.txt');

    expect(response.status).toBe(200);
    // expect(response.body).toEqual(createdMedia);

    expect(storage.uploadObject).toHaveBeenCalledWith(
      expect.stringMatching(/^userData\/media1_uploader\/\d+\.txt$/),
      expect.any(Buffer),
      'text/plain',
    );
    expect(addMediaSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'media1_uploader',
        filepathLocation: expect.stringMatching(/^userData\/media1_uploader\/\d+\.txt$/),
        filepathLocationClient: expect.stringContaining('https://media.example.com/userData/'),
      }),
    );
  });

  test('should return 500 when the storage upload fails', async () => {
    (storage.uploadObject as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    const response = await supertest(app)
      .post('/api/media/create')
      .field('user', 'media1_uploader')
      .attach('file', Buffer.from('dummy file content'), 'dummy.txt');

    expect(response.status).toBe(500);
    expect(response.text).toContain('Upload failed');
    expect(addMediaSpy).not.toHaveBeenCalled();
  });

  test('should return 500 when service returns error', async () => {
    addMediaSpy.mockResolvedValueOnce({ error: 'Database error' });

    const response = await supertest(app)
      .post('/api/media/create')
      .field('filepathLocation', 'New Media')
      .field('user', 'media1_uploader')
      .attach('file', Buffer.from('dummy file content'), 'dummy.txt');

    expect(response.status).toBe(500);
    expect(response.text).toContain('Database error');
  });
});

describe('DELETE /delete/:filepathLocation', () => {
  test('should delete a media successfully', async () => {
    deleteMediaSpy.mockResolvedValueOnce(mockMedia);

    const response = await supertest(app).delete(
      `/api/media/delete/${encodeURIComponent(mockMedia.filepathLocation)}`,
    );

    expect(response.status).toBe(200);
    expect(deleteMediaSpy).toHaveBeenCalledWith(`dummy/filepath`);
  });

  test('should return 400 when missing filepathLocation', async () => {
    const response = await supertest(app).delete('/api/media/delete/');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Filepath missing' });
  });

  test('should return 500 when service throws error', async () => {
    deleteMediaSpy.mockRejectedValueOnce(new Error('Database error'));

    const response = await supertest(app).delete(
      `/api/media/delete/${encodeURIComponent(mockMedia.filepathLocation)}`,
    );

    expect(response.status).toBe(500);
    expect(response.text).toContain('Database error');
  });

  test('should return 500 when service returns error', async () => {
    deleteMediaSpy.mockResolvedValueOnce({ error: 'Media not found' });

    const response = await supertest(app).delete(
      `/api/media/delete/${encodeURIComponent(mockMedia.filepathLocation)}`,
    );

    expect(response.status).toBe(500);
    expect(response.text).toContain('Media not found');
  });
});
