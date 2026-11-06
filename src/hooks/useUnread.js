import { useEffect, useState } from "react";
import { watchNotifications } from "../services/notifications";

export function useUnread(uid) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) return;
    return watchNotifications(uid, (list) => setCount(list.filter((n) => !n.read).length), (error) => console.error("Notification listener failed", error));
  }, [uid]);

  return uid ? count : 0;
}