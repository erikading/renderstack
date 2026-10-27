import axios from 'axios';
import { UserCredentials, SafeDatabaseUser } from '../types/types';
import api from './config';

const USER_API_URL = `/api/user`;

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUsers = async (): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/getUsers`);
  if (res.status !== 200) {
    throw new Error('Error when fetching users');
  }
  return res.data;
};

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUserByUsername = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.get(`${USER_API_URL}/getUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Signs in an Auth0 user, creating their account on first login.
 *
 * @param email - The email address from the Auth0 profile.
 * @param username - The preferred username for a new account.
 * @returns {Promise<SafeDatabaseUser>} The existing or newly created user.
 * @throws {Error} If the request fails.
 */
const loginWithAuth0 = async (email: string, username: string): Promise<SafeDatabaseUser> => {
  const res = await api.post(`${USER_API_URL}/auth0Login`, { email, username });
  if (res.status !== 200) {
    throw new Error('Error when signing in with Auth0');
  }
  return res.data;
};

/**
 * Sends a POST request to create a new user account.
 *
 * @param user - The user credentials (username and password) for signup.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If an error occurs during the signup process.
 */
const createUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while signing up: ${error.response.data}`);
    } else {
      throw new Error('Error while signing up');
    }
  }
};

/**
 * Sends a POST request to authenticate a user.
 *
 * @param user - The user credentials (username and password) for login.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If an error occurs during the login process.
 */
const loginUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/login`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while logging in: ${error.response.data}`);
    } else {
      throw new Error('Error while logging in');
    }
  }
};

/**
 * Deletes a user by their username.
 * @param username - The unique username of the user
 * @returns A promise that resolves to the deleted user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const deleteUser = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.delete(`${USER_API_URL}/deleteUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting user');
  }
  return res.data;
};

/**
 * Asks Auth0 to email the user a link for choosing a new password.
 * @param email - The email address of the account
 * @throws {Error} If the request to Auth0 is unsuccessful
 */
const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const res = await fetch(`https://${import.meta.env.VITE_AUTH0_DOMAIN}/dbconnections/change_password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: import.meta.env.VITE_AUTH0_CLIENT_ID,
      email,
      connection: import.meta.env.VITE_AUTH0_CONNECTION || 'Username-Password-Authentication',
    }),
  });
  if (!res.ok) {
    throw new Error('Error when requesting password reset');
  }
};

/**
 * Updates the user's biography.
 * @param username The unique username of the user
 * @param newBiography The new biography to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBiography = async (
  username: string,
  newBiography: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateBiography`, {
    username,
    biography: newBiography,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating biography');
  }
  return res.data;
};

/**
 * Updates the user's skill list.
 * @param username The unique username of the user
 * @param skills The list of skills for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateSkills = async (username: string, skills: string[]): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateSkills`, {
    username,
    skills,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating skills');
  }
  return res.data;
};

const updateExternalLinks = async (
  username: string,
  externalLinks: { github?: string; artstation?: string; linkedin?: string; website?: string },
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateExternalLinks`, {
    username,
    externalLinks,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating external links');
  }
  return res.data;
};

/**
 * Updates theme colors for a user.
 */
const updateCustomColors = async (
  username: string,
  customColors: { primary?: string; accent?: string; background?: string },
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateCustomColors`, {
    username,
    customColors,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating custom colors');
  }
  return res.data;
};

/**
 * Uploads a profile picture for a user.
 */
const uploadProfilePicture = async (username: string, file: File): Promise<SafeDatabaseUser> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);

  const res = await api.post(`${USER_API_URL}/uploadProfilePicture`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (res.status !== 200) {
    throw new Error('Error uploading profile picture');
  }
  return res.data;
};

/**
 * Uploads a banner image for a user.
 */
const uploadBannerImage = async (username: string, file: File): Promise<SafeDatabaseUser> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);

  const res = await api.post(`${USER_API_URL}/uploadBannerImage`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (res.status !== 200) {
    throw new Error('Error uploading banner image');
  }
  return res.data;
};

/**
 * Uploads a resume file for a user.
 */
const uploadResume = async (username: string, file: File): Promise<SafeDatabaseUser> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', username);

  const res = await api.post(`${USER_API_URL}/uploadResume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (res.status !== 200) {
    throw new Error('Error uploading resume');
  }
  return res.data;
};

/**
 * Uploads a portfolio model for a user.
 */
const uploadPortfolioModel = async (
  username: string,
  fileOrUrl: File | string, // Changed from just File
  thumbnail: string,
): Promise<SafeDatabaseUser> => {
  const formData = new FormData();

  // If it's a string (URL), append it as 'mediaUrl'
  if (typeof fileOrUrl === 'string') {
    formData.append('mediaUrl', fileOrUrl);
  } else {
    // If it's a File, append it as 'file'
    formData.append('file', fileOrUrl);
  }

  formData.append('username', username);
  formData.append('thumbnail', thumbnail);

  const res = await api.post(`${USER_API_URL}/uploadPortfolioModel`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (res.status !== 200) {
    throw new Error('Error uploading portfolio model');
  }
  return res.data;
};

/**
 * Creates or updates a testimonial for a user
 */
export const createOrUpdateTestimonial = async (
  profileUsername: string,
  fromUsername: string,
  content: string,
): Promise<SafeDatabaseUser> => {
  const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/testimonial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileUsername, fromUsername, content }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

/**
 * Deletes your testimonial from a user's profile
 */
export const deleteTestimonial = async (
  profileUsername: string,
  fromUsername: string,
): Promise<SafeDatabaseUser> => {
  const response = await fetch(
    `${import.meta.env.VITE_SERVER_URL}/api/user/testimonial/${profileUsername}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUsername }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

/**
 * Approves or rejects a testimonial (profile owner only)
 */
export const updateTestimonialApproval = async (
  username: string,
  testimonialId: string,
  approved: boolean,
): Promise<SafeDatabaseUser> => {
  const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/testimonial/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, testimonialId, approved }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

/**
 * Updates a user's custom font selection.
 * @param username - Username of the user
 * @param customFont - Font name to set
 * @returns Updated user object
 */
export const updateCustomFont = async (
  username: string,
  customFont: string,
): Promise<SafeDatabaseUser> => {
  const res = await fetch('/api/user/updateCustomFont', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, customFont }),
  });

  if (!res.ok) {
    throw new Error('Failed to update custom font');
  }

  return await res.json();
};

/**
 * Increments views for a portfolio item
 */
export const incrementPortfolioViews = async (
  username: string,
  index: number,
  viewerUsername: string,
): Promise<void> => {
  const res = await api.post(
    `${USER_API_URL}/portfolio/incrementViews/${username}/${index}/${viewerUsername}`,
  );

  if (res.status !== 200) {
    throw new Error('Error incrementing portfolio views');
  }
};

/**
 * Toggles a like for a portfolio item
 */
export const togglePortfolioLike = async (
  username: string,
  index: number,
  likeUsername: string,
): Promise<void> => {
  const res = await api.post(
    `${USER_API_URL}/portfolio/toggleLike/${username}/${index}/${likeUsername}`,
  );
  if (res.status !== 200) {
    throw new Error('Error toggling portfolio like');
  }
};

export {
  getUsers,
  getUserByUsername,
  loginWithAuth0,
  loginUser,
  createUser,
  deleteUser,
  sendPasswordResetEmail,
  updateBiography,
  updateSkills,
  updateExternalLinks,
  updateCustomColors,
  uploadProfilePicture,
  uploadBannerImage,
  uploadResume,
  uploadPortfolioModel,
};
