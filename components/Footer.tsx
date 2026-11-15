// components/Footer.tsx — disclaimer footer (FR-UI-01; spec §6.1)
import { COPY } from "@/lib/copy";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface-raised mt-auto">
      <div className="max-w-content mx-auto px-4 md:px-8 py-4 text-sm text-text-muted text-center">
        {COPY["footer.disclaimer"]}
      </div>
    </footer>
  );
}
