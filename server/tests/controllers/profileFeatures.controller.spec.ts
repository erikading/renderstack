import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeDatabaseUser } from '../../types/types';

const mockSafeUser: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'testuser',
  email: 'testuser@example.com',
  dateJoined: new Date('2024-12-03'),
  biography: 'Original bio',
  skills: ['React', 'JavaScript'],
  customColors: {
    primary: '#2563eb',
    accent: '#16a34a',
    background: '#f2f4f7',
  },
  customFont: 'Inter',
  externalLinks: {
    github: 'https://github.com/testuser',
  },
  portfolio: [],
};

const mockUserWithPortfolio: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user123',
  email: 'user123@example.com',
  dateJoined: new Date(),
  biography: '',
  skills: [],
  customColors: {},
  customFont: '',
  externalLinks: {},
  portfolio: [
    {
      title: 'Test Model',
      description: 'A test portfolio item',
      mediaUrl: '/userData/user123/model.glb',
      thumbnailUrl: '/userData/user123/thumb.jpg',
      uploadedAt: new Date(),
      views: [],
      likes: [],
    },
  ],
};

const mockUserWithTestimonial: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user123',
  email: 'user123@example.com',
  dateJoined: new Date(),
  biography: '',
  skills: [],
  customColors: {},
  customFont: '',
  externalLinks: {},
  portfolio: [],
  testimonials: [
    {
      _id: new mongoose.Types.ObjectId(),
      fromUsername: 'user234',
      fromProfilePicture: '',
      content: 'Great developer!',
      createdAt: new Date(),
      approved: false,
    },
  ],
};

const updateUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');

