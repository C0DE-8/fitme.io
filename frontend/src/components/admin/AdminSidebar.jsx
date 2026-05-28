import { NavLink } from "react-router-dom";
import {
  FiBarChart2,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiGrid,
  FiMessageSquare,
  FiPackage,
  FiUserCheck,
  FiX,
  FiUsers,
} from "react-icons/fi";
import { AdminSoundToggle } from "./AdminSoundToggle";
import styles from "./AdminSidebar.module.css";

const fitmeIcon = "/favicon.png";

const links = [
  { to: "/admin", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/demo-users", label: "Demo Users", icon: FiUserCheck },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: FiCreditCard },
  { to: "/admin/plans", label: "Plans", icon: FiBarChart2 },
  { to: "/admin/accounts", label: "Accounts", icon: FiPackage },
  { to: "/admin/foods", label: "Foods", icon: FiBox },
  { to: "/admin/feed", label: "Food Feed", icon: FiMessageSquare },
];

export function AdminSidebar({ collapsed = false, mobileOpen = false, onCloseMobile, onToggle }) {
  const ToggleIcon = collapsed ? FiChevronRight : FiChevronLeft;

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}
    >
      <div className={styles.top}>
        <div className={styles.brandMark}>
          <img src={fitmeIcon} alt="" aria-hidden="true" />
        </div>
        <div className={styles.brandText}>
          <strong>fitme.io</strong>
          <span>Admin</span>
        </div>
        <button
          aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
          className={styles.toggle}
          type="button"
          onClick={onToggle}
        >
          <ToggleIcon aria-hidden="true" />
        </button>
        <button
          aria-label="Close admin menu"
          className={styles.mobileClose}
          type="button"
          onClick={onCloseMobile}
        >
          <FiX aria-hidden="true" />
        </button>
      </div>

      <AdminSoundToggle collapsed={collapsed} />
      <div className={styles.sectionLabel}>Manage</div>
      <nav className={styles.nav} aria-label="Admin sections">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              aria-label={link.label}
              className={({ isActive }) => (isActive ? styles.active : styles.link)}
              end={link.end}
              key={link.to}
              onClick={onCloseMobile}
              title={link.label}
              to={link.to}
            >
              <Icon aria-hidden="true" className={styles.icon} />
              <span className={styles.label}>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
