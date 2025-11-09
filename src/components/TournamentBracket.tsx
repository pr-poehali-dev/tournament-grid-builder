import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Match {
  id: number;
  round: number;
  match_number: number;
  participant1: string | null;
  participant2: string | null;
  winner: string | null;
  score: string | null;
  status: string;
}

interface TournamentBracketProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

export default function TournamentBracket({ matches, onMatchClick }: TournamentBracketProps) {
  const maxRound = Math.max(...matches.map(m => m.round));
  const rounds: { [key: number]: Match[] } = {};

  matches.forEach(match => {
    if (!rounds[match.round]) {
      rounds[match.round] = [];
    }
    rounds[match.round].push(match);
  });

  const getRoundName = (round: number) => {
    const fromEnd = maxRound - round;
    if (fromEnd === 0) return 'Финал';
    if (fromEnd === 1) return 'Полуфинал';
    if (fromEnd === 2) return 'Четвертьфинал';
    return `Раунд ${round}`;
  };

  return (
    <div className="flex gap-8 overflow-x-auto pb-8">
      {Array.from({ length: maxRound }, (_, i) => i + 1).map(roundNum => (
        <div key={roundNum} className="flex flex-col gap-4 min-w-[280px]">
          <div className="text-center">
            <Badge variant="outline" className="text-lg font-semibold bg-primary/10 border-primary text-primary px-4 py-2">
              {getRoundName(roundNum)}
            </Badge>
          </div>
          
          <div className="flex flex-col gap-6 justify-around h-full">
            {rounds[roundNum]?.map(match => (
              <Card
                key={match.id}
                onClick={() => onMatchClick?.(match)}
                className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 ${
                  match.status === 'completed' 
                    ? 'border-accent bg-card' 
                    : match.status === 'in_progress'
                    ? 'border-primary animate-pulse-glow bg-card'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon 
                        name="User" 
                        size={18} 
                        className={match.winner === match.participant1 ? 'text-accent' : 'text-muted-foreground'} 
                      />
                      <span className={`truncate ${
                        match.winner === match.participant1 
                          ? 'font-bold text-accent' 
                          : match.participant1 === 'BYE'
                          ? 'text-muted-foreground italic'
                          : 'text-foreground'
                      }`}>
                        {match.participant1 || 'TBD'}
                      </span>
                    </div>
                    {match.winner === match.participant1 && (
                      <Icon name="Trophy" size={16} className="text-accent flex-shrink-0" />
                    )}
                  </div>

                  <div className="h-px bg-border/50" />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon 
                        name="User" 
                        size={18} 
                        className={match.winner === match.participant2 ? 'text-accent' : 'text-muted-foreground'} 
                      />
                      <span className={`truncate ${
                        match.winner === match.participant2 
                          ? 'font-bold text-accent' 
                          : match.participant2 === 'BYE'
                          ? 'text-muted-foreground italic'
                          : 'text-foreground'
                      }`}>
                        {match.participant2 || 'TBD'}
                      </span>
                    </div>
                    {match.winner === match.participant2 && (
                      <Icon name="Trophy" size={16} className="text-accent flex-shrink-0" />
                    )}
                  </div>

                  {match.score && (
                    <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border/50">
                      {match.score}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
