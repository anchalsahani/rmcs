"use client";

import { useState } from "react";

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

interface ShellProps {
  roomId: string;
  phase: "WAITING" | "REVEAL" | "GUESSING" | "RESULT";
  players: Player[];
  myId?: string;
  currentRound: number;
  totalRounds: number;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

interface PlayerGridProps {
  players: Player[];
  myId?: string;
  centerContent?: React.ReactNode;
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
  onPlayAgain?: () => void;
  showNextRound?: boolean;
  roundHistory?: RoundHistoryEntry[];
}

const roleColors: Record<string, string> = {
  raja: "text-[#ffd766]",
  mantri: "text-[#d8b4fe]",
  chor: "text-[#ff8a65]",
  sipahi: "text-[#7dd3fc]",
};

const roleLabels: Record<string, string> = {
  raja: "RAJA",
  mantri: "MANTRI",
  chor: "CHOR",
  sipahi: "SIPAHI",
};

const avatarGradients = [
  "from-[#ffd166] to-[#c8791b]",
  "from-[#f6a15d] to-[#8f2f18]",
  "from-[#ffd6a5] to-[#9b5a24]",
  "from-[#f0c36b] to-[#6f3b18]",
];

function getAvatarColor(playerId: string) {
  const seed = playerId.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarGradients[seed % avatarGradients.length];
}

function getPlacementLabel(index: number) {
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  if (index === 2) return "3rd";
  return `${index + 1}th`;
}

function getPlacementIcon(index: number) {
  if (index === 0) return "1";
  if (index === 1) return "2";
  if (index === 2) return "3";
  return `${index + 1}`;
}

function getRoleMeta(role?: string) {
  if (role === "raja") return { icon: "R", label: "Raja", tone: "text-[#ffd766]" };
  if (role === "mantri") return { icon: "M", label: "Mantri", tone: "text-[#d8b4fe]" };
  if (role === "chor") return { icon: "C", label: "Chor", tone: "text-[#ff8a65]" };
  if (role === "sipahi") return { icon: "S", label: "Sipahi", tone: "text-[#7dd3fc]" };
  return { icon: "?", label: "Unknown", tone: "text-[#fff2cf]" };
}

function getRoundScoreLabel(player: Player, result: GuessResult) {
  const roundScore = result.roundScores?.[player.id] ?? player.roundScore ?? 0;
  return roundScore > 0 ? `+${roundScore} this round` : "+0 this round";
}

function SummaryModal({
  players,
  roundHistory,
  onClose,
}: {
  players: Player[];
  roundHistory: RoundHistoryEntry[];
  onClose: () => void;
}) {
  const playerNameMap = new Map(players.map((player) => [player.id, player.name]));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-3 py-6">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#f2a84f]/28 bg-[linear-gradient(180deg,rgba(255,242,214,0.78)_0%,rgba(255,205,123,0.4)_18%,rgba(255,151,53,0.2)_100%)] p-4 text-[#4f220f] shadow-[0_24px_80px_rgba(84,29,0,0.18)] backdrop-blur-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-ui text-[10px] font-black uppercase tracking-[0.32em] text-[#b55d16]">Round Summary</div>
            <div className="font-raja mt-1 text-3xl font-black uppercase text-[#7a320d] sm:text-4xl">
              Court Ledger
            </div>
            <div className="game-subtitle mt-2 text-sm text-[#8f4a1a] sm:text-base">
              Every round, every role, and every score swing in one place.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e4a559]/40 bg-white/45 px-4 py-2 font-ui text-xs font-black uppercase tracking-[0.18em] text-[#7a320d] transition hover:bg-white/65"
          >
            Close
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-auto rounded-[22px] border border-[#efb86c]/40 bg-white/35">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10 bg-[#f6c784]">
              <tr>
                <th className="px-4 py-3 font-ui text-[10px] font-black uppercase tracking-[0.22em] text-[#8a3a10]">Round</th>
                <th className="px-4 py-3 font-ui text-[10px] font-black uppercase tracking-[0.22em] text-[#8a3a10]">Player</th>
                <th className="px-4 py-3 font-ui text-[10px] font-black uppercase tracking-[0.22em] text-[#8a3a10]">Role</th>
                <th className="px-4 py-3 font-ui text-[10px] font-black uppercase tracking-[0.22em] text-[#8a3a10]">Round Score</th>
                <th className="px-4 py-3 font-ui text-[10px] font-black uppercase tracking-[0.22em] text-[#8a3a10]">Total Score</th>
                <th className="px-4 py-3 font-ui text-[10px] font-black uppercase tracking-[0.22em] text-[#8a3a10]">Result</th>
              </tr>
            </thead>
            <tbody>
              {roundHistory.flatMap((round) =>
                round.players.map((player, index) => {
                  const guessedName = round.guessedId ? playerNameMap.get(round.guessedId) ?? "Unknown" : "None";
                  const resultLabel = round.correct
                    ? `Mantri caught ${playerNameMap.get(round.chorId) ?? "Chor"}`
                    : `Chor escaped, guessed ${guessedName}`;

                  return (
                    <tr
                      key={`${round.roundNumber}-${player.id}`}
                      className={index % 2 === 0 ? "bg-[#fff4df]/55" : "bg-transparent"}
                    >
                      <td className="whitespace-nowrap border-t border-[#e7bf87]/45 px-4 py-3 font-ui text-sm font-black text-[#6b2d0d]">
                        {round.roundNumber}
                      </td>
                      <td className="whitespace-nowrap border-t border-[#e7bf87]/45 px-4 py-3 font-ui text-sm text-[#5f2b13]">
                        {player.name}
                      </td>
                      <td className={`whitespace-nowrap border-t border-[#e7bf87]/45 px-4 py-3 font-ui text-sm font-black uppercase ${roleColors[player.role ?? ""] ?? "text-[#9a5c25]"}`}>
                        {roleLabels[player.role ?? ""] ?? "UNKNOWN"}
                      </td>
                      <td className="whitespace-nowrap border-t border-[#e7bf87]/45 px-4 py-3 font-ui text-sm font-black text-[#b65810]">
                        +{player.roundScore}
                      </td>
                      <td className="whitespace-nowrap border-t border-[#e7bf87]/45 px-4 py-3 font-ui text-sm text-[#7b4218]">
                        {player.totalScore}
                      </td>
                      <td className="border-t border-[#e7bf87]/45 px-4 py-3 font-ui text-xs uppercase tracking-[0.12em] text-[#9a5c25]">
                        {resultLabel}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function GameShell({ roomId, phase, players, myId, currentRound, totalRounds, title, subtitle, children }: ShellProps) {
  const showFinalScoring = phase === "RESULT";

  return (
    <div className="relative w-full max-w-7xl">
      <div className="premium-nav no-scrollbar flex min-w-full flex-nowrap items-center justify-between gap-3 overflow-x-auto rounded-full border border-[#f0b256]/35 bg-[linear-gradient(180deg,rgba(255,247,228,0.55)_0%,rgba(255,209,136,0.24)_100%)] px-3 py-2 text-[#7c330c] shadow-[0_18px_50px_rgba(120,45,0,0.14)] backdrop-blur-2xl">
        <div className="shrink-0 rounded-full border border-[#efb86c]/45 bg-white/[0.34] px-4 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.22em] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:px-5 sm:text-[10px]">
          <span className="font-ui text-[#c96f17]">Room Code</span>
          <span className="font-ui ml-2 text-[#6e2f10]">{roomId || "----"}</span>
        </div>

        <div className="min-w-[300px] flex-1 px-2 text-center">
          <div className="font-raja text-2xl font-black uppercase tracking-[0.08em] text-[#7d320c] drop-shadow-[0_0_10px_rgba(255,194,72,0.12)] sm:text-4xl">
            Raja Mantri Chor Sipahi
          </div>
          <div className="font-ui text-[9px] font-black uppercase tracking-[0.4em] text-[#cf7316] sm:text-[10px]">
            Tense Court Deduction
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-[#efb86c]/45 bg-white/[0.34] px-4 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.2em] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:px-5 sm:text-[10px]">
          <div className="font-ui text-[#6e2f10]">{showFinalScoring ? `Final ${totalRounds}/${totalRounds}` : `Round ${currentRound}/${totalRounds}`}</div>
          <div className="font-ui text-[#c96f17]">Players {players.length}/4</div>
        </div>
      </div>

      <div className="relative mt-4 min-h-[calc(100vh-112px)] overflow-hidden rounded-[30px] border border-[#f0b256]/35 bg-[linear-gradient(180deg,rgba(255,248,231,0.56)_0%,rgba(255,214,143,0.3)_22%,rgba(255,162,66,0.16)_100%)] p-3 shadow-[0_20px_60px_rgba(120,45,0,0.14)] backdrop-blur-xl sm:p-4 lg:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,201,110,0.18)_0%,transparent_38%),radial-gradient(circle_at_20%_12%,rgba(255,170,74,0.14)_0%,transparent_26%),radial-gradient(circle_at_80%_85%,rgba(255,132,39,0.12)_0%,transparent_30%)]" />
        <div className="mandala-field pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_62%,rgba(177,82,17,0.08)_100%)]" />

        {(title || subtitle) && (
          <div className={phase === "RESULT" ? "relative z-10 mx-auto mb-4 max-w-3xl pt-2 text-center" : "pointer-events-none absolute inset-x-4 top-5 z-20 mx-auto max-w-3xl text-center"}>
            {title && <div className="font-ui text-xs font-black uppercase tracking-[0.42em] text-[#cd7218] sm:text-sm">{title}</div>}
            {subtitle && <div className="game-subtitle mt-2 text-base font-bold text-[#8d4316] sm:text-xl">{subtitle}</div>}
          </div>
        )}

        <div className="relative z-10">{children}</div>

        <div className="relative z-10 mt-3 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-[#c86b16]">
          <span className="font-ui">
            {phase === "REVEAL" && "Role Reveal"}
            {phase === "GUESSING" && "Mantri Is Guessing"}
            {phase === "RESULT" && "Round Result"}
            {phase === "WAITING" && "Waiting For Round"}
          </span>
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
    <div className="reveal-card relative mx-auto max-w-[220px] overflow-hidden rounded-[24px] border border-[#efb86c]/38 bg-[linear-gradient(180deg,rgba(255,246,228,0.82)_0%,rgba(255,216,148,0.5)_36%,rgba(255,172,80,0.22)_100%)] px-3 py-3 text-center text-[#5b240f] shadow-[0_14px_34px_rgba(125,45,0,0.12)] backdrop-blur-2xl sm:max-w-[270px] sm:px-3 sm:py-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,233,183,0.26)_0%,transparent_42%)]" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[23px] border border-white/18" />
      {imageSrc ? (
        <div className="relative z-10 rounded-[18px] border border-[#f0bf82]/36 bg-[linear-gradient(180deg,rgba(255,250,239,0.7)_0%,rgba(255,228,181,0.34)_100%)] px-2 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
          <img
            src={imageSrc}
            alt={role}
            loading="eager"
            decoding="async"
            className="mx-auto h-16 w-auto object-contain drop-shadow-[0_10px_12px_rgba(102,46,0,0.16)] sm:h-24"
          />
          <div className={`font-raja mt-2 text-xl font-black uppercase tracking-[0.08em] sm:text-3xl ${accentClass}`}>{role}</div>
          <div className="game-subtitle mt-1 text-sm font-bold text-[#7d3511] sm:text-base">{hindiLine}</div>
          <div className="font-ui mt-0.5 text-[8px] font-black uppercase tracking-[0.22em] text-[#bc6516] sm:text-[10px]">{englishLine}</div>
        </div>
      ) : (
        <>
          <div className="text-4xl sm:text-5xl">{icon}</div>
          <div className={`font-raja mt-3 text-xl font-black uppercase sm:text-4xl ${accentClass}`}>{role}</div>
          <div className="game-subtitle mt-2 text-xl font-bold text-[#7d3511] sm:text-3xl">{hindiLine}</div>
          <div className="font-ui mt-1 text-base font-extrabold tracking-wide text-[#7d3511] sm:text-2xl">{englishLine}</div>
        </>
      )}
    </div>
  );
}

export function PlayerGrid({
  players,
  myId,
  centerContent,
  highlightId,
  revealRoleForId,
  selectedId,
  onSelect,
}: PlayerGridProps) {
  const orderedPlayers = [
    ...players.filter((player) => player.id !== myId),
    ...players.filter((player) => player.id === myId),
  ];
  const leftPlayers = orderedPlayers.slice(0, 2);
  const rightPlayers = orderedPlayers.slice(2, 4);

  return (
    <div className="relative mx-auto grid min-h-[500px] w-full max-w-6xl items-center gap-3 py-2 lg:min-h-[390px] lg:grid-cols-[180px_minmax(240px,1fr)_180px] xl:grid-cols-[210px_minmax(280px,1fr)_210px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0bc72]/18 bg-[radial-gradient(circle,rgba(255,193,88,0.1)_0%,rgba(255,193,88,0.04)_38%,transparent_70%)] shadow-[0_0_28px_rgba(255,169,48,0.08)] lg:block" />
      <div className="order-2 flex flex-col gap-2.5 lg:col-start-1 lg:order-1">
        {leftPlayers.map((player) => (
          <PlayerSeat
            key={player.id}
            player={player}
            myId={myId}
            highlightId={highlightId}
            revealRoleForId={revealRoleForId}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
      {centerContent && (
        <div className="order-1 z-10 mx-auto w-full max-w-[300px] lg:order-2 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
          {centerContent}
        </div>
      )}
      <div className="order-3 flex flex-col gap-2.5 lg:col-start-3 lg:order-3">
        {rightPlayers.map((player) => (
          <PlayerSeat
            key={player.id}
            player={player}
            myId={myId}
            highlightId={highlightId}
            revealRoleForId={revealRoleForId}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerSeat({
  player,
  myId,
  highlightId,
  revealRoleForId,
  selectedId,
  onSelect,
}: {
  player: Player;
  myId?: string;
  highlightId?: string;
  revealRoleForId?: string;
  selectedId?: string;
  onSelect?: (playerId: string) => void;
}) {
  const selected = selectedId === player.id;
  const isCurrentPlayer = myId === player.id;
  const isActive = highlightId === player.id || selected;
  const clickable = Boolean(onSelect) && !isCurrentPlayer;
  const status = selected ? "speaking..." : isActive ? "thinking..." : isCurrentPlayer ? "you are here" : "waiting";

  return (
    <button
      type="button"
      onClick={() => clickable && onSelect?.(player.id)}
      disabled={!clickable}
      className={`group relative w-full rounded-[20px] border px-3 py-2.5 text-left transition duration-300 ${
        clickable ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.01]" : "cursor-default"
      } ${
        selected
          ? "border-[#eca84e]/70 bg-[linear-gradient(135deg,rgba(255,221,158,0.62)_0%,rgba(255,180,83,0.24)_100%)] shadow-[0_10px_24px_rgba(170,78,10,0.14)]"
          : isActive
            ? "border-[#efb263]/55 bg-[linear-gradient(135deg,rgba(255,226,181,0.52)_0%,rgba(255,191,108,0.18)_100%)] shadow-[0_8px_22px_rgba(190,94,14,0.1)]"
            : isCurrentPlayer
              ? "border-[#efb263]/45 bg-[linear-gradient(135deg,rgba(255,233,194,0.56)_0%,rgba(255,193,108,0.18)_100%)]"
              : "border-[#efc18b]/30 bg-white/[0.26] shadow-[0_10px_24px_rgba(120,45,0,0.08)]"
      } backdrop-blur-xl`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(player.id)} text-lg font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_14px_rgba(120,45,0,0.14)]`}>
          {player.name.slice(0, 1).toUpperCase()}
          <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#a25218] ${isActive ? "bg-[#ffb347] shadow-[0_0_8px_rgba(255,179,71,0.28)]" : "bg-[#d69b63]"}`} />
        </div>
        <div className="min-w-0">
          <div className="font-ui truncate text-sm font-black text-[#6f2f10]">{player.name}</div>
          <div className="font-ui mt-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#bc6516]">{status}</div>
          {revealRoleForId === player.id && player.role && (
            <div className={`font-ui mt-1 inline-flex rounded-full bg-white/40 px-2 py-0.5 text-[8px] font-black uppercase ${roleColors[player.role] ?? "text-[#9a5c25]"}`}>
              {roleLabels[player.role]}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function StatusRibbon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-3 w-fit rounded-full border border-[#efb263]/40 bg-[linear-gradient(180deg,rgba(255,243,217,0.62)_0%,rgba(255,198,106,0.22)_100%)] px-5 py-1.5 text-center text-xs font-black uppercase tracking-wide text-[#8b4012] shadow-[0_10px_22px_rgba(140,58,0,0.1)] backdrop-blur-xl sm:px-7 sm:py-2 sm:text-sm">
      <span className="font-ui">{children}</span>
    </div>
  );
}

export function ResultCard({
  result,
  players,
  myRole,
  currentRound,
  totalRounds,
  gameFinished,
  onNextRound,
  onPlayAgain,
  showNextRound,
  roundHistory = [],
}: ResultCardProps) {
  const [showSummary, setShowSummary] = useState(false);

  if (!result) return null;

  const chor = players.find((player) => player.id === result.chorId);
  const leaderboard = [...players].sort((left, right) => right.score - left.score);
  const topScore = leaderboard[0]?.score ?? 0;
  const finalWinnerIds = new Set(leaderboard.filter((player) => player.score === topScore).map((player) => player.id));
  const roundWinnerIds = new Set(
    players.filter((player) => (result.correct ? player.role !== "chor" : player.role === "chor")).map((player) => player.id),
  );
  const winningIds = gameFinished ? finalWinnerIds : roundWinnerIds;
  const mantri = players.find((player) => player.role === "mantri");
  const guessedPlayer = players.find((player) => player.id === result.guessedId);
  const outcomeTitle = gameFinished ? "Final Winner" : "Round Result";
  const outcomeMessage = gameFinished
    ? finalWinnerIds.size > 1
      ? "Joint Winners"
      : `${leaderboard[0]?.name ?? "Winner"} wins the game!`
    : result.correct
      ? "Mantri guessed correctly!"
      : "Chor escaped!";
  const outcomeDetail = result.correct
    ? `${mantri?.name ?? "Mantri"}${guessedPlayer ? ` guessed ${guessedPlayer.name}` : ""} and caught ${chor?.name ?? "the Chor"}.`
    : `${chor?.name ?? "The Chor"} stayed hidden and earned escape points.`;

  return (
    <>
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[#efb263]/34 bg-[linear-gradient(180deg,rgba(255,247,228,0.84)_0%,rgba(255,214,145,0.42)_22%,rgba(255,163,69,0.18)_100%)] px-3 py-4 text-[#5b240f] shadow-[0_20px_50px_rgba(120,45,0,0.14)] backdrop-blur-2xl sm:px-4 sm:py-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(255,214,118,0.16)_0%,rgba(255,143,45,0.06)_34%,transparent_68%)]" />
        <div className="pointer-events-none absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full border border-[#efb86c]/12 bg-[conic-gradient(from_0deg,transparent,rgba(255,215,102,0.08),transparent,rgba(255,143,45,0.05),transparent)] opacity-55 blur-[1px]" />

        <div className="relative z-10 text-center">
          <div className="font-ui text-[10px] font-black uppercase tracking-[0.42em] text-[#c96c16]">Celebration</div>
          <h2 className="font-raja mt-1 text-4xl font-black uppercase tracking-[0.06em] text-[#7a320d] drop-shadow-[0_0_10px_rgba(255,215,102,0.1)] sm:text-5xl">
            {outcomeTitle}
          </h2>
          <div className={`mx-auto mt-2 w-fit rounded-full border px-4 py-1.5 font-ui text-xs font-black uppercase tracking-[0.16em] ${
            gameFinished
              ? "border-[#efb263]/45 bg-[#fff2d4] text-[#8b4012] shadow-[0_8px_20px_rgba(201,108,22,0.08)]"
              : result.correct
                ? "border-[#efb263]/40 bg-[#fff1db] text-[#8b4012] shadow-[0_8px_18px_rgba(201,108,22,0.08)]"
                : "border-[#f09a71]/40 bg-[#fff0e7] text-[#8b4012] shadow-[0_8px_18px_rgba(201,108,22,0.08)]"
          }`}>
            {outcomeMessage}
          </div>
          <p className="game-subtitle mx-auto mt-2 max-w-2xl text-sm font-semibold text-[#8d4316] sm:text-base">
            {gameFinished ? "Final rankings are based on total score across all rounds." : outcomeDetail}
          </p>
        </div>

        <div className="relative z-10 mt-4 grid gap-4 lg:grid-cols-[1fr_330px]">
          <div className="rounded-[24px] border border-[#efc18b]/34 bg-white/[0.3] p-3 shadow-[0_12px_30px_rgba(120,45,0,0.08)] backdrop-blur-xl sm:p-4">
            {gameFinished && (
              <div className="mb-3 rounded-[22px] border border-[#efb263]/45 bg-[linear-gradient(180deg,rgba(255,244,220,0.9)_0%,rgba(255,210,130,0.45)_100%)] p-3 text-center shadow-[0_10px_22px_rgba(120,45,0,0.08)]">
                <div className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-[#c96c16]">
                  {finalWinnerIds.size > 1 ? "Joint Winners" : "Winner Spotlight"}
                </div>
                <div className="font-raja mt-1 text-3xl font-black uppercase text-[#7a320d] sm:text-4xl">
                  {leaderboard.filter((player) => finalWinnerIds.has(player.id)).map((player) => player.name).join(" & ")}
                </div>
                <div className="font-ui mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#8d4316]">
                  {topScore} total points
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-[#c96c16]">
                  {gameFinished ? "Last Round Roles" : "Role Reveal"}
                </div>
                <div className="font-raja text-2xl font-black uppercase text-[#7a320d] sm:text-3xl">
                  {gameFinished ? "Final Court Reveal" : "The Court Is Revealed"}
                </div>
              </div>
              <div className="font-ui text-[10px] font-black uppercase tracking-[0.2em] text-[#9e5420]">
                Round {currentRound}/{totalRounds}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
              {players.map((player, index) => {
                const role = getRoleMeta(player.role);
                const isChor = player.role === "chor";
                const isWinner = winningIds.has(player.id);

                return (
                  <div
                    key={player.id}
                    className={`result-flip-card relative min-h-[126px] overflow-hidden rounded-[18px] border p-2.5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
                      isChor
                        ? "border-[#f09a71]/45 bg-[linear-gradient(180deg,rgba(255,243,233,0.95)_0%,rgba(255,202,178,0.52)_100%)]"
                        : isWinner
                          ? "border-[#efb263]/58 bg-[linear-gradient(180deg,rgba(255,247,227,0.92)_0%,rgba(255,212,133,0.46)_100%)] shadow-[0_10px_22px_rgba(120,45,0,0.08)]"
                          : "border-[#efc18b]/32 bg-white/[0.28]"
                    }`}
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_45%)]" />
                    {isWinner && <div className="absolute right-2 top-2 rounded-full bg-[#f3bf63] px-2 py-0.5 font-ui text-[8px] font-black uppercase tracking-[0.12em] text-[#6f2f10]">Winner</div>}
                    <div className="relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/40 text-xl font-ui font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                      {role.icon}
                    </div>
                    <div className={`relative z-10 mt-2 font-raja text-xl font-black uppercase ${role.tone}`}>{role.label}</div>
                    <div className="relative z-10 truncate font-ui text-sm font-black text-[#6f2f10]">{player.name}</div>
                    <div className="relative z-10 mt-1.5 rounded-full border border-[#efc18b]/36 bg-white/45 px-2 py-1 font-ui text-[8px] font-black uppercase tracking-[0.12em] text-[#9a5c25]">
                      {player.id === result.chorId ? "The Chor" : result.correct && player.role === "mantri" ? "Correct Guess" : winningIds.has(player.id) ? "Round Winner" : "Revealed"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#efc18b]/34 bg-white/[0.3] p-3 shadow-[0_12px_30px_rgba(120,45,0,0.08)] backdrop-blur-xl sm:p-4">
            <div className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-[#c96c16]">Scoreboard</div>
            <div className="font-raja text-2xl font-black uppercase text-[#7a320d]">
              {gameFinished ? "Final Rankings" : "Rankings"}
            </div>

            <div className="mt-3 space-y-2">
              {leaderboard.map((player, index) => {
                const topPlayer = gameFinished ? finalWinnerIds.has(player.id) : index === 0;
                const role = getRoleMeta(player.role);
                const placementLabel = gameFinished && finalWinnerIds.size > 1 && finalWinnerIds.has(player.id) ? "Joint 1st" : getPlacementLabel(index);

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 rounded-[18px] border px-3 py-2 ${
                      topPlayer
                        ? "border-[#efb263]/52 bg-[linear-gradient(180deg,rgba(255,247,229,0.92)_0%,rgba(255,210,130,0.42)_100%)] shadow-[0_10px_20px_rgba(120,45,0,0.08)]"
                        : "border-[#efc18b]/32 bg-white/[0.24]"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-ui text-base font-black ${topPlayer ? "bg-[#f3bf63] text-[#6f2f10]" : "bg-white/45 text-[#9a5c25]"}`}>
                      {topPlayer ? getPlacementIcon(0) : getPlacementIcon(index)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-ui text-sm font-black text-[#6f2f10]">{player.name}</div>
                        <span className={`shrink-0 font-ui text-xs font-black ${role.tone}`}>{role.icon}</span>
                      </div>
                      <div className="font-ui text-[8px] font-black uppercase tracking-[0.16em] text-[#bc6516]">
                        {placementLabel} - {getRoundScoreLabel(player, result)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="score-count font-ui text-xl font-black text-[#c96c16]">{player.score}</div>
                      <div className="font-ui text-[8px] font-black uppercase tracking-[0.18em] text-[#9a5c25]">Total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {showNextRound && onNextRound && !gameFinished && currentRound < totalRounds ? (
            <button
              type="button"
              onClick={onNextRound}
            className="w-full rounded-full bg-[linear-gradient(180deg,#ffd27b_0%,#ff972e_100%)] px-6 py-3 font-ui text-sm font-black uppercase tracking-[0.18em] text-[#6f2f10] shadow-[0_12px_26px_rgba(201,108,22,0.14)] transition hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[210px]"
            >
              Play Next Round
            </button>
          ) : showNextRound && onPlayAgain && gameFinished ? (
            <button
              type="button"
              onClick={onPlayAgain}
            className="w-full rounded-full bg-[linear-gradient(180deg,#ffd27b_0%,#ff972e_100%)] px-6 py-3 font-ui text-sm font-black uppercase tracking-[0.18em] text-[#6f2f10] shadow-[0_12px_26px_rgba(201,108,22,0.14)] transition hover:scale-[1.02] active:scale-[0.98] sm:w-auto sm:min-w-[210px]"
            >
              Play Again
            </button>
          ) : (
            <div className="rounded-full border border-[#efb263]/35 bg-white/[0.24] px-5 py-2.5 font-ui text-xs font-black uppercase tracking-[0.2em] text-[#bc6516] backdrop-blur-xl">
              {gameFinished ? "Game Complete" : myRole ? "Waiting For Host" : "Round Complete"}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full rounded-full border border-[#efc18b]/34 bg-white/[0.24] px-6 py-3 font-ui text-sm font-black uppercase tracking-[0.18em] text-[#7a320d] shadow-[0_12px_24px_rgba(120,45,0,0.08)] transition hover:bg-white/[0.34] active:scale-[0.98] sm:w-auto"
          >
            Exit Room
          </button>
          <button
            type="button"
            onClick={() => setShowSummary(true)}
            className="w-full rounded-full border border-[#efb263]/36 bg-[#fff0d8] px-6 py-3 font-ui text-sm font-black uppercase tracking-[0.18em] text-[#8b4012] shadow-[0_12px_24px_rgba(120,45,0,0.08)] transition hover:bg-[#fff5e6] active:scale-[0.98] sm:w-auto"
          >
            View Summary
          </button>
        </div>
      </div>

      {showSummary && <SummaryModal players={players} roundHistory={roundHistory} onClose={() => setShowSummary(false)} />}
    </>
  );
}
