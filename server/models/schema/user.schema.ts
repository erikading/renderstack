import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 *
 * This schema defines the structure for storing users in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `password`: The encrypted password securing the user's account.
 * - `email`: The user's email address (required and unique).
 * - `dateJoined`: The date the user joined the platform.
 * - `biography`: The user's bio/about me section.
 * - `profilePicture`: URL to the user's profile picture.
 * - `skills`: Array of software/tool expertise (e.g., Blender, Unity, Maya).
 * - `bannerImage`: URL to the user's banner image.
 * - `resumeFile`: URL to the user's downloadable resume/CV.
 * - `portfolio`: Array of portfolio items with rich metadata including title, description, media URL, thumbnail, views, and likes.
 * - `portfolioModels`: (Deprecated) Array of URLs to user's 3D model files. Use `portfolio` instead.
 * - `portfolioThumbnails`: (Deprecated) Array of thumbnail URLs. Use `portfolio` instead.
 * - `externalLinks`: Links to external profiles (GitHub, ArtStation, LinkedIn, website).
 * - `customColors`: User's custom theme colors (primary, accent, background).
 * - `customFont`: User's custom font selection.
 * - `testimonials`: Array of peer recommendations with approval workflow, including author info, content, timestamp, and approval status.
 */
const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      immutable: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    dateJoined: {
      type: Date,
    },
    biography: {
      type: String,
      default: '',
    },
    // profile customization fields for sprint 1
    profilePicture: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    resumeFile: {
      type: String,
      default: '',
    },
    portfolio: {
      type: [
        {
          title: { type: String, required: true },
          description: { type: String, default: '' },
          mediaUrl: { type: String, required: true },
          thumbnailUrl: { type: String, default: '' },
          uploadedAt: { type: Date, default: Date.now },
          views: { type: [String], default: [] },
          likes: { type: [String], default: [] },
          _id: { type: Schema.Types.ObjectId, auto: true },
        },
      ],
      default: [],
    },
    // implement other implementations of 3D models - deprecated
    portfolioModels: {
      type: [String],
      default: [],
    },
    portfolioThumbnails: {
      type: [String],
      default: [],
    },
    externalLinks: {
      type: {
        github: { type: String, default: '' },
        artstation: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        website: { type: String, default: '' },
      },
      default: {},
    },
    customColors: {
      type: {
        primary: { type: String, default: '' },
        accent: { type: String, default: '' },
        background: { type: String, default: '' },
      },
      default: {},
    },
    customFont: {
      type: String,
      default: '',
    },
    testimonials: {
      type: [
        {
          fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
          fromUsername: { type: String, required: true },
          fromProfilePicture: { type: String, default: '' },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          approved: { type: Boolean, default: false },
          _id: { type: Schema.Types.ObjectId, auto: true },
        },
      ],
      default: [],
    },
  },
  { collection: 'User' },
);

export default userSchema;
