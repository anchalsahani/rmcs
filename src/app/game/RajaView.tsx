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

export default function RajaView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, onNextRound }: Props) {
  const me = players.find((player) => player.id === myId);
  const mantri = players.find((player) => player.role === "mantri");

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      currentRound={currentRound}
      totalRounds={totalRounds}
      subtitle={phase === "RESULT" ? "The court awaits the next round" : "Mantri will identify the Chor"}
    >
      {phase === "RESULT" ? (
        <ResultCard result={result} players={players} myRole="raja" currentRound={currentRound} totalRounds={totalRounds} gameFinished={gameFinished} onNextRound={onNextRound} showNextRound={Boolean(me?.isHost)} />
      ) : (
        <>
          <RoleCard
          role="RAJA"
          hindiLine="आप RAJA हैं"
          englishLine="YOU ARE RAJA"
          accentClass="text-[#7a3f00]"
          icon="👑"
          imageSrc="/raja.png"
        />

          <div className="mt-8 text-center text-2xl font-bold text-[#5e3516] sm:text-4xl">
            {phase === "REVEAL" ? "The round begins..." : `${mantri?.name ?? "Mantri"} is guessing the Chor...`}
          </div>

          <div className="mt-8">
            <PlayerGrid players={players} revealRoleForId={mantri?.id} highlightId={mantri?.id} />
          </div>

          <StatusRibbon>Royal court is watching Everything</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
