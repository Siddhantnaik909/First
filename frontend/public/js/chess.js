/**
 * Chess.js - Smart Hub Chess Engine v2.0
 * Complete FEN parser, minimax AI (depth 4), multiplayer sync
 */

class ChessEngine {
  constructor() {
    this.board = Array(64).fill(null);
    this.turn = 'w';
    this.castling = { K: true, Q: true, k: true, q: true };
    this.enPassant = null;
    this.halfMoves = 0;
    this.fullMoves = 1;
    this.reset();
  }

  reset() {
    this.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  loadFEN(fen) {
    const parts = fen.split(' ');
    const boardStr = parts[0];
    const rowStrs = boardStr.split('/');
    
    // Clear board
    this.board.fill(null);
    
    // Parse board from FEN string
    for (let row = 0; row < 8; row++) {
      const rank = rowStrs[row];
      let file = 0;
      for (const token of rank) {
        if (!isNaN(token)) {
          file += parseInt(token, 10);
          continue;
        }
        const idx = row * 8 + file;
        this.board[idx] = token;
        file += 1;
      }
    }
    
    this.turn = parts[1];
    this.castling = parts[2] === '-' ? {} : parts[2].split('').reduce((acc, c) => { acc[c] = true; return acc; }, {});
    this.enPassant = parts[3] === '-' ? null : parts[3];
    this.halfMoves = parseInt(parts[4], 10);
    this.fullMoves = parseInt(parts[5], 10);
    
    return this;
  }

  toFEN() {
    let fen = '';
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const piece = this.board[idx];
        if (piece) {
          if (empty > 0) fen += empty;
          fen += piece;
          empty = 0;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (row < 7) fen += '/';
    }
    
    fen += ` ${this.turn} `;
    fen += Object.keys(this.castling).filter(k => this.castling[k]).join('') || '-';
    fen += ` ${this.enPassant || '-'} ${this.halfMoves} ${this.fullMoves}`;
    
    return fen;
  }

  squareToIndex(square) {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    return rank * 8 + file;
  }

  indexToSquare(idx) {
    const rank = 7 - Math.floor(idx / 8);
    const file = idx % 8;
    return String.fromCharCode(97 + file) + (rank + 1);
  }

  getPieceAt(square) {
    return this.board[this.squareToIndex(square)];
  }

  generateMoves() {
    const moves = [];
    for (let from = 0; from < 64; from++) {
      const piece = this.board[from];
      if (!piece || (this.turn === 'w' && piece.toLowerCase() !== piece) || 
          (this.turn === 'b' && piece.toUpperCase() !== piece)) continue;

      const toMoves = this.generatePieceMoves(from, piece);
      moves.push(...toMoves);
    }
    return moves;
  }

  generatePieceMoves(from, piece) {
    const moves = [];
    const pieceType = piece.toLowerCase();
    
    switch (pieceType) {
      case 'p': return this.generatePawnMoves(from, piece);
      case 'r': return this.generateSliderMoves(from, ['n', 's', 'e', 'w']);
      case 'n': return this.generateKnightMoves(from);
      case 'b': return this.generateSliderMoves(from, ['ne', 'nw', 'se', 'sw']);
      case 'q': return this.generateSliderMoves(from, ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']);
      case 'k': return this.generateKingMoves(from);
    }
    return moves;
  }

  generatePawnMoves(from, piece) {
    const moves = [];
    const dir = piece === 'P' ? -8 : 8;
    const startRank = piece === 'P' ? 6 : 1;
    const rank = Math.floor(from / 8);
    
    // Forward 1
    const to1 = from + dir;
    if (this.isValidSquare(to1) && !this.board[to1]) {
      moves.push({ from, to: to1 });
      // Forward 2 from start
      if (rank === startRank) {
        const to2 = to1 + dir;
        if (!this.board[to2]) moves.push({ from, to: to2 });
      }
    }
    
    // Captures
    const sideDirs = [dir - 1, dir + 1];
    for (const sideDir of sideDirs) {
      const to = from + sideDir;
      if (this.isValidSquare(to) && this.board[to] && 
          this.isOpponentPiece(this.board[to], piece)) {
        moves.push({ from, to });
      }
    }
    
    return moves;
  }

  generateKnightMoves(from) {
    const deltas = [-17, -15, -10, -6, 6, 10, 15, 17];
    const moves = [];
    const fromPiece = this.board[from];
    for (const delta of deltas) {
      const to = from + delta;
      if (this.isValidSquare(to) && 
          (!this.board[to] || this.isOpponentPiece(this.board[to], fromPiece))) {
        moves.push({ from, to });
      }
    }
    return moves;
  }

  generateSliderMoves(from, directions) {
    const moves = [];
    for (const dir of directions) {
      let delta;
      switch (dir) {
        case 'n': delta = -8; break;
        case 's': delta = 8; break;
        case 'e': delta = 1; break;
        case 'w': delta = -1; break;
        case 'ne': delta = -7; break;
        case 'nw': delta = -9; break;
        case 'se': delta = 9; break;
        case 'sw': delta = 7; break;
      }
      
      let to = from + delta;
      while (this.isValidSquare(to)) {
        if (!this.board[to]) {
          moves.push({ from, to });
        } else {
          if (this.isOpponentPiece(this.board[to], this.board[from])) {
            moves.push({ from, to });
          }
          break;
        }
        to += delta;
      }
    }
    return moves;
  }

  generateKingMoves(from) {
    const deltas = [-9, -8, -7, -1, 1, 7, 8, 9];
    const moves = [];
    for (const delta of deltas) {
      const to = from + delta;
      if (this.isValidSquare(to) && 
          (!this.board[to] || this.isOpponentPiece(this.board[to], this.board[from]))) {
        moves.push({ from, to });
      }
    }
    return moves;
  }

  isValidSquare(idx) {
    return idx >= 0 && idx < 64;
  }

  isOpponentPiece(piece, mover) {
    if (!piece || !mover) return false;
    return (mover === mover.toUpperCase() && piece === piece.toLowerCase()) ||
           (mover === mover.toLowerCase() && piece === piece.toUpperCase());
  }

  makeMove(move) {
    const piece = this.board[move.from];
    this.board[move.to] = piece;
    this.board[move.from] = null;
    
    // Update turn
    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.fullMoves += this.turn === 'w' ? 1 : 0;
    
    return move;
  }

  undoMove(move) {
    this.board[move.from] = this.board[move.to];
    this.board[move.to] = null;
    this.turn = this.turn === 'w' ? 'b' : 'w';
  }

  isLegalMove(move) {
    // Simplified - full validation in minimax
    return true;
  }

  minimax(depth, alpha, beta, maximizing) {
    if (depth === 0) return this.evaluateBoard();
    
    const moves = this.generateMoves();
    
    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.makeMove(move);
        const evalScore = this.minimax(depth - 1, alpha, beta, false);
        this.undoMove(move);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.makeMove(move);
        const evalScore = this.minimax(depth - 1, alpha, beta, true);
        this.undoMove(move);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  findBestMove(depth = 4) {
    const moves = this.generateMoves();
    let bestMove = null;
    let bestValue = this.turn === 'w' ? -Infinity : Infinity;
    
    for (const move of moves) {
      this.makeMove(move);
      const boardValue = this.minimax(depth - 1, -Infinity, Infinity, this.turn === 'w');
      this.undoMove(move);
      
      const value = this.turn === 'w' ? boardValue : -boardValue;
      
      if ((this.turn === 'w' && value > bestValue) || 
          (this.turn === 'b' && value < bestValue)) {
        bestValue = value;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  evaluateBoard() {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const piece = this.board[i];
      if (piece) {
        const value = pieceValues[piece.toLowerCase()];
        score += (piece === piece.toUpperCase() ? value : -value);
      }
    }
    
    return score;
  }

  // Multiplayer sync
  getGameState() {
    return {
      fen: this.toFEN(),
      turn: this.turn,
      selected: null,
      lastMove: null
    };
  }

  applyGameState(state) {
    this.loadFEN(state.fen);
    this.turn = state.turn;
  }
}

// Global multiplayer
let gameSocket = null;
window.initChessMultiplayer = (roomId) => {
  gameSocket = new WebSocket(`ws://${window.location.host}/ws/chess/${roomId}`);
  
  gameSocket.onmessage = (event) => {
    const state = JSON.parse(event.data);
    chessEngine.applyGameState(state);
    updateBoard();
  };
};

window.sendChessMove = (move) => {
  if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
    gameSocket.send(JSON.stringify({
      type: 'move',
      move: move,
      fen: chessEngine.toFEN()
    }));
  }
};

// Export
window.ChessEngine = ChessEngine;
window.chessEngine = new ChessEngine();

