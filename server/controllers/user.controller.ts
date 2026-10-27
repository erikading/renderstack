import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import {
  Auth0LoginRequest,
  UserRequest,
  User,
  UserCredentials,
  UserByUsernameRequest,
  FakeSOSocket,
  UpdateBiographyRequest,
  Testimonial,
} from '../types/types';
import {
  deleteUserByUsername,
  findOrCreateAuth0User,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
} from '../services/user.service';

const userController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();
  const upload = multer({ storage: multer.memoryStorage() });

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username, email, and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    const requestUser = req.body;

    const user: User = {
      ...requestUser,
      dateJoined: new Date(),
      biography: requestUser.biography ?? '',
    };

    try {
      const result = await saveUser(user);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('userUpdate', {
        user: result,
        type: 'created',
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when saving user: ${error}`);
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const loginCredentials: UserCredentials = {
        username: req.body.username,
        password: req.body.password,
      };

      const user = await loginUser(loginCredentials);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send('Login failed');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const user = await getUserByUsername(username);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send(`Error when getting user by username: ${error}`);
    }
  };

  /**
   * Signs in an Auth0 user, creating their account on first login.
   * @param req The request containing the Auth0 profile's email and a preferred username in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const auth0Login = async (req: Auth0LoginRequest, res: Response): Promise<void> => {
    const { email, username } = req.body;

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).send('A valid email is required');
      return;
    }
    if (typeof username !== 'string' || !username.trim()) {
      res.status(400).send('Username is required');
      return;
    }

    try {
      const user = await findOrCreateAuth0User(email, username);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send(`Error when signing in Auth0 user: ${error}`);
    }
  };

  /**
   * Retrieves all users from the database.
   * @param res The response, either returning the users or an error.
   * @returns A promise resolving to void.
   */
  const getUsers = async (_: Request, res: Response): Promise<void> => {
    try {
      const users = await getUsersList();

      if ('error' in users) {
        throw Error(users.error);
      }

      res.status(200).json(users);
    } catch (error) {
      res.status(500).send(`Error when getting users: ${error}`);
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either confirming deletion or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const deletedUser = await deleteUserByUsername(username);

      if ('error' in deletedUser) {
        throw Error(deletedUser.error);
      }

      socket.emit('userUpdate', {
        user: deletedUser,
        type: 'deleted',
      });
      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(500).send(`Error when deleting user by username: ${error}`);
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const updatedUser = await updateUser(req.body.username, { password: req.body.password });

      if ('error' in updatedUser) {
        throw Error(updatedUser.error);
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user password: ${error}`);
    }
  };

  /**
   * Updates a user's biography.
   * @param req The request containing the username and biography in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateBiography = async (req: UpdateBiographyRequest, res: Response): Promise<void> => {
    try {
      // Validate that request has username and biography
      const { username, biography } = req.body;

      // Call the same updateUser(...) service used by resetPassword
      const updatedUser = await updateUser(username, { biography });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user biography: ${error}`);
    }
  };

  /**
   * Updates a user's list of skills.
   * @param req The request containing the username and skills array in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, skills } = req.body;

      const updatedUser = await updateUser(username, { skills });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating skills: ${error}`);
    }
  };

  /**
   * Updates a user's external links.
   * @param req The request containing the username and externalLinks object in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateExternalLinks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, externalLinks } = req.body;

      const updatedUser = await updateUser(username, { externalLinks });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating external links: ${error}`);
    }
  };

  /**
   * Updates a user's custom theme colors.
   * @param req The request containing the username and customColors object in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateCustomColors = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, customColors } = req.body;

      const updatedUser = await updateUser(username, { customColors });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating custom colors: ${error}`);
    }
  };

  /**
   * Updates a user's custom font.
   * @param req The request containing the username and customFont in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateCustomFont = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, customFont } = req.body;

      const updatedUser = await updateUser(username, { customFont });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating custom font: ${error}`);
    }
  };

  /**
   * Uploads a profile picture for a user.
   */
  const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const { username } = req.body;

      if (!file) {
        res.status(400).json({ error: 'File missing' });
        return;
      }
      if (!username) {
        res.status(400).json({ error: 'Username missing' });
        return;
      }

      // Convert buffer to base64 string for storage
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const updatedUser = await updateUser(username, { profilePicture: base64Image });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error uploading profile picture: ${error}`);
    }
  };

  /**
   * Uploads a banner image for a user.
   */
  const uploadBannerImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const { username } = req.body;

      if (!file) {
        res.status(400).json({ error: 'File missing' });
        return;
      }
      if (!username) {
        res.status(400).json({ error: 'Username missing' });
        return;
      }

      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const updatedUser = await updateUser(username, { bannerImage: base64Image });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error uploading banner image: ${error}`);
    }
  };

  /**
   * Uploads a resume file for a user.
   */
  const uploadResume = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const { username } = req.body;

      if (!file) {
        res.status(400).json({ error: 'File missing' });
        return;
      }
      if (!username) {
        res.status(400).json({ error: 'Username missing' });
        return;
      }

      // For PDFs, store as base64
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const updatedUser = await updateUser(username, { resumeFile: base64File });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error uploading resume: ${error}`);
    }
  };

  /**
   * Uploads a portfolio item with title, description, and media.
   */
  const UploadPortfolioModel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, thumbnail, file, mediaUrl, title, description } = req.body;
      // const file = req.file;

      if (!file && !mediaUrl) {
        res.status(400).json({ error: 'Either a file or media URL is required' });
        return;
      }
      if (!username) {
        res.status(400).json({ error: 'Username missing' });
        return;
      }
      if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      let mediaToStore: string;

      // If URL is provided (YouTube, etc.), use it directly
      if (mediaUrl) {
        mediaToStore = mediaUrl;
      } else if (file) {
        // Save file to filesystem instead of base64
        // const userDir = path.resolve(__dirname, '../../client/public/userData', username);

        // if (!fs.existsSync(userDir)) {
        //   fs.mkdirSync(userDir, { recursive: true });
        // }

        // const filename = file.originalname;
        // const destPath = path.join(userDir, filename);
        // fs.writeFileSync(destPath, file.buffer);

        // Store only the path
        mediaToStore = file;
      } else {
        res.status(400).json({ error: 'No media provided' });
        return;
      }

      const user = await getUserByUsername(username);
      if ('error' in user) {
        throw new Error('User not found');
      }

      const currentPortfolio = user.portfolio || [];

      // Create new portfolio item object
      const newItem = {
        title: title.trim(),
        description: description?.trim() || '',
        mediaUrl: mediaToStore,
        thumbnailUrl: thumbnail || '',
        uploadedAt: new Date(),
      };

      const updatedPortfolio = [...currentPortfolio, newItem];

      const updatedUser = await updateUser(username, { portfolio: updatedPortfolio });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error uploading portfolio item: ${error}`);
    }
  };

  /**
   * Creates or updates a testimonial from one user to another.
   */
  const createOrUpdateTestimonial = async (req: Request, res: Response): Promise<void> => {
    try {
      const { profileUsername, fromUsername, content } = req.body;

      if (!profileUsername || !fromUsername || !content) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get the user who is receiving the testimonial
      const profileUser = await getUserByUsername(profileUsername);
      if ('error' in profileUser) {
        res.status(404).json({ error: 'Profile user not found' });
        return;
      }

      // Get the user who is writing the testimonial (for profile picture)
      const fromUser = await getUserByUsername(fromUsername);
      if ('error' in fromUser) {
        res.status(404).json({ error: 'Author user not found' });
        return;
      }

      // Can't write testimonial for yourself
      if (profileUsername === fromUsername) {
        res.status(400).json({ error: 'Cannot write testimonial for yourself' });
        return;
      }

      const testimonials = profileUser.testimonials || [];

      // Check if testimonial already exists from this user
      const existingIndex = testimonials.findIndex(
        (t: Testimonial) => t.fromUsername === fromUsername,
      );
      const newTestimonial = {
        fromUsername,
        fromProfilePicture: fromUser.profilePicture || '',
        content: content.trim(),
        createdAt: new Date(),
        approved: false,
      };

      if (existingIndex >= 0) {
        // Update existing testimonial
        testimonials[existingIndex] = {
          ...testimonials[existingIndex],
          ...newTestimonial,
        };
      } else {
        // Add new testimonial
        testimonials.push(newTestimonial);
      }

      const updatedUser = await updateUser(profileUsername, { testimonials });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error creating/updating testimonial: ${error}`);
    }
  };

  /**
   * Deletes a user's testimonial from another user's profile.
   */
  const deleteTestimonial = async (req: Request, res: Response): Promise<void> => {
    try {
      const { profileUsername } = req.params;
      const { fromUsername } = req.body;

      if (!fromUsername) {
        res.status(400).json({ error: 'fromUsername required' });
        return;
      }

      const profileUser = await getUserByUsername(profileUsername);
      if ('error' in profileUser) {
        res.status(404).json({ error: 'Profile user not found' });
        return;
      }

      const testimonials = profileUser.testimonials || [];
      const filteredTestimonials = testimonials.filter(
        (t: Testimonial) => t.fromUsername !== fromUsername,
      );

      const updatedUser = await updateUser(profileUsername, {
        testimonials: filteredTestimonials,
      });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error deleting testimonial: ${error}`);
    }
  };

  /**
   * Approves or rejects a testimonial.
   */
  const updateTestimonialApproval = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, testimonialId, approved } = req.body;

      if (!username || !testimonialId || typeof approved !== 'boolean') {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const user = await getUserByUsername(username);
      if ('error' in user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const testimonials = user.testimonials || [];
      const testimonialIndex = testimonials.findIndex(
        (t: Testimonial) => t._id?.toString() === testimonialId,
      );

      if (testimonialIndex === -1) {
        res.status(404).json({ error: 'Testimonial not found' });
        return;
      }

      if (approved) {
        // Approve testimonial
        testimonials[testimonialIndex].approved = true;
      } else {
        // Reject = delete testimonial
        testimonials.splice(testimonialIndex, 1);
      }

      const updatedUser = await updateUser(username, { testimonials });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error updating testimonial approval: ${error}`);
    }
  };

  /**
   * Reorders portfolio items by swapping two indices.
   */
  const reorderPortfolioItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, fromIndex, toIndex } = req.body;

      if (!username || typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const user = await getUserByUsername(username);
      if ('error' in user) {
        throw new Error('User not found');
      }

      const portfolio = [...(user.portfolio || [])];

      // Swap items
      [portfolio[fromIndex], portfolio[toIndex]] = [portfolio[toIndex], portfolio[fromIndex]];

      const updatedUser = await updateUser(username, { portfolio });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error reordering portfolio items: ${error}`);
    }
  };

  /**
   * Deletes a single portfolio item by index.
   */
  const deleteSinglePortfolioItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, index } = req.body;

      if (!username || typeof index !== 'number') {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const user = await getUserByUsername(username);
      if ('error' in user) {
        throw new Error('User not found');
      }

      const portfolio = (user.portfolio || []).filter((_, i) => i !== index);

      const updatedUser = await updateUser(username, { portfolio });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error deleting portfolio item: ${error}`);
    }
  };

  /**
   * Migrates old portfolioModels/Thumbnails arrays to new portfolio structure.
   * This is a one-time migration endpoint.
   */
  const migratePortfolioData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.body;

      const user = await getUserByUsername(username);
      if ('error' in user) {
        throw new Error('User not found');
      }

      // Skip if already migrated or no old data
      if (!user.portfolioModels || user.portfolioModels.length === 0) {
        res.status(200).json({ message: 'No migration needed', user });
        return;
      }

      const migratedPortfolio = user.portfolioModels.map((mediaUrl, index) => ({
        title: `Portfolio Item ${index + 1}`,
        description: '',
        mediaUrl,
        thumbnailUrl: user.portfolioThumbnails?.[index] || '',
        uploadedAt: new Date(),
      }));

      const updatedUser = await updateUser(username, {
        portfolio: migratedPortfolio,
        portfolioModels: [], // Clear old data
        portfolioThumbnails: [],
      });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error migrating portfolio: ${error}`);
    }
  };

  /**
   * Increments views for a portfolio item
   */
  const incrementPortfolioViews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, index, viewerUsername } = req.params;
      const portfolioIndex = parseInt(index);

      const user = await getUserByUsername(username);
      if ('error' in user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const portfolio = user.portfolio || [];
      if (portfolioIndex < 0 || portfolioIndex >= portfolio.length) {
        res.status(404).json({ error: 'Portfolio item not found' });
        return;
      }

      const views = portfolio[portfolioIndex].views || [];

      // views are cumulative
      portfolio[portfolioIndex].views = [...views, viewerUsername];

      const updatedUser = await updateUser(username, { portfolio });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      if (!updatedUser.portfolio || !updatedUser.portfolio[portfolioIndex]) {
        throw new Error('Portfolio item not found after update');
      }

      res.status(200).json(updatedUser.portfolio[portfolioIndex]);
    } catch (error) {
      res.status(500).send(`Error incrementing portfolio views: ${error}`);
    }
  };

  /**
   * Toggles a like for a portfolio item
   */
  const togglePortfolioLike = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, index, likeUsername } = req.params;
      const portfolioIndex = parseInt(index);

      const user = await getUserByUsername(username);
      if ('error' in user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const portfolio = user.portfolio || [];
      if (portfolioIndex < 0 || portfolioIndex >= portfolio.length) {
        res.status(404).json({ error: 'Portfolio item not found' });
        return;
      }

      const item = portfolio[portfolioIndex];
      const likes = item.likes || [];
      const alreadyLiked = likes.includes(likeUsername);

      if (alreadyLiked) {
        // Remove like
        item.likes = likes.filter(u => u !== likeUsername);
      } else {
        // Add like
        item.likes = [...likes, likeUsername];
      }

      const updatedUser = await updateUser(username, { portfolio });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      if (!updatedUser.portfolio || !updatedUser.portfolio[portfolioIndex]) {
        // ADD THIS CHECK
        throw new Error('Portfolio item not found after update');
      }

      res.status(200).json(updatedUser.portfolio[portfolioIndex]);
    } catch (error) {
      res.status(500).send(`Error toggling portfolio like: ${error}`);
    }
  };

  // Define routes for the user-related operations.
  router.post('/signup', createUser);
  router.post('/login', userLogin);
  router.post('/auth0Login', auth0Login);
  router.patch('/resetPassword', resetPassword);
  router.get('/getUser/:username', getUser);
  router.get('/getUsers', getUsers);
  router.delete('/deleteUser/:username', deleteUser);
  router.patch('/updateBiography', updateBiography);
  router.patch('/updateSkills', updateSkills);
  router.patch('/updateExternalLinks', updateExternalLinks);
  router.patch('/updateCustomColors', updateCustomColors);
  router.patch('/updateCustomFont', updateCustomFont);
  router.post('/migratePortfolio', migratePortfolioData);
  router.patch('/reorderPortfolioItems', reorderPortfolioItems);
  router.delete('/deleteSinglePortfolioItem', deleteSinglePortfolioItem);
  router.post('/uploadProfilePicture', upload.single('file'), uploadProfilePicture);
  router.post('/uploadBannerImage', upload.single('file'), uploadBannerImage);
  router.post('/uploadResume', upload.single('file'), uploadResume);
  router.post('/uploadPortfolioModel', upload.single('file'), UploadPortfolioModel);
  router.post('/testimonial', createOrUpdateTestimonial);
  router.delete('/testimonial/:profileUsername', deleteTestimonial);
  router.post(
    '/portfolio/incrementViews/:username/:index/:viewerUsername',
    incrementPortfolioViews,
  );
  router.post('/portfolio/toggleLike/:username/:index/:likeUsername', togglePortfolioLike);
  router.patch('/testimonial/approve', updateTestimonialApproval);
  return router;
};

export default userController;
