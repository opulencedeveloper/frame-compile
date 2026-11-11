import { ConversionStatus, DeploymentStatus, SiteFilter } from "@/utils/enum";

export interface ConversionFailure {
  code: string;
  message: string;
}

export interface ConversionSummary {
  pages: number;
  files: number;
  bytes: number;
  issueCount: number;
}

export interface ConversionDeployment {
  provider: string;
  status: DeploymentStatus;
  // The live address, once ready.
  url: string | null;
  error: string | null;
  projectName: string;
}

// Returned by the conversions endpoints.
export interface Conversion {
  id: string;
  sourceUrl: string;
  siteName: string;
  status: ConversionStatus;
  failure: ConversionFailure | null;
  // Set once the conversion is ready.
  previewUrl: string | null;
  thumbnailUrl: string | null;
  summary: ConversionSummary | null;
  deployment: ConversionDeployment | null;
  createdAt: string;
  completedAt: string | null;
}

// How many conversions each filter holds.
export interface ConversionCounts {
  all: number;
  deployed: number;
  notDeployed: number;
}

// A page of the user's conversions, newest first.
export interface ConversionList {
  conversions: Conversion[];
  counts: ConversionCounts;
  nextCursor: string | null;
}

// The dashboard's conversions in the Redux store (conversions slice).
// The New conversion modal: open, and the URL it starts with.
export interface NewConversionState {
  isOpen: boolean;
  url: string;
}

export interface ConversionsState {
  newConversion: NewConversionState;
  conversions: Conversion[];
  counts: ConversionCounts | null;
  nextCursor: string | null;
  hasLoaded: boolean;
  filter: SiteFilter;
  search: string;
}

export interface SidebarFilterItem {
  label: string;
  value: SiteFilter;
  count: keyof ConversionCounts;
}

export interface ConversionProgressProps {
  conversion: Conversion;
}

export interface ContentCardProps {
  conversion: Conversion;
  onDelete: (conversion: Conversion) => void;
}

export interface DeleteConversionModalProps {
  conversion: Conversion | null;
  onClose: () => void;
}
