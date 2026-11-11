import { Conversion } from "@/types/conversion";

// Where a user can deploy: their personal account or one of their teams.
export interface VercelAccount {
  teamId: string | null;
  name: string;
  isPersonal: boolean;
}

// Returned by the Vercel integration endpoint.
export interface VercelConnection {
  // Null for a token scoped to one team.
  username: string | null;
  accounts: VercelAccount[];
}

export interface DeployButtonProps {
  conversion: Conversion | null;
  onDeployStarted: (conversion: Conversion) => void;
}

export interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversion: Conversion;
  onDeployStarted: (conversion: Conversion) => void;
}

export interface DeploymentBarProps {
  conversion: Conversion;
}
