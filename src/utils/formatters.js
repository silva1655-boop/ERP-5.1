export const money = (value = 0, currency = 'CLP') => new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(Number(value || 0));
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'US';
export const cleanPayload = payload => Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
