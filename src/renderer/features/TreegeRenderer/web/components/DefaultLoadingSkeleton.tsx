import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Default loading skeleton displayed by `TreegeRenderer` while `isLoading` is
 * true. Mimics the visual structure of a step (title, a few fields and the
 * navigation buttons) so the layout doesn't shift once the real form renders.
 */
const DefaultLoadingSkeleton = () => (
  <section className="tg:rounded-lg tg:border tg:p-4" aria-busy="true" aria-live="polite">
    {/* Step title */}
    <Skeleton className="tg:mb-6 tg:h-6 tg:w-1/3" />

    {/* Fields */}
    <div className="tg:space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="tg:space-y-2">
          <Skeleton className="tg:h-4 tg:w-1/4" />
          <Skeleton className="tg:h-10 tg:w-full" />
        </div>
      ))}
    </div>

    {/* Navigation button (continue/submit only) */}
    <div className="tg:mt-6 tg:flex tg:items-center tg:justify-end">
      <Skeleton className="tg:h-10 tg:w-24" />
    </div>
  </section>
);

export default DefaultLoadingSkeleton;
