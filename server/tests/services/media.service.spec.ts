import MediaModel from '../../models/media.model';
import mediaService from '../../services/media.service';
import { Media, DatabaseMedia } from '../../types/types';
import mongoose from 'mongoose';
import { deleteObject } from '../../utils/storage.util';

jest.mock('../../utils/storage.util');

describe('Media Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock media data
  const mockMediaInput: Media = {
    filepathLocation: '/test/hogwarts-example.png',
    filepathLocationClient: '../test/hogwarts-example.png',
    user: 'media1_uploader',
    fileSize: '1.5 MB',
  };

  const mockMedia: DatabaseMedia = {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
    filepathLocation: 'dummy/filepath',
    filepathLocationClient: 'dummy/filepath',
    user: 'test_user',
    fileSize: '13 KB',
  };

  describe('addMedia', () => {
    test('addMedia should return the added media', async () => {
      const savedMedia = {
        ...mockMediaInput,
        _id: '68ffe20ccbc370b3e921c07b',
        filepathLocation: `/userData/${mockMediaInput.user}/${mockMediaInput.filepathLocation}`,
        filepathLocationClient: mockMediaInput.filepathLocationClient,
        fileSize: '1.5 MB',
      };

      // Mock the save() method on the MediaModel instance
      const saveMock = jest.fn().mockResolvedValueOnce(savedMedia);
      jest.spyOn(MediaModel.prototype, 'save').mockImplementation(saveMock);

      const result = await mediaService.addMedia(mockMediaInput);

      expect(result).toEqual(savedMedia);
      expect(saveMock).toHaveBeenCalled();
    });

    test('should return error when save returns null', async () => {
      jest.spyOn(MediaModel.prototype, 'save').mockResolvedValueOnce(null);

      const result = await mediaService.addMedia(mockMediaInput);

      expect(result).toEqual({ error: 'Failed to add media' });
    });

    test('addMedia should return an object with error if create throws an error', async () => {
      jest.spyOn(MediaModel.prototype, 'save').mockRejectedValue(new Error('Error from db query'));
      const result = await mediaService.addMedia(mockMediaInput);
      expect(result).toEqual({ error: 'Error from db query' });
    });

    // shouldn't need this test anymore since multer handles the directory creation
    // it('should create the directory if it does not exist', async () => {
    //   // Mock directory does NOT exist
    //   (fs.existsSync as jest.Mock).mockReturnValue(false);

    //   // Mock DB save
    //   jest.spyOn(MediaModel.prototype, 'save').mockResolvedValue({
    //     ...mockMediaInput,
    //     _id: '123',
    //     filepathLocation: `/userData/test_user/test.png`,
    //   });

    //   await mediaService.addMedia(mockMediaInput);

    //   expect(fs.existsSync).toHaveBeenCalled();
    //   expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    // });
  });

  describe('formatFileSize', () => {
    it('should format bytes less than 1024 as B', () => {
      expect(mediaService.formatFileSize(500)).toBe('500 B');
    });

    it('should format bytes less than 1 MB as KB', () => {
      expect(mediaService.formatFileSize(1024)).toBe('1.00 KB');
      expect(mediaService.formatFileSize(2048)).toBe('2.00 KB');
    });

    it('should format bytes less than 1 GB as MB', () => {
      expect(mediaService.formatFileSize(1024 * 1024)).toBe('1.00 MB');
    });

    it('should format bytes 1 GB or greater as GB', () => {
      expect(mediaService.formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should handle decimal conversion correctly', () => {
      expect(mediaService.formatFileSize(1536)).toBe('1.50 KB');
    });
  });

  describe('deleteMedia', () => {
    test('should delete media when it exists', async () => {
      jest.spyOn(MediaModel, 'findOneAndDelete').mockResolvedValueOnce(mockMedia);

      const result = await mediaService.deleteMedia(
        `${encodeURIComponent(mockMedia.filepathLocation)}`,
      );

      expect(result).toEqual(mockMedia);
      expect(MediaModel.findOneAndDelete).toHaveBeenCalledWith({
        filepathLocation: 'dummy/filepath',
      });
      expect(deleteObject).toHaveBeenCalledWith('dummy/filepath');
    });

    test('should return error when storage deletion fails', async () => {
      jest.spyOn(MediaModel, 'findOneAndDelete').mockResolvedValueOnce(mockMedia);
      (deleteObject as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const result = await mediaService.deleteMedia(encodeURIComponent(mockMedia.filepathLocation));

      expect(result).toEqual({ error: 'Storage error' });
    });

    test('should return error when media not found', async () => {
      jest.spyOn(MediaModel, 'findOneAndDelete').mockResolvedValueOnce(null);

      const result = await mediaService.deleteMedia(encodeURIComponent(mockMedia.filepathLocation));

      expect(result).toEqual({ error: 'Media not found' });
    });

    test('should throw error when deletion fails', async () => {
      jest.spyOn(MediaModel, 'findOneAndDelete').mockRejectedValueOnce(new Error('Database error'));

      const result = await mediaService.deleteMedia(encodeURIComponent(mockMedia.filepathLocation));

      expect(result).toEqual({ error: 'Database error' });
    });
  });
});