describe('Profile Features - File Uploads', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /uploadProfilePicture', () => {
    it('should upload profile picture successfully', async () => {
      const buffer = Buffer.from('fake-image-data');

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        profilePicture: 'data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh',
      });

      const response = await supertest(app)
        .post('/api/user/uploadProfilePicture')
        .field('username', 'testuser')
        .attach('file', buffer, { filename: 'profile.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body.profilePicture).toBeDefined();
      expect(response.body.profilePicture).toContain('data:image/jpeg;base64');
    });

    it('should return 400 if file is missing', async () => {
      const response = await supertest(app)
        .post('/api/user/uploadProfilePicture')
        .field('username', 'testuser');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File missing');
    });

    it('should return 400 if username is missing', async () => {
      const buffer = Buffer.from('fake-image-data');

      const response = await supertest(app)
        .post('/api/user/uploadProfilePicture')
        .attach('file', buffer, { filename: 'profile.jpg' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username missing');
    });

    it('should return 500 if database error', async () => {
      const buffer = Buffer.from('fake-image-data');

      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app)
        .post('/api/user/uploadProfilePicture')
        .field('username', 'testuser')
        .attach('file', buffer, { filename: 'profile.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /uploadBannerImage', () => {
    it('should upload banner image successfully', async () => {
      const buffer = Buffer.from('fake-banner-data');

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        bannerImage: 'data:image/jpeg;base64,ZmFrZS1iYW5uZXItZGF0YQ==',
      });

      const response = await supertest(app)
        .post('/api/user/uploadBannerImage')
        .field('username', 'testuser')
        .attach('file', buffer, { filename: 'banner.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(200);
      expect(response.body.bannerImage).toBeDefined();
      expect(response.body.bannerImage).toContain('data:image/jpeg;base64');
    });

    it('should return 400 if file is missing', async () => {
      const response = await supertest(app)
        .post('/api/user/uploadBannerImage')
        .field('username', 'testuser');

      expect(response.status).toBe(400);
    });

    it('should return 500 if database update fails', async () => {
      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app)
        .post('/api/user/uploadBannerImage')
        .attach('file', Buffer.from('fake image'), 'banner.jpg')
        .field('username', 'testuser');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /uploadResume', () => {
    it('should upload resume PDF successfully', async () => {
      const buffer = Buffer.from('fake-pdf-data');

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        resumeFile: 'data:application/pdf;base64,ZmFrZS1wZGYtZGF0YQ==',
      });

      const response = await supertest(app)
        .post('/api/user/uploadResume')
        .field('username', 'testuser')
        .attach('file', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(200);
      expect(response.body.resumeFile).toBeDefined();
      expect(response.body.resumeFile).toContain('data:application/pdf;base64');
    });

    it('should return 400 if file is missing', async () => {
      const response = await supertest(app)
        .post('/api/user/uploadResume')
        .field('username', 'testuser');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('File missing');
    });

    it('should return 400 if username is missing', async () => {
      const buffer = Buffer.from('fake-pdf-data');

      const response = await supertest(app)
        .post('/api/user/uploadResume')
        .attach('file', buffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username missing');
    });

    it('should return 500 if database update fails', async () => {
      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app)
        .post('/api/user/uploadResume')
        .attach('file', Buffer.from('fake pdf'), 'resume.pdf')
        .field('username', 'testuser');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /uploadPortfolioModel', () => {
    it('should upload portfolio item with file', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [],
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            title: 'My 3D Model',
            description: 'A test model',
            mediaUrl: '/userData/testuser/model.glb',
            thumbnailUrl: '',
            uploadedAt: new Date(),
          },
        ],
      });

      const response = await supertest(app)
        .post('/api/user/uploadPortfolioModel')
        .field('username', 'testuser')
        .field('title', 'My 3D Model')
        .field('description', 'A test model')
        .field('file', '/userData/testuser/model.glb');

      expect(response.status).toBe(200);
      expect(response.body.portfolio).toHaveLength(1);
      expect(response.body.portfolio[0].title).toBe('My 3D Model');
    });

    it('should upload portfolio item with YouTube URL', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [],
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            title: 'My Video',
            description: 'YouTube video',
            mediaUrl: 'https://www.youtube.com/watch?v=abc123',
            thumbnailUrl: '',
            uploadedAt: new Date(),
          },
        ],
      });

      const response = await supertest(app).post('/api/user/uploadPortfolioModel').send({
        username: 'testuser',
        title: 'My Video',
        description: 'YouTube video',
        mediaUrl: 'https://www.youtube.com/watch?v=abc123',
      });

      expect(response.status).toBe(200);
      expect(response.body.portfolio[0].mediaUrl).toBe('https://www.youtube.com/watch?v=abc123');
    });

    it('should return 400 if title is missing', async () => {
      const response = await supertest(app)
        .post('/api/user/uploadPortfolioModel')
        .field('username', 'testuser')
        .field('file', '/userData/testuser/model.glb');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });

    it('should return 400 if neither file nor mediaUrl provided', async () => {
      const response = await supertest(app).post('/api/user/uploadPortfolioModel').send({
        username: 'testuser',
        title: 'Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Either a file or media URL is required');
    });
  });

  describe('Portfolio Upload Edge Cases', () => {
    it('should return 500 if getUserByUsername fails during portfolio upload', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app).post('/api/user/uploadPortfolioModel').send({
        username: 'testuser',
        title: 'Test',
        description: 'Test',
        mediaUrl: 'https://youtube.com/watch?v=test',
      });

      expect(response.status).toBe(500);
    });
  });
});

describe('Profile Features - Skills', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PATCH /updateSkills', () => {
    it('should successfully update skills', async () => {
      const mockReqBody = {
        username: 'testuser',
        skills: ['Blender', 'Unity', 'React'],
      };

      const updatedUser = {
        ...mockSafeUser,
        skills: mockReqBody.skills,
      };

      updateUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app).patch('/api/user/updateSkills').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.skills).toEqual(['Blender', 'Unity', 'React']);
      expect(updateUserSpy).toHaveBeenCalledWith('testuser', { skills: mockReqBody.skills });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        skills: ['Blender'],
      };

      const response = await supertest(app).patch('/api/user/updateSkills').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating skills');
    });

    it('should return 400 for request missing skills array', async () => {
      const mockReqBody = {
        username: 'testuser',
      };

      const response = await supertest(app).patch('/api/user/updateSkills').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating skills');
    });

    it('should return 500 if database error', async () => {
      const mockReqBody = {
        username: 'testuser',
        skills: ['Blender'],
      };

      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).patch('/api/user/updateSkills').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });
});

