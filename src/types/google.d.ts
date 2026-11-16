// The parts of Google Identity Services (accounts.google.com/gsi/client)
// the One Tap prompt uses.
export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}
