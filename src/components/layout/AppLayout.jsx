import { Sidebar } from "./Sidebar";
import { ToastContainer } from "../common/Toast";

export function AppLayout({ user, active, onNav, onLogout, onChangePassword, notifications, devBadge, online, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        user={user}
        active={active}
        onNav={onNav}
        onLogout={onLogout}
        onChangePassword={onChangePassword}
        notifications={notifications}
        devBadge={devBadge}
        online={online}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ToastContainer/>
    </div>
  );
}

export default AppLayout;