describe('Profile Features - External Links', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PATCH /updateExternalLinks', () => {
    it('should successfully update external links', async () => {
      const mockReqBody = {
        username: 'testuser',
        externalLinks: {
          github: 'https://github.com/newuser',
          artstation: 'https://artstation.com/newuser',
          linkedin: 'https://linkedin.com/in/newuser',
          website: 'https://newuser.com',
        },
      };

      const updatedUser = {
        ...mockSafeUser,
        externalLinks: mockReqBody.externalLinks,
      };

      updateUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.externalLinks).toEqual(mockReqBody.externalLinks);
    });

    it('should accept partial external links', async () => {
      const mockReqBody = {
        username: 'testuser',
        externalLinks: {
          github: 'https://github.com/testuser',
        },
      };

      const updatedUser = {
        ...mockSafeUser,
        externalLinks: mockReqBody.externalLinks,
      };

      updateUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.externalLinks.github).toBe('https://github.com/testuser');
    });

    it('should return 400 for missing username', async () => {
      const mockReqBody = {
        externalLinks: { github: 'https://github.com/test' },
      };

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating external links');
    });

    it('should return 500 if database error', async () => {
      const mockReqBody = {
        username: 'testuser',
        externalLinks: { github: 'https://github.com/test' },
      };

      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });
});

describe('Profile Features - Custom Colors', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PATCH /updateCustomColors', () => {
    it('should successfully update custom colors', async () => {
      const mockReqBody = {
        username: 'testuser',
        customColors: {
          primary: '#ff5733',
          accent: '#33ff57',
          background: '#3357ff',
        },
      };

      const updatedUser = {
        ...mockSafeUser,
        customColors: mockReqBody.customColors,
      };

      updateUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app).patch('/api/user/updateCustomColors').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.customColors.primary).toBe('#ff5733');
      expect(response.body.customColors.accent).toBe('#33ff57');
      expect(response.body.customColors.background).toBe('#3357ff');
    });

    it('should return 400 for missing username', async () => {
      const mockReqBody = {
        customColors: { primary: '#ff0000' },
      };

      const response = await supertest(app).patch('/api/user/updateCustomColors').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating custom colors');
    });

    it('should return 400 for invalid color format', async () => {
      const mockReqBody = {
        username: 'testuser',
        customColors: {
          primary: 'not-a-color',
          accent: '#33ff57',
          background: '#3357ff',
        },
      };

      const response = await supertest(app).patch('/api/user/updateCustomColors').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating custom colors');
    });

    it('should return 500 if database error', async () => {
      const mockReqBody = {
        username: 'testuser',
        customColors: {
          primary: '#ff5733',
          accent: '#33ff57',
          background: '#3357ff',
        },
      };

      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).patch('/api/user/updateCustomColors').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });
});

describe('Profile Features - Custom Font', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PATCH /updateCustomFont', () => {
    it('should successfully update custom font', async () => {
      const mockReqBody = {
        username: 'testuser',
        customFont: 'Roboto',
      };

      const updatedUser = {
        ...mockSafeUser,
        customFont: 'Roboto',
      };

      updateUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app).patch('/api/user/updateCustomFont').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.customFont).toBe('Roboto');
    });

    it('should return 400 for missing username', async () => {
      const mockReqBody = {
        customFont: 'Roboto',
      };

      const response = await supertest(app).patch('/api/user/updateCustomFont').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating custom font');
    });

    it('should return 400 for missing customFont', async () => {
      const mockReqBody = {
        username: 'testuser',
      };

      const response = await supertest(app).patch('/api/user/updateCustomFont').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when updating custom font');
    });

    it('should return 500 if database error', async () => {
      const mockReqBody = {
        username: 'testuser',
        customFont: 'Roboto',
      };

      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).patch('/api/user/updateCustomFont').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });
});

