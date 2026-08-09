import { 
  Utensils, 
  Zap, 
  Tv, 
  Home, 
  Car, 
  ShoppingBag, 
  HeartPulse, 
  ArrowDownLeft, 
  Receipt,
  LucideIcon
} from 'lucide-react';

export interface CategoryIconStyle {
  Icon: LucideIcon;
  badgeClass: string;
  colorClass: string;
}

export function getTransactionIconAndStyle(type: 'income' | 'expense' | string, categoryName?: string, description?: string): CategoryIconStyle {
  if (type === 'income' || type === 'INCOME') {
    return {
      Icon: ArrowDownLeft,
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      colorClass: 'text-emerald-400',
    };
  }

  const text = `${categoryName || ''} ${description || ''}`.toLowerCase();

  if (text.includes('aliment') || text.includes('comida') || text.includes('super') || text.includes('restauran') || text.includes('food') || text.includes('mercado') || text.includes('pan')) {
    return { Icon: Utensils, badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20', colorClass: 'text-amber-400' };
  }
  if (text.includes('luz') || text.includes('agua') || text.includes('servicio') || text.includes('utilit') || text.includes('gas') || text.includes('internet') || text.includes('telefono')) {
    return { Icon: Zap, badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', colorClass: 'text-yellow-400' };
  }
  if (text.includes('cine') || text.includes('netfl') || text.includes('spoti') || text.includes('entreten') || text.includes('entertai') || text.includes('juego') || text.includes('tv')) {
    return { Icon: Tv, badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20', colorClass: 'text-purple-400' };
  }
  if (text.includes('casa') || text.includes('alquiler') || text.includes('hogar') || text.includes('hous') || text.includes('depa')) {
    return { Icon: Home, badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20', colorClass: 'text-blue-400' };
  }
  if (text.includes('transpor') || text.includes('car') || text.includes('uber') || text.includes('taxi') || text.includes('gasolin') || text.includes('auto') || text.includes('movilidad')) {
    return { Icon: Car, badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', colorClass: 'text-cyan-400' };
  }
  if (text.includes('salud') || text.includes('farmac') || text.includes('medic') || text.includes('doctor') || text.includes('health') || text.includes('clinica')) {
    return { Icon: HeartPulse, badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20', colorClass: 'text-rose-400' };
  }
  if (text.includes('compra') || text.includes('shopp') || text.includes('ropa') || text.includes('tienda') || text.includes('mall')) {
    return { Icon: ShoppingBag, badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20', colorClass: 'text-pink-400' };
  }

  return { Icon: Receipt, badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', colorClass: 'text-indigo-400' };
}
