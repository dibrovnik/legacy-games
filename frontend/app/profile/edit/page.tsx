'use client';
import { title } from '@/components/primitives';
import AvatarUpload from '@/components/profile/edit/AvatarUpload';
import DemoFeatures from '@/components/profile/edit/DemoFeatures';
import UpdateInformation from '@/components/profile/edit/UpdateInformation';
import FriendsPage from '@/components/profile/Friends';
import { Wrapper } from '@/components/wrapper';
import { fetchApi } from '@/features/functions/api';
import { IncomingFriendRequest } from '@/types/profile/profile';
import { Tab, Tabs } from '@heroui/react';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
export default function EditProfilePage() {
  const [session, setSession] = useState<Session | null>(null);

  const { data: sessionData, status, update } = useSession();

  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<IncomingFriendRequest[]>([]);

  const handleDataChange = (newFriends: any[], newRequests: IncomingFriendRequest[]) => {
    setFriends(newFriends);
    setRequests(newRequests);
  };

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      getFriends();
      getRequests();
    } else {
      setSession(null);
      setFriends([]);
      setRequests([]);
    }
  }, [sessionData]);

  async function getFriends() {
    if (session?.access_token) {
      const res = await fetchApi('/friends', { method: 'GET' }, session.access_token);
      setFriends(res);
      console.log('friends', res);
    }
  }

  async function getRequests() {
    if (session?.access_token) {
      const res = await fetchApi(
        '/friends/requests/incoming',
        { method: 'GET' },
        session.access_token,
      );
      setRequests(res);
    }
  }

  return (
    <Wrapper>
      <Tabs
        aria-label="Options"
        variant="underlined"
        size="lg"
        onSelectionChange={(tab) => {
          if (tab == 'friends') {
            getRequests();
            getFriends();
          }
        }}
      >
        <Tab key="profile" title="Профиль" className="flex flex-col gap-4">
          <h1 className={title()}>Профиль</h1>
          <div className="flex gap-4">
            <div className="flex-2">
              <AvatarUpload />
            </div>
            <UpdateInformation />
            <DemoFeatures />
          </div>
        </Tab>
        <Tab key="friends" title="Друзья" className="flex flex-col gap-4">
          <h1 className={title()}>Друзья</h1>
          <FriendsPage onChangeData={handleDataChange} friends={friends} requests={requests} />
        </Tab>
      </Tabs>
    </Wrapper>
  );
}
