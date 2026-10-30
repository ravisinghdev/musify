"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "./Icons";
import type { Track } from "../types/music";
import type { SafeUser } from "../lib/store";

export interface ListeningRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: SafeUser | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  onRemoteAction: (action: {
    type: "PLAY" | "PAUSE" | "SEEK" | "TRACK_CHANGE";
    track?: Track;
    currentTime?: number;
    isPlaying?: boolean;
  }) => void;
  onShowToast?: (title: string, message?: string, type?: "success" | "info" | "heart") => void;
}

interface ChatMsg {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export function ListeningRoomModal({
  isOpen,
  onClose,
  authUser,
  currentTrack,
  isPlaying,
  currentTime,
  onRemoteAction,
  onShowToast,
}: ListeningRoomModalProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [membersCount, setMembersCount] = useState<number>(1);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [msgInput, setMsgInput] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  const [anonId, setAnonId] = useState<string>("anon_guest");
  useEffect(() => {
    if (!authUser?.id) {
      setAnonId(`anon_${Math.random().toString(36).substring(2, 9)}`);
    }
  }, [authUser?.id]);

  const memberName = authUser?.displayName || "Listener";
  const memberId = authUser?.id || anonId;
  const avatarUrl = authUser?.avatarUrl || "";

  // Connect to room via WebSocket
  const connectToRoom = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const host = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const port = window.location.port === "3000" ? ":3001" : window.location.port ? `:${window.location.port}` : "";
    const wsUrl = `${protocol}//${host}${port}/ws/rooms/${clean}?memberId=${encodeURIComponent(
      memberId,
    )}&name=${encodeURIComponent(memberName)}&avatarUrl=${encodeURIComponent(avatarUrl)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setRoomId(clean);
        onShowToast?.("Room Connected", `Joined room ${clean}`, "success");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "ROOM_CONNECTED") {
            setMembersCount(data.state?.membersCount || 1);
            setIsHost(data.state?.hostId === memberId);
            if (data.state?.currentTrack && !isHost) {
              onRemoteAction({
                type: "TRACK_CHANGE",
                track: data.state.currentTrack,
                currentTime: data.state.currentTime,
                isPlaying: data.state.isPlaying,
              });
            }
          } else if (data.type === "MEMBER_JOINED") {
            setMembersCount(data.membersCount);
            onShowToast?.("Friend Joined", `${data.member.name} joined the room!`, "info");
          } else if (data.type === "MEMBER_LEFT") {
            setMembersCount(data.membersCount);
          } else if (data.type === "SYNC_PLAYBACK") {
            onRemoteAction(data.action);
          } else if (data.type === "CHAT_MESSAGE") {
            setChatMessages((prev) => [...prev, data]);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
        onShowToast?.("Connection Error", "Could not connect to listening room", "info");
      };
    } catch {
      setIsConnected(false);
    }
  };

  // Broadcast host playback state changes
  useEffect(() => {
    if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!isHost) return;

    wsRef.current.send(
      JSON.stringify({
        type: "ACTION",
        action: {
          type: isPlaying ? "PLAY" : "PAUSE",
          track: currentTrack,
          currentTime,
          isPlaying,
        },
      }),
    );
  }, [isPlaying, currentTrack?.id, isConnected, isHost]);

  const handleCreateRoom = () => {
    const generated = `MUS-${Math.floor(100 + Math.random() * 900)}`;
    connectToRoom(generated);
  };

  const handleJoinInput = () => {
    if (inputCode.trim()) {
      connectToRoom(inputCode);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: "CHAT",
        name: memberName,
        text: msgInput.trim(),
      }),
    );
    setMsgInput("");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      onShowToast?.("Link Copied", "Share invite link with friends", "success");
    }
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setRoomId("");
    setChatMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Listen Together Room"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e16]/90 p-6 backdrop-blur-2xl shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-md">
              <Icon name="sparkles" size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Listen Together</h2>
              <p className="text-[11px] text-zinc-400">Real-time synchronized playback with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {!isConnected ? (
          <div className="space-y-4 pt-1">
            <button
              onClick={handleCreateRoom}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition active:scale-[0.98] shadow-lg"
            >
              <Icon name="play" size={15} />
              <span>Create New Listening Room</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">or join room</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter Code (e.g. MUS-402)"
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition uppercase"
              />
              <button
                onClick={handleJoinInput}
                disabled={!inputCode.trim()}
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15 transition active:scale-[0.98] disabled:opacity-40"
              >
                Join
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Active Room Badge & Code */}
            <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5 backdrop-blur-xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Active Room</span>
                <h3 className="text-xl font-black font-mono text-white tracking-wider">{roomId}</h3>
                <p className="text-[11px] text-zinc-300">
                  {membersCount} {membersCount === 1 ? "listener" : "listeners"} connected &bull; {isHost ? "You are Host" : "Synced to Host"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  title="Copy invite link"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95 border border-white/10"
                >
                  <Icon name="share" size={15} />
                </button>
                <button
                  onClick={handleLeaveRoom}
                  title="Leave room"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition active:scale-95 border border-rose-500/30"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            </div>

            {/* Live Chat Box */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400">Live Room Chat</span>
              <div className="h-36 overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-2 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No messages yet. Say hi to the room!</p>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="font-semibold text-indigo-300 text-[11px]">{msg.senderName}</span>
                      <span className="text-zinc-200">{msg.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Send message..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
