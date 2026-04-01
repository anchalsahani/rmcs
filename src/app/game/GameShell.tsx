"use client";

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

interface ShellProps {
  roomId: string;
  phase: "WAITING" | "REVEAL" | "GUESSING" | "RESULT";
  players: Player[];
  currentRound: number;
  totalRounds: number;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

interface PlayerGridProps {
  players: Player[];
  highlightId?: string;
  revealRoleForId?: string;
  selectedId?: string;
  onSelect?: (playerId: string) => void;
}

interface ResultCardProps {
  result?: GuessResult | null;
  players: Player[];
  myRole: string;
  currentRound: number;
  totalRounds: number;
  gameFinished?: boolean;
  onNextRound?: () => void;
  showNextRound?: boolean;
}

const roleColors: Record<string, string> = {
  raja: "text-[#7a3f00]",
  mantri: "text-[#5f2f78]",
  chor: "text-[#9b1c1c]",
  sipahi: "text-[#0d6b7b]",
};

const roleLabels: Record<string, string> = {
  raja: "RAJA",
  mantri: "MANTRI",
  chor: "CHOR",
  sipahi: "SIPAHI",
};

const avatarGradients = [
  "from-[#f2c96b] to-[#f18b2c]",
  "from-[#ffbbd4] to-[#d47399]",
  "from-[#7fd0ff] to-[#2889c9]",
  "from-[#b4e57f] to-[#5eb045]",
];

function getAvatarColor(playerId: string) {
  const seed = playerId.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarGradients[seed % avatarGradients.length];
}

export function GameShell({ roomId, phase, players, currentRound, totalRounds, title, subtitle, children }: ShellProps) {
  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-between gap-3 px-1 text-[#5a2d0c]">
        <div className="rounded-sm border border-[#cfa76a] bg-[#f6ecd7] px-4 py-2 text-xs font-black uppercase tracking-wide shadow-[0_3px_0_rgba(113,70,17,0.18)] sm:text-sm">
          Room Code: {roomId || "----"}
        </div>

        <div className="flex-1 rounded-sm border border-[#d4b07a] bg-[#f8eed8] px-4 py-2 text-center shadow-[0_4px_0_rgba(113,70,17,0.16)]">
          <img
            src="/lobbytitle.png"
            alt="Raja Mantri Chor Sipahi"
            loading="eager"
            decoding="async"
            className="mx-auto h-16 w-auto object-contain sm:h-24"
          />
        </div>

        <div className="rounded-sm border border-[#cfa76a] bg-[#f6ecd7] px-4 py-2 text-right text-xs font-black uppercase tracking-wide shadow-[0_3px_0_rgba(113,70,17,0.18)] sm:text-sm">
          <div>Round {currentRound}/{totalRounds}</div>
          <div>Players: {players.length}/4</div>
        </div>
      </div>

      <div className="mt-5 rounded-[30px] border-[10px] border-[#d77314] bg-[linear-gradient(180deg,#f8f0dc_0%,#f4ead4_49%,#ebddc2_50%,#f7efd8_100%)] p-5 shadow-[0_20px_60px_rgba(64,24,0,0.22)] sm:p-8">
        <div className="mb-6 flex justify-start">
          <div className="min-w-[220px] rounded-[18px] border border-[#cfad77] bg-[linear-gradient(180deg,#fff5e2_0%,#f0ddbb_100%)] px-4 py-3 shadow-[0_10px_22px_rgba(71,38,6,0.14)]">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-[#8b6337]">
              Scoreboard
            </div>
            <div className="mt-3 space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between gap-4 text-[#4d2e17]">
                  <div className="truncate text-base font-black uppercase">{player.name}</div>
                  <div className="shrink-0 text-base font-black">{player.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && <div className="text-3xl font-black uppercase tracking-wide text-[#47210a] sm:text-5xl">{title}</div>}
            {subtitle && <div className="mt-2 text-lg font-bold text-[#6e3c11] sm:text-2xl">{subtitle}</div>}
          </div>
        )}

        <div>{children}</div>

        <div className="mt-6 text-center text-xs font-bold uppercase tracking-[0.35em] text-[#8b6337]">
          {phase === "REVEAL" && "Role Reveal"}
          {phase === "GUESSING" && "Mantri Is Guessing"}
          {phase === "RESULT" && "Round Result"}
          {phase === "WAITING" && "Waiting For Round"}
        </div>
      </div>
    </div>
  );
}

