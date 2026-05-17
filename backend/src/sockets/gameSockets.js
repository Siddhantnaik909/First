const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

/**
 * gameSockets.js — Server-authoritative socket handler
 * 
 * Key security improvements:
 * - JWT authentication on connection (authenticated users only submit scores/wins)
 * - Turn validation (can't move when it's not your turn)
 * - All score/win submissions tied to verified socket.user identity
 */
module.exports = function (io) {
    const activeRooms = {};
    const globalLeaderboard = [];
    const globalWinsLeaderboard = {};

    // Expose activeRooms on io so admin routes can inspect them
    io.activeRooms = activeRooms;

    // ─── JWT Authentication Middleware ───────────────────────────────────────
    // Sockets without a valid token are treated as guests.
    // Guests can join rooms and play, but CANNOT submit scores.
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            socket.user = { id: `guest_${socket.id}`, role: 'guest', username: null, isGuest: true };
            return next();
        }
        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            // Support both payload shapes
            const u = decoded.user || decoded;
            socket.user = {
                id: String(u.id || u.sub),
                role: u.role || 'user',
                username: u.name || u.username || u.email || `Player_${socket.id.slice(0, 4)}`,
                email: u.email || '',
                isGuest: false
            };
        } catch {
            // Invalid token → treat as guest
            socket.user = { id: `guest_${socket.id}`, role: 'guest', username: null, isGuest: true };
        }
        next();
    });

    // ─── Connection ──────────────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const displayName = socket.user?.username || `Guest_${socket.id.slice(0, 6)}`;
        console.log(`[Socket] Connected: ${socket.id} | User: ${displayName}`);

        // Send current leaderboard on connect
        socket.emit('leaderboard_update', globalLeaderboard);

        // Join personal notification room for DMs (authenticated users only)
        if (!socket.user.isGuest) {
            socket.join(`user_${socket.user.id}`);
        }

        // ─── Room Events ─────────────────────────────────────────────────────

        socket.on('create_room', (data) => {
            const username = socket.user.username || data?.username || `Guest_${socket.id.slice(0, 4)}`;
            const roomCode = Math.random().toString(36).substring(2, 8).padEnd(6, 'X').toUpperCase();

            socket.join(roomCode);
            activeRooms[roomCode] = {
                players: [{ id: socket.id, userId: socket.user.id, username, score: 0 }],
                gameData: { turnIndex: 0, moves: [], state: 'waiting' },
                createdAt: new Date()
            };

            socket.emit('room_created', { roomCode });
            console.log(`[Socket] Room ${roomCode} created by ${username}`);
        });

        socket.on('join_room', (data) => {
            const { roomCode } = data || {};
            const username = socket.user.username || data?.username || `Guest_${socket.id.slice(0, 4)}`;

            if (!roomCode) return socket.emit('room_error', { message: 'Room code required' });

            const room = activeRooms[roomCode];
            if (!room) return socket.emit('room_error', { message: 'Invalid Room Code!' });
            if (room.players.length >= 2) return socket.emit('room_error', { message: 'Room is full! Only 2 players allowed.' });

            // Clear pending delete timeout if reconnecting
            if (room.deleteTimeout) {
                clearTimeout(room.deleteTimeout);
                room.deleteTimeout = null;
            }

            // Handle reconnection — update socket ID if same username
            const existingIdx = room.players.findIndex(p => p.username === username);
            if (existingIdx !== -1) {
                room.players[existingIdx].id = socket.id;
            } else {
                room.players.push({ id: socket.id, userId: socket.user.id, username, score: 0 });
            }

            socket.join(roomCode);

            // Game starts when 2 players are in the room
            if (room.players.length === 2) {
                room.gameData.state = 'active';
                io.to(roomCode).emit('game_start', { players: room.players });
            }

            io.to(roomCode).emit('player_joined', {
                message: `${username} joined the game!`,
                players: room.players
            });

            console.log(`[Socket] ${username} joined Room ${roomCode}`);
        });

        // ─── Game Action (Server-Side Turn Validation) ───────────────────────

        socket.on('game_action', (data) => {
            const { roomCode, action, payload } = data || {};
            if (!roomCode || !activeRooms[roomCode]) return;

            const room = activeRooms[roomCode];
            if (room.gameData.state !== 'active') return;

            // Validate: is this player's turn?
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex === -1) return; // Not a registered player in this room

            if (playerIndex !== room.gameData.turnIndex) {
                return socket.emit('game_error', { message: 'Not your turn!' });
            }

            // Record move server-side (audit trail)
            room.gameData.moves.push({
                player: playerIndex,
                username: room.players[playerIndex].username,
                action,
                payload,
                timestamp: Date.now()
            });

            // Advance turn (toggle between 0 and 1)
            room.gameData.turnIndex = 1 - room.gameData.turnIndex;

            // Relay validated move to opponent
            socket.to(roomCode).emit('opponent_action', { action, payload });
        });

        // ─── Game Over ───────────────────────────────────────────────────────

        socket.on('game_over', (data) => {
            const { roomCode, winner } = data || {};
            if (!roomCode || !activeRooms[roomCode]) return;

            const room = activeRooms[roomCode];
            room.gameData.state = 'finished';
            io.to(roomCode).emit('game_ended', { winner });
        });

        // ─── Leaderboard (Authenticated Only) ───────────────────────────────

        socket.on('submit_score', (data) => {
            // Reject unauthenticated score submissions
            if (socket.user.isGuest) {
                return socket.emit('game_error', { message: 'You must be logged in to submit scores.' });
            }

            const { score, vehicle } = data || {};
            const username = socket.user.username;
            if (!username || typeof score !== 'number' || score < 0) return;

            const existingIdx = globalLeaderboard.findIndex(e => e.username === username);
            if (existingIdx !== -1) {
                if (score > globalLeaderboard[existingIdx].score) {
                    globalLeaderboard[existingIdx] = { username, score, vehicle };
                }
            } else {
                globalLeaderboard.push({ username, score, vehicle });
            }

            globalLeaderboard.sort((a, b) => b.score - a.score);
            if (globalLeaderboard.length > 8) globalLeaderboard.pop();

            io.emit('leaderboard_update', globalLeaderboard);
        });

        socket.on('submit_win', (data) => {
            // Reject unauthenticated win submissions
            if (socket.user.isGuest) return;

            const { gameType } = data || {};
            const username = socket.user.username;
            if (!username || !gameType || !/^[a-z0-9_]+$/.test(gameType)) return;

            if (!globalWinsLeaderboard[gameType]) globalWinsLeaderboard[gameType] = [];
            const board = globalWinsLeaderboard[gameType];

            const idx = board.findIndex(e => e.username === username);
            if (idx !== -1) {
                board[idx].wins += 1;
            } else {
                board.push({ username, wins: 1 });
            }

            board.sort((a, b) => b.wins - a.wins);
            if (board.length > 10) board.pop();

            io.emit(`${gameType}_leaderboard_update`, board);
        });

        // ─── Disconnect Handler ──────────────────────────────────────────────

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);

            for (const roomCode in activeRooms) {
                const room = activeRooms[roomCode];
                const playerIdx = room.players.findIndex(p => p.id === socket.id);

                if (playerIdx !== -1) {
                    const disconnectedName = room.players[playerIdx].username;
                    room.players.splice(playerIdx, 1);

                    if (room.players.length === 0) {
                        // Delay deletion — allow 15s for page navigation / reconnect
                        room.deleteTimeout = setTimeout(() => {
                            if (activeRooms[roomCode]?.players.length === 0) {
                                delete activeRooms[roomCode];
                                console.log(`[Socket] Room ${roomCode} cleaned up`);
                            }
                        }, 15000);
                    } else {
                        room.gameData.state = 'paused';
                        io.to(roomCode).emit('player_left', {
                            message: `${disconnectedName} disconnected. Waiting for reconnect...`,
                            players: room.players
                        });
                    }
                    break;
                }
            }
        });
    });
};
