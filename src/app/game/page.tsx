"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import socket, { connectSocket, ensureSessionId, getStoredSession, persistSession } from "../../socket/socket";

import RajaView from "./RajaView";
import MantriView from "./MantriView";
import ChorView from "./ChorView";
import SipahiView from "./SipahiView";

interface Player {
  id: string;
  name: string;
  score: number;
  role?: string;
  isHost?: boolean;
}

interface GuessResult {
  correct: boolean;
  chorId: string;
}

interface Room {
  roomId: string;
  state: Phase | "FINISHED";
  players: Player[];
  result?: GuessResult;
  currentRound: number;
  totalRounds: number;
}

type Phase = "WAITING" | "REVEAL" | "GUESSING" | "RESULT";

const REVEAL_DURATION_MS = 900;
const GAME_ASSETS = [
  "/lobbytitle.png",
  "/raja.png",
  "/mantri.png",
  "/chor.png",
  "/sipahi.png",
];

export default function Game() {
  const params = useSearchParams();
  const requestedRoomId = params.get("room") ?? "";
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSessionPersistRef = useRef("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [myId, setMyId] = useState("");
  const [myRole, setMyRole] = useState("");
  const [roomId, setRoomId] = useState(requestedRoomId);
  const [phase, setPhase] = useState<Phase>("WAITING");
  const [result, setResult] = useState<GuessResult | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    const activeSocket = connectSocket();
    if (!activeSocket) return;

    const clearRevealTimer = () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
    };

    const advanceToGuessing = () => {
      clearRevealTimer();

      revealTimeoutRef.current = setTimeout(() => {
        setPhase((current) => (current === "REVEAL" ? "GUESSING" : current));
      }, REVEAL_DURATION_MS);
    };

    const applyRoomState = (room: Room) => {
      setPlayers(room.players);
      setRoomId(room.roomId);
      setResult(room.result ?? null);
      setCurrentRound(room.currentRound || 1);
      setTotalRounds(room.totalRounds || 5);

      const me = room.players.find((player) => player.id === activeSocket.id);
      const derivedRole = me?.role ?? "";
      setMyRole(derivedRole);

      if (room.roomId && me?.name) {
        const sessionId = ensureSessionId();
        const nextSnapshot = `${room.roomId}:${me.name}:${activeSocket.id}:${sessionId}`;

        if (lastSessionPersistRef.current !== nextSnapshot) {
          lastSessionPersistRef.current = nextSnapshot;

          persistSession({
            roomId: room.roomId,
            playerName: me.name,
            socketId: activeSocket.id,
            sessionId,
          });
        }
      }

      if (room.state === "FINISHED") {
        clearRevealTimer();
        setGameFinished(true);
        setPhase("RESULT");
        return;
      }

      setGameFinished(false);

      if (room.state === "RESULT") {
        clearRevealTimer();
        setPhase("RESULT");
        return;
      }

      if (!derivedRole) {
        clearRevealTimer();
        setPhase("WAITING");
        return;
      }

      if (room.state === "REVEAL") {
        setPhase("REVEAL");
        advanceToGuessing();
        return;
      }

      clearRevealTimer();
      setPhase("GUESSING");
    };

    const handleConnect = () => {
      setMyId(activeSocket.id ?? "");
    };

    const handlePlayers = (room: Room) => {
      applyRoomState(room);
    };

    const handleRole = (data: { role: string; room: Room }) => {
      if (!data?.room) return;

      setMyRole(data.role ?? "");
      applyRoomState({
        ...data.room,
        state: "REVEAL",
      });
    };

    const handleResult = (nextResult: GuessResult) => {
      setResult(nextResult);
      setGameFinished(false);
      setPhase("RESULT");
    };

    activeSocket.on("connect", handleConnect);
    activeSocket.on("room_players", handlePlayers);
    activeSocket.on("your_role", handleRole);
    activeSocket.on("guess_result", handleResult);

    handleConnect();

    const targetRoomId = requestedRoomId || getStoredSession()?.roomId;
    if (targetRoomId) {
      activeSocket.emit("get_room_players", { roomId: targetRoomId });
    }

    GAME_ASSETS.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    return () => {
      activeSocket.off("connect", handleConnect);
      activeSocket.off("room_players", handlePlayers);
      activeSocket.off("your_role", handleRole);
      activeSocket.off("guess_result", handleResult);
      clearRevealTimer();
    };
  }, [requestedRoomId]);

  const handleNextRound = () => {
    if (!roomId) return;
    socket?.emit("next_round", { roomId });
  };

  const commonProps = {
    players,
    myId,
    roomId,
    phase,
    currentRound,
    totalRounds,
    gameFinished,
    result,
    onNextRound: handleNextRound,
  };

  const renderRoleView = () => {
    if (!myRole) {
      return (
        <div className="w-full max-w-4xl rounded-[28px] border-[10px] border-[#d77314] bg-[linear-gradient(180deg,#f8f0dc_0%,#f4ead4_49%,#ebddc2_50%,#f7efd8_100%)] p-10 text-center shadow-[0_20px_60px_rgba(64,24,0,0.22)]">
          <div className="text-3xl font-black uppercase text-[#5e3516]">Waiting for game to start...</div>
        </div>
      );
    }

    switch (myRole) {
      case "raja":
        return <RajaView {...commonProps} />;
      case "mantri":
        return <MantriView {...commonProps} />;
      case "chor":
        return <ChorView {...commonProps} />;
      case "sipahi":
        return <SipahiView {...commonProps} />;
      default:
        return <div className="text-white">Unknown role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,#ffc76c_0%,#f28f1d_48%,#d96d00_100%)] px-4 py-6 sm:px-8">
      {renderRoleView()}
    </div>
  );
}