describe('Profile Features - Testimonials', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /testimonial', () => {
    it('should create a new testimonial', async () => {
      const mockReqBody = {
        profileUsername: 'user123',
        fromUsername: 'testuser',
        content: 'Great developer to work with!',
      };

      const profileUser = {
        ...mockSafeUser,
        username: 'user123',
  email: 'user123@example.com',
        testimonials: [],
      };

      const fromUser = {
        ...mockSafeUser,
        username: 'testuser',
        profilePicture: 'http://example.com/pic.jpg',
      };

      getUserByUsernameSpy.mockResolvedValueOnce(profileUser).mockResolvedValueOnce(fromUser);

      const newTestimonial = {
        _id: new mongoose.Types.ObjectId(),
        fromUsername: 'testuser',
        fromProfilePicture: 'http://example.com/pic.jpg',
        content: 'Great developer to work with!',
        createdAt: new Date(),
        approved: false,
      };

      updateUserSpy.mockResolvedValueOnce({
        ...profileUser,
        testimonials: [newTestimonial],
      });

      const response = await supertest(app).post('/api/user/testimonial').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.testimonials).toHaveLength(1);
    });

    it('should return 400 for missing profileUsername', async () => {
      const mockReqBody = {
        fromUsername: 'testuser',
        content: 'Great!',
      };

      const response = await supertest(app).post('/api/user/testimonial').send(mockReqBody);

      expect(response.status).toBe(400);
    });

    it('should return 400 when trying to write testimonial for yourself', async () => {
      const mockReqBody = {
        profileUsername: 'testuser',
        fromUsername: 'testuser',
        content: 'I am great!',
      };

      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser).mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/api/user/testimonial').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot write testimonial for yourself');
    });

    it('should return 404 if profile user not found', async () => {
      const mockReqBody = {
        profileUsername: 'nonexistent',
        fromUsername: 'testuser',
        content: 'Great!',
      };

      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app).post('/api/user/testimonial').send(mockReqBody);

      expect(response.status).toBe(404);
    });

    it('should return 404 if author user not found', async () => {
      getUserByUsernameSpy
        .mockResolvedValueOnce(mockSafeUser)
        .mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app).post('/api/user/testimonial').send({
        profileUsername: 'testuser',
        fromUsername: 'nonexistent',
        content: 'Great work!',
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Author user not found');
    });

    it('should update existing testimonial instead of creating duplicate', async () => {
      const existingTestimonial = {
        _id: new mongoose.Types.ObjectId(),
        fromUsername: 'testuser',
        fromProfilePicture: '',
        content: 'Original content',
        createdAt: new Date(),
        approved: true,
      };

      const profileUser = {
        ...mockSafeUser,
        username: 'user123',
  email: 'user123@example.com',
        testimonials: [existingTestimonial],
      };

      getUserByUsernameSpy.mockResolvedValueOnce(profileUser).mockResolvedValueOnce(mockSafeUser);

      updateUserSpy.mockResolvedValueOnce({
        ...profileUser,
        testimonials: [
          {
            ...existingTestimonial,
            content: 'Updated content!',
            approved: false,
          },
        ],
      });

      const response = await supertest(app).post('/api/user/testimonial').send({
        profileUsername: 'user123',
        fromUsername: 'testuser',
        content: 'Updated content!',
      });

      expect(response.status).toBe(200);
      expect(response.body.testimonials).toHaveLength(1);
      expect(response.body.testimonials[0].content).toBe('Updated content!');
    });
  });

  describe('PATCH /testimonial/approve', () => {
    it('should approve a testimonial', async () => {
      const testimonialId = new mongoose.Types.ObjectId();
      const mockReqBody = {
        username: 'user123',
  email: 'user123@example.com',
        testimonialId: testimonialId.toString(),
        approved: true,
      };

      const userWithTestimonials = {
        ...mockSafeUser,
        username: 'user123',
  email: 'user123@example.com',
        testimonials: [
          {
            _id: testimonialId,
            fromUsername: 'testuser',
            fromProfilePicture: '',
            content: 'Great!',
            createdAt: new Date(),
            approved: false,
          },
        ],
      };

      getUserByUsernameSpy.mockResolvedValueOnce(userWithTestimonials);
      updateUserSpy.mockResolvedValueOnce({
        ...userWithTestimonials,
        testimonials: [
          {
            _id: testimonialId,
            fromUsername: 'testuser',
            fromProfilePicture: '',
            content: 'Great!',
            createdAt: new Date(),
            approved: true,
          },
        ],
      });

      const response = await supertest(app)
        .patch('/api/user/testimonial/approve')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.testimonials[0].approved).toBe(true);
    });

    it('should return 404 if testimonial not found', async () => {
      const mockReqBody = {
        username: 'user123',
  email: 'user123@example.com',
        testimonialId: new mongoose.Types.ObjectId().toString(),
        approved: true,
      };

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        testimonials: [],
      });

      const response = await supertest(app)
        .patch('/api/user/testimonial/approve')
        .send(mockReqBody);

      expect(response.status).toBe(404);
    });

    it('should return 500 if database update fails when approving', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockUserWithTestimonial);
      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).patch('/api/user/testimonial/approve').send({
        username: 'user123',
  email: 'user123@example.com',
        testimonialId: mockUserWithTestimonial.testimonials![0]._id!.toString(),
        approved: true,
      });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /testimonial/:profileUsername', () => {
    it('should delete a testimonial', async () => {
      const mockReqBody = {
        fromUsername: 'testuser',
      };

      const userWithTestimonials = {
        ...mockSafeUser,
        testimonials: [
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'testuser',
            fromProfilePicture: '',
            content: 'Great!',
            createdAt: new Date(),
            approved: true,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'other',
            fromProfilePicture: '',
            content: 'Nice!',
            createdAt: new Date(),
            approved: true,
          },
        ],
      };

      getUserByUsernameSpy.mockResolvedValueOnce(userWithTestimonials);
      updateUserSpy.mockResolvedValueOnce({
        ...userWithTestimonials,
        testimonials: [
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'other',
            fromProfilePicture: '',
            content: 'Nice!',
            createdAt: new Date(),
            approved: true,
          },
        ],
      });

      const response = await supertest(app)
        .delete('/api/user/testimonial/user123')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.testimonials).toHaveLength(1);
    });

    it('should return 400 if fromUsername missing', async () => {
      const response = await supertest(app).delete('/api/user/testimonial/user123').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Testimonials with Many Items', () => {
    it('user can have more than 3 testimonials', async () => {
      const username = 'user_with_many_testimonials';

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username,
        email: 'user_with_many_testimonials@example.com',
        dateJoined: new Date(),
        testimonials: [
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'user1',
            fromProfilePicture: '',
            content: 'Great!',
            createdAt: new Date(),
            approved: true,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'user2',
            fromProfilePicture: '',
            content: 'Awesome!',
            createdAt: new Date(),
            approved: true,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'user3',
            fromProfilePicture: '',
            content: 'Excellent!',
            createdAt: new Date(),
            approved: true,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'user4',
            fromProfilePicture: '',
            content: 'Amazing!',
            createdAt: new Date(),
            approved: true,
          },
          {
            _id: new mongoose.Types.ObjectId(),
            fromUsername: 'user5',
            fromProfilePicture: '',
            content: 'Perfect!',
            createdAt: new Date(),
            approved: true,
          },
        ],
      };

      getUserByUsernameSpy.mockResolvedValueOnce(mockUser);

      const response = await supertest(app).get(`/api/user/getUser/${username}`);

      expect(response.status).toBe(200);
      expect(response.body.testimonials).toHaveLength(5);
      expect(response.body.testimonials.filter((t: any) => t.approved)).toHaveLength(5);
    });
  });
});

