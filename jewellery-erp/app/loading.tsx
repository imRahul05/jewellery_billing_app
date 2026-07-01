import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8"><div className="space-y-2"><Skeleton className="h-8 w-44" /><Skeleton className="h-4 w-64" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}</div><Skeleton className="h-52 rounded-xl" /></main>;
}
