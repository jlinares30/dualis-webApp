export type WorkspaceType = 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple';

export interface WorkspaceDTO {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'COUPLE';
  description?: string;
  invitationCode?: string;
  inviteCode?: string;
  currency?: string;
  ownerEmail?: string;
  members?: WorkspaceMemberDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  userEmail: string;
  role: 'OWNER' | 'PARTNER' | 'MEMBER';
  joinedAt?: string;
  userName?: string;
  /** Display name provided by the backend */
  fullName?: string | null;
  userId?: string;
}

export interface Workspace {
  id: WorkspaceType;
  name: string;
  description: string;
  avatarUrl?: string;
  partnerName?: string;
}