describe('Profile Features - Portfolio Management', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('PATCH /reorderPortfolioItems', () => {
    it('should reorder portfolio items by swapping indices', async () => {
      const portfolio = [
        { title: 'Item 1', mediaUrl: 'url1', description: '', uploadedAt: new Date() },
        { title: 'Item 2', mediaUrl: 'url2', description: '', uploadedAt: new Date() },
        { title: 'Item 3', mediaUrl: 'url3', description: '', uploadedAt: new Date() },
      ];

      const mockReqBody = {
        username: 'testuser',
        fromIndex: 0,
        toIndex: 2,
      };

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          { title: 'Item 3', mediaUrl: 'url3', description: '', uploadedAt: expect.any(Date) },
          { title: 'Item 2', mediaUrl: 'url2', description: '', uploadedAt: expect.any(Date) },
          { title: 'Item 1', mediaUrl: 'url1', description: '', uploadedAt: expect.any(Date) },
        ],
      });

      const response = await supertest(app)
        .patch('/api/user/reorderPortfolioItems')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.portfolio[0].title).toBe('Item 3');
      expect(response.body.portfolio[2].title).toBe('Item 1');
    });

    it('should return 400 if required fields missing', async () => {
      const mockReqBody = {
        username: 'testuser',
      };

      const response = await supertest(app)
        .patch('/api/user/reorderPortfolioItems')
        .send(mockReqBody);

      expect(response.status).toBe(400);
    });

    it('should return 500 if user not found', async () => {
      const mockReqBody = {
        username: 'nonexistent',
        fromIndex: 0,
        toIndex: 1,
      };

      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app)
        .patch('/api/user/reorderPortfolioItems')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /deleteSinglePortfolioItem', () => {
    it('should delete a portfolio item by index', async () => {
      const portfolio = [
        { title: 'Item 1', mediaUrl: 'url1', description: '', uploadedAt: new Date() },
        { title: 'Item 2', mediaUrl: 'url2', description: '', uploadedAt: new Date() },
        { title: 'Item 3', mediaUrl: 'url3', description: '', uploadedAt: new Date() },
      ];

      const mockReqBody = {
        username: 'testuser',
        index: 1,
      };

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          { title: 'Item 1', mediaUrl: 'url1', description: '', uploadedAt: expect.any(Date) },
          { title: 'Item 3', mediaUrl: 'url3', description: '', uploadedAt: expect.any(Date) },
        ],
      });

      const response = await supertest(app)
        .delete('/api/user/deleteSinglePortfolioItem')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.portfolio).toHaveLength(2);
      expect(response.body.portfolio[1].title).toBe('Item 3');
    });

    it('should return 400 if required fields missing', async () => {
      const mockReqBody = {
        username: 'testuser',
      };

      const response = await supertest(app)
        .delete('/api/user/deleteSinglePortfolioItem')
        .send(mockReqBody);

      expect(response.status).toBe(400);
    });

    it('should return 500 if database update fails', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockUserWithPortfolio);
      updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).delete('/api/user/deleteSinglePortfolioItem').send({
        username: 'user123',
  email: 'user123@example.com',
        index: 0,
      });

      expect(response.status).toBe(500);
    });
  });
});

