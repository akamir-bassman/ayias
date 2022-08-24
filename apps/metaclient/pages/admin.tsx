import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "./index.module.css";
export function Admin() {
  const AdminWithNoSSR = dynamic(() => import("../components/AdminWrapper"), { ssr: false });
  return (
    <div className={styles.page}>
      <AdminWithNoSSR />
    </div>
  );
}

export default Admin;
