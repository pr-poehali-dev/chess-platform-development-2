import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'main' | 'searching' | 'game' | 'result' | 'auth';
type Tab = 'home' | 'games' | 'leaders' | 'settings' | 'profile';
type Board = string[][];

// ─── Constants ────────────────────────────────────────────────────────────────
const INIT_BOARD: Board = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R'],
];

const UNICODE: Record<string,string> = {
  r:'♜',n:'♞',b:'♝',q:'♛',k:'♚',p:'♟',
  R:'♖',N:'♘',B:'♗',Q:'♕',K:'♔',P:'♙',
};

const MODES = [
  { id:'rapid',   name:'Рапид',   time:'10 мин', secs:600,  icon:'Timer' },
  { id:'blitz',   name:'Блиц',    time:'5 мин',  secs:300,  icon:'Zap' },
  { id:'bullet',  name:'Пуля',    time:'1 мин',  secs:60,   icon:'Rocket' },
  { id:'classic', name:'Классика',time:'30 мин', secs:1800, icon:'Crown' },
];

const NAV = [
  { id:'home',     name:'Главная',  icon:'Home' },
  { id:'games',    name:'Партии',   icon:'History' },
  { id:'leaders',  name:'Лидеры',   icon:'Trophy' },
  { id:'settings', name:'Настройки',icon:'Settings' },
  { id:'profile',  name:'Профиль',  icon:'User' },
] as const;

const LEADERS = [
  { rank:1, name:'Kasparov_99',    rating:2847, games:1204, win:78, flag:'🇷🇺' },
  { rank:2, name:'MagnusFan',      rating:2791, games:980,  win:74, flag:'🇳🇴' },
  { rank:3, name:'queen_gambit',   rating:2735, games:1567, win:71, flag:'🇺🇸' },
  { rank:4, name:'endgame_god',    rating:2688, games:745,  win:69, flag:'🇩🇪' },
  { rank:5, name:'tactical_ninja', rating:2640, games:2103, win:67, flag:'🇮🇳' },
  { rank:6, name:'nighthawk_d',    rating:2598, games:3312, win:65, flag:'🇫🇷' },
  { rank:7, name:'RookMaster',     rating:2541, games:891,  win:63, flag:'🇧🇷' },
];

const HISTORY = [
  { opp:'MagnusFan',    result:'win',  ratingChange:+14, duration:'12:34', moves:42, myRating:1512, date:'15 июн 2026' },
  { opp:'endgame_god',  result:'loss', ratingChange:-12, duration:'8:21',  moves:31, myRating:1498, date:'15 июн 2026' },
  { opp:'tactical_ninja',result:'draw',ratingChange:+2,  duration:'18:05', moves:67, myRating:1510, date:'14 июн 2026' },
  { opp:'RookMaster',   result:'win',  ratingChange:+16, duration:'5:44',  moves:28, myRating:1508, date:'13 июн 2026' },
];

const BOT = { name:'ChessBot_Pro', rating:1480, flag:'🤖' };

// ─── Chess helpers ─────────────────────────────────────────────────────────────
function cloneBoard(b: Board): Board { return b.map(r => [...r]); }

function isWhitePiece(p: string) { return p !== '' && p === p.toUpperCase(); }
function isBlackPiece(p: string) { return p !== '' && p === p.toLowerCase(); }

