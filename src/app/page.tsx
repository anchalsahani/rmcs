"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, ensureSessionId, getStoredSession, persistSession } from "../socket/socket";
import Image from "next/image";
import { Crown, KeyRound, Lightbulb } from "lucide-react";

interface Player {
  id: string;
  name: string;
}

interface Room {
  roomId: string;
  players?: Player[];
}

type EntryMode = "idle" | "create" | "join";

export default function Home() {

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [mode, setMode] = useState<EntryMode>("idle");

  const router = useRouter();

  useEffect(() => {

    const activeSocket = connectSocket();
    if (!activeSocket) return;

    const handleRoomUpdate = (room: Room) => {
      console.log("[home] room received", room);

      if (!room?.roomId) return;

      const me = room.players?.find((player) => player.id === activeSocket.id);
      if (me?.name) {
        persistSession({
          roomId: room.roomId,
          playerName: me.name,
          socketId: activeSocket.id,
          sessionId: ensureSessionId(getStoredSession()?.sessionId)
        });
      }

      router.push(`/lobby?room=${room.roomId}`);
    };

    const handleError = (message: string) => {
      console.error("[home] socket error", message);
      alert(message);
    };

    const handleConnect = () => {
      console.log("[home] connected", activeSocket.id);
    };

    activeSocket.on("room_players", handleRoomUpdate);
    activeSocket.on("error_message", handleError);
    activeSocket.on("connect", handleConnect);

    return () => {
      activeSocket.off("room_players", handleRoomUpdate);
      activeSocket.off("error_message", handleError);
      activeSocket.off("connect", handleConnect);
    };

  }, [router]);

  const createRoom = () => {

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    const activeSocket = connectSocket();
    if (!activeSocket) return;
    const sessionId = ensureSessionId(getStoredSession()?.sessionId);

    persistSession({
      roomId: "",
      playerName: name.trim(),
      socketId: activeSocket.id,
      sessionId
    });

    console.log("[home] creating room");

    activeSocket.emit("create_room", {
      playerName: name.trim(),
      sessionId
    });
  };


  const joinRoom = () => {

    if (!name.trim() || !roomCode.trim()) {
      alert("Enter name and room code");
      return;
    }

    const normalizedRoomId = roomCode.trim().toUpperCase();
    const activeSocket = connectSocket();
    if (!activeSocket) return;
    const sessionId = ensureSessionId(getStoredSession()?.sessionId);

    persistSession({
      roomId: normalizedRoomId,
      playerName: name.trim(),
      socketId: activeSocket.id,
      sessionId
    });

    console.log("[home] joining room", normalizedRoomId);

    activeSocket.emit("join_room", {
      playerName: name.trim(),
      roomId: normalizedRoomId,
      sessionId
    });
  };


  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden px-3 sm:px-0 relative
      bg-[radial-gradient(circle_at_center,#ffcf7a_0%,#ff9c2f_45%,#ff7a00_80%)]">

      <button
        type="button"
        onClick={() => setShowRules(true)}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#fff1d6] px-6 py-2.5 text-sm sm:text-base font-semibold text-[#6a3712] shadow-[2px_2px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition"
      >
        <Lightbulb size={18} />
        How To Play
      </button>

      <Image
        src="/mandala-center.png"
        alt="mandala"
        width={900}
        height={900}
        className="absolute opacity-20 pointer-events-none z-0"
      />

      <Image
        src="/paisley-top-left.png"
        alt="decor"
        width={220}
        height={220}
        className="absolute top-1 left-1 opacity-30 pointer-events-none z-0"
      />

      <Image
        src="/paisley-top-left.png"
        alt="decor"
        width={220}
        height={220}
        className="absolute top-1 right-1 opacity-30 pointer-events-none scale-x-[-1] z-0"
      />

      <Image
        src="/paisley-top-left.png"
        alt="decor"
        width={220}
        height={220}
        className="absolute bottom-1 left-1 opacity-50 rotate-180 pointer-events-none scale-x-[-1] z-0"
      />

      <Image
        src="/paisley-top-left.png"
        alt="decor"
        width={220}
        height={220}
        className="absolute bottom-1 right-1 opacity-50 rotate-180 pointer-events-none z-0"
      />

      <div className="relative w-[95vw] max-w-[620px] sm:w-[690px] -mt-10 sm:-mt-32 flex justify-center z-10">

        <Image
          src="/envelope.png"
          alt="envelope"
          width={600}
          height={590}
          className="drop-shadow-2xl select-none pointer-events-none w-full sm:w-auto relative z-0"
          priority
        />

        <div className="absolute top-[5%] sm:top-[10px] flex justify-center w-full z-10">
          <img
            src="/gametitle.png"
            alt="Raja Mantri Chor Sipahi"
            className="w-[70%] sm:w-[420px] h-auto select-none pointer-events-none drop-shadow-lg"
          />
        </div>

        <div
          className={`absolute w-full flex flex-col items-center gap-2 sm:gap-4 z-20 ${
            mode === "idle"
              ? "top-[67%] -translate-y-1/2"
              : "bottom-[25%] sm:bottom-[170px]"
          }`}
        >

          {mode === "idle" && (
            <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">
              <button
                onClick={() => setMode("create")}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-base font-semibold"
              >
                <Crown size={18} />
                Create Room
              </button>

              <button
                onClick={() => setMode("join")}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-base font-semibold"
              >
                <KeyRound size={18} />
                Join Room
              </button>
            </div>
          )}

          {mode !== "idle" && (
            <>
              <input
                className="w-[70%] sm:w-[60%] bg-orange-200 rounded-full py-2 sm:py-3 text-center shadow-inner outline-none text-sm"
                placeholder="Enter Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {mode === "join" && (
                <input
                  className="w-[65%] sm:w-[40%] bg-[#efe7d5] rounded-full py-2 text-center shadow-inner outline-none text-sm"
                  placeholder="Room Code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
              )}

              <div className="flex gap-1 sm:gap-4 flex-wrap justify-center">
                {mode === "create" && (
                  <button
                    onClick={createRoom}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-500 shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-sm font-semibold"
                  >
                    <Crown size={18} />
                    Create Room
                  </button>
                )}

                {mode === "join" && (
                  <button
                    onClick={joinRoom}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-sm font-semibold"
                  >
                    <KeyRound size={18} />
                    Join Room
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMode("idle");
                    setName("");
                    setRoomCode("");
                  }}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#fff1d6] shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-sm font-semibold text-[#6a3712]"
                >
                  Back
                </button>
              </div>
            </>
          )}

        </div>

      </div>

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="relative w-full max-w-2xl rounded-[28px] border-[8px] border-[#d77314] bg-[linear-gradient(180deg,#fff6e6_0%,#f4e1bf_100%)] p-6 shadow-[0_24px_60px_rgba(44,18,0,0.35)] sm:p-8">
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="absolute right-4 top-4 rounded-full bg-[#8f2f16] px-3 py-1 text-sm font-bold text-white shadow"
            >
              Close
            </button>

            <div className="pr-16">
              <div className="text-3xl sm:text-4xl font-black text-[#6f3410] game-title">
                How To Play
              </div>
              <div className="mt-2 text-base sm:text-lg text-[#6f3410] font-semibold">
                Raja Mantri Chor Sipahi is a bluff-and-deduction party game for 4 players.
              </div>
            </div>

            <div className="mt-6 space-y-4 text-[#4b2410]">
              <div>
                <div className="font-bold text-lg">1. Roles are assigned secretly</div>
                <div className="text-sm sm:text-base">Each round assigns one `Raja`, one `Mantri`, one `Chor`, and one `Sipahi`.</div>
              </div>

              <div>
                <div className="font-bold text-lg">2. The Mantri must identify the Chor</div>
                <div className="text-sm sm:text-base">Only the Mantri can make the guess. Everyone else waits and watches the round unfold.</div>
              </div>

              <div>
                <div className="font-bold text-lg">3. Scores update after every round</div>
                <div className="text-sm sm:text-base">If the Mantri guesses correctly, Raja, Mantri, and Sipahi score. If not, the Chor benefits.</div>
              </div>

              <div>
                <div className="font-bold text-lg">4. Play for 3 or 5 rounds</div>
                <div className="text-sm sm:text-base">The host chooses the total rounds before starting the room.</div>
              </div>

              <div>
                <div className="font-bold text-lg">5. Highest score wins</div>
                <div className="text-sm sm:text-base">After the final round, everyone sees the final leaderboard and the overall winner.</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
