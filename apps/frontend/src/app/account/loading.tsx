import { Skeleton } from '@dh-araria/ui/components';

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-6 py-8">
      <Skeleton variant="title" widthClassName="w-48" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className="rounded-xl border border-outline-variant p-4">
            <Skeleton variant="title" widthClassName="w-32" />
            <Skeleton variant="text" widthClassName="w-full" lines={2} className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