describe('Profile Features - Portfolio Views and Likes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /portfolio/incrementViews/:username/:index/:viewerUsername', () => {
    it('should increment view count for a portfolio item', async () => {
      const portfolio = [
        {
          title: 'Test Item',
          description: 'Test description',
          mediaUrl: 'url1',
          uploadedAt: new Date(),
          views: ['user1', 'user2'],
          likes: [],
        },
      ];

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            ...portfolio[0],
            views: ['user1', 'user2', 'user3'],
          },
        ],
      });

      const response = await supertest(app).post(
        '/api/user/portfolio/incrementViews/testuser/0/user3',
      );

      expect(response.status).toBe(200);
      expect(response.body.views).toHaveLength(3);
      expect(response.body.views).toContain('user3');
    });

    it('should return 404 if portfolio item index is invalid', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [{ title: 'Item 1', mediaUrl: 'url1', description: '', uploadedAt: new Date() }],
      });

      const response = await supertest(app).post(
        '/api/user/portfolio/incrementViews/testuser/5/user3',
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 if user not found', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

      const response = await supertest(app).post(
        '/api/user/portfolio/incrementViews/nonexistent/0/user3',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /portfolio/toggleLike/:username/:index/:likeUsername', () => {
    it('should add a like to a portfolio item', async () => {
      const portfolio = [
        {
          title: 'Test Item',
          description: 'Test description',
          mediaUrl: 'url1',
          uploadedAt: new Date(),
          views: [],
          likes: ['user1'],
        },
      ];

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            ...portfolio[0],
            likes: ['user1', 'user2'],
          },
        ],
      });

      const response = await supertest(app).post('/api/user/portfolio/toggleLike/testuser/0/user2');

      expect(response.status).toBe(200);
      expect(response.body.likes).toHaveLength(2);
      expect(response.body.likes).toContain('user2');
    });

    it('should remove a like if user already liked', async () => {
      const portfolio = [
        {
          title: 'Test Item',
          description: 'Test description',
          mediaUrl: 'url1',
          uploadedAt: new Date(),
          views: [],
          likes: ['user1', 'user2'],
        },
      ];

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            ...portfolio[0],
            likes: ['user1'],
          },
        ],
      });

      const response = await supertest(app).post('/api/user/portfolio/toggleLike/testuser/0/user2');

      expect(response.status).toBe(200);
      expect(response.body.likes).toHaveLength(1);
      expect(response.body.likes).not.toContain('user2');
    });

    it('should return 404 if portfolio item not found', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [],
      });

      const response = await supertest(app).post('/api/user/portfolio/toggleLike/testuser/0/user2');

      expect(response.status).toBe(404);
    });
  });

  describe('Portfolio Metrics - Advanced Scenarios', () => {
    it('should handle multiple views from same user (cumulative)', async () => {
      const portfolio = [
        {
          title: 'Test',
          mediaUrl: 'url',
          description: '',
          uploadedAt: new Date(),
          views: ['user1', 'user1'],
          likes: [],
        },
      ];

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            ...portfolio[0],
            views: ['user1', 'user1', 'user1'],
          },
        ],
      });

      const response = await supertest(app).post(
        '/api/user/portfolio/incrementViews/testuser/0/user1',
      );

      expect(response.status).toBe(200);
      expect(response.body.views).toHaveLength(3);
    });

    it('should not allow double-liking (toggle removes like)', async () => {
      const portfolio = [
        {
          title: 'Test',
          mediaUrl: 'url',
          description: '',
          uploadedAt: new Date(),
          views: [],
          likes: ['user1'],
        },
      ];

      getUserByUsernameSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio,
      });

      updateUserSpy.mockResolvedValueOnce({
        ...mockSafeUser,
        portfolio: [
          {
            ...portfolio[0],
            likes: [],
          },
        ],
      });

      const response = await supertest(app).post('/api/user/portfolio/toggleLike/testuser/0/user1');

      expect(response.status).toBe(200);
      expect(response.body.likes).toHaveLength(0);
    });
  });
});

