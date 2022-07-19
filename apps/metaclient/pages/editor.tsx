import dynamic from "next/dynamic";
import { Suspense } from "react";
import styles from "./index.module.css";
export function Editor() {
  const MapEditorWithNoSSR = dynamic(() => import("../components/MapEditorWrapper"), { ssr: false });
  return (
    <div className={styles.page}>
      <MapEditorWithNoSSR />
    </div>
  );
}

export default Editor;
