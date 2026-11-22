import { LinkButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/States";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-3xl sm:text-4xl">Page not found</h1>
      <EmptyState
        title="There is nothing at this address"
        action={<LinkButton to="/">Go to Today</LinkButton>}
      >
        The link may be old, or the address may have a typo.
      </EmptyState>
    </div>
  );
}
