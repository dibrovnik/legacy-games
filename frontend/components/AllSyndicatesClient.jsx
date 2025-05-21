'use client';

import { Input } from '@heroui/input';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { subtitle } from './primitives';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const STATUS_LABELS = {
  PENDING: 'Набор участников',
  WAITING_FOR_READY: 'В ожидании готовности',
  BUYING: 'Покупка билетов',
  PARTICIPATING: 'Участвует в розыгрыше',
  COMPLETED: 'Завершён',
  FAILED: 'Не состоялся',
};
export default function AllSyndicatesClient() {
  const [socket, setSocket] = useState(null);
  const [syndicates, setSyndicates] = useState([]);
  const [drawId, setDrawId] = useState(1);
  const [maxMembers, setMaxMembers] = useState(5);
  const [joinSyndicateId, setJoinSyndicateId] = useState('');
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [messages, setMessages] = useState([]); // Лог сообщений
  const messagesEndRef = useRef(null); // Для скролла лога
  const router = useRouter();

  const clickJoinSyndicateIdRef = useRef(null);

  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const handleJoinSyndicate = () => {
    if (socket && userId && joinSyndicateId) {
      addMessage(`Attempting to join syndicate ${joinSyndicateId} as user ${userId}...`);
      clickJoinSyndicateIdRef.current = parseInt(joinSyndicateId, 10);
      socket.emit('joinSyndicate', {
        syndicateId: parseInt(joinSyndicateId, 10),
        userId,
      });
    } else {
      addMessage('Socket not connected, User ID not set, or Syndicate ID is empty.');
    }
  };

  const handleJoinSyndicateCard = (syndicateId) => {
    if (socket && userId) {
      addMessage(`Attempting to join syndicate ${syndicateId} from card as user ${userId}...`);

      clickJoinSyndicateIdRef.current = syndicateId;
      console.log('setClickJoinSyndicateId', clickJoinSyndicateIdRef.current);

      socket.emit('joinSyndicate', { syndicateId, userId });
    } else {
      addMessage('Socket not connected or User ID not set.');
    }
  };

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      console.log('sessionData', sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user);
        setUserId(sessionData?.user.id);
        setFirstName(sessionData?.user.first_name);
        setLastName(sessionData?.user.last_name);
      }
    } else {
      setUser(null);
      setSession(null);
    }
  }, [sessionData]);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);
    const testRedirect = () => {
      console.log('Test redirect initiated.');
      router.push(`/games/syndicateGame/test-id-123`);
    };

    newSocket.on('connect', () => {
      addMessage('Connected to WebSocket server.');
      newSocket.emit('getAllSyndicates');
    });

    newSocket.on('disconnect', () => {
      addMessage('Disconnected from WebSocket server.');
    });

    newSocket.on('exception', (error) => {
      addMessage(`Error: ${error.message || 'Unknown error'}`);
      if (
        error?.message === 'Вы уже являетесь участником этого синдиката' &&
        clickJoinSyndicateIdRef.current // Используем ref здесь
      ) {
        router.push(`/games/syndicateGame/${clickJoinSyndicateIdRef.current}`);
        clickJoinSyndicateIdRef.current = null;
      }
    });

    newSocket.on('syndicateCreated', (syndicate) => {
      addMessage(`Syndicate created: ${syndicate.id}`);
      router.push(`/games/syndicateGame/${syndicate.id}`);
      clickJoinSyndicateIdRef.current = null; // Сброс при успешной навигации
    });

    newSocket.on('memberJoined', (syndicate) => {
      addMessage(
        `User joined syndicate ${syndicate.id}. Current members: ${syndicate.members.length}/${syndicate.maxMembers}`,
      );
      setSyndicates((prev) => prev.map((s) => (s.id === syndicate.id ? syndicate : s)));
      router.push(`/games/syndicateGame/${syndicate.id}`);
      clickJoinSyndicateIdRef.current = null; // Сброс при успешной навигации
    });

    newSocket.on('syndicateUpdated', (updatedSyndicate) => {
      addMessage(`Syndicate ${updatedSyndicate.id} updated. Status: ${updatedSyndicate.status}`);
      setSyndicates((prev) =>
        prev.map((s) => (s.id === updatedSyndicate.id ? updatedSyndicate : s)),
      );
    });

    newSocket.on('syndicatesUpdated', () => {
      addMessage('List of all syndicates updated. Requesting new list...');
      newSocket.emit('getAllSyndicates');
    });

    newSocket.on('allSyndicatesList', (data) => {
      addMessage(`Received ${data.length} available syndicates.`);
      console.log(data);
      setSyndicates(data);
    });

    newSocket.on('syndicateRemoved', (syndicateId) => {
      addMessage(`Syndicate ${syndicateId} removed.`);
      setSyndicates((prev) => prev.filter((s) => s.id !== syndicateId));
    });

    newSocket.on('inviteSent', (response) => {
      addMessage(`Invite sent: ${response.message}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId, router]); // Keep router in dependency array

  // Скролл лога сообщений вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg) => {
    setMessages((prevMessages) => [...prevMessages, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const handleCreateSyndicate = () => {
    if (socket && userId) {
      addMessage(
        `Attempting to create syndicate for draw ${drawId} with ${maxMembers} members as user ${userId}...`,
      );
      socket.emit('createSyndicate', { hostId: userId, drawId, maxMembers });
    } else {
      addMessage('Socket not connected or User ID not set.');
    }
  };
  const joined = syndicates.filter(
    (s) => s.host?.id === userId || s.members?.some((m) => m.user.id === userId),
  );
  const others = syndicates.filter((s) => !joined.includes(s));
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Левая колонка: Forms */}
      <div className="md:w-1/2 space-y-6">
        {/* Create Syndicate */}
        <Card className="p-4">
          <CardHeader className={subtitle()}>Создать новый синдикат</CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Номер тиража"
              labelPlacement="outside"
              type="number"
              id="drawId"
              value={drawId}
              placeholder="Введите номер тиража"
              onChange={({ target }) => setDrawId(Math.max(1, parseInt(target.value, 10)))}
              min={1}
              step={1}
            />

            <Input
              type="number"
              label="Макс. кол-во участников"
              labelPlacement="outside"
              id="maxMembers"
              value={maxMembers}
              onChange={({ target }) => setMaxMembers(Math.max(1, parseInt(target.value, 10)))}
              min={1}
              step={1}
            />

            <Button onPress={handleCreateSyndicate} color="primary">
              Создать синдикат
            </Button>
          </CardBody>
        </Card>

        {/* Join Syndicate */}
        <Card className="p-4">
          <CardHeader className={subtitle()}>Присоединиться по ID</CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input
              type="number"
              label="ID синдиката"
              labelPlacement="outside"
              id="joinSyndicateId"
              value={joinSyndicateId}
              onValueChange={(value) => setJoinSyndicateId(value)}
              placeholder="Введите ID синдиката"
            />
            <Button onPress={handleJoinSyndicate} color="success">
              Присоединиться к синдикату
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Правая колонка: Syndicates List & Messages */}
      <Card className="flex-1 p-4">
        {/* Live Syndicates */}

        <CardHeader className={subtitle()}>Доступные синдикаты</CardHeader>
        <CardBody className="flex flex-col gap-4">
          {joined.length === 0 && others.length === 0 && (
            <p className="text-gray-500 text-center">Нет синдикатов</p>
          )}
          {joined.map((syndicate) => (
            <Card key={syndicate.id} className="p-3 bg-[#27272a]">
              <CardHeader className={subtitle()}>Синдикат #{syndicate.id}</CardHeader>
              <CardBody className="flex flex-col gap-4">
                <div>
                  <p>
                    <strong>Создатель</strong>:{' '}
                    <span className="text-[#34C759]">
                      {syndicate.host?.first_name || 'N/A'}{' '}
                      {syndicate.host?.last_name || 'N/A'}{' '}
                    </span>
                    <span className="text-gray-500">( Вы )</span>{' '}
                  </p>
                  <p>
                    <strong>Тираж ID</strong>: {syndicate.draw?.id}
                  </p>
                  <p>
                    <strong>Участники</strong>: {syndicate.members?.length || 0} /{' '}
                    {syndicate.maxMembers}
                  </p>
                  <p>
                    <strong>Статус:</strong>{' '}
                    <span
                      className={`font-medium ${
                        syndicate.status === 'PENDING'
                          ? 'text-yellow-600 animate-pulse'
                          : syndicate.status === 'WAITING_FOR_READY'
                            ? 'text-blue-600'
                            : 'text-gray-800'
                      }`}
                    >
                      {STATUS_LABELS[syndicate.status] || syndicate.status}
                    </span>
                  </p>
                </div>
                <Button
                  onPress={() => {
                    handleJoinSyndicateCard(syndicate.id);
                  }}
                  color="primary"
                  variant="ghost"
                >
                  Перейти
                </Button>
              </CardBody>
            </Card>
          ))}

          {others.map((syndicate) => (
            <Card key={syndicate.id} className="p-3 bg-[#27272a]">
              <CardHeader className={subtitle()}>Синдикат #{syndicate.id}</CardHeader>
              <CardBody className="flex flex-col gap-4">
                <div>
                  <p>
                    Создатель: {syndicate.host?.first_name || 'N/A'}{' '}
                    {syndicate.host?.last_name || 'N/A'} (ID: {syndicate.host?.id})
                  </p>
                  <p>Тираж ID: {syndicate.draw?.id}</p>
                  <p>
                    Участники: {syndicate.members?.length || 0} / {syndicate.maxMembers}
                  </p>
                  <p>
                    Status:{' '}
                    <span
                      className={`font-medium ${
                        syndicate.status === 'PENDING'
                          ? 'text-yellow-600 animate-pulse'
                          : syndicate.status === 'WAITING_FOR_READY'
                            ? 'text-blue-600'
                            : 'text-gray-800'
                      }`}
                    >
                      {STATUS_LABELS[syndicate.status] || syndicate.status}
                    </span>
                  </p>
                </div>
                <Button
                  onPress={() => {
                    handleJoinSyndicateCard(syndicate.id);
                  }}
                  color="primary"
                >
                  Присоединиться
                </Button>
              </CardBody>
            </Card>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
