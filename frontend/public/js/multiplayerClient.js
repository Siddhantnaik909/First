/**
 * multiplayerClient.js — Socket.IO wrapper for Smart Hub multiplayer games.
 * 
 * Security fix: Now sends JWT auth token in socket handshake.
 * This allows the server to identify authenticated users and reject
 * unauthenticated score submissions.
 */

class MultiplayerClient {
    constructor(gameName, onPlayerJoined, onOpponentAction, onPlayerLeft) {
        // ✅ FIX: Send JWT token in socket handshake for server-side authentication
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || null;

        this.socket = window.io ? io({
            auth: { token },            // ← JWT sent to server io.use() middleware
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        }) : null;

        if (!this.socket) {
            console.error('[MultiplayerClient] Socket.io not found! Multiplayer unavailable.');
            return;
        }

        this.gameName = gameName;
        this.roomCode = null;

        // Extract username from JWT-decoded user (set by auth-system.js shim)
        const userData = (() => {
            try {
                const raw = localStorage.getItem('user');
                return raw ? JSON.parse(raw) : null;
            } catch { return null; }
        })();
        
        this.username = (userData && (userData.name || userData.username))
            ? (userData.name || userData.username)
            : `Guest_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        this.isHost = false;

        // Callbacks
        this.onPlayerJoined = onPlayerJoined || function () {};
        this.onOpponentAction = onOpponentAction || function () {};
        this.onPlayerLeft = onPlayerLeft || function () {};
        this.onRoomReady = null;

        this.setupSocketListeners();

        // Auto-rejoin if navigating from game lobby (room code in URL)
        const urlParams = new URLSearchParams(window.location.search);
        const roomFromUrl = urlParams.get('room');
        const isHostFromUrl = urlParams.get('host');
        if (roomFromUrl) {
            this.roomCode = roomFromUrl;
            this.isHost = isHostFromUrl === 'true';
            this.socket.emit('join_room', { roomCode: this.roomCode, username: this.username });
        }
    }

    setupSocketListeners() {
        this.socket.on('room_created', (data) => {
            this.roomCode = data.roomCode;
            this.isHost = true;
            if (this.onRoomReady) this.onRoomReady(this.roomCode);
        });

        this.socket.on('game_start', (data) => {
            console.log('[MP] Game starting with players:', data.players);
        });

        this.socket.on('player_joined', (data) => {
            this.onPlayerJoined(data.players);
        });

        this.socket.on('opponent_action', (data) => {
            if (data.action === 'launch_game') {
                window.location.href = `${data.payload}?room=${this.roomCode}&host=false`;
                return;
            }
            this.onOpponentAction(data);
        });

        this.socket.on('player_left', (data) => {
            this.onPlayerLeft(data);
        });

        this.socket.on('room_error', (data) => {
            console.warn('[MP] Room error:', data.message);
            if (typeof showAlert === 'function') showAlert(data.message, 'error');
            else alert(data.message);
        });

        this.socket.on('game_error', (data) => {
            console.warn('[MP] Game error:', data.message);
        });

        this.socket.on('connect_error', (err) => {
            console.error('[MP] Connection error:', err.message);
        });
    }

    createRoom(roomName) {
        this.socket.emit('create_room', { username: this.username, gameName: this.gameName, roomName });
    }

    joinRoom(code) {
        this.roomCode = code.toUpperCase().trim();
        this.socket.emit('join_room', { roomCode: this.roomCode, username: this.username });
        this.isHost = false;
    }

    sendAction(actionName, payload) {
        if (!this.roomCode) return;
        this.socket.emit('game_action', {
            roomCode: this.roomCode,
            action: actionName,
            payload: payload,
            timestamp: Date.now()
        });
    }

    syncGameState(stateData) {
        if (!this.roomCode) return;
        this.socket.emit('game_action', {
            roomCode: this.roomCode,
            action: 'SYNC_STATE',
            payload: stateData
        });
    }

    submitScore(score, vehicle = null) {
        this.socket.emit('submit_score', { score, vehicle });
    }

    submitWin(gameType) {
        this.socket.emit('submit_win', { gameType });
    }

    launchGame(gameUrl) {
        if (!this.roomCode || !this.isHost) return;
        this.sendAction('launch_game', gameUrl);
        setTimeout(() => {
            window.location.href = `${gameUrl}?room=${this.roomCode}&host=true`;
        }, 300);
    }

    disconnect() {
        if (this.socket) this.socket.disconnect();
    }
}

window.MultiplayerClient = MultiplayerClient;
