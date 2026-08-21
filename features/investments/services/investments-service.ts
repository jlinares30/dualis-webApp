import { apiFetch } from '@/lib/api';
import { getAccounts, createAccount, deleteAccount } from '@/features/accounts/services/accounts-service';
import { InvestmentDTO, CreateInvestmentRequest, InvestmentType } from '../types/investments';

export type { InvestmentDTO, CreateInvestmentRequest, InvestmentType };

export async function getInvestments(workspaceId?: string): Promise<InvestmentDTO[]> {
  if (!workspaceId) return [];
  const accounts = await getAccounts(workspaceId);
  const investmentAccounts = accounts.filter((a) => a.type === 'INVESTMENT' || a.type === 'investment' || a.type === 'MUTUAL_FUNDS');

  return investmentAccounts.map((acc) => {
    const parts = (acc.description || '').split('|');
    const inst = parts[0]?.trim() || 'Entidad Financiera';
    const typeStr = parts[1]?.trim() || 'MUTUAL_FUNDS';

    return {
      id: acc.id,
      name: acc.name,
      type: (typeStr as any) || 'MUTUAL_FUNDS',
      institution: inst,
      initialCapital: acc.balance,
      currentValue: acc.balance,
      returnsAmount: 0,
      returnsPercentage: 0,
      currency: acc.currency || 'PEN',
      workspaceId: acc.workspaceId,
    };
  });
}

export async function createInvestment(data: CreateInvestmentRequest): Promise<InvestmentDTO> {
  const capital = data.currentValue ?? data.initialCapital ?? 0;
  const createdAcc = await createAccount({
    workspaceId: data.workspaceId!,
    name: data.name,
    type: 'INVESTMENT',
    balance: capital,
    currency: data.currency || 'PEN',
    description: `${data.institution} | ${data.type}`,
  });

  return {
    id: createdAcc.id,
    name: createdAcc.name,
    type: (data.type as any) || 'MUTUAL_FUNDS',
    institution: data.institution,
    initialCapital: data.initialCapital,
    currentValue: capital,
    returnsAmount: capital - data.initialCapital,
    returnsPercentage: data.initialCapital > 0 ? ((capital - data.initialCapital) / data.initialCapital) * 100 : 0,
    currency: createdAcc.currency || 'PEN',
    workspaceId: createdAcc.workspaceId,
  };
}

export async function deleteInvestment(id: string): Promise<void> {
  return deleteAccount(id);
}
