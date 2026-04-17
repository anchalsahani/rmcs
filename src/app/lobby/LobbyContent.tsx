"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import socket, {
  clearStoredSession,
  connectSocket,
  ensureSessionId,
  getStoredSession,
  persistSession
} from "../../socket/socket";
import { Crown } from "lucide-react";
import { motion } from "framer-motion";

interface Player {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  isHost?: boolean;
  speaking?: boolean;
}

interface Room {
  roomId: string;
  state: string;
  players: Player[];
  totalRounds: number;
  currentRound: number;
}

export default function LobbyContent() {

  const params = useSearchParams();
  const router = useRouter();
  const roomId = params.get("room");

  const [players, setPlayers] = useState<Player[]>([]);
  const [myId, setMyId] = useState("");
  const [totalRounds, setTotalRounds] = useState<3 | 5>(5);

  const fallbackAvatar = "/default.png";

  useEffect(() => {

    const activeSocket = connectSocket();
    if (!activeSocket) return;

    const updateId = () => {
      if (!activeSocket.id) return;

      console.log("[lobby] socket id", activeSocket.id);
      setMyId(activeSocket.id);

      const stored = getStoredSession();
      if (stored?.roomId && stored.playerName) {
        persistSession({
          roomId: stored.roomId,
          playerName: stored.playerName,
          socketId: activeSocket.id,
          sessionId: ensureSessionId(stored.sessionId)
        });
      }
    };

    const handlePlayers = (room: Room) => {

      console.log("[lobby] room update", room);

      if (!room?.players) return;

      const cleanedPlayers = room.players.map((player) => ({
        ...player,
        speaking: false
      }));

      setPlayers(cleanedPlayers);
      setTotalRounds(room.totalRounds === 3 ? 3 : 5);

      const stored = getStoredSession();
      const me = room.players.find((player) => player.id === activeSocket.id);

      if (room.roomId && me?.name) {
        persistSession({
          roomId: room.roomId,
          playerName: me.name,
          socketId: activeSocket.id,
          sessionId: ensureSessionId(stored?.sessionId)
        });
      } else if (room.roomId && stored?.playerName) {
        persistSession({
          roomId: room.roomId,
          playerName: stored.playerName,
          socketId: activeSocket.id,
          sessionId: ensureSessionId(stored.sessionId)
        });
      }
    };

    const handleGameStart = ({ roomId: nextRoomId }: { roomId: string }) => {
      console.log("[lobby] navigating to game", nextRoomId);
      router.push(`/game?room=${nextRoomId}`);
    };

    updateId();

    activeSocket.on("connect", updateId);
    activeSocket.on("room_players", handlePlayers);
    activeSocket.on("game_started", handleGameStart);

    if (roomId) {
      console.log("[lobby] requesting room players", roomId);
      activeSocket.emit("get_room_players", { roomId });
    }

    return () => {
      activeSocket.off("connect", updateId);
      activeSocket.off("room_players", handlePlayers);
      activeSocket.off("game_started", handleGameStart);
    };

  }, [roomId, router]);

  const me = players.find(p => p.id === myId);
  const isHost = me?.isHost;

  const toggleReady = () => {
    if (!roomId) return;
    socket?.emit("player_ready", { roomId });
  };

  const startGame = () => {

    if (!roomId) return;

    const readyPlayers = players.filter(p => !p.isHost && p.ready);

    if (readyPlayers.length < 3) {
      alert("At least 3 players must be ready");
      return;
    }

    console.log("[lobby] start_game emit", { roomId, players });
    socket?.emit("start_game", { roomId, totalRounds });
  };

  const leaveRoom = () => {

    if (roomId) {
      socket?.emit("leave_room", { roomId });
    }

    clearStoredSession();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center
bg-[radial-gradient(circle_at_center,#ffd07c_0%,#ff9c2f_50%,#ff7a00_90%)]
relative overflow-x-hidden px-4">

      <div className="absolute top-4 bg-[#fff1d6] px-5 py-2 rounded-lg shadow text-sm sm:text-lg font-semibold">
        Room Code: {roomId}
      </div>

      <img
        src="/lobbytitle.png"
        alt="Lobby title"
        className="mt-10 w-[340px] sm:w-[500px]"
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-10 w-full max-w-5xl">

        {players.slice(0, 4).map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`relative bg-[#fff6e5] p-3 sm:p-4 rounded-xl shadow flex gap-3 items-center
transition-all duration-200
${player.isHost ? "ring-2 ring-yellow-300" : ""}
${player.speaking ? "ring-4 ring-green-400 scale-110 shadow-green-300 shadow-xl" : ""}`}
          >

            {player.isHost && (
              <Crown
                size={14}
                className="absolute -top-2 -left-2 text-yellow-500"
              />
            )}

            <img
              src={fallbackAvatar}
              alt={`${player.name} avatar`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
            />

            <div>
              <div className="font-semibold text-sm sm:text-base capitalize">
                {player.name}
              </div>

              <div className="text-xs sm:text-sm">
                {player.score} PTS
              </div>

              <div className={`text-[10px] sm:text-xs px-2 py-[2px] rounded-full mt-1 w-fit
${player.ready
? "bg-green-200 text-green-700"
: "bg-orange-200 text-orange-700"
}`}>
                {player.ready ? "Ready" : "Waiting"}
              </div>
            </div>
          </motion.div>
        ))}

      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-12 mb-10">

        {!isHost && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleReady}
            className="px-8 py-2 rounded-full bg-green-400
shadow-[2px_2px_0px_black]
hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
transition text-sm sm:text-base font-semibold"
          >
            {me?.ready ? "Unready" : "Ready"}
          </motion.button>
        )}

        {isHost && (
          <>
            <div className="flex items-center gap-2 rounded-full bg-[#fff1d6] px-3 py-2 shadow">
              {[3, 5].map((roundCount) => (
                <button
                  key={roundCount}
                  type="button"
                  onClick={() => setTotalRounds(roundCount as 3 | 5)}
                  className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                    totalRounds === roundCount
                      ? "bg-yellow-400 shadow-[2px_2px_0px_black]"
                      : "bg-white"
                  }`}
                >
                  {roundCount} Rounds
                </button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-10 py-2 rounded-full bg-yellow-400
shadow-[2px_2px_0px_black]
hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
transition text-sm sm:text-base font-semibold"
            >
              Start Game
            </motion.button>
          </>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={leaveRoom}
          className="px-8 py-2 rounded-full bg-red-500 text-white
shadow-[2px_2px_0px_black]
hover:shadow-none hover:translate-x-[2px]
hover:translate-y-[2px]
transition text-sm sm:text-base font-semibold"
        >
          Leave Room
        </motion.button>

      </div>

    </div>
  );
}
