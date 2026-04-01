import Peer from "simple-peer";
import socket from "../socket/socket";

let peers: Record<string, any> = {};
let localStream: MediaStream | null = null;
let analyser: AnalyserNode | null = null;
let speakingLoop: number | null = null;
let audioContext: AudioContext | null = null;
let activeRoomId: string | null = null;

export async function startVoice(roomId: string) {

  if (localStream) return;

  activeRoomId = roomId;

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  setupSpeakingDetection(roomId);

  socket.emit("voice_join", { roomId });

  /* EXISTING USERS */

  socket.off("voice_users");
  socket.on("voice_users", (users: string[]) => {

    users.forEach(userId => {

      if (peers[userId]) return;

      const peer = createPeer(userId, true);

      peers[userId] = peer;

    });

  });

  /* NEW USER JOINED */

  socket.off("voice_user_joined");
  socket.on("voice_user_joined", (userId: string) => {

    if (peers[userId]) return;

    const peer = createPeer(userId, true);

    peers[userId] = peer;

  });

  /* SIGNAL HANDLING */

  socket.off("voice_signal");
  socket.on("voice_signal", ({ from, signal }) => {

    if (!peers[from]) {

      const peer = createPeer(from, false);

      peers[from] = peer;

    }

    peers[from].signal(signal);

  });

  /* USER LEFT */

  socket.off("voice_user_left");
  socket.on("voice_user_left", (userId: string) => {

    if (peers[userId]) {
      peers[userId].destroy();
      delete peers[userId];
    }

  });

}

/* CREATE PEER */

function createPeer(userId: string, initiator: boolean) {

  const peer = new Peer({
    initiator,
    trickle: false,
    stream: localStream!
  });

  peer.on("signal", signal => {

    socket.emit("voice_signal", {
      target: userId,
      signal
    });

  });

  peer.on("stream", stream => {

    playAudio(stream);

  });

  return peer;

}


/* STOP VOICE */

export function stopVoice() {

  Object.values(peers).forEach((peer: any) => peer.destroy());

  peers = {};

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  localStream = null;

  if (speakingLoop) cancelAnimationFrame(speakingLoop);
  speakingLoop = null;

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  analyser = null;

  socket.off("voice_users");
  socket.off("voice_user_joined");
  socket.off("voice_signal");
  socket.off("voice_user_left");

  if (activeRoomId) {
    socket.emit("voice_leave", { roomId: activeRoomId });
    activeRoomId = null;
  }

}


/* PLAY AUDIO */

function playAudio(stream: MediaStream) {

  const audio = document.createElement("audio");

  audio.srcObject = stream;
  audio.autoplay = true;
  audio.playsInline = true;

  document.body.appendChild(audio);

}


/* SPEAKING DETECTION */

function setupSpeakingDetection(roomId: string) {

  audioContext = new AudioContext();

  const mic = audioContext.createMediaStreamSource(localStream!);

  analyser = audioContext.createAnalyser();

  analyser.fftSize = 256;

  mic.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);

  let speaking = false;

  function detectSpeaking() {

    analyser!.getByteFrequencyData(data);

    const volume =
      data.reduce((a, b) => a + b, 0) / data.length;

    const isSpeaking = volume > 45;

    if (isSpeaking !== speaking) {

      speaking = isSpeaking;

      socket.emit("speaking", {
        roomId,
        speaking
      });

    }

    speakingLoop = requestAnimationFrame(detectSpeaking);

  }

  detectSpeaking();

}
