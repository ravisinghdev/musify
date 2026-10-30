export interface RoomMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
  ws: any;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  hostName: string;
  currentTrack: any | null;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
  membersCount: number;
}

export class RoomService {
  private rooms = new Map<
    string,
    {
      state: RoomState;
      members: Map<string, RoomMember>;
    }
  >();

  createRoom(roomId: string, hostId: string, hostName: string): RoomState {
    const cleanCode = roomId.toUpperCase();
    const state: RoomState = {
      roomId: cleanCode,
      hostId,
      hostName,
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      updatedAt: Date.now(),
      membersCount: 0,
    };

    this.rooms.set(cleanCode, {
      state,
      members: new Map(),
    });

    return state;
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId.toUpperCase());
  }

  joinRoom(
    roomId: string,
    member: { id: string; name: string; avatarUrl?: string },
    ws: any,
  ): RoomState | null {
    const code = roomId.toUpperCase();
    let room = this.rooms.get(code);

    if (!room) {
      // Auto-create room if not found so room codes can be instantly shared
      this.createRoom(code, member.id, member.name);
      room = this.rooms.get(code)!;
    }

    const isHost = room.state.hostId === member.id || room.members.size === 0;
    if (isHost) {
      room.state.hostId = member.id;
      room.state.hostName = member.name;
    }

    const newMember: RoomMember = {
      ...member,
      isHost,
      ws,
    };

    room.members.set(member.id, newMember);
    room.state.membersCount = room.members.size;

    // Broadcast member joined
    this.broadcast(code, {
      type: "MEMBER_JOINED",
      member: { id: member.id, name: member.name, avatarUrl: member.avatarUrl, isHost },
      membersCount: room.members.size,
    });

    return room.state;
  }

  leaveRoom(roomId: string, memberId: string): void {
    const code = roomId.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    room.members.delete(memberId);
    room.state.membersCount = room.members.size;

    if (room.members.size === 0) {
      // Cleanup empty room after 5 minutes
      setTimeout(() => {
        const check = this.rooms.get(code);
        if (check && check.members.size === 0) {
          this.rooms.delete(code);
        }
      }, 300_000);
      return;
    }

    // Reassign host if host left
    if (room.state.hostId === memberId) {
      const nextMember = room.members.values().next().value;
      if (nextMember) {
        nextMember.isHost = true;
        room.state.hostId = nextMember.id;
        room.state.hostName = nextMember.name;
      }
    }

    this.broadcast(code, {
      type: "MEMBER_LEFT",
      memberId,
      newHostId: room.state.hostId,
      membersCount: room.members.size,
    });
  }

  syncPlayback(
    roomId: string,
    action: {
      type: "PLAY" | "PAUSE" | "SEEK" | "TRACK_CHANGE";
      track?: any;
      currentTime?: number;
      isPlaying?: boolean;
    },
    senderId: string,
  ): void {
    const code = roomId.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    if (action.track !== undefined) room.state.currentTrack = action.track;
    if (action.currentTime !== undefined) room.state.currentTime = action.currentTime;
    if (action.isPlaying !== undefined) room.state.isPlaying = action.isPlaying;
    room.state.updatedAt = Date.now();

    // Broadcast to all other members in room
    for (const [id, member] of room.members.entries()) {
      if (id !== senderId) {
        try {
          member.ws.send(
            JSON.stringify({
              type: "SYNC_PLAYBACK",
              action,
              state: room.state,
            }),
          );
        } catch {}
      }
    }
  }

  broadcast(roomId: string, payload: any): void {
    const code = roomId.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const data = JSON.stringify(payload);
    for (const member of room.members.values()) {
      try {
        member.ws.send(data);
      } catch {}
    }
  }
}

export const roomService = new RoomService();

