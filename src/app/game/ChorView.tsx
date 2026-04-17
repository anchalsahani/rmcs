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

export default function ChorView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, onNextRound, onPlayAgain }: Props) {
  const me = players.find((player) => player.id === myId);

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      myId={myId}
      currentRound={currentRound}
      totalRounds={totalRounds}
      subtitle={phase === "RESULT" ? "The shadows break" : "Stay hidden while Mantri guesses"}
    >
      {phase === "RESULT" ? (
        <ResultCard
          result={result}
          players={players}
          myRole="chor"
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
              highlightId={myId}
              centerContent={
                <div className="rounded-[24px] border border-[#ffd766]/16 bg-[radial-gradient(circle_at_center,rgba(133,86,35,0.3)_0%,rgba(38,22,14,0.7)_60%,rgba(19,13,9,0.9)_100%)] px-3 py-3 text-center text-white shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                  <RoleCard
                    role="CHOR"
                    hindiLine="Aap Chor Hain"
                    englishLine="YOU ARE CHOR"
                    accentClass="text-[#d5a53a]"
                    icon="Mask"
                    imageSrc="/chor.png"
                  />
                  <div className="mt-2 text-xs font-bold text-[#f4e1b9] sm:text-sm">Waiting for Mantri to guess...</div>
                  <div className="font-ui mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#d4ba8b] sm:text-[9px]">
                    Blend in, stay calm, and let the suspicion drift elsewhere
                  </div>
                </div>
              }
            />
          </div>

          <StatusRibbon>Stay calm and stay hidden</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
