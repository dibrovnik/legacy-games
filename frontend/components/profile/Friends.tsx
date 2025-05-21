import { fetchApi } from '@/features/functions/api';
import { IncomingFriendRequest } from '@/types/profile/profile';
import { User } from '@/types/user';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { addToast, Button } from '@heroui/react';
import { User as HeroUser } from '@heroui/user';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

export default function FriendsPage({
  friends: friendsData,
  requests: requestsData,
  onChangeData,
}: {
  friends: User[];
  requests: IncomingFriendRequest[];
  onChangeData: (friends: User[], requests: IncomingFriendRequest[]) => void;
}) {
  const { data: sessionData, status } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [friends, setFriends] = useState<User[]>(friendsData);
  const [requests, setRequests] = useState<IncomingFriendRequest[]>(requestsData);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Синхронизируем пропсы
  useEffect(() => {
    setFriends(friendsData);
    setRequests(requestsData);
  }, [friendsData, requestsData]);

  // Сессия
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      setUser(sessionData.user as User);
    } else {
      setSession(null);
      setUser(null);
    }
  }, [sessionData]);

  // Закрыть выпадашку при клике вне
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Поиск пользователей
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSelectedUserId(null);
      return;
    }
    setIsSearching(true);
    const handler = setTimeout(async () => {
      if (status !== 'authenticated' || !session) {
        setIsSearching(false);
        return;
      }
      try {
        const users = (await fetchApi(
          `/users?query=${encodeURIComponent(searchTerm)}`,
          { method: 'GET' },
          session.access_token,
        )) as User[];
        const filtered = users
          .filter((u) => u.id !== session.user.id)
          .filter((u) => !friends.some((f) => f.id === u.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, session, status, friends]);

  // Принять запрос
  async function acceptRequest(id: number) {
    if (status !== 'authenticated' || !session) return;
    try {
      const res = await fetchApi(`/friends/${id}/accept`, { method: 'POST' }, session.access_token);
      onChangeData(
        [...friends, res.requester],
        requests.filter((r) => r.requester.id !== id),
      );
    } catch (err) {
      console.error(err);
    }
  }

  // Отклонить запрос
  async function declineRequest(id: number) {
    if (status !== 'authenticated' || !session) return;
    try {
      await fetchApi(`/friends/${id}/decline`, { method: 'POST' }, session.access_token);
      setRequests(requests.filter((r) => r.requester.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // Удалить друга
  async function deleteFriend(id: number) {
    if (status !== 'authenticated' || !session) return;
    try {
      await fetchApi(`/friends/${id}`, { method: 'DELETE' }, session.access_token);
      setFriends(friends.filter((f) => f.id !== id));
      onChangeData(
        friends.filter((f) => f.id !== id),
        requests,
      );
    } catch (err) {
      console.error(err);
      addToast({ title: 'Ошибка удаления', variant: 'flat', color: 'danger' });
    }
  }

  // Отправить запрос в друзья
  async function sendFriendRequest() {
    if (status !== 'authenticated' || !session || selectedUserId == null) return;
    if (selectedUserId === user?.id) {
      addToast({ title: 'Нельзя добавить самого себя в друзья', variant: 'flat', color: 'danger' });
      return;
    }
    try {
      await fetchApi(
        '/friends',
        { method: 'POST', body: JSON.stringify({ recipientId: selectedUserId }) },
        session.access_token,
      );
      const incoming = (await fetchApi(
        '/friends/requests/incoming',
        { method: 'GET' },
        session.access_token,
      )) as IncomingFriendRequest[];
      onChangeData(friends, incoming);
      addToast({ title: 'Заявка отправлена', variant: 'flat', color: 'success' });
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUserId(null);
    } catch {
      addToast({ title: 'Ошибка отправки заявки', variant: 'flat', color: 'danger' });
    }
  }

  return (
    <div className="flex gap-4 w-full">
      {/* Поиск и список друзей */}
      <div className="flex flex-col gap-4 flex-grow">
        <Card className="p-4 w-full overflow-visible">
          <CardHeader className="gap-4">
            <div className="relative w-full">
              <Input
                value={searchTerm}
                onValueChange={(v) => {
                  setSearchTerm(v);
                  setSelectedUserId(null);
                }}
                placeholder="Начните вводить имя..."
              />
              {isSearching && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
                  …
                </div>
              )}
              {searchResults.length > 0 && (
                <ul
                  ref={dropdownRef}
                  className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto"
                >
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-100 focus:bg-blue-200 cursor-pointer text-sm ${selectedUserId === u.id ? 'bg-blue-50 font-semibold' : ''}`}
                        onClick={() => {
                          setSearchTerm(`${u.first_name} ${u.last_name}`);
                          setSelectedUserId(u.id);
                          setSearchResults([]);
                        }}
                      >
                        <span className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.first_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{u.first_name[0]}</span>
                          )}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-black">
                            {u.first_name} {u.last_name}
                          </span>
                          <span className="text-xs text-gray-500">{u.email}</span>
                        </div>
                        {selectedUserId === u.id && (
                          <span className="ml-auto text-blue-500 font-bold">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button onPress={sendFriendRequest} disabled={!selectedUserId}>
              Добавить
            </Button>
          </CardHeader>
        </Card>

        <Card className="p-4 w-full">
          <CardHeader>Список друзей</CardHeader>
          <CardBody className="flex flex-col gap-4">
            {friends.length === 0 && (
              <div className="text-center text-gray-300">Ваш список друзей пока пуст</div>
            )}
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between">
                <HeroUser
                  avatarProps={{ src: friend.avatar || undefined }}
                  description={friend.email}
                  name={`${friend.first_name} ${friend.last_name}`}
                />
                <Button
                  variant="bordered"
                  onPress={() => deleteFriend(friend.id)}
                  color="danger"
                  size="sm"
                >
                  Удалить
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Запросы в друзья */}
      <Card className="p-4 w-1/2">
        <CardHeader>Запросы в друзья</CardHeader>
        <CardBody className="flex flex-col gap-4">
          {requests.length === 0 && (
            <div className="text-center text-gray-300">Нет запросов в друзья</div>
          )}
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between">
              <HeroUser
                avatarProps={{ src: req.requester.avatar || undefined }}
                description={req.requester.email}
                name={`${req.requester.first_name} ${req.requester.last_name}`}
              />
              <div className="flex gap-2">
                <Button
                  onPress={() => acceptRequest(req.requester.id)}
                  size="sm"
                  variant="bordered"
                  color="success"
                >
                  Принять
                </Button>
                <Button onPress={() => declineRequest(req.requester.id)} size="sm" color="danger">
                  Отменить
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
