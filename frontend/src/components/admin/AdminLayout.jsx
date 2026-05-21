import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { AdminFooter } from "./AdminFooter";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

export function AdminLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <AdminHeader />
      <div className={styles.mobileBar}>
        <button
          aria-label="Open admin menu"
          className={styles.menuButton}
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <FiMenu aria-hidden="true" />
        </button>
        <span>Admin menu</span>
      </div>
      <div className={`${styles.body} ${sidebarCollapsed ? styles.collapsed : ""}`}>
        <AdminSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
        {mobileSidebarOpen ? (
          <button
            aria-label="Close admin menu"
            className={styles.mobileOverlay}
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
          />
        ) : null}
        <main className={styles.main}>{children}</main>
      </div>
      <AdminFooter />
    </div>
  );
}