function getLegalMoves(board: Board, r: number, c: number): [number,number][] {
  const piece = board[r][c];
  if (!piece) return [];
  const white = isWhitePiece(piece);
  const moves: [number,number][] = [];
  const inBounds = (rr: number, cc: number) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8;
  const canLand  = (rr: number, cc: number) => {
    if (!inBounds(rr,cc)) return false;
    const t = board[rr][cc];
    return t === '' || (white ? isBlackPiece(t) : isWhitePiece(t));
  };

  const slide = (dirs: [number,number][]) => {
    for (const [dr,dc] of dirs) {
      let rr = r+dr, cc = c+dc;
      while (inBounds(rr,cc)) {
        const t = board[rr][cc];
        if (t === '') { moves.push([rr,cc]); }
        else { if (white ? isBlackPiece(t) : isWhitePiece(t)) moves.push([rr,cc]); break; }
        rr+=dr; cc+=dc;
      }
    }
  };

  const p = piece.toLowerCase();
  if (p === 'p') {
    const dir = white ? -1 : 1;
    const startRow = white ? 6 : 1;
    if (inBounds(r+dir,c) && board[r+dir][c]==='') {
      moves.push([r+dir,c]);
      if (r===startRow && board[r+2*dir][c]==='') moves.push([r+2*dir,c]);
    }
    for (const dc of [-1,1]) {
      if (inBounds(r+dir,c+dc) && board[r+dir][c+dc]!=='' && canLand(r+dir,c+dc)) moves.push([r+dir,c+dc]);
    }
  } else if (p === 'n') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) if (canLand(r+dr,c+dc)) moves.push([r+dr,c+dc]);
  } else if (p === 'r') { slide([[-1,0],[1,0],[0,-1],[0,1]]); }
  else if (p === 'b') { slide([[-1,-1],[-1,1],[1,-1],[1,1]]); }
  else if (p === 'q') { slide([[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]); }
  else if (p === 'k') {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) if (canLand(r+dr,c+dc)) moves.push([r+dr,c+dc]);
  }
  return moves;
}

function botMove(board: Board): [[number,number],[number,number]] | null {
  const candidates: [[number,number],[number,number],number][] = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (!isBlackPiece(board[r][c])) continue;
    const moves = getLegalMoves(board,r,c);
    for (const [tr,tc] of moves) {
      const captured = board[tr][tc];
      const vals: Record<string,number> = {p:1,n:3,b:3,r:5,q:9,k:100};
      const score = captured ? (vals[captured.toLowerCase()]||0)*10 + Math.random() : Math.random();
      candidates.push([[r,c],[tr,tc],score]);
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a,b)=>b[2]-a[2]);
  const top = candidates.slice(0, Math.min(5,candidates.length));
  const pick = top[Math.floor(Math.random()*top.length)];
  return [pick[0],pick[1]];
}

