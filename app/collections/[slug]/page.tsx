'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useTaskContext } from '@/context/TaskContext';
import { TaskList } from '@/components/task/TaskList';
import { Button } from '@/components/ui/Button';

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { state, getCollection } = useTaskContext();

  const collection = getCollection(slug);
  const taskCount = state.tasks.filter((t) => t.collection === slug).length;

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Collection not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/collections')}>
          <ArrowLeft className="h-4 w-4" /> Back to collections
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600"
      >
        <Link href="/collections" className="hover:text-gray-600 dark:hover:text-gray-300">
          Collections
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700 dark:text-gray-300">{collection.name}</span>
      </nav>

      {/* Collection header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{collection.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {taskCount} task{taskCount !== 1 ? 's' : ''} in this collection
        </p>
      </div>

      <Suspense>
        <TaskList lockedCollection={slug} />
      </Suspense>
    </div>
  );
}
