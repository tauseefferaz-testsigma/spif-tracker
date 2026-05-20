import { useState, useCallback } from "react";

export function useSnapshot() {
  const [snapshotVisible, setSnapshotVisible] = useState(false);
  const [snapshotData, setSnapshotData] = useState(null);

  const openSnapshot = useCallback(() => {
    setSnapshotVisible(true);
  }, []);

  const closeSnapshot = useCallback(() => {
    setSnapshotVisible(false);
  }, []);

  const handleSnapshotGenerated = useCallback((data) => {
    setSnapshotData(data);
  }, []);

  return {
    snapshotVisible,
    snapshotData,
    openSnapshot,
    closeSnapshot,
    handleSnapshotGenerated,
  };
}
