export const PERMISSIONS = {
  supervisor: [
    "dashboard.view","workorders.view","workorders.manage","workorders.create","workorders.approve",
    "equipment.view","equipment.manage","plans.view","plans.manage","indicators.view",
    "requests.view","requests.manage","requests.approve","checklist.view",
    "deviations.view","deviations.manage","reports.view","users.view","users.manage",
    "notifications.view"
  ],
  mecanico: [
    "dashboard.view","workorders.view","workorders.updateAssigned","equipment.view",
    "deviations.view","deviations.create","reports.view","notifications.view"
  ],
  operaciones: [
    "dashboard.view","requests.view","requests.create","requests.process",
    "checklist.view","plans.view","notifications.view"
  ],
  operador: [
    "dashboard.view","checklist.view","checklist.create","notifications.view"
  ],
};

export function can(userRole, permission) {
  const perms = PERMISSIONS[userRole] || [];
  return perms.includes("*") || perms.includes(permission);
}

export function canAny(userRole, permissions) {
  return permissions.some(p => can(userRole, p));
}

export function canAll(userRole, permissions) {
  return permissions.every(p => can(userRole, p));
}
