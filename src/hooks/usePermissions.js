import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { can, canAny, canAll } from "../utils/permissions";

export function usePermissions() {
  const { user } = useContext(AuthContext);
  const role = user?.role || "";
  return {
    can: (permission) => can(role, permission),
    canAny: (permissions) => canAny(role, permissions),
    canAll: (permissions) => canAll(role, permissions),
    role,
  };
}
