import { title } from '@/components/primitives';
import Ticket from '@/components/ticket';
import { Wrapper } from '@/components/wrapper';

export default function Page() {
  return (
    <Wrapper className="flex flex-col gap-4 items-center">
      <h1 className={title()}>Сувенирные Билеты</h1>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(5)].map((_, i) => (
          <Ticket key={i} />
        ))}
      </div>
    </Wrapper>
  );
}
