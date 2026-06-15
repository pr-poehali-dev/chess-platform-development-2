import { useState } from 'react';
import Icon from '@/components/ui/icon';

const PIECES: Record<string, string> = {
  r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟',
  R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙',
};

const START = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const MODES = [
  { id: 'rapid', name: 'Рапид', time: '10 мин', icon: 'Timer', desc: 'Вдумчивая игра' },
  { id: 'blitz', name: 'Блиц', time: '5 мин', icon: 'Zap', desc: 'Быстрые партии' },
  { id: 'bullet', name: 'Пуля', time: '1 мин', icon: 'Rocket', desc: 'Молниеносно' },
  { id: 'classic', name: 'Классика', time: '30 мин', icon: 'Crown', desc: 'Без спешки' },
];

const NAV = [
  { name: 'Главная', icon: 'Home' },
  { name: 'Профиль', icon: 'User' },
  { name: 'Лидеры', icon: 'Trophy' },
  { name: 'История', icon: 'History' },
  { name: 'Настройки', icon: 'Settings' },
];

const LEADERS = [
  { rank: 1, name: 'Kasparov_99', rating: 2847, games: 1204, win: 78, flag: '🇷🇺' },
  { rank: 2, name: 'MagnusFan', rating: 2791, games: 980, win: 74, flag: '🇳🇴' },
  { rank: 3, name: 'queen_gambit', rating: 2735, games: 1567, win: 71, flag: '🇺🇸' },
  { rank: 4, name: 'endgame_god', rating: 2688, games: 745, win: 69, flag: '🇩🇪' },
  { rank: 5, name: 'tactical_ninja', rating: 2640, games: 2103, win: 67, flag: '🇮🇳' },
];

const Index = () => {
  const [mode, setMode] = useState('rapid');
  const [showModes, setShowModes] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-border/60 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-2xl board-glow">
              ♞
            </div>
            <span className="font-display text-2xl font-700 tracking-wide text-foreground">
              CHESS<span className="text-primary">ARENA</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item, i) => (
              <button
                key={item.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-500 transition-all ${
                  i === 0
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon name={item.icon} size={17} />
                {item.name}
              </button>
            ))}
          </nav>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary border border-border text-sm font-600 hover:bg-secondary/70 transition-all">
            <Icon name="LogIn" size={17} />
            Войти
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 container py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-600 text-muted-foreground mb-6 animate-float-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              12 847 игроков онлайн
            </div>

            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-700 leading-[0.95] tracking-tight mb-6 animate-float-up"
              style={{ animationDelay: '0.1s' }}
            >
              ИГРАЙ В ШАХМАТЫ
              <br />
              <span className="text-primary text-glow">КАК ЧЕМПИОН</span>
            </h1>

            <p
              className="text-lg text-muted-foreground mb-8 leading-relaxed animate-float-up"
              style={{ animationDelay: '0.2s' }}
            >
              Реальный мультиплеер в реальном времени, честный рейтинг Elo,
              подробная статистика и турниры. Найди соперника за секунды.
            </p>

            {/* Play button + modes */}
            <div className="animate-float-up" style={{ animationDelay: '0.3s' }}>
              {!showModes ? (
                <button
                  onClick={() => setShowModes(true)}
                  className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-12 py-5 rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-700 tracking-wide animate-pulse-ring hover:scale-[1.02] transition-transform"
                >
                  <Icon name="Play" size={28} className="fill-current" />
                  ИГРАТЬ
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MODES.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`group flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all animate-float-up ${
                          mode === m.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border hover:border-primary/50'
                        }`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <Icon
                          name={m.icon}
                          size={22}
                          className={mode === m.id ? 'text-primary' : 'text-muted-foreground'}
                        />
                        <div>
                          <div className="font-600 text-foreground">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.time}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button className="flex items-center justify-center gap-3 w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display text-xl font-700 tracking-wide hover:scale-[1.01] transition-transform">
                    <Icon name="Search" size={22} />
                    НАЙТИ СОПЕРНИКА
                  </button>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div
              className="flex items-center gap-8 mt-10 animate-float-up"
              style={{ animationDelay: '0.4s' }}
            >
              {[
                { num: '2.4M', label: 'партий сыграно' },
                { num: '180+', label: 'стран' },
                { num: '4.9', label: 'рейтинг ★' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl font-700 text-foreground">{s.num}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — chessboard */}
          <div className="flex justify-center lg:justify-end">
            <div className="animate-board-pop" style={{ animationDelay: '0.2s' }}>
              <div className="relative p-3 rounded-3xl bg-card border border-border board-glow">
                <div className="grid grid-cols-8 rounded-xl overflow-hidden w-[320px] sm:w-[400px] lg:w-[440px]">
                  {START.map((row, r) =>
                    row.map((cell, c) => {
                      const dark = (r + c) % 2 === 1;
                      const isWhite = cell && cell === cell.toUpperCase();
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl lg:text-[2.6rem] select-none ${
                            dark ? 'bg-primary/85' : 'bg-secondary'
                          }`}
                        >
                          <span
                            className={`${isWhite ? 'text-white' : 'text-[#1a1a1a]'} ${
                              (r === 6 || r === 1) ? 'animate-piece-bob' : ''
                            } drop-shadow-md`}
                            style={{ animationDelay: `${c * 0.15}s` }}
                          >
                            {PIECES[cell] || ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard preview */}
        <section className="mt-24 animate-float-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl font-700 tracking-wide flex items-center gap-3">
              <Icon name="Trophy" size={28} className="text-accent" />
              ТАБЛИЦА ЛИДЕРОВ
            </h2>
            <button className="text-sm font-500 text-primary hover:underline flex items-center gap-1">
              Весь рейтинг <Icon name="ArrowRight" size={16} />
            </button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-12 px-6 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground border-b border-border">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Игрок</div>
              <div className="col-span-2 text-right">Рейтинг</div>
              <div className="col-span-2 text-right hidden sm:block">Партий</div>
              <div className="col-span-1 text-right">%</div>
            </div>
            {LEADERS.map((p) => (
              <div
                key={p.rank}
                className="grid grid-cols-12 px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors"
              >
                <div className="col-span-1">
                  <span
                    className={`font-display text-lg font-700 ${
                      p.rank === 1
                        ? 'text-accent'
                        : p.rank <= 3
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {p.rank}
                  </span>
                </div>
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-base">
                    {p.flag}
                  </div>
                  <span className="font-600 text-foreground">{p.name}</span>
                </div>
                <div className="col-span-2 text-right font-display font-700 text-primary text-lg">
                  {p.rating}
                </div>
                <div className="col-span-2 text-right text-muted-foreground hidden sm:block">
                  {p.games}
                </div>
                <div className="col-span-1 text-right text-foreground font-500">{p.win}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-24 grid sm:grid-cols-3 gap-5">
          {[
            { icon: 'Wifi', title: 'Реальный мультиплеер', desc: 'Онлайн-партии в реальном времени с проверкой ходов на сервере' },
            { icon: 'TrendingUp', title: 'Честный рейтинг Elo', desc: '10 калибровочных партий определяют ваш стартовый уровень' },
            { icon: 'ShieldCheck', title: 'Защита от читов', desc: 'Серверная валидация каждого хода и анти-чит система' },
          ].map((f, i) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all animate-float-up"
              style={{ animationDelay: `${0.6 + i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon name={f.icon} size={24} className="text-primary" />
              </div>
              <h3 className="font-display text-xl font-600 mb-2 tracking-wide">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 mt-20">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 ChessArena. Играй честно.</span>
          <div className="flex items-center gap-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">О платформе</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Правила FIDE</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Поддержка</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
