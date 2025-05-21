'use client';

import { Button, Card, CardHeader, Input, Skeleton } from '@heroui/react';
import { Bomb, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL; // URL вашего NestJS бэкенда

function MinesweeperGame() {
  const { data: sessionData, status, update } = useSession();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.user) {
        setUser(sessionData?.user);
        setUserId(sessionData?.user.id);
        setFirstName(sessionData?.user.first_name);
        setLastName(sessionData?.user.last_name);
      }
    } else {
      setSession(null);
      setUser(null);
    }
  }, [sessionData]);
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    const updateRoomState = (roomData) => {
      if (roomData) {
        const openedCellsSet = Array.isArray(roomData.openedCells)
          ? new Set(roomData.openedCells)
          : new Set();
        setRoom({ ...roomData, openedCells: openedCellsSet });
      } else {
        setRoom(null);
      }
    };

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server with ID:', newSocket.id);
      newSocket.emit('getAvailableRooms');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server.');
      setMessage('Disconnected from server.');
      setRoom(null);
      setRoomId('');
      setSelectedCell(null);
      setAvailableRooms([]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection Error:', err.message);
      setMessage(`Connection error: ${err.message}. Please try again.`);
    });

    newSocket.on('error', (data) => {
      console.error('Server Error:', data.message);
      // setMessage(`Server Error: ${data.message}`);
    });

    newSocket.on('roomCreated', (roomData) => {
      updateRoomState(roomData);
      setRoomId(roomData.id);
      setMessage(`Room '${roomData.name}' created. Waiting for opponent...`);
      setAvailableRooms([]);
    });

    newSocket.on('playerJoined', (roomData) => {
      updateRoomState(roomData);
      const joinedPlayer = roomData.players.find((p) => p.userId !== userId);
      setMessage(
        `Player ${
          joinedPlayer ? `${joinedPlayer.firstName} ${joinedPlayer.lastName}` : 'Opponent'
        } joined room ${roomData.id}.`,
      );
    });

    newSocket.on('gameStarted', (roomData) => {
      updateRoomState(roomData);
      setMessage('Game started! Select a cell.');
      setSelectedCell(null);
    });

    newSocket.on('playerSelected', (data) => {
      if (data.playerId !== newSocket.id) {
        setMessage('Opponent has made a selection. Your turn to select!');
      }
    });

    // --- ИЗМЕНЕННАЯ ЛОГИКА ДЛЯ roundResult ---
    newSocket.on('roundResult', (data) => {
      const { room: newRoomState, result } = data;
      updateRoomState(newRoomState);
      setSelectedCell(null);

      let currentRoundMessage = '';
      const currentUser = newRoomState.players.find((p) => p.userId === userId);
      const opponentUser = newRoomState.players.find((p) => p.userId !== userId);

      if (result === 'user_wins') {
        currentRoundMessage = 'Вы выиграли этот раунд!';
      } else if (result === 'user_loses') {
        currentRoundMessage = 'Вы проиграли этот раунд!';
      } else if (result === 'both_lose') {
        currentRoundMessage = 'Оба проиграли этот раунд!';
      } else if (result === 'round_repeat') {
        currentRoundMessage = 'Никто не попал на мину. Новый раунд!';
      }

      if (newRoomState.status === 'finished') {
        let winnerName = '';
        if (result === 'user_wins') {
          winnerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'You';
          setMessage(`${winnerName} победил(а)! Игра окончена!`);
        } else if (result === 'user_loses') {
          winnerName = opponentUser
            ? `${opponentUser.firstName} ${opponentUser.lastName}`
            : 'Opponent';
          setMessage(`${winnerName} победил(а)! Игра окончена!`);
        } else if (result === 'both_lose') {
          setMessage(`Игра закончена! ${currentRoundMessage}`);
        }
      } else {
        setMessage(currentRoundMessage);
      }
    });
    // --- КОНЕЦ ИЗМЕНЕННОЙ ЛОГИКИ ДЛЯ roundResult ---

    newSocket.on('newRound', (roomData) => {
      updateRoomState(roomData);
      setMessage('New round started! Select a cell.');
      setSelectedCell(null);
    });

    // --- ИЗМЕНЕННАЯ ЛОГИКА ДЛЯ gameOver ---
    newSocket.on('gameOver', (roomData) => {
      updateRoomState(roomData);

      if (
        roomData.status === 'finished' &&
        !message.includes('wins the game') &&
        !message.includes('lose this round')
      ) {
      }
    });
    // --- КОНЕЦ ИЗМЕНЕННОЙ ЛОГИКИ ДЛЯ gameOver ---

    const handleAvailableRooms = (rooms) => {
      const filteredRooms = rooms.filter(
        (r) => r.players.length < 2 && !r.players.some((p) => p.isAI),
      );
      setAvailableRooms(filteredRooms);
      console.log('Available rooms received:', filteredRooms);
    };
    newSocket.on('availableRooms', handleAvailableRooms);

    return () => {
      newSocket.off('availableRooms', handleAvailableRooms);
      newSocket.disconnect();
    };
  }, [userId]); // Добавил `message` в зависимости, чтобы useEffect реагировал на его изменения

  useEffect(() => {
    if (!socket || room) return;

    const interval = setInterval(() => {
      socket.emit('getAvailableRooms');
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, room]);

  const handleCreateRoom = (playWithAI) => {
    if (socket && userId && firstName && lastName) {
      socket.emit('createRoom', { userId, firstName, lastName, playWithAI });
      update(session => {
        return {
          ...session,
          user: {
            ...session?.user,
            balance_bonus: (session?.user?.balance_bonus || 0) - 50
          }
        }
      })
    } else {
      setMessage('Please enter your First Name and Last Name to create a room.');
    }
  };

  useEffect(() => {
    if (roomId && socket) {
      socket.emit('joinRoom', { roomId, userId, firstName, lastName });
    }
  }, [roomId]);

  const handleJoinRoom = () => {
    if (socket && roomId && userId && firstName && lastName) {
      socket.emit('joinRoom', { roomId, userId, firstName, lastName });
    } else {
      setMessage('Please enter Room ID, First Name and Last Name to join a room.');
    }
  };

  const handleCellClick = (index) => {
    if (room?.openedCells.has(index)) {
      setMessage('This cell has already been opened.');
      return;
    }

    if (socket && room && room.status === 'in_game' && selectedCell === null) {
      setSelectedCell(index);
      socket.emit('selectCell', { roomId: room.id, cellIndex: index });
      setMessage(`You selected cell ${index}. Waiting for opponent's move...`);
    } else if (selectedCell !== null) {
      setMessage('You have already made your selection for this round. Please wait.');
    } else if (!room || room.status !== 'in_game') {
      setMessage('Game is not active. Please join or create a room.');
    }
  };

  const renderGameField = () => {
    if (!room || (room.status !== 'in_game' && room.status !== 'finished')) return null;

    const cells = Array(25).fill(null);

    return (
      <Card className="grid grid-cols-5 gap-1 mt-5 border border-gray-300 p-2 bg-gray-100 rounded-lg">
        {cells.map((_, index) => {
          const isOpened = room.openedCells.has(index);
          const isSelectedByMe = selectedCell === index;
          const isMine = room.mines.includes(index);

          let cellStyle = {};

          let cellContent = null;

          const isRoundResultRevealed =
            room.playerSelection !== null && room.opponentSelection !== null;
          const isGameOver = room.status === 'finished';

          if (isOpened) {
            cellStyle.cursor = 'not-allowed';
            cellStyle.pointerEvents = 'none';
            cellStyle.backgroundColor = '#e0e0e0';

            if (isMine) {
              cellStyle.backgroundColor = '#ffcccc';
              cellStyle.color = 'darkred';
              cellContent = <Bomb color="red" />;
            } else {
              cellContent = <Check color="green" />;
              cellStyle.backgroundColor = '#ddffdd';
            }
          }

          if (isRoundResultRevealed || isGameOver) {
            cellStyle.cursor = 'not-allowed';
            cellStyle.pointerEvents = 'none';

            const isUserSelectionAtThisCell = room.playerSelection === index;
            const isOpponentSelectionAtThisCell = room.opponentSelection === index;

            if (isUserSelectionAtThisCell || isOpponentSelectionAtThisCell) {
              if (isMine) {
                cellStyle.backgroundColor = '#ffcccc';
                cellStyle.color = 'darkred';
                cellContent = <Bomb color="red" />;
              } else {
                cellContent = <Check color="green" />;
                cellStyle.backgroundColor = '#ddffdd';
              }
            }

            if (isUserSelectionAtThisCell) {
              cellStyle.border = '3px solid #007bff';
              cellStyle.boxShadow = '0 0 5px rgba(0, 123, 255, 0.5)';
            }
            if (isOpponentSelectionAtThisCell) {
              cellStyle.border = '3px solid #28a745';
              cellStyle.boxShadow = '0 0 5px rgba(40, 167, 69, 0.5)';
            }
          }

          if (isSelectedByMe && !isRoundResultRevealed && !isOpened) {
            cellStyle.backgroundColor = '#cceeff';
            cellStyle.pointerEvents = 'none';
            cellStyle.cursor = 'not-allowed';
          }

          if (room.status !== 'in_game' || selectedCell !== null) {
            if (cellStyle.pointerEvents !== 'none') {
              cellStyle.cursor = 'not-allowed';
              cellStyle.pointerEvents = 'none';
            }
          }
          return (
            <div
              key={index}
              className="w-16 h-16 border border-gray-400 rounded-md flex items-center justify-center font-bold text-lg cursor-pointer bg-white transition duration-300 opacity-100"
              style={{
                ...cellStyle,
                transform: selectedCell === index ? 'rotateY(180deg)' : 'rotateZ(0deg)',
              }}
              onClick={() => handleCellClick(index)}
            >
              {cellContent}
            </div>
          );
        })}
      </Card>
    );
  };

  return (
    <>
      {!socket && (
        <Card className="p-4 w-full max-w-xl">
          {' '}
          <div className="flex w-full flex-col gap-4">
            {' '}
            <div className="flex gap-4 ">
              <Skeleton className="h-10 w-full rounded-lg" />{' '}
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />{' '}
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-8 w-full rounded-md" />
              ))}{' '}
            </div>{' '}
          </div>{' '}
        </Card>
      )}

      {socket && !room && (
        <Card className="flex flex-col gap-6 p-4 max-w-2xl">
          <div className="flex gap-3">
            <Button
              onPress={() => handleCreateRoom(false)}
              isDisabled={!firstName || !lastName}
              color="primary"
            >
              Создать комнату (Против Игрока)
            </Button>
            <Button
              onPress={() => handleCreateRoom(true)}
              isDisabled={!firstName || !lastName}
              color="secondary"
              variant="bordered"
            >
              Создать комнату (Против Ai)
            </Button>
          </div>

          <hr className="border-t border-gray-200 my-4" />

          <h3 className="mb-2 text-lg">Присоединиться к существующей комнате по ID</h3>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Введите ID комнаты"
              value={roomId}
              onValueChange={(val) => setRoomId(val)}
            />
            <Button
              onPress={handleJoinRoom}
              color="success"
              isDisabled={!roomId || !firstName || !lastName}
            >
              Войти
            </Button>
          </div>

          <hr className="border-t border-gray-200 my-4" />

          <h3>Доступные комнаты для присоединения</h3>
          {availableRooms.length === 0 ? (
            <p className="text-center text-gray-500">Нет доступных комнат. Создайте одну!</p>
          ) : (
            <ul className="divide-y divide-gray-200 gap-3">
              {availableRooms.map(
                (r) => (
                  console.log(r),
                  (
                    <li
                      key={r.id}
                      className="flex justify-between border px-2 rounded-[12px] items-center py-2"
                    >
                      <span>
                        Комната игрока:{' '}
                        <strong>
                          <br /> {r.name}
                        </strong>
                      </span>
                      <Button
                        onPress={() => {
                          setRoomId(r.id);
                        }}
                        isDisabled={
                          !firstName || !lastName || `${firstName} ${lastName}` === r.name
                        }
                        color="primary"
                      >
                        Присоединиться
                      </Button>
                    </li>
                  )
                ),
              )}
            </ul>
          )}
        </Card>
      )}

      {room && (
        <Card className="p-4 ">
          <CardHeader className="flex justify-center text-xl">
            Комната игрока {room.name}
          </CardHeader>
          <p className="text-center  mb-1">
            <strong>Статус комнаты: </strong>
            {room.status === 'in_game'
              ? 'В игре'
              : room.status === 'finished'
                ? 'Игра окончена'
                : 'Ожидание'}
          </p>
          <p className="text-center mb-4">
            <strong>Игроки</strong>:<br />
            {room.players.map((p, i) => (
              <span key={p.userId} className="block">
                {p.firstName} {p.lastName}
                {i < room.players.length - 1 && (
                  <>
                    <br /> vs
                    <br />
                  </>
                )}
              </span>
            ))}
          </p>

          {room.status === 'waiting' && (
            <p className="text-center animate-pulse ">Ожидание других игроков</p>
          )}
          {room.status === 'in_game' && (
            <p className="text-center text-blue-600 font-bold ">Выберите ячейку!</p>
          )}
          {room.status === 'finished' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-red-600 font-bold">{message}</p>
              <Button
                color="primary"
                onPress={() => {
                  // Сбрасываем комнату и состояние
                  setRoom(null);
                  setRoomId('');
                  setSelectedCell(null);
                  setMessage('');
                  // Сразу запрашиваем список доступных лобби
                  if (socket) socket.emit('getAvailableRooms');
                }}
              >
                Вернуться в лобби
              </Button>
            </div>
          )}

          {renderGameField()}
        </Card>
      )}
    </>
  );
}

export default MinesweeperGame;
