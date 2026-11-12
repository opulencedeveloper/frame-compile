import { ActionMenuItem } from "@/types/dashboard";
import { SidebarFilterItem } from "@/types/conversion";
import { DropdownOption } from "@/types/shared";
import { ConversionStatus, MenuItemVariant, SiteAction, SiteFilter } from "@/utils/enum";

export const conversionStatusLabels: Record<ConversionStatus, string> = {
  [ConversionStatus.Queued]: "Waiting for a free slot…",
  [ConversionStatus.Capturing]: "Capturing every page, breakpoint and asset…",
  [ConversionStatus.Storing]: "Saving your Next.js project…",
  [ConversionStatus.Ready]: "Done. Opening your preview…",
  [ConversionStatus.Failed]: "Conversion failed",
};

export const conversionDurationHint = "This usually takes about a minute.";

export const siteActionItems: ActionMenuItem[] = [
  { label: "Preview", value: SiteAction.Preview },
  { label: "Deploy", value: SiteAction.Deploy },
  { label: "Delete", value: SiteAction.Delete, variant: MenuItemVariant.Danger },
];

export const sidebarFilterItems: SidebarFilterItem[] = [
  { label: "Convert site", value: SiteFilter.All, count: "all" },
  { label: "Deployed", value: SiteFilter.Deployed, count: "deployed" },
  { label: "Not deployed", value: SiteFilter.NotDeployed, count: "notDeployed" },
];

export const siteFilterOptions: DropdownOption[] = [
  { label: "All sites", value: SiteFilter.All },
  { label: "Deployed", value: SiteFilter.Deployed },
  { label: "Not deployed", value: SiteFilter.NotDeployed },
];

export const conversionListContent = {
  empty: "No conversions yet. Click New convert to turn your first Framer site into Next.js.",
  noMatches: "No sites match your search.",
  noDeployed: "No deployed sites yet.",
  noUndeployed: "Every site is deployed.",
  loading: "Loading your sites…",
  loadMore: "Load more",
  framework: "Next.js",
};

export const profileContent = {
  logout: "Logout",
  loading: "Loading your profile…",
};

export const logoutContent = {
  title: "Log out?",
  description: "You'll need to sign in again to see your sites.",
  confirm: "Log out",
  cancel: "Cancel",
};

export const deleteConversionContent = {
  title: "Delete this conversion?",
  description: "Its preview and its code will be deleted. This can't be undone.",
  confirm: "Delete",
  cancel: "Cancel",
};
