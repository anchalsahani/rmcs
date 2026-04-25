"use client";

import { useEffect, useState } from "react";
import socket from "../../socket/socket";
import { GameShell, PlayerGrid, ResultCard, StatusRibbon } from "./GameShell";

const GUESS_TIMER_SECONDS = 120;

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

interface RoundHistoryEntry {
  roundNumber: number;
  guessedId?: string;
  chorId: string;
  correct: boolean;
  players: Array<{
    id: string;
    name: string;
    role?: string;
    roundScore: number;
    totalScore: number;
  }>;
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
  roundHistory?: RoundHistoryEntry[];
  onNextRound?: () => void;
  onPlayAgain?: () => void;
}

export default function MantriView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, roundHistory, onNextRound, onPlayAgain }: Props) {
  const [selected, setSelected] = useState("");
  const [timeLeft, setTimeLeft] = useState(GUESS_TIMER_SECONDS);

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
  const handleGuess = () => {
    if (!selected || phase !== "GUESSING") return;

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
      myId={myId}
      currentRound={currentRound}
      totalRounds={totalRounds}
      title={phase === "RESULT" ? "Verdict Declared" : "Mantri Turn"}
      subtitle={phase === "RESULT" ? "The Chor has been revealed" : "Guess who is the Chor"}
    >
      {phase === "RESULT" ? (
        <ResultCard
          result={result}
          players={players}
          myRole="mantri"
          currentRound={currentRound}
          totalRounds={totalRounds}
          gameFinished={gameFinished}
          onNextRound={onNextRound}
          onPlayAgain={onPlayAgain}
          showNextRound={Boolean(me?.isHost)}
          roundHistory={roundHistory}
        />
      ) : (
        <>
          <div className="mt-3">
            <PlayerGrid
              players={players}
              myId={myId}
              selectedId={selected}
              onSelect={setSelected}
              centerContent={
                <div className="reveal-card rounded-[24px] border border-[#ffe0a3]/28 bg-[linear-gradient(145deg,rgba(255,244,215,0.18)_0%,rgba(255,193,80,0.1)_42%,rgba(31,14,10,0.78)_100%)] px-3 py-3 text-center text-white shadow-[0_20px_52px_rgba(0,0,0,0.36),0_0_38px_rgba(255,181,61,0.18)] backdrop-blur-2xl">
                  <div className="rounded-[18px] border border-[#ffda8a]/22 bg-[linear-gradient(180deg,rgba(255,242,213,0.16)_0%,rgba(255,217,148,0.08)_100%)] px-2 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                    <img
                      src="/mantri.png"
                      alt="Mantri"
                      className="mx-auto h-16 w-auto object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.32)] sm:h-24"
                    />
                  </div>
                  <div className="font-raja mt-2 text-xl font-black uppercase text-[#ffd766] sm:text-3xl">Find The Chor</div>
                  <div className="font-ui mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-[#d8a35b] sm:text-[10px]">
                    Study the room before you commit your guess
                  </div>
                  <div className="mx-auto mt-3 h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#ffd766_0%,#ff8f2d_100%)] transition-all"
                      style={{ width: `${(timeLeft / GUESS_TIMER_SECONDS) * 100}%` }}
                    />
                  </div>
                  <div className="font-ui mt-2 text-xl font-black text-white sm:text-2xl">{minutes}:{seconds}</div>
                </div>
              }
            />
          </div>

          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleGuess}
              disabled={!selected || phase !== "GUESSING"}
              className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_20px_rgba(112,24,4,0.26)] transition sm:px-8 sm:py-2.5 sm:text-sm ${
                selected && phase === "GUESSING"
                  ? "bg-[linear-gradient(180deg,#ffd766_0%,#ff8f2d_100%)] text-[#32150c] hover:scale-[1.02] active:scale-[0.98]"
                  : "cursor-not-allowed bg-white/10 text-[#bca07b]"
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
