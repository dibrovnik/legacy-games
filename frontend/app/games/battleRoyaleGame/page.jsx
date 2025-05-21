// src/app/battleroyal/page.jsx
'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Progress,
  Spacer,
  useDisclosure,
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const NAMESPACE = '/br';

const DEFAULT_GRID_SIZE = 10; // This means 10x10 = 100 numbers
const DEFAULT_TOTAL_NUMBERS = DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE;
const DEFAULT_ROUND_TIME = 10000; // 10 seconds
const RECONNECT_DELAY_MS = 3000;
const MAX_SELECTIONS = 6; // Максимальное количество чисел для выбора

export default function BattleRoyalGame() {
  const { data: session, status: sessionStatus } = useSession();
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]); // Массив для хранения выбранных чисел (с порядком и повторами)
  const [currentSelectedNumber, setCurrentSelectedNumber] = useState(null); // Число, выбранное на текущем этапе
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isWaitingForGameStart, setIsWaitingForGameStart] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const reconnectTimeoutRef = useRef(null);

  // Effect 1: Determine userId and control connection attempts
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setUserId(null);
      setIsLoadingGame(true);
      return;
    }

    if (sessionStatus === 'authenticated' && session?.user?.id) {
      const newUserId = parseInt(session.user.id, 10);
      if (userId !== newUserId) {
        setUserId(newUserId);
      }
    } else {
      setUserId(null);
      setIsLoadingGame(false);
      setGameState(null);
      setSelectedNumbers([]);
      setCurrentSelectedNumber(null); // Reset current selected number
      if (socket && socket.connected) {
        socket.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      console.warn('User is not authenticated or session.user.id is missing. Cannot load game.');
    }
  }, [session, sessionStatus, userId, socket]);

  // Effect 2: WebSocket connection logic
  useEffect(() => {
    if (!userId) {
      console.log('WebSocket connection skipped: userId not available.');
      setIsLoadingGame(false);
      return;
    }

    if (socket && socket.connected && isConnected) {
      return;
    }

    if (socket && !socket.connected && isConnected) {
      return;
    }

    console.log(
      `Attempting to connect to WS server at ${BACKEND_URL}${NAMESPACE} for user ${userId}`,
    );
    setIsLoadingGame(true);

    const newSocket = io(`${BACKEND_URL}${NAMESPACE}`);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Battle Royale WS server. Socket ID:', newSocket.id);
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      newSocket.emit('joinRoom', { userId });
    });

    newSocket.on('state', (state) => {
      console.log('Received game state:', state); // Log for debugging
      setGameState(state);
      setIsLoadingGame(false);

      // --- Отладочные логи для isEligibleToSelect ---
      console.log('--- Debugging isEligibleToSelect (inside onState) ---');
      console.log('state.isGameActive:', state.isGameActive);
      console.log('state.isGameOver:', state.isGameOver);
      console.log('state.userTicket:', state.userTicket);
      console.log(
        'Calculated isEligibleToSelect:',
        !state.isGameActive && !state.isGameOver && !state.userTicket,
      );
      console.log('------------------------------------');
      // --- Конец отладочных логов ---

      if (state.userTicket && state.userTicket.selectedNumbers) {
        setSelectedNumbers(state.userTicket.selectedNumbers);
        setCurrentSelectedNumber(null);
      } else if (state.phase === 0 && !state.isGameActive && !state.isGameOver) {
        setSelectedNumbers([]);
        setCurrentSelectedNumber(null);
      }

      const isInitialPhase = state.phase === 0;
      const isFullTimeLeft = state.timeLeft >= (state.roundTimeMs || DEFAULT_ROUND_TIME) - 1000;
      setIsWaitingForGameStart(
        isInitialPhase && isFullTimeLeft && !state.isGameOver && !state.isGameActive,
      );
    });

    newSocket.on('exception', (error) => {
      console.error('WS Exception:', error);
      setIsLoadingGame(false);
      setIsWaitingForGameStart(false);
      setIsConnected(false);
      setGameState(null);
      setSelectedNumbers([]);
      setCurrentSelectedNumber(null);
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
      setSocket(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`Disconnected from Battle Royale WS server. Reason: ${reason}`);
      setIsConnected(false);
      setGameState(null);
      setIsWaitingForGameStart(false);
      setSelectedNumbers([]);
      setCurrentSelectedNumber(null);

      if (userId && reason !== 'io client disconnect') {
        console.log(`Attempting reconnect in ${RECONNECT_DELAY_MS / 1000} seconds...`);
        setIsLoadingGame(true);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          setSocket(null);
        }, RECONNECT_DELAY_MS);
      } else {
        setIsLoadingGame(false);
      }
    });

    return () => {
      console.log('Cleaning up WebSocket connection.');
      newSocket.off('connect');
      newSocket.off('state');
      newSocket.off('exception');
      newSocket.off('disconnect');
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  // Effect 3: Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        console.log('Component unmounting, disconnecting socket.');
        socket.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [socket]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleNumberClick = useCallback(
    (number) => {
      // Клик по числу разрешен только если isEligibleToSelect
      if (
        !socket ||
        !userId ||
        !gameState ||
        !(!gameState.isGameActive && !gameState.isGameOver && !gameState.userTicket)
      ) {
        console.log('Cannot select number: Not eligible for selection due to game state.');
        return;
      }
      if (gameState.eliminatedNumbers && gameState.eliminatedNumbers.includes(number)) {
        console.log(`Number ${number} is already eliminated.`);
        return;
      }
      setCurrentSelectedNumber(number);
    },
    [socket, userId, gameState],
  );

  const handleNextStage = useCallback(() => {
    if (currentSelectedNumber === null) {
      alert('Пожалуйста, выберите число для текущего этапа.');
      return;
    }
    if (selectedNumbers.length < MAX_SELECTIONS) {
      setSelectedNumbers((prev) => [...prev, currentSelectedNumber]);
      setCurrentSelectedNumber(null);
    }
  }, [currentSelectedNumber, selectedNumbers]);

  const handleBuyTicket = useCallback(() => {
    // Проверка, что пользователь имеет право покупать билет
    if (
      !socket ||
      !userId ||
      !gameState ||
      gameState.isGameOver ||
      gameState.isGameActive ||
      gameState.userTicket
    ) {
      alert(
        'Невозможно купить билет: игра не готова, уже активна/завершена, или у вас уже есть билет.',
      );
      return;
    }
    // Проверка, что выбрано ровно MAX_SELECTIONS чисел
    if (selectedNumbers.length !== MAX_SELECTIONS) {
      alert(`Пожалуйста, выберите ровно ${MAX_SELECTIONS} чисел, прежде чем покупать билет.`);
      return;
    }

    socket.emit('buyTicket', {
      battleRoyalId: gameState.battleRoyalId,
      userId: userId,
      selectedNumbers: selectedNumbers,
    });
  }, [socket, userId, gameState, selectedNumbers]);

  // --- CONDITIONAL RENDERING ---
  if (sessionStatus === 'loading') {
    return (
      <div className="flex flex-col gap-4 items-center m-auto p-5 min-h-screen">
        <Card className="max-w-[800px] w-full p-5 text-center shadow-lg rounded-xl">
          <p className="text-xl font-bold text-gray-700">Загрузка сессии...</p>
        </Card>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated' || !userId) {
    return (
      <div className="flex flex-col gap-4 items-center m-auto p-5  min-h-screen">
        <Card className="max-w-[800px] w-full p-5 text-center shadow-lg rounded-xl">
          <p className="text-xl font-bold text-red-600">
            Пожалуйста, войдите, чтобы играть в Королевскую Лотерею.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoadingGame || !gameState || !isConnected) {
    return (
      <div className="flex flex-col gap-4 items-center m-auto p-5 min-h-screen">
        <Card className="max-w-[800px] w-full p-5 text-center shadow-lg rounded-xl">
          <p className="text-xl font-bold text-gray-700">Загрузка...</p>
          <p className="text-md text-gray-500 mt-2">Подключение к серверу...</p>
        </Card>
      </div>
    );
  }

  const {
    phase,
    eliminatedNumbers,
    timeLeft,
    isGameOver,
    totalPlayersLeft,
    battleRoyalId,
    roundTimeMs,
    isGameActive,
    userTicket,
    winningInfo,
    totalBank,
  } = gameState;

  const currentNumbers = Array.from(
    { length: gameState.gridSize * gameState.gridSize || DEFAULT_TOTAL_NUMBERS },
    (_, i) => i + 1,
  );

  const playerNumbers = userTicket?.selectedNumbers || [];
  const hasLost = userTicket && playerNumbers.every((num) => eliminatedNumbers.includes(num));
  const isEligibleToSelect = !isGameActive && !isGameOver && !userTicket;
  const gameIsOverAndNoWinner = isGameOver && (!winningInfo || winningInfo.userId === null);

  const formattedTotalBank =
    typeof totalBank === 'string' ? parseFloat(totalBank).toFixed(2) : (totalBank || 0).toFixed(2);
  const formattedWinningAmount = winningInfo?.amount
    ? typeof winningInfo.amount === 'string'
      ? parseFloat(winningInfo.amount).toFixed(2)
      : winningInfo.amount.toFixed(2)
    : '0.00';

  return (
    <div className="flex flex-col gap-4 items-center m-auto p-5 min-h-screen">
      <Card className="max-w-[800px] w-full shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-5 flex justify-between items-center flex-wrap gap-4">
          <div className="flex flex-col">
            <p className="text-lg font-bold">Королевская Лотерея</p>
            <p className="text-sm ">ID: {battleRoyalId || 'N/A'}</p>
            <p className="text-sm mt-1">
              Общий банк: <span className="font-semibold">{formattedTotalBank}₽</span>
            </p>
            {/* ДОБАВЛЕННЫЙ ЛОГ ДЛЯ ОТЛАДКИ isEligibleToSelect НА UI */}
            <p className="text-xs mt-1">Выбор доступен: {isEligibleToSelect ? 'Да' : 'Нет'}</p>
            {/* КОНЕЦ ЛОГА */}
          </div>
          <div className="flex flex-col items-center flex-grow max-w-sm min-w-[250px]">
            {/* Условный рендеринг основного статуса */}
            {!isWaitingForGameStart && isGameActive ? (
              <p className="text-xl font-bold text-yellow-600 text-center p-3  rounded-lg bg-yellow-50 w-full">
                Ожидание старта игры...
                {isEligibleToSelect && selectedNumbers.length < MAX_SELECTIONS && (
                  <span className="block text-base mt-2">
                    Пожалуйста, выберите числа и купите билет.
                  </span>
                )}
              </p>
            ) : (
              <>
                <Progress
                  className="w-full"
                  label={`Раунд ${phase + 1} (${Math.floor(timeLeft / 1000)} сек) - чисел осталось: ${totalPlayersLeft}`}
                  value={(selectedNumbers.length / MAX_SELECTIONS) * 100}
                  color={'success'}
                />
                <Spacer y={4} />

                {/* Логика отображения кнопок выбора/покупки */}
                {
                  isEligibleToSelect ? (
                    <>
                      {selectedNumbers.length < MAX_SELECTIONS ? (
                        <>
                          <p className="text-md text-gray-600 mt-2">
                            {`Выберите число ${selectedNumbers.length + 1} из ${MAX_SELECTIONS}`}
                          </p>
                          {selectedNumbers.length > 0 && (
                            <p className="text-lg font-bold text-gray-700 mt-2">
                              Выбрано:{' '}
                              <span className="text-purple-600">{selectedNumbers.join(', ')}</span>
                            </p>
                          )}
                          <Button
                            color="warning"
                            className="w-full mt-2"
                            onClick={handleNextStage}
                            isDisabled={currentSelectedNumber === null}
                          >
                            Следующий этап ({selectedNumbers.length + 1}/{MAX_SELECTIONS})
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-gray-700 mt-2">
                            Все 6 чисел выбраны:{' '}
                            <span className="text-purple-600">{selectedNumbers.join(', ')}</span>
                          </p>
                          <Button
                            color="primary"
                            className="w-full mt-2"
                            onClick={handleBuyTicket}
                            isDisabled={isGameActive || isGameOver} // Дополнительная проверка на всякий случай
                          >
                            {`Купить билет за ${MAX_SELECTIONS * 100}₽ (${MAX_SELECTIONS} чисел по $100)`}
                          </Button>
                        </>
                      )}
                    </>
                  ) : // Этот блок будет отображаться, если isEligibleToSelect === false
                  // И при этом игра не находится в "Ожидание старта игры" (этот блок выше)
                  userTicket ? (
                    <p className="text-lg font-bold text-gray-700 mt-2">
                      Ваши числа:{' '}
                      <span className="text-green-600">
                        {userTicket.selectedNumbers.join(', ')}
                      </span>
                    </p>
                  ) : isGameActive ? (
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      Игра активна. Дождитесь следующего раунда.
                    </p>
                  ) : isGameOver ? (
                    <p className="text-lg font-bold text-gray-600 mt-2">Игра завершена.</p>
                  ) : null // Если не одно из этих состояний, ничего не отображаем (или можно добавить "Неизвестное состояние")
                }

                {/* Сообщения о проигрыше/выигрыше */}
                {isGameOver && hasLost && (
                  <p className="text-lg font-bold text-red-600 mt-2">
                    Ваши числа были исключены! Вы проиграли.
                  </p>
                )}
                {isGameOver && winningInfo && winningInfo.userId === userId && (
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Поздравляем! Вы выиграли! Выигрыш: ${formattedWinningAmount} (
                    {winningInfo.percentage}%)
                  </p>
                )}
                {gameIsOverAndNoWinner && (
                  <p className="text-lg font-bold text-gray-600 mt-2">
                    Игра завершена. Победителей не найдено.
                  </p>
                )}
                {isGameOver &&
                  winningInfo &&
                  winningInfo.userId !== userId &&
                  winningInfo.userId !== null && (
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      Победитель: Пользователь ID {winningInfo.userId}. Выигрыш: $
                      {formattedWinningAmount} ({winningInfo.percentage}%)
                    </p>
                  )}
              </>
            )}
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-5">
          <p className="text-lg text-center text-gray-700 mb-4">Выберите число</p>
          <div className="grid grid-cols-10 gap-2 text-center">
            {currentNumbers.map((number) => {
              const isEliminated = eliminatedNumbers.includes(number);
              const isSelectedByTicket = userTicket?.selectedNumbers.includes(number);
              const isCurrentlySelectedForStage = currentSelectedNumber === number;

              let buttonColor = 'default';
              let isDisabled = isEliminated || !isEligibleToSelect; // isDisabled зависит от isEligibleToSelect
              let className = 'text-base font-bold';

              if (isEliminated) {
                buttonColor = 'danger';
                className += ' line-through opacity-70';
              } else if (userTicket) {
                // Если билет уже куплен, выделяем его числа зеленым
                if (isSelectedByTicket) {
                  buttonColor = 'success';
                }
                isDisabled = true; // И все кнопки чисел неактивны, так как выбор уже сделан
              } else if (isCurrentlySelectedForStage) {
                buttonColor = 'warning';
              }

              return (
                <Button
                  key={number}
                  color={buttonColor}
                  onClick={() => handleNumberClick(number)}
                  isDisabled={isDisabled}
                  isIconOnly
                  className={className}
                >
                  {number}
                </Button>
              );
            })}
          </div>
        </CardBody>
      </Card>
      <Button onPress={onOpen}>Правила Игры</Button>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        TODO: ПРАВИЛА ИГРЫ
        <DrawerContent className="p-4">
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">Правила игры</DrawerHeader>
              <DrawerBody>
                <p>
                Игра 2: Королевская лотерея (королевская битва в лотерее)
                </p>
                <p>
                Это захватывающая интерактивная игра на выбывание, где каждое число борется за выживание. Игроки выбирают числа, которые затем поэтапно отсеиваются. Главная изюминка: после каждого раунда выжившие игроки могут тактически менять свои числа!
                </p>
                <p>
                Это создает ощущение контроля и постоянной вовлеченности, превращая обычный розыгрыш в настоящую королевскую битву чисел.

                </p>
              </DrawerBody>
              <DrawerFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Закрыть
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
