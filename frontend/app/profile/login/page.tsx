import LoginCard from '@/components/login/loginCard';
import { Wrapper } from '@/components/wrapper';

export default function LoginPage() {
  return (
    <Wrapper className="flex flex-col items-center justify-center mt-[-4rem] flex-grow">
      <LoginCard state="login" />
    </Wrapper>
  );
}
