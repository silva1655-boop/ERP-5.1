import { EQUIPMENT_STATUS, PRIORITIES, REQUEST_STATUS, ROLES, WORK_ORDER_STATUS } from './constants';

export const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
export const isRequired = value => value !== undefined && value !== null && String(value).trim() !== '';
export const isValidDate = value => !value || !Number.isNaN(new Date(value).getTime());
export const isNumeric = value => value === '' || value === undefined || value === null || !Number.isNaN(Number(value));
export const isValidPriority = value => PRIORITIES.includes(value);
export const isValidRole = value => ROLES.includes(value);
export const isValidStatus = (value, type = 'workOrder') => {
  const catalog = type === 'equipment' ? EQUIPMENT_STATUS : type === 'request' ? REQUEST_STATUS : WORK_ORDER_STATUS;
  return catalog.includes(value);
};

export function validateRequiredFields(payload, fields) {
  return fields.reduce((errors, field) => {
    if (!isRequired(payload[field])) errors[field] = 'Campo obligatorio';
    return errors;
  }, {});
}

export function validateWorkOrder(payload) {
  const errors = validateRequiredFields(payload, ['title', 'equipmentId', 'priority', 'status']);
  if (!isValidPriority(payload.priority)) errors.priority = 'Prioridad inválida';
  if (!isValidStatus(payload.status, 'workOrder')) errors.status = 'Estado inválido';
  if (['programada', 'en_curso'].includes(payload.status) && !isRequired(payload.assignedToId || payload.assignedTo)) {
    errors.assignedToId = 'Debe asignar un técnico para este estado';
  }
  if (payload.status === 'programada' && !isRequired(payload.dueDate)) errors.dueDate = 'Debe definir fecha compromiso para programar';
  return errors;
}
