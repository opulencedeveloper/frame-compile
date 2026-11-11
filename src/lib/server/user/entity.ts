import mongoose, { Schema } from "mongoose";
import { IEmailVerification, IMarketingConsent, IUser } from "./interface";
import { AuthProvider } from "../auth/enum";

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
    pendingPasswordHash: { type: String },
  },
  { _id: false },
);

const marketingConsentSchema = new Schema<IMarketingConsent>(
  {
    granted: { type: Boolean, required: true, default: false },
    grantedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Absent for accounts that only sign in with Google.
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    // Google's stable `sub` claim. Emails can change; this does not.
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProviders: {
      type: [String],
      enum: Object.values(AuthProvider),
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Present only while an email sign-up is waiting for its OTP.
    emailVerification: {
      type: emailVerificationSchema,
      select: false,
    },
    // Every account is created from sign-up, where the terms are accepted.
    termsAcceptedAt: {
      type: Date,
      required: true,
    },
    // Only users with `granted: true` may be sent marketing emails.
    marketingConsent: {
      type: marketingConsentSchema,
      required: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.emailVerification;
        return ret;
      },
    },
  },
);

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

export default User;