export function RoleCard({
  role,
  hindiLine,
  englishLine,
  accentClass,
  icon,
  imageSrc,
}: {
  role: string;
  hindiLine: string;
  englishLine: string;
  accentClass: string;
  icon: string;
  imageSrc?: string;
}) {
  return (
    <div className="mx-auto max-w-[420px] rotate-[-2deg] rounded-[22px] border border-[#c8a36d] bg-[linear-gradient(180deg,#f7ead0_0%,#ecd6ae_100%)] px-8 py-7 text-center shadow-[0_16px_30px_rgba(93,57,9,0.28)]">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={role}
          loading="eager"
          decoding="async"
          className="mx-auto h-44 w-auto object-contain sm:h-52"
        />
      ) : (
        <>
          <div className="text-5xl">{icon}</div>
          <div className={`mt-3 text-2xl font-black uppercase sm:text-4xl ${accentClass}`}>{role}</div>
          <div className="mt-2 text-2xl font-bold text-[#3e2312] sm:text-3xl">{hindiLine}</div>
          <div className="mt-1 text-xl font-extrabold tracking-wide text-[#3e2312] sm:text-2xl">{englishLine}</div>
        </>
      )}
    </div>
  );
}

export function PlayerGrid({
  players,
  highlightId,
  revealRoleForId,
  selectedId,
  onSelect,
}: PlayerGridProps) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      {players.map((player) => {
        const selected = selectedId === player.id;
        const clickable = Boolean(onSelect);

        return (
          <button
            key={player.id}
            type="button"
            onClick={() => onSelect?.(player.id)}
            className={`rounded-[26px] border-4 bg-[#fff7e7] px-4 py-4 text-center shadow-[0_8px_18px_rgba(74,33,1,0.18)] transition ${
              clickable ? "cursor-pointer hover:-translate-y-1" : "cursor-default"
            } ${
              selected
                ? "border-[#c93a20] ring-4 ring-[#f5b46d]"
                : highlightId === player.id
                  ? "border-[#f0b400]"
                  : "border-transparent"
            }`}
          >
            <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(player.id)} text-4xl font-black text-white shadow-inner`}>
              {player.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="mt-3 text-2xl font-black text-[#3a2414]">{player.name}</div>
            <div className="text-xl font-bold text-[#4d2e17]">{player.score}</div>
            {revealRoleForId === player.id && player.role && (
              <div className={`mt-1 text-sm font-black uppercase ${roleColors[player.role] ?? "text-[#4d2e17]"}`}>
                [{roleLabels[player.role]}]
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function StatusRibbon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-8 w-fit rounded-full border border-[#dca64b] bg-[linear-gradient(180deg,#ffe69b_0%,#efbf3b_100%)] px-10 py-3 text-center text-lg font-black uppercase tracking-wide text-[#6b3809] shadow-[0_10px_20px_rgba(135,72,0,0.2)]">
      {children}
    </div>
  );
}

export function ResultCard({ result, players, myRole, currentRound, totalRounds, gameFinished, onNextRound, showNextRound }: ResultCardProps) {
  if (!result) return null;

  const chor = players.find((player) => player.id === result.chorId);
  const tone = result.correct ? "text-[#26713f]" : "text-[#8e1d1d]";

  return (
    <div className="mx-auto max-w-[760px] rounded-[24px] border border-[#cfad77] bg-[linear-gradient(180deg,#fff5df_0%,#f3dec0_100%)] px-6 py-8 text-center shadow-[0_14px_35px_rgba(71,38,6,0.18)]">
      <div className={`text-3xl font-black uppercase sm:text-5xl ${tone}`}>
        {result.correct ? "Chor Caught" : "Chor Escaped"}
      </div>
      <div className="mt-3 text-xl font-bold text-[#4b2a17] sm:text-2xl">
        {chor ? `${chor.name} was the CHOR.` : "The Chor has been revealed."}
      </div>
      <div className="mt-2 text-base font-semibold text-[#6c4521] sm:text-lg">
        {result.correct
          ? "Raja, Mantri, and Sipahi receive points this round."
          : "The Chor survives this round and the scores have been updated."}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={`rounded-full px-4 py-2 text-sm font-black uppercase shadow ${
              player.id === result.chorId
                ? "bg-[#6b1f1f] text-white"
                : "bg-[#f7ead3] text-[#4d2e17]"
            }`}
          >
            {player.name}
            {player.role ? ` · ${roleLabels[player.role]}` : ""}
          </div>
        ))}
      </div>

      {showNextRound && onNextRound && !gameFinished && currentRound < totalRounds && (
        <button
          type="button"
          onClick={onNextRound}
          className="mt-7 rounded-full bg-[linear-gradient(180deg,#d74d2f_0%,#992a16_100%)] px-10 py-4 text-xl font-black uppercase tracking-wide text-white shadow-[0_12px_24px_rgba(100,16,2,0.35)] transition hover:scale-[1.02]"
        >
          Start Next Round
        </button>
      )}

      {gameFinished && (
        <div className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-[#8b6337]">
          Game Complete
        </div>
      )}

      {!showNextRound && myRole && !gameFinished && (
        <div className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-[#8b6337]">
          Waiting For Host
        </div>
      )}
    </div>
  );
}
