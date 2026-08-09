export type WorkspaceType = 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple';

export interface WorkspaceDTO {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'COUPLE';
  description?: string;
  invitationCode?: string;
  inviteCode?: string;
  currency?: string;
  members?: WorkspaceMemberDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'OWNER' | 'PARTNER' | 'MEMBER';
}

export interface Workspace {
  id: WorkspaceType;
  name: string;
  description: string;
  avatarUrl?: string;
  partnerName?: string;
}
