"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectSocket, ensureSessionId, getStoredSession, persistSession } from "../socket/socket";
import Image from "next/image";
import { Crown, KeyRound } from "lucide-react";

interface Player {
  id: string;
  name: string;
}

interface Room {
  roomId: string;
  players?: Player[];
}

export default function Home() {

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

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
          <Image
            src="/title.png"
            alt="Raja Mantri Chor Sipahi"
            width={420}
            height={200}
            className="w-[70%] sm:w-[420px] h-auto select-none pointer-events-none drop-shadow-lg"
            priority
          />
        </div>

        <div className="absolute bottom-[18%] sm:bottom-[170px] w-full flex flex-col items-center gap-2 sm:gap-4 z-20">

          <input
            className="w-[70%] sm:w-[60%] bg-orange-200 rounded-full py-2 sm:py-3 text-center shadow-inner outline-none text-sm"
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">

            <button
              onClick={createRoom}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-base font-semibold"
            >
              <Crown size={18} />
              Create Room
            </button>

            <button
              onClick={joinRoom}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition text-sm sm:text-base font-semibold"
            >
              <KeyRound size={18} />
              Join Room
            </button>

          </div>

          <input
            className="w-[65%] sm:w-[40%] bg-[#efe7d5] rounded-full py-2 text-center shadow-inner outline-none text-sm"
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />

        </div>

      </div>

    </div>
  );
}
