import { useEffect } from "react";
import { APP_NAME } from "../lib/constants";

// Sets the browser tab title, so each page has its own (important for screen readers and history).
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title === "" ? APP_NAME : `${title} - ${APP_NAME}`;
  }, [title]);
}