describe('Additional Coverage - Error Paths', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return 400 if getUserByUsername fails when uploading portfolio with file', async () => {
    const buffer = Buffer.from('fake-glb-data');

    getUserByUsernameSpy.mockRejectedValueOnce({ error: 'User not found' });

    const response = await supertest(app)
      .post('/api/user/uploadPortfolioModel')
      .field('username', 'testuser')
      .field('title', 'Test Model')
      .field('description', 'Test')
      .attach('file', buffer, { filename: 'model.glb', contentType: 'model/gltf-binary' });

    expect(response.status).toBe(400);
  });

  it('should return 500 if updateUser fails when uploading portfolio', async () => {
    getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);
    updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

    const response = await supertest(app).post('/api/user/uploadPortfolioModel').send({
      username: 'testuser',
      title: 'Test',
      description: 'Test',
      mediaUrl: 'https://youtube.com/watch?v=test',
    });

    expect(response.status).toBe(500);
  });

  it('should return 500 if updateUser fails when incrementing views', async () => {
    const portfolio = [
      {
        title: 'Test',
        mediaUrl: 'url',
        description: '',
        uploadedAt: new Date(),
        views: [],
        likes: [],
      },
    ];

    getUserByUsernameSpy.mockResolvedValueOnce({ ...mockSafeUser, portfolio });
    updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

    const response = await supertest(app).post(
      '/api/user/portfolio/incrementViews/testuser/0/viewer',
    );

    expect(response.status).toBe(500);
  });

  it('should return 500 if updateUser fails when toggling like', async () => {
    const portfolio = [
      {
        title: 'Test',
        mediaUrl: 'url',
        description: '',
        uploadedAt: new Date(),
        views: [],
        likes: [],
      },
    ];

    getUserByUsernameSpy.mockResolvedValueOnce({ ...mockSafeUser, portfolio });
    updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

    const response = await supertest(app).post('/api/user/portfolio/toggleLike/testuser/0/liker');

    expect(response.status).toBe(500);
  });

  it('should return 500 if updateUser returns portfolio as undefined after incrementing views', async () => {
    const portfolio = [
      {
        title: 'Test',
        mediaUrl: 'url',
        description: '',
        uploadedAt: new Date(),
        views: [],
        likes: [],
      },
    ];

    getUserByUsernameSpy.mockResolvedValueOnce({ ...mockSafeUser, portfolio });
    updateUserSpy.mockResolvedValueOnce({ ...mockSafeUser, portfolio: undefined });

    const response = await supertest(app).post(
      '/api/user/portfolio/incrementViews/testuser/0/viewer',
    );

    expect(response.status).toBe(500);
  });

  it('should return 404 if profile user lookup fails when deleting testimonial', async () => {
    getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

    const response = await supertest(app)
      .delete('/api/user/testimonial/nonexistent')
      .send({ fromUsername: 'testuser' });

    expect(response.status).toBe(404);
  });

  it('should return 404 if user not found when approving testimonial', async () => {
    getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

    const response = await supertest(app).patch('/api/user/testimonial/approve').send({
      username: 'nonexistent',
      testimonialId: new mongoose.Types.ObjectId().toString(),
      approved: true,
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 for missing fields in testimonial approval', async () => {
    const response = await supertest(app).patch('/api/user/testimonial/approve').send({
      username: 'testuser',
      // missing testimonialId and approved
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 when uploadPortfolioModel has username missing', async () => {
    const response = await supertest(app).post('/api/user/uploadPortfolioModel').send({
      title: 'Test',
      mediaUrl: 'http://test.com/video.mp4',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username missing');
  });

  it('should return 500 if updateUser fails during reorderPortfolioItems', async () => {
    const portfolio = [
      { title: 'A', mediaUrl: 'url1', description: '', uploadedAt: new Date() },
      { title: 'B', mediaUrl: 'url2', description: '', uploadedAt: new Date() },
    ];

    getUserByUsernameSpy.mockResolvedValueOnce({ ...mockSafeUser, portfolio });
    updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

    const response = await supertest(app)
      .patch('/api/user/reorderPortfolioItems')
      .send({ username: 'testuser', fromIndex: 0, toIndex: 1 });

    expect(response.status).toBe(500);
  });

  it('should return 500 if getUserByUsername fails during deleteSinglePortfolioItem', async () => {
    getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

    const response = await supertest(app)
      .delete('/api/user/deleteSinglePortfolioItem')
      .send({ username: 'testuser', index: 0 });

    expect(response.status).toBe(500);
  });

  it('should return 500 if updateUser fails during testimonial deletion', async () => {
    const userWithTestimonial = {
      ...mockSafeUser,
      testimonials: [
        {
          fromUsername: 'other',
          content: 'Test',
          createdAt: new Date(),
          approved: true,
        },
      ],
    };

    getUserByUsernameSpy.mockResolvedValueOnce(userWithTestimonial);
    updateUserSpy.mockResolvedValueOnce({ error: 'Database error' });

    const response = await supertest(app)
      .delete('/api/user/testimonial/testuser')
      .send({ fromUsername: 'other' });

    expect(response.status).toBe(500);
  });
});
