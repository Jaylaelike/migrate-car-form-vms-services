import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export function formatDateThai(date: Date | string | number | null | undefined, formatStr: string = 'd MMM yyyy HH:mm'): string {
    if (!date) return '-';
    const d = new Date(date);
    // date-fns th locale uses Buddhist year automatically for some formats, 
    // but to be safe/standard we might rely on 'th' locale features.
    // Actually by default date-fns might output AD. 
    // To show Buddhist year (BE), we often need to manually adjust year or use a specific formatter.
    // But standard Thai often accepts AD in digital contexts, or we rely on 'th' locale to handle it.
    // Let's stick to standard locale output first.
    return format(d, formatStr, { locale: th });
}

export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
    }).format(amount);
}
