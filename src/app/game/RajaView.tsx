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
  onPlayAgain?: () => void;
}

export default function RajaView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, onNextRound, onPlayAgain }: Props) {
  const me = players.find((player) => player.id === myId);
  const mantri = players.find((player) => player.role === "mantri");

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      myId={myId}
      currentRound={currentRound}
      totalRounds={totalRounds}
      subtitle={phase === "RESULT" ? "The court awaits the next round" : "Mantri will identify the Chor"}
    >
      {phase === "RESULT" ? (
        <ResultCard
          result={result}
          players={players}
          myRole="raja"
          currentRound={currentRound}
          totalRounds={totalRounds}
          gameFinished={gameFinished}
          onNextRound={onNextRound}
          onPlayAgain={onPlayAgain}
          showNextRound={Boolean(me?.isHost)}
        />
      ) : (
        <>
          <div className="mt-3">
            <PlayerGrid
              players={players}
              myId={myId}
              revealRoleForId={mantri?.id}
              highlightId={mantri?.id}
              centerContent={
                <div className="space-y-3">
                  <RoleCard
                    role="RAJA"
                    hindiLine="Aap Raja Hain"
                    englishLine="YOU ARE RAJA"
                    accentClass="text-[#ffd766]"
                    icon="Crown"
                    imageSrc="/raja.png"
                  />
                  <div className="rounded-[18px] border border-[#ffd766]/20 bg-white/[0.08] px-3 py-2.5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                    <div className="game-subtitle text-xs font-bold text-[#fff2cf] sm:text-sm">
                      {phase === "REVEAL" ? "The round begins..." : `${mantri?.name ?? "Mantri"} is guessing the Chor...`}
                    </div>
                    <div className="font-ui mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#d8a35b] sm:text-[9px]">
                      Raja watches the court and waits for the verdict
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <StatusRibbon>The royal court is watching every move</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
