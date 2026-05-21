import { PublicHeader } from "../public/PublicHeader";
import { UserBottomNav } from "./UserBottomNav";
import styles from "./UserLayout.module.css";

export function UserLayout({ children }) {
  return (
    <div className={styles.layout}>
      <PublicHeader />
      <main className={styles.main}>{children}</main>
      <UserBottomNav />
    </div>
  );
}
