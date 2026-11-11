import { ActionMenuItem } from "@/types/dashboard";
import { DropdownOption } from "@/types/shared";
import { MenuItemVariant, SiteAction, SiteFilter } from "@/utils/enum";

export const siteActionItems: ActionMenuItem[] = [
  { label: "Preview", value: SiteAction.Preview },
  { label: "Deploy", value: SiteAction.Deploy },
  { label: "Delete", value: SiteAction.Delete, variant: MenuItemVariant.Danger },
];

export const siteFilterOptions: DropdownOption[] = [
  { label: "All sites", value: SiteFilter.All },
  { label: "Deployed", value: SiteFilter.Deployed },
  { label: "Not deployed", value: SiteFilter.NotDeployed },
];
