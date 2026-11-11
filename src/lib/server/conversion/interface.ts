import { HydratedDocument, Types } from "mongoose";
import { ICaptureIssue, ISiteManifest } from "../framer-to-nextjs/interface";
import { IConversionDeployment, IDeploymentDto } from "../deployment/interface";
import { IGitHubRepository } from "../utils/interface";
import {
  ConversionFailureCode,
  ConversionListFilter,
  ConversionSource,
  ConversionStatus,
} from "./enum";

export interface IConversionFailure {
  code: ConversionFailureCode;
  // Shown to the user.
  message: string;
}

// The repository holding the converted project, at the commit that has it.
export interface IConversionRepository extends IGitHubRepository {
  commitSha: string;
  // The preview branch's commit: the pages as Framer published them.
  previewCommitSha: string;
}

export interface IConversionSummary {
  pages: number;
  files: number;
  bytes: number;
  issueCount: number;
}

export interface IConversion {
  // The id in URLs and in the repository name. Random, so previews can't be
  // found by guessing.
  publicId: string;
  user: Types.ObjectId;
  source: ConversionSource;
  sourceUrl: string;
  status: ConversionStatus;
  failure?: IConversionFailure;
  repository?: IConversionRepository;
  summary?: IConversionSummary;
  // The site's social preview image on its preview host, e.g.
  // "/assets/framerusercontent.com/images/x.png".
  thumbnailPath?: string;
  issues: ICaptureIssue[];
  startedAt?: Date;
  // Refreshed while a server holds the conversion; when it stops, the
  // server that held it has gone (see config.conversion.staleAfterMs).
  heartbeatAt?: Date;
  // Set on conversions that failed on the user's input (a wrong URL, not a
  // Framer site): hidden from the list at once, deleted by MongoDB then.
  expireAt?: Date;
  completedAt?: Date;
  // When the project was last deployed; unset until it is.
  deployedAt?: Date;
  deployment?: IConversionDeployment;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversionDocument = HydratedDocument<IConversion>;

export interface ICreateConversionInput {
  // Normalized by the validator: absolute, http or https.
  url: string;
}

export interface IConversionListQuery {
  limit: number;
  before?: Date;
  filter: ConversionListFilter;
  // Part of the site's address, any case.
  search?: string;
}

// How many of the user's conversions each filter holds, ignoring search.
export interface IConversionCounts {
  all: number;
  deployed: number;
  notDeployed: number;
}

// A page of the user's conversions, newest first.
export interface IConversionListDto {
  conversions: IConversionDto[];
  counts: IConversionCounts;
  // Pass as `before` for the next page; null on the last one.
  nextCursor: string | null;
}

export interface IConversionParams {
  id: string;
}

export interface IPreviewParams {
  id: string;
  // The requested path, split into segments; absent for "/".
  path?: string[];
}

// What the API returns for a conversion.
export interface IConversionDto {
  id: string;
  sourceUrl: string;
  siteName: string;
  status: ConversionStatus;
  failure: IConversionFailure | null;
  // Set once the conversion is ready.
  previewUrl: string | null;
  thumbnailUrl: string | null;
  summary: IConversionSummary | null;
  deployment: IDeploymentDto | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface IFinishedCapture {
  repository: IConversionRepository;
  thumbnailPath?: string;
  summary: IConversionSummary;
  issues: ICaptureIssue[];
}

// A ready conversion's project, as the preview reads it.
export interface IPreviewSite {
  repository: IConversionRepository;
  manifest: ISiteManifest;
}

export interface IPreviewFile {
  status: number;
  contentType: string;
  body: Buffer;
  // Immutable files (everything under /assets) are cached for a year.
  isImmutable: boolean;
}
