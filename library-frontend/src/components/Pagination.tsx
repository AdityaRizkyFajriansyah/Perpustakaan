import Button from "./Button";
import type { PaginationMeta } from "../types";

export default function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (p: number) => void }) {
  const { page, totalPages } = meta;

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end">
      <div className="text-xs muted">
        Page <span className="font-semibold">{page}</span> of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
