"use client";

import { GameShell, PlayerGrid, ResultCard, RoleCard, StatusRibbon } from "./GameShell";

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

export default function SipahiView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, roundHistory, onNextRound, onPlayAgain }: Props) {
  const me = players.find((player) => player.id === myId);
  const raja = players.find((player) => player.role === "raja");

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      myId={myId}
      currentRound={currentRound}
      totalRounds={totalRounds}
      subtitle={phase === "RESULT" ? "Duty completed for this round" : "Protect the kingdom while Mantri guesses"}
    >
      {phase === "RESULT" ? (
        <ResultCard
          result={result}
          players={players}
          myRole="sipahi"
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
              revealRoleForId={raja?.id}
              highlightId={raja?.id}
              centerContent={
                <div className="space-y-3">
                  <RoleCard
                    role="SIPAHI"
                    hindiLine="Aap Sipahi Hain"
                    englishLine="YOU ARE SIPAHI"
                    accentClass="text-[#7dd3fc]"
                    icon="Shield"
                    imageSrc="/sipahi.png"
                  />
                  <div className="rounded-[18px] border border-[#ffd766]/20 bg-white/[0.08] px-3 py-2.5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                    <div className="game-subtitle text-xs font-bold text-[#fff2cf] sm:text-sm">
                      {phase === "REVEAL" ? "The guards are ready..." : "Mantri is guessing..."}
                    </div>
                    <div className="font-ui mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#d8a35b] sm:text-[9px]">
                      Stand beside Raja and hold the line for this round
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <StatusRibbon>Stand by for the verdict</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
