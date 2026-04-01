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

export default function ChorView({ players, myId, roomId, phase, currentRound, totalRounds, gameFinished, result, onNextRound }: Props) {
  const me = players.find((player) => player.id === myId);

  return (
    <GameShell
      roomId={roomId}
      phase={phase}
      players={players}
      currentRound={currentRound}
      totalRounds={totalRounds}
      subtitle={phase === "RESULT" ? "The shadows break" : "Stay hidden while Mantri guesses"}
    >
      {phase === "RESULT" ? (
        <ResultCard result={result} players={players} myRole="chor" currentRound={currentRound} totalRounds={totalRounds} gameFinished={gameFinished} onNextRound={onNextRound} showNextRound={Boolean(me?.isHost)} />
      ) : (
        <>
          <div className="rounded-[32px] bg-[radial-gradient(circle_at_center,#6d5427_0%,#26160e_60%,#130d09_100%)] px-6 py-8 text-center text-white shadow-[0_18px_45px_rgba(0,0,0,0.42)]">
            <RoleCard
            role="CHOR"
            hindiLine="आप CHOR हैं"
            englishLine="YOU ARE CHOR"
            accentClass="text-[#d5a53a]"
            icon="🕵"
            imageSrc="/chor.png"
          />
            <div className="mt-8 text-3xl font-bold text-[#f4e1b9] sm:text-4xl">Waiting for Mantri to guess...</div>
          </div>

          <div className="mt-8">
            <PlayerGrid players={players} highlightId={myId} />
          </div>

          <StatusRibbon>Stay calm and stay hidden</StatusRibbon>
        </>
      )}
    </GameShell>
  );
}
