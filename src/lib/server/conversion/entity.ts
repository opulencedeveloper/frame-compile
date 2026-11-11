import mongoose, { Schema } from "mongoose";
import { DeploymentProvider, DeploymentStatus } from "../deployment/enum";
import { IConversionDeployment } from "../deployment/interface";
import { ICaptureIssue } from "../framer-to-nextjs/interface";
import { ConversionFailureCode, ConversionSource, ConversionStatus } from "./enum";
import {
  IConversion,
  IConversionFailure,
  IConversionRepository,
  IConversionSummary,
} from "./interface";

const failureSchema = new Schema<IConversionFailure>(
  {
    code: { type: String, enum: Object.values(ConversionFailureCode), required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const repositorySchema = new Schema<IConversionRepository>(
  {
    owner: { type: String, required: true },
    name: { type: String, required: true },
    commitSha: { type: String, required: true },
    previewCommitSha: { type: String, required: true },
  },
  { _id: false },
);

const summarySchema = new Schema<IConversionSummary>(
  {
    pages: { type: Number, required: true },
    files: { type: Number, required: true },
    bytes: { type: Number, required: true },
    issueCount: { type: Number, required: true },
  },
  { _id: false },
);

const issueSchema = new Schema<ICaptureIssue>(
  {
    type: { type: String, required: true },
    url: { type: String },
    detail: { type: String },
  },
  { _id: false },
);

const deploymentSchema = new Schema<IConversionDeployment>(
  {
    provider: { type: String, enum: Object.values(DeploymentProvider), required: true },
    status: { type: String, enum: Object.values(DeploymentStatus), required: true },
    teamId: { type: String, default: null },
    projectName: { type: String, required: true },
    deploymentId: { type: String },
    url: { type: String },
    error: { type: String },
    startedAt: { type: Date, required: true },
    checkedAt: { type: Date },
    readyAt: { type: Date },
  },
  { _id: false },
);

const conversionSchema = new Schema<IConversion>(
  {
    publicId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, enum: Object.values(ConversionSource), required: true },
    sourceUrl: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(ConversionStatus),
      required: true,
      default: ConversionStatus.Queued,
    },
    failure: { type: failureSchema },
    repository: { type: repositorySchema },
    summary: { type: summarySchema },
    thumbnailPath: { type: String },
    issues: { type: [issueSchema], default: [] },
    startedAt: { type: Date },
    heartbeatAt: { type: Date },
    completedAt: { type: Date },
    deployedAt: { type: Date },
    deployment: { type: deploymentSchema },
  },
  { timestamps: true },
);

// A user's conversions, newest first, and their active ones.
conversionSchema.index({ user: 1, createdAt: -1 });
conversionSchema.index({ user: 1, status: 1 });

const Conversion =
  (mongoose.models.Conversion as mongoose.Model<IConversion>) ||
  mongoose.model<IConversion>("Conversion", conversionSchema);

export default Conversion;
