'use client';

import LotteryCard from '@/components/loteryCard';
import { subtitle, title } from '@/components/primitives';
import { Wrapper } from '@/components/wrapper';
import { fetchApi } from '@/features/functions/api';
import { Button, Card, CardHeader } from '@heroui/react';
import { CheckCircle2Icon, CheckCircleIcon, ClipboardCopyIcon, UsersIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STATUS_LABELS = {
  PENDING: 'Набор участников',
  WAITING_FOR_READY: 'В ожидании готовности',
  BUYING: 'Покупка билетов',
  PARTICIPATING: 'Участвует в розыгрыше',
  COMPLETED: 'Завершён',
  FAILED: 'Не состоялся',
};
export default function SyndicateDetailsPage() {
  const { id } = useParams();
  const syndicateId = parseInt(id, 10);

  const [socket, setSocket] = useState(null);
  const [syndicate, setSyndicate] = useState(null);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const [selectedNumbers, setSelectedNumbers] = useState('');
  const [ticketPrice, setTicketPrice] = useState(2);
  const [memberReady, setMemberReady] = useState(false);

  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user);
        setUserId(sessionData?.user.id);
      }
    } else {
      setUser(null);
      setSession(null);
    }
  }, [sessionData]);

  useEffect(() => {
    if (syndicate && userId) {
      const currentUserMember = syndicate.members?.find((m) => m.user.id === userId);
      setMemberReady(currentUserMember?.isReady || false);
    }
  }, [syndicate, userId]);

  useEffect(() => {
    if (!userId || isNaN(syndicateId)) return;

    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      addMessage('Connected to WebSocket server.');
      newSocket.emit('joinSyndicateRoom', syndicateId.toString());
      addMessage(`Joined syndicate room: ${syndicateId}`);
      newSocket.emit('getSyndicateDetails', syndicateId);
      addMessage(`Requested details for syndicate ${syndicateId}`);
    });

    newSocket.on('disconnect', () => {
      addMessage('Disconnected from WebSocket server.');
    });

    newSocket.on('exception', (error) => {
      console.log('error', error?.message);
      if (syndicateId && syndicate?.members?.find((m) => m.user.id === userId)) {
        console.log('Вы уже являетесь участником этого синдиката');
        router.push(`/games/syndicateGame/${syndicateId}`);
      }
      addMessage(`Error: ${error.message || 'Unknown error'}`);
      console.error('WebSocket Error:', error);
      if (error.status === 404) {
        addMessage('Syndicate not found, redirecting...');
        router.push('/syndicates');
      }
    });

    newSocket.on('syndicateDetails', (details) => {
      addMessage(`Received syndicate details for ${details.id}. Status: ${details.status}`);
      setSyndicate(details);
      if (details.status === 'COMPLETED' || details.status === 'FAILED') {
        addMessage(`Syndicate ${details.id} is ${details.status}`);
        // router.push('/syndicates'); // Optional: redirect to home after completion/failure
      }
    });

    newSocket.on('syndicateUpdated', (updatedSyndicate) => {
      addMessage(`Syndicate ${updatedSyndicate.id} updated. Status: ${updatedSyndicate.status}`);
      setSyndicate(updatedSyndicate);
    });

    newSocket.on('memberJoined', (updatedSyndicate) => {
      if (updatedSyndicate.id === syndicateId) {
        addMessage(`New member joined syndicate ${updatedSyndicate.id}.`);
        setSyndicate(updatedSyndicate);
      }
    });

    newSocket.on('syndicateReadyToProceed', (updatedSyndicate) => {
      if (updatedSyndicate.id === syndicateId) {
        addMessage(
          `Syndicate ${updatedSyndicate.id} is now full and ready to proceed (WAITING_FOR_READY).`,
        );
        setSyndicate(updatedSyndicate);
      }
    });

    newSocket.on('syndicateReadyForBuying', (updatedSyndicate) => {
      if (updatedSyndicate.id === syndicateId) {
        addMessage(`Syndicate ${updatedSyndicate.id} is now ready for buying (BUYING).`);
        setSyndicate(updatedSyndicate);
      }
    });

    newSocket.on('ticketsBought', (updatedSyndicate) => {
      if (updatedSyndicate.id === syndicateId) {
        addMessage(`Tickets bought for syndicate ${updatedSyndicate.id}.`);
        setSyndicate(updatedSyndicate);
      }
    });

    newSocket.on('syndicateStatusFinalized', (updatedSyndicate) => {
      if (updatedSyndicate.id === syndicateId) {
        addMessage(
          `Syndicate ${updatedSyndicate.id} status finalized to ${updatedSyndicate.status}.`,
        );
        setSyndicate(updatedSyndicate);
      }
    });

    return () => {
      if (newSocket) {
        newSocket.emit('leaveSyndicateRoom', syndicateId.toString());
        newSocket.disconnect();
      }
    };
  }, [syndicateId, userId, router]);

  // Скролл лога сообщений вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg) => {
    setMessages((prevMessages) => [...prevMessages, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const isHost = syndicate && Number(userId) === Number(syndicate.host.id);
  const isMember = syndicate && syndicate.members.some((m) => m.user.id === userId);
  const currentUserMember = syndicate?.members?.find((m) => m.user.id === userId);

  const handleMarkReady = () => {
    if (socket && syndicate && userId) {
      addMessage(`Attempting to mark syndicate ${syndicateId} as ready...`);
      socket.emit('markSyndicateReady', { syndicateId: syndicate.id, userId });
    } else {
      addMessage('Socket not connected, syndicate data missing, or User ID not set.');
    }
  };

  const handleSetSyndicateReady = async () => {
    await fetchApi(
      `/syndicates/${syndicate.id}/ready`,
      {
        method: 'POST',
      },
      session?.access_token,
    );
  };

  const handleCopySyndicateId = async () => {
    try {
      await navigator.clipboard.writeText(syndicate.id.toString());
      addMessage('Syndicate ID copied to clipboard!');
    } catch (err) {
      addMessage('Failed to copy syndicate ID.');
      console.error('Failed to copy:', err);
    }
  };

  const handleInviteUser = () => {
    const invitedUserId = prompt('Enter User ID to invite:');
    if (invitedUserId && socket && syndicate && userId) {
      addMessage(`Sending invite to user ${invitedUserId}...`);
      socket.emit('sendInvite', {
        syndicateId: syndicate.id,
        senderId: userId,
        receiverId: parseInt(invitedUserId, 10),
      });
    } else {
      addMessage('Invalid User ID or missing data for invite.');
    }
  };

  if (!syndicate) {
    return (
      <div className="container mx-auto p-4 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-6 animate-pulse">
          Loading Syndicate #{syndicateId}...
        </h1>
        <div className="bg-gray-800 text-green-400 p-4 rounded-lg shadow-lg h-64 overflow-y-auto text-sm font-mono w-full max-w-lg">
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  // Helper for status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'WAITING_FOR_READY':
        return 'bg-blue-100 text-blue-800';
      case 'BUYING':
        return 'bg-purple-100 text-purple-800';
      case 'PARTICIPATING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-teal-100 text-teal-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Wrapper className="flex flex-col gap-4">
      <h1 className={title()}>
        Синдикат <span className="text-indigo-600">#{syndicate.id}</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левый блок: Билеты и покупка */}
        <div className="flex col-span-2 flex-col gap-8">
          <Card className="lg:col-span-1 p-4">
            <CardHeader className={subtitle()}>Билеты синдиката</CardHeader>
            <LotteryCard syndicate={syndicate} userId={userId} />
          </Card>

          <Card className="p-4">
            <CardHeader>Билеты участников синдиката</CardHeader>
            {syndicate.tickets && syndicate.tickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syndicate.tickets.map((st) => (
                  <div
                    key={st.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <h4 className="font-semibold text-gray-700 mb-2">Билет #{st.ticket.id}</h4>
                    <p className="text-sm text-gray-600">
                      Покупатель:{' '}
                      <span className="font-medium">
                        {st.ticket.user?.firstName} (ID: {st.ticket.user?.id})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Выбранные числа:{' '}
                      <span className="font-bold text-lg text-indigo-700">
                        {st.ticket.selectedNumbers?.join(', ')}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Цена: <span className="font-medium">${st.ticket.price}</span>
                    </p>
                    {st.ticket.prize > 0 && (
                      <p className="text-base font-bold text-green-700 mt-2">
                        Prize: ${st.ticket.prize}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No tickets have been bought for this syndicate yet.
              </p>
            )}
          </Card>
        </div>
        {/* Правый блок: Информация о лобби, участники, действия */}
        <div className="lg:col-span-1 space-y-8">
          {/* Syndicate Info */}
          <Card className="p-4">
            <CardHeader className="flex justify-between">
              <div className="flex text-xl items-center">
                <UsersIcon className="h-6 w-6 text-indigo-500 mr-2" />
                <span>Информация о лобби</span>
              </div>
              {isHost && syndicate.status === 'PENDING' && (
                <Button
                  className="animate-pulse"
                  onPress={() => handleSetSyndicateReady()}
                  color="success"
                >
                  Готов
                </Button>
              )}
            </CardHeader>

            <p className="mb-3">
              <span className="font-medium "> ID Тиража:</span>{' '}
              <span className="font-semibold ">{syndicate.draw?.id}</span>
            </p>
            <p className="mb-3">
              <span className="font-medium ">Создатель:</span>{' '}
              <span className="font-semibold text-indigo-700">
                {syndicate.host?.first_name || 'N/A'} {syndicate.host?.first_name || 'N/A'}
              </span>
            </p>
            <p className="mb-3">
              <span className="font-medium">Members:</span>{' '}
              <span className="font-semibold ">
                {syndicate.members?.length || 0} / {syndicate.maxMembers}
              </span>
            </p>
            <div className="mb-4 flex items-center">
              <span className="font-medium mr-2">Статус синдиката:</span>{' '}
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(
                  syndicate.status,
                )}`}
              >
                {STATUS_LABELS[syndicate.status] ?? syndicate.status}
              </span>
            </div>

            <h3 className="text-xl font-semibold  mt-6 mb-3">Участники</h3>
            <ul className="list-none space-y-2">
              {syndicate.members?.map((member) => (
                <li key={member.id} className="flex items-center">
                  <span
                    className={`${member.user.id === userId ? 'font-bold text-indigo-700' : ''}`}
                  >
                    {member.user?.first_name || 'N/A'} {member.user?.first_name || 'N/A'}{' '}
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    Spent: ${member.amountSpent || '0'}
                  </span>
                  {member.isReady && (
                    <CheckCircle2Icon className="h-5 w-5 text-green-500 ml-2" title="Ready" />
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <h2 className="text-2xl font-bold mb-5">Действия</h2>
            <div className="space-y-4">
              <Button onPress={handleCopySyndicateId} color="default">
                <ClipboardCopyIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Copy Syndicate ID
              </Button>

              {isHost && syndicate.status === 'PENDING' && (
                <button
                  onClick={handleInviteUser}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {/* <ShareIcon className="-ml-1 mr-2 h-5 w-5" /> */}
                  Invite User
                </button>
              )}

              {isHost &&
                syndicate.status === 'WAITING_FOR_READY' &&
                syndicate.members.length === syndicate.maxMembers && (
                  <button
                    onClick={handleMarkReady}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                    Host: Mark Syndicate Ready for Buying
                  </button>
                )}

              {isMember && syndicate.status === 'WAITING_FOR_READY' && (
                <button
                  onClick={handleMarkReady} // Та же логика, но для пользователя
                  className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white ${
                    memberReady ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  disabled={memberReady}
                >
                  {memberReady ? (
                    <>
                      {/* <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" /> */}
                      You are Ready
                    </>
                  ) : (
                    <>
                      {/* <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" /> */}
                      Mark Yourself Ready
                    </>
                  )}
                </button>
              )}

              {syndicate.status === 'PARTICIPATING' && (
                <p className="text-green-700 font-bold text-center p-3 rounded-md bg-green-50 border border-green-200">
                  Syndicate is participating in the draw. Waiting for results!
                </p>
              )}
              {syndicate.status === 'COMPLETED' && (
                <p className="text-blue-700 font-bold text-center p-3 rounded-md bg-blue-50 border border-blue-200">
                  Syndicate results processed. Prizes distributed!
                </p>
              )}
              {syndicate.status === 'FAILED' && (
                <p className="text-red-700 font-bold text-center p-3 rounded-md bg-red-50 border border-red-200">
                  Syndicate failed. No tickets bought or issue occurred.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Wrapper>
  );
}
