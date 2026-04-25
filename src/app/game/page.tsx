"use client";
import { Suspense } from "react";
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
  roundScore?: number;
  role?: string;
  isHost?: boolean;
}

interface GuessResult {
  correct: boolean;
  chorId: string;
  guessedId?: string;
  roundNumber?: number;
  roundScores?: Record<string, number>;
}

interface GuessResultPayload extends GuessResult {
  room?: Room;
}

interface RoundHistoryPlayer {
  id: string;
  name: string;
  role?: string;
  roundScore: number;
  totalScore: number;
}

interface RoundHistoryEntry {
  roundNumber: number;
  guessedId?: string;
  chorId: string;
  correct: boolean;
  players: RoundHistoryPlayer[];
}

interface Room {
  roomId: string;
  state: Phase | "FINISHED";
  gameState?: "playing" | "roundResult" | "finalResult";
  players: Player[];
  result?: GuessResult;
  currentRound: number;
  totalRounds: number;
  roundHistory?: RoundHistoryEntry[];
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

function GameContent() {
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
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);

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
      setRoundHistory(room.roundHistory ?? []);

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

      if (room.gameState === "finalResult" || room.state === "FINISHED") {
        clearRevealTimer();
        setGameFinished(true);
        setPhase("RESULT");
        return;
      }

      setGameFinished(false);

      if (room.gameState === "roundResult" || room.state === "RESULT") {
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

    const handleResult = (nextResult: GuessResultPayload) => {
      if (nextResult.room) {
        applyRoomState(nextResult.room);
        return;
      }

      setResult({
        correct: nextResult.correct,
        chorId: nextResult.chorId,
        guessedId: nextResult.guessedId,
        roundNumber: nextResult.roundNumber,
        roundScores: nextResult.roundScores,
      });
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

  const handlePlayAgain = () => {
    if (!roomId) return;
    socket?.emit("restart_game", { roomId });
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
    roundHistory,
    onNextRound: handleNextRound,
    onPlayAgain: handlePlayAgain,
  };

  const renderRoleView = () => {
    if (!myRole) {
      return (
        <div className="w-full max-w-4xl rounded-[28px] border-[10px] border-[#d77314] bg-[linear-gradient(180deg,#f8f0dc_0%,#f4ead4_49%,#ebddc2_50%,#f7efd8_100%)] p-10 text-center shadow-[0_20px_60px_rgba(64,24,0,0.22)]">
          <div className="text-2xl font-black uppercase text-[#5e3516] sm:text-3xl">Waiting for game to start...</div>
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
    <div className="relative flex min-h-screen justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_18%,rgba(255,196,89,0.32)_0%,transparent_28%),linear-gradient(135deg,#1b0d09_0%,#4d1f12_38%,#8a2e16_67%,#2a110b_100%)] px-3 py-3 sm:px-5">
      <div className="mandala-field pointer-events-none absolute inset-0 opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_48%,rgba(0,0,0,0.58)_100%)]" />
      {renderRoleView()}
    </div>
  );
}
export default function Game() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-10">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}