function fmt(s: number) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────
function PageHome({ onPlay }: { onPlay: () => void }) {
  const [showModes, setShowModes] = useState(false);
  const [mode, setMode] = useState('rapid');
  return (
    <div className="relative z-10 container py-10 lg:py-16">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-600 text-muted-foreground mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            12 847 игроков онлайн
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-700 leading-[0.95] tracking-tight mb-6 animate-float-up">
            ИГРАЙ В ШАХМАТЫ<br/>
            <span className="text-primary text-glow">КАК ЧЕМПИОН</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed animate-float-up" style={{animationDelay:'0.1s'}}>
            Реальный мультиплеер в реальном времени, честный рейтинг Elo и подробная статистика.
          </p>
          <div className="animate-float-up" style={{animationDelay:'0.2s'}}>
            {!showModes ? (
              <button onClick={() => setShowModes(true)}
                className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-12 py-5 rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-700 tracking-wide animate-pulse-ring hover:scale-[1.02] transition-transform">
                <Icon name="Play" size={28} />
                ИГРАТЬ
              </button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MODES.map((m,i) => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all animate-float-up ${mode===m.id ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'}`}
                      style={{animationDelay:`${i*0.05}s`}}>
                      <Icon name={m.icon} size={22} className={mode===m.id?'text-primary':'text-muted-foreground'}/>
                      <div>
                        <div className="font-600 text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.time}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={onPlay}
                  className="flex items-center justify-center gap-3 w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display text-xl font-700 tracking-wide hover:scale-[1.01] transition-transform">
                  <Icon name="Search" size={22}/>
                  НАЙТИ СОПЕРНИКА
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-8 mt-10 animate-float-up" style={{animationDelay:'0.3s'}}>
            {[{num:'2.4M',label:'партий сыграно'},{num:'180+',label:'стран'},{num:'4.9',label:'рейтинг ★'}].map(s=>(
              <div key={s.label}>
                <div className="font-display text-3xl font-700">{s.num}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="animate-board-pop" style={{animationDelay:'0.2s'}}>
            <div className="relative p-3 rounded-3xl bg-card border border-border board-glow">
              <div className="grid grid-cols-8 rounded-xl overflow-hidden w-[300px] sm:w-[380px] lg:w-[420px]">
                {INIT_BOARD.map((row,r) => row.map((cell,c) => {
                  const dark=(r+c)%2===1;
                  return (
                    <div key={`${r}-${c}`} className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl select-none ${dark?'bg-primary/85':'bg-secondary'}`}>
                      <span className={`${isWhitePiece(cell)?'text-white':'text-[#1a2a1a]'} drop-shadow-md`}>
                        {UNICODE[cell]||''}
                      </span>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-20 animate-float-up" style={{animationDelay:'0.4s'}}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-700 tracking-wide flex items-center gap-3">
            <Icon name="Trophy" size={28} className="text-accent"/>
            ЛИДЕРЫ
          </h2>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-1">#</div>
            <div className="col-span-6">Игрок</div>
            <div className="col-span-2 text-right">Рейтинг</div>
            <div className="col-span-2 text-right hidden sm:block">Партий</div>
            <div className="col-span-1 text-right">%</div>
          </div>
          {LEADERS.slice(0,5).map(p=>(
            <div key={p.rank} className="grid grid-cols-12 px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors">
              <div className="col-span-1">
                <span className={`font-display text-lg font-700 ${p.rank===1?'text-accent':p.rank<=3?'text-foreground':'text-muted-foreground'}`}>{p.rank}</span>
              </div>
              <div className="col-span-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-base">{p.flag}</div>
                <span className="font-600">{p.name}</span>
              </div>
              <div className="col-span-2 text-right font-display font-700 text-primary text-lg">{p.rating}</div>
              <div className="col-span-2 text-right text-muted-foreground hidden sm:block">{p.games}</div>
              <div className="col-span-1 text-right font-500">{p.win}%</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid sm:grid-cols-3 gap-5">
        {[
          {icon:'Wifi',       title:'Реальный мультиплеер', desc:'Онлайн-партии в реальном времени с проверкой ходов на сервере'},
          {icon:'TrendingUp', title:'Честный рейтинг Elo',  desc:'10 калибровочных партий определяют ваш стартовый уровень'},
          {icon:'ShieldCheck',title:'Защита от читов',      desc:'Серверная валидация каждого хода и анти-чит система'},
        ].map((f,i)=>(
          <div key={f.title} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all animate-float-up" style={{animationDelay:`${0.5+i*0.1}s`}}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon name={f.icon} size={24} className="text-primary"/>
            </div>
            <h3 className="font-display text-xl font-600 mb-2 tracking-wide">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function PageGames() {
  return (
    <div className="container py-10">
      <h2 className="font-display text-3xl font-700 tracking-wide mb-6 flex items-center gap-3">
        <Icon name="History" size={28} className="text-primary"/> ИСТОРИЯ ПАРТИЙ
      </h2>
      <div className="space-y-3">
        {HISTORY.map((g,i)=>(
          <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-display font-700 ${g.result==='win'?'bg-primary/15 text-primary':g.result==='loss'?'bg-destructive/15 text-destructive':'bg-secondary text-muted-foreground'}`}>
              {g.result==='win'?'W':g.result==='loss'?'L':'D'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-600">{g.opp}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{g.date}</span>
              </div>
              <div className="text-sm text-muted-foreground">{g.moves} ходов · {g.duration}</div>
            </div>
            <div className={`text-right font-display font-700 text-lg ${g.ratingChange>0?'text-primary':g.ratingChange<0?'text-destructive':'text-muted-foreground'}`}>
              {g.ratingChange>0?'+':''}{g.ratingChange}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageLeaders() {
  const [period, setPeriod] = useState<'month'|'all'>('all');
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-3xl font-700 tracking-wide flex items-center gap-3">
          <Icon name="Trophy" size={28} className="text-accent"/> ЛИДЕРЫ
        </h2>
        <div className="flex rounded-xl overflow-hidden border border-border">
          {([['month','За месяц'],['all','Всё время']] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setPeriod(id)} className={`px-4 py-2 text-sm font-600 transition-all ${period===id?'bg-primary text-primary-foreground':'bg-card text-muted-foreground hover:text-foreground'}`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Игрок</div>
          <div className="col-span-2 text-right">Рейтинг</div>
          <div className="col-span-2 text-right hidden sm:block">Партий</div>
          <div className="col-span-1 text-right">%</div>
        </div>
        {LEADERS.map(p=>(
          <div key={p.rank} className="grid grid-cols-12 px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer">
            <div className="col-span-1">
              <span className={`font-display text-lg font-700 ${p.rank===1?'text-accent':p.rank<=3?'text-foreground':'text-muted-foreground'}`}>
                {p.rank===1?'🥇':p.rank===2?'🥈':p.rank===3?'🥉':p.rank}
              </span>
            </div>
            <div className="col-span-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-base">{p.flag}</div>
              <span className="font-600">{p.name}</span>
            </div>
            <div className="col-span-2 text-right font-display font-700 text-primary text-lg">{p.rating}</div>
            <div className="col-span-2 text-right text-muted-foreground hidden sm:block">{p.games}</div>
            <div className="col-span-1 text-right font-500">{p.win}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSettings({ theme, setTheme }: { theme: string; setTheme: (t:string)=>void }) {
  const [sound, setSound] = useState(true);
  const [lang, setLang] = useState('ru');
  const [boardTheme, setBoardTheme] = useState('green');

  const boards = [
    {id:'green',  light:'#f0d9b5', dark:'#4a7c59'},
    {id:'blue',   light:'#dee3e6', dark:'#8ca2ad'},
    {id:'purple', light:'#f0e4f6', dark:'#7b4f9e'},
    {id:'classic',light:'#eeeed2', dark:'#769656'},
  ];

  return (
    <div className="container py-10 max-w-xl">
      <h2 className="font-display text-3xl font-700 tracking-wide mb-8 flex items-center gap-3">
        <Icon name="Settings" size={28} className="text-primary"/> НАСТРОЙКИ
      </h2>
      <div className="space-y-4">
        {/* Sound */}
        <div className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <Icon name={sound?'Volume2':'VolumeX'} size={22} className="text-primary"/>
            <div>
              <div className="font-600">Звуки</div>
              <div className="text-xs text-muted-foreground">Ходы, взятия, шах, победа</div>
            </div>
          </div>
          <button onClick={()=>setSound(!sound)} className={`w-12 h-6 rounded-full transition-colors ${sound?'bg-primary':'bg-secondary border border-border'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${sound?'translate-x-6':'translate-x-0'}`}/>
          </button>
        </div>
        {/* Theme */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="Moon" size={22} className="text-primary"/>
            <div className="font-600">Тема приложения</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['dark','Тёмная'],['light','Светлая']].map(([id,label])=>(
              <button key={id} onClick={()=>setTheme(id)} className={`py-3 rounded-xl border font-600 text-sm transition-all ${theme===id?'bg-primary/10 border-primary text-primary':'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>
            ))}
          </div>
        </div>
        {/* Language */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="Globe" size={22} className="text-primary"/>
            <div className="font-600">Язык</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['ru','Русский 🇷🇺'],['en','English 🇺🇸']].map(([id,label])=>(
              <button key={id} onClick={()=>setLang(id)} className={`py-3 rounded-xl border font-600 text-sm transition-all ${lang===id?'bg-primary/10 border-primary text-primary':'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>
            ))}
          </div>
        </div>
        {/* Board theme */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="Grid3x3" size={22} className="text-primary"/>
            <div className="font-600">Тема доски</div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {boards.map(b=>(
              <button key={b.id} onClick={()=>setBoardTheme(b.id)} className={`rounded-xl overflow-hidden border-2 transition-all ${boardTheme===b.id?'border-primary scale-105':'border-transparent'}`}>
                <div className="grid grid-cols-2">
                  {[b.light,b.dark,b.dark,b.light].map((col,i)=>(
                    <div key={i} className="aspect-square" style={{backgroundColor:col}}/>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageProfile({ onLogin }: { onLogin: () => void }) {
  const user = null;
  if (!user) {
    return (
      <div className="container py-20 flex flex-col items-center text-center max-w-sm mx-auto">
        <div className="w-24 h-24 rounded-full bg-secondary border border-border flex items-center justify-center text-5xl mb-6">♚</div>
        <h2 className="font-display text-3xl font-700 mb-3">ВАШ ПРОФИЛЬ</h2>
        <p className="text-muted-foreground mb-8">Войдите или зарегистрируйтесь, чтобы отслеживать рейтинг, историю партий и статистику.</p>
        <button onClick={onLogin} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display text-xl font-700 tracking-wide hover:scale-[1.02] transition-transform">
          ВОЙТИ / РЕГИСТРАЦИЯ
        </button>
      </div>
    );
  }
  return <div className="container py-10"><p>Профиль пользователя</p></div>;
}

// ─── Auth screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nick, setNick] = useState('');
  const [error, setError] = useState('');

  const validate = (val: string) => {
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Только латинские буквы, цифры и _';
    if (val.length < 4) return 'Минимум 4 символа';
    if (val.length > 16) return 'Максимум 16 символов';
    return '';
  };

  const handleSubmit = () => {
    const err = validate(nick);
    if (err) { setError(err); return; }
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-float-up">
      <div className="relative w-full max-w-md mx-4 p-8 rounded-3xl bg-card border border-border">
        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="X" size={22}/>
        </button>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">♞</div>
          <h2 className="font-display text-3xl font-700 tracking-wide">{isLogin ? 'ДОБРО ПОЖАЛОВАТЬ' : 'РЕГИСТРАЦИЯ'}</h2>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-border mb-6">
          {[['true','Войти'],['false','Регистрация']].map(([val,label])=>(
            <button key={val} onClick={()=>{setIsLogin(val==='true');setError('');}} className={`flex-1 py-3 text-sm font-600 transition-all ${String(isLogin)===val?'bg-primary text-primary-foreground':'bg-card text-muted-foreground hover:text-foreground'}`}>{label}</button>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-600 text-muted-foreground mb-1.5 block">Никнейм</label>
            <input
              value={nick}
              onChange={e=>{setNick(e.target.value);setError('');}}
              placeholder="GrandMaster_99"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
          </div>
          {!isLogin && (
            <p className="text-xs text-muted-foreground bg-secondary/50 border border-border rounded-lg px-4 py-3">
              ⚠️ После регистрации никнейм изменить невозможно. Только латинские буквы, цифры и «_», от 4 до 16 символов.
            </p>
          )}
          <button onClick={handleSubmit} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display text-lg font-700 tracking-wide hover:scale-[1.01] transition-transform">
            {isLogin ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Game screen ──────────────────────────────────────────────────────────────
function GameScreen({ modeId, onExit }: { modeId: string; onExit: (result:'win'|'loss'|'draw')=>void }) {
  const modeDef = MODES.find(m=>m.id===modeId)!;
  const [board, setBoard] = useState<Board>(INIT_BOARD.map(r=>[...r]));
  const [selected, setSelected] = useState<[number,number]|null>(null);
  const [legalMoves, setLegalMoves] = useState<[number,number][]>([]);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [moveCount, setMoveCount] = useState(0);
  const [whiteTime, setWhiteTime] = useState(modeDef.secs);
  const [blackTime, setBlackTime] = useState(modeDef.secs);
  const [gameOver, setGameOver] = useState<'win'|'loss'|'draw'|null>(null);
  const [lastMove, setLastMove] = useState<[[number,number],[number,number]]|null>(null);
  const [botThinking, setBotThinking] = useState(false);

  // Timer
  useEffect(()=>{
    if (gameOver) return;
    const t = setInterval(()=>{
      if (isWhiteTurn) {
        setWhiteTime(s=>{ if(s<=1){setGameOver('loss');return 0;} return s-1; });
      } else {
        setBlackTime(s=>{ if(s<=1){setGameOver('win');return 0;} return s-1; });
      }
    },1000);
    return ()=>clearInterval(t);
  },[isWhiteTurn,gameOver]);

  // Bot move
  useEffect(()=>{
    if (gameOver || isWhiteTurn) return;
    setBotThinking(true);
    const t = setTimeout(()=>{
      setBotThinking(false);
      const move = botMove(board);
      if (!move) { setGameOver('win'); return; }
      const [[fr,fc],[tr,tc]] = move;
      const nb = cloneBoard(board);
      nb[tr][tc] = nb[fr][fc];
      nb[fr][fc] = '';
      setBoard(nb);
      setLastMove([[fr,fc],[tr,tc]]);
      setMoveCount(m=>m+1);
      setIsWhiteTurn(true);
    }, 600 + Math.random()*600);
    return ()=>clearTimeout(t);
  },[isWhiteTurn,gameOver]);

  const handleCell = useCallback((r: number, c: number)=>{
    if (!isWhiteTurn || gameOver || botThinking) return;
    const piece = board[r][c];
    if (selected) {
      const isLegal = legalMoves.some(([lr,lc])=>lr===r&&lc===c);
      if (isLegal) {
        const nb = cloneBoard(board);
        nb[r][c] = nb[selected[0]][selected[1]];
        nb[selected[0]][selected[1]] = '';
        // Pawn promotion
        if (nb[r][c]==='P' && r===0) nb[r][c]='Q';
        setBoard(nb);
        setLastMove([selected,[r,c]]);
        setMoveCount(m=>m+1);
        setSelected(null);
        setLegalMoves([]);
        setIsWhiteTurn(false);
        // Check if bot king captured (win)
        const hasKing = nb.some(row=>row.some(cell=>cell==='k'));
        if (!hasKing) setGameOver('win');
        return;
      }
      if (piece && isWhitePiece(piece)) {
        setSelected([r,c]);
        setLegalMoves(getLegalMoves(board,r,c));
        return;
      }
      setSelected(null);
      setLegalMoves([]);
      return;
    }
    if (piece && isWhitePiece(piece)) {
      setSelected([r,c]);
      setLegalMoves(getLegalMoves(board,r,c));
    }
  },[board,selected,legalMoves,isWhiteTurn,gameOver,botThinking]);

  useEffect(()=>{ if(gameOver) { setTimeout(()=>onExit(gameOver),1500); } },[gameOver]);

  const isHighlight = (r:number,c:number) => lastMove && ((lastMove[0][0]===r&&lastMove[0][1]===c)||(lastMove[1][0]===r&&lastMove[1][1]===c));
  const isSelected = (r:number,c:number) => selected && selected[0]===r && selected[1]===c;
  const isLegal    = (r:number,c:number) => legalMoves.some(([lr,lc])=>lr===r&&lc===c);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-6">
      {/* Bot info */}
      <div className="flex items-center gap-3 mb-4 w-full max-w-[460px]">
        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xl">{BOT.flag}</div>
        <div className="flex-1">
          <div className="font-600">{BOT.name}</div>
          <div className="text-sm text-muted-foreground">Рейтинг {BOT.rating}</div>
        </div>
        <div className={`px-4 py-2 rounded-xl font-display font-700 text-lg border ${!isWhiteTurn&&!gameOver?'bg-primary/10 border-primary text-primary':'bg-secondary border-border text-muted-foreground'}`}>
          {fmt(blackTime)}
          {botThinking && <span className="ml-2 text-xs animate-pulse">думает...</span>}
        </div>
      </div>

      {/* Board */}
      <div className="relative rounded-2xl overflow-hidden board-glow">
        <div className="grid grid-cols-8 w-[320px] sm:w-[400px] md:w-[460px]">
          {board.map((row,r)=>row.map((cell,c)=>{
            const dark=(r+c)%2===1;
            const sel = isSelected(r,c);
            const leg = isLegal(r,c);
            const hi  = isHighlight(r,c);
            return (
              <div key={`${r}-${c}`} onClick={()=>handleCell(r,c)}
                className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl select-none relative cursor-pointer transition-all ${
                  sel ? 'bg-accent/60' :
                  hi  ? (dark?'bg-primary/60':'bg-primary/30') :
                        (dark?'bg-primary/85':'bg-secondary')
                }`}>
                {leg && (
                  <div className={`absolute inset-0 flex items-center justify-center ${cell?'':'pointer-events-none'}`}>
                    {cell
                      ? <div className="absolute inset-0 rounded-sm border-4 border-accent/60"/>
                      : <div className="w-3 h-3 rounded-full bg-background/40"/>
                    }
                  </div>
                )}
                <span className={`relative z-10 drop-shadow-md ${isWhitePiece(cell)?'text-white':'text-[#1a2a1a]'}`}>
                  {UNICODE[cell]||''}
                </span>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Player info */}
      <div className="flex items-center gap-3 mt-4 w-full max-w-[460px]">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xl">😊</div>
        <div className="flex-1">
          <div className="font-600">Вы</div>
          <div className="text-sm text-muted-foreground">Рейтинг 1500</div>
        </div>
        <div className={`px-4 py-2 rounded-xl font-display font-700 text-lg border ${isWhiteTurn&&!gameOver?'bg-primary/10 border-primary text-primary':'bg-secondary border-border text-muted-foreground'}`}>
          {fmt(whiteTime)}
        </div>
      </div>

      {/* Move count + exit */}
      <div className="flex items-center gap-4 mt-6">
        <span className="text-sm text-muted-foreground">Ходов: {moveCount}</span>
        <button onClick={()=>onExit('draw')} className="px-5 py-2 rounded-lg bg-secondary border border-border text-sm font-600 hover:bg-secondary/70 transition-all">
          Сдаться
        </button>
      </div>

      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-float-up">
          <div className="text-center">
            <div className="text-6xl mb-4">{gameOver==='win'?'🏆':gameOver==='loss'?'😔':'🤝'}</div>
            <div className="font-display text-4xl font-700 text-primary">{gameOver==='win'?'ПОБЕДА!':gameOver==='loss'?'ПОРАЖЕНИЕ':'НИЧЬЯ'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────
function ResultScreen({ result, onNext, onRematch }: { result:'win'|'loss'|'draw'; onNext:()=>void; onRematch:()=>void }) {
  const ratingChange = result==='win'?+15:result==='loss'?-12:+3;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-6">{result==='win'?'🏆':result==='loss'?'😔':'🤝'}</div>
        <h2 className="font-display text-4xl font-700 tracking-wide mb-2">
          {result==='win'?'ПОБЕДА!':result==='loss'?'ПОРАЖЕНИЕ':'НИЧЬЯ'}
        </h2>
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full mb-8 font-display text-2xl font-700 ${ratingChange>0?'bg-primary/10 text-primary':ratingChange<0?'bg-destructive/10 text-destructive':'bg-secondary text-muted-foreground'}`}>
          {ratingChange>0?'+':''}{ratingChange} рейтинг
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8 text-left bg-card border border-border rounded-2xl p-5">
          <div className="text-muted-foreground text-sm">Рейтинг до</div><div className="font-600 text-right">1500</div>
          <div className="text-muted-foreground text-sm">Рейтинг после</div><div className="font-600 text-right text-primary">{1500+ratingChange}</div>
        </div>
        <div className="space-y-3">
          <button onClick={onRematch} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display text-lg font-700 tracking-wide hover:scale-[1.01] transition-transform">
            РЕВАНШ
          </button>
          <button onClick={onNext} className="w-full py-4 rounded-xl bg-secondary border border-border font-600 hover:bg-secondary/70 transition-all">
            Следующий соперник
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('main');
  const [modeId, setModeId] = useState('rapid');
  const [showAuth, setShowAuth] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [gameResult, setGameResult] = useState<'win'|'loss'|'draw'|null>(null);
  const [theme] = useState('dark');

  // Search timer → start game after 3s
  useEffect(()=>{
    if (screen!=='searching') return;
    setSearchTime(0);
    const t = setInterval(()=>{
      setSearchTime(s=>{
        if (s>=2) { clearInterval(t); setScreen('game'); return 0; }
        return s+1;
      });
    },1000);
    return ()=>clearInterval(t);
  },[screen]);

  const handlePlay = () => setScreen('searching');
  const handleGameEnd = (result:'win'|'loss'|'draw') => { setGameResult(result); setScreen('result'); };
  const handleNext = () => { setScreen('searching'); };
  const handleRematch = () => { setScreen('searching'); };

  const activeMode = MODES.find(m=>m.id===modeId)!;

  if (screen==='game') return <GameScreen modeId={modeId} onExit={handleGameEnd}/>;
  if (screen==='result' && gameResult) return <ResultScreen result={gameResult} onNext={handleNext} onRematch={handleRematch}/>;

  return (
    <div className={`min-h-screen bg-background relative overflow-hidden pb-20 md:pb-0 ${theme}`}>
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]"/>
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[120px]"/>
      </div>

      {/* Searching overlay */}
      {screen==='searching' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md animate-float-up">
          <div className="text-center px-6 max-w-sm w-full">
            <div className="relative w-36 h-36 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-secondary"/>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl animate-piece-bob">♞</span>
              </div>
            </div>
            <h2 className="font-display text-3xl font-700 tracking-wide mb-3">ПОИСК СОПЕРНИКА</h2>
            <p className="text-muted-foreground mb-1">
              Режим: <span className="text-primary font-600">{activeMode.name}</span> · {activeMode.time}
            </p>
            <p className="text-sm text-muted-foreground mb-2">Подбираем соперника по рейтингу...</p>
            <div className="flex justify-center gap-1.5 mb-8">
              {[0,1,2].map(i=>(
                <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mb-6">Старт через {3-searchTime} сек...</p>
            <button onClick={()=>setScreen('main')} className="px-8 py-3 rounded-xl bg-secondary border border-border font-600 hover:bg-secondary/70 transition-all">
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Auth modal */}
      {showAuth && <AuthScreen onClose={()=>setShowAuth(false)}/>}

      {/* Header */}
      <header className="relative z-20 border-b border-border/60 backdrop-blur-sm sticky top-0">
        <div className="container flex items-center justify-between h-16 py-0">
          <button onClick={()=>{setTab('home');setScreen('main');}} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xl">♞</div>
            <span className="font-display text-xl font-700 tracking-wide">CHESS<span className="text-primary">ARENA</span></span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>setTab(item.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-500 transition-all ${tab===item.id?'bg-secondary text-foreground':'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <Icon name={item.icon} size={16}/>
                {item.name}
              </button>
            ))}
          </nav>
          <button onClick={()=>setShowAuth(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-600 hover:opacity-90 transition-all">
            <Icon name="LogIn" size={16}/>
            Войти
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10">
        {tab==='home'     && <PageHome onPlay={handlePlay}/>}
        {tab==='games'    && <PageGames/>}
        {tab==='leaders'  && <PageLeaders/>}
        {tab==='settings' && <PageSettings theme={theme} setTheme={()=>{}}/>}
        {tab==='profile'  && <PageProfile onLogin={()=>setShowAuth(true)}/>}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id as Tab)}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${tab===item.id?'text-primary':'text-muted-foreground'}`}>
              <div className={`flex items-center justify-center w-10 h-7 rounded-lg transition-all ${tab===item.id?'bg-primary/15':''}`}>
                <Icon name={item.icon} size={20}/>
              </div>
              <span className="text-[10px] font-600">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>

      <footer className="relative z-10 border-t border-border/60 mt-10 hidden md:block">
        <div className="container py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 ChessArena</span>
          <div className="flex gap-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">О платформе</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Правила FIDE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
