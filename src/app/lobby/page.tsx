"use client";

import { Suspense } from "react";
import LobbyContent from "./LobbyContent";

export default function LobbyPage() {
  return (
    <Suspense fallback={<div>Loading lobby...</div>}>
      <LobbyContent />
    </Suspense>
  );
}