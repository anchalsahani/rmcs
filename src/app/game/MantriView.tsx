"use client";

import { useEffect, useState } from "react";
import socket from "../../socket/socket";
import { GameShell, PlayerGrid, ResultCard, StatusRibbon } from "./GameShell";

const GUESS_TIMER_SECONDS = 120;

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

interface Props {
  players: Player[];
  myId: string;
  roomId: string;
  phase: "WAITING" | "REVEAL" | "GUESSING" | "RESULT";
  currentRound: number;
  totalRounds: number;
  gameFinished?: boolean;
  result?: GuessResult | null;
  onNextRound?: () => void;
}

export default function MantriView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, onNextRound }: Props) {
  const [selected, setSelected] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (phase === "RESULT") {
      setTimeLeft(GUESS_TIMER_SECONDS);
      return;
    }

    if (phase !== "GUESSING") return;

    setTimeLeft(GUESS_TIMER_SECONDS);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "GUESSING") {
      setSelected("");
    }
  }, [phase]);

  const me = players.find((player) => player.id === myId);
  const candidatePlayers = players.filter((player) => player.id !== myId);

  const handleGuess = () => {
    if (!selected || phase !== "GUESSING") return;

    console.log("[mantri] make_guess", { roomId, guessedId: selected });
    socket?.emit("make_guess", {
      roomId,
      guessedId: selected,
    });
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      currentRound={currentRound}
      totalRounds={totalRounds}
      title={phase === "RESULT" ? "Verdict Declared" : "आप MANTRI हैं"}
      subtitle={phase === "RESULT" ? "The Chor has been revealed" : "Guess who is the Chor"}
    >
      {phase === "RESULT" ? (
        <ResultCard result={result} players={players} myRole="mantri" currentRound={currentRound} totalRounds={totalRounds} gameFinished={gameFinished} onNextRound={onNextRound} showNextRound={Boolean(me?.isHost)} />
      ) : (
        <>
          <div className="mx-auto max-w-[720px] rounded-[24px] border border-[#dab37b] bg-[linear-gradient(180deg,#fff4de_0%,#f2dfbe_100%)] px-6 py-6 text-center shadow-[0_12px_24px_rgba(95,52,9,0.18)]">
            <img
              src="/mantri.png"
              alt="Mantri"
              className="mx-auto h-40 w-auto object-contain sm:h-48"
            />
            <div className="mt-2 text-3xl font-black text-[#532612] sm:text-5xl">GUESS WHO IS THE CHOR!</div>
            <div className="mx-auto mt-5 h-4 w-full max-w-[420px] overflow-hidden rounded-full bg-[#dbc9ae]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ffb11f_0%,#f48917_100%)] transition-all"
                style={{ width: `${(timeLeft / GUESS_TIMER_SECONDS) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-3xl font-black text-[#8b3e04]">{minutes}:{seconds}</div>
          </div>

          <div className="mt-8">
            <PlayerGrid players={candidatePlayers} selectedId={selected} onSelect={setSelected} />
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleGuess}
              disabled={!selected || phase !== "GUESSING"}
              className={`rounded-full px-12 py-4 text-2xl font-black uppercase tracking-wide text-white shadow-[0_12px_24px_rgba(112,24,4,0.3)] transition ${
                selected && phase === "GUESSING"
                  ? "bg-[linear-gradient(180deg,#d84a2e_0%,#a02310_100%)] hover:scale-[1.02]"
                  : "cursor-not-allowed bg-[#b8a89c]"
              }`}
            >
              Confirm Guess
            </button>
          </div>

          <StatusRibbon>{selected ? "Suspect selected" : "Choose your suspect"}</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
