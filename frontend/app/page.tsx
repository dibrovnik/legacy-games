import News from '@/components/news/news';
import StoriesList from '@/components/stories/storiesList';
import { Divider } from '@heroui/react';

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-2 py-8 md:py-10">
      <StoriesList />
      <Divider className="my-4" />
      <News />
    </section>
  );
}
