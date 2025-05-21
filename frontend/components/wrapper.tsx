import { clsx } from 'clsx';

export function Wrapper({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return <div className={clsx('wrapper', className)}>{children}</div>;
}

export function WrapperFull({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return <div className={clsx('wrapper-full', className)}>{children}</div>;
}
