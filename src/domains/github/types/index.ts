// github domain — types

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  visibility: string;
};

export type GitHubInstallationRepositoriesResponse = {
  total_count: number;
  repositories: GitHubRepository[];
};

export type GitHubInstallation = {
  id: number;
  account: {
    login: string;
    type: string;
  };
};

export type GitHubAccessTokenResponse = {
  token: string;
  expires_at: string;
};

export type GitHubWebhookRepository = {
  id: number;
  name: string;
  full_name: string;
  default_branch?: string;
  private: boolean;
  visibility?: string;
};

export type GitHubInstallationRepositoriesEvent = {
  action: "added" | "removed";
  installation: {
    id: number;
  };
  repositories_added: GitHubWebhookRepository[];
  repositories_removed: GitHubWebhookRepository[];
};

export type GitHubInstallationEvent = {
  action: "deleted" | "created" | "suspend" | "unsuspend" | "new_permissions_accepted";
  installation: {
    id: number;
  };
};

export type GitHubPullRequestWebhookPayload = {
  action: "opened" | "closed" | "synchronize" | "reopened" | "edited";
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
    html_url: string;
    user: {
      login: string;
    };
    head: {
      sha: string;
    };
  };
  repository: {
    id: number;
    full_name: string;
  };
};

export type GitHubPRFile = {
  filename: string;
  status: "added" | "modified" | "removed" | "renamed" | "copied" | "changed" | "unchanged";
  additions: number;
  deletions: number;
};

