"use client";

import { GameShell, PlayerGrid, ResultCard, RoleCard, StatusRibbon } from "./GameShell";

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

export default function SipahiView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, onNextRound }: Props) {
  const me = players.find((player) => player.id === myId);
  const raja = players.find((player) => player.role === "raja");

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      currentRound={currentRound}
      totalRounds={totalRounds}
      subtitle={phase === "RESULT" ? "Duty completed for this round" : "Protect the kingdom while Mantri guesses"}
    >
      {phase === "RESULT" ? (
        <ResultCard result={result} players={players} myRole="sipahi" currentRound={currentRound} totalRounds={totalRounds} gameFinished={gameFinished} onNextRound={onNextRound} showNextRound={Boolean(me?.isHost)} />
      ) : (
        <>
          <RoleCard
          role="SIPAHI"
          hindiLine="आप SIPAHI हैं"
          englishLine="YOU ARE SIPAHI"
          accentClass="text-[#0f6376]"
          icon="🛡"
          imageSrc="/sipahi.png"
        />

          <div className="mt-8 text-center text-2xl font-bold text-[#5e3516] sm:text-4xl">
            {phase === "REVEAL" ? "The guards are ready..." : "Mantri is guessing..."}
          </div>

          <div className="mt-8">
            <PlayerGrid players={players} revealRoleForId={raja?.id} highlightId={raja?.id} />
          </div>

          <StatusRibbon>Stand by for the verdict</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
