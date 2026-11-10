import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import type { WorkspaceDTO } from '@/types';

const personal: WorkspaceDTO = { id: 'p-1', name: 'Personal', type: 'INDIVIDUAL', members: [] };
const couple = (members: { userEmail: string; role: 'OWNER' | 'PARTNER'; fullName?: string }[]): WorkspaceDTO => ({
  id: 'c-1',
  name: 'Pareja',
  type: 'COUPLE',
  ownerEmail: 'jorge@example.com',
  members: members.map((m, i) => ({ id: String(i), ...m })),
});

describe('useWorkspaceStore.setWorkspaces (partner link from the server)', () => {
  beforeEach(() => useWorkspaceStore.getState().resetWorkspaceState());

  it('derives the partner from the couple workspace members', () => {
    useWorkspaceStore.getState().setWorkspaces(
      [personal, couple([
        { userEmail: 'jorge@example.com', role: 'OWNER', fullName: 'Jorge Linares' },
        { userEmail: 'maria@example.com', role: 'PARTNER', fullName: 'María Pérez' },
      ])],
      'Jorge@Example.com'
    );
    const s = useWorkspaceStore.getState();
    expect(s.hasPartner).toBe(true);
    expect(s.partnerName).toBe('María Pérez');
    expect(s.partnerEmail).toBe('maria@example.com');
  });

  it('has no partner while the owner is still waiting for them', () => {
    useWorkspaceStore.getState().setWorkspaces(
      [personal, couple([{ userEmail: 'jorge@example.com', role: 'OWNER' }])],
      'jorge@example.com'
    );
    const s = useWorkspaceStore.getState();
    expect(s.hasPartner).toBe(false);
    expect(s.activeWorkspaceId).toBe('p-1');
  });

  it('clears the partner when the couple workspace disappears', () => {
    const store = useWorkspaceStore.getState();
    store.setWorkspaces([personal, couple([
      { userEmail: 'jorge@example.com', role: 'OWNER' },
      { userEmail: 'maria@example.com', role: 'PARTNER' },
    ])], 'jorge@example.com');
    store.setWorkspaces([personal], 'jorge@example.com');
    const s = useWorkspaceStore.getState();
    expect(s.hasPartner).toBe(false);
    expect(s.partnerEmail).toBeNull();
  });
});
