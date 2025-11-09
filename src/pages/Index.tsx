import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import TournamentBracket from '@/components/TournamentBracket';
import CreateTournamentDialog from '@/components/CreateTournamentDialog';
import UpdateMatchDialog from '@/components/UpdateMatchDialog';
import { useToast } from '@/hooks/use-toast';

interface Tournament {
  id: number;
  name: string;
  weight_category: string;
  age_category: string;
  total_participants: number;
  status: string;
}

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

interface Participant {
  id: number;
  name: string;
}

export default function Index() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const API_URL = 'https://functions.poehali.dev/ad250640-ab38-4a99-8453-f04f409a3434';

  const loadTournaments = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTournaments(data.tournaments || []);
      
      if (data.tournaments?.length > 0 && !selectedTournament) {
        loadTournamentDetails(data.tournaments[0].id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить турниры',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournamentId: number) => {
    try {
      const response = await fetch(`${API_URL}?tournament_id=${tournamentId}`);
      const data = await response.json();
      
      setSelectedTournament(data.tournament);
      setMatches(data.matches || []);
      
      const uniqueParticipants: Participant[] = [];
      const names = new Set<string>();
      
      data.matches?.forEach((match: Match) => {
        if (match.participant1 && !names.has(match.participant1)) {
          names.add(match.participant1);
          uniqueParticipants.push({ id: Math.random(), name: match.participant1 });
        }
        if (match.participant2 && !names.has(match.participant2)) {
          names.add(match.participant2);
          uniqueParticipants.push({ id: Math.random(), name: match.participant2 });
        }
      });
      
      setParticipants(uniqueParticipants);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить детали турнира',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
                Турнирная Сетка
              </h1>
              <p className="text-muted-foreground text-lg">Олимпийская система розыгрыша</p>
            </div>
            <CreateTournamentDialog onTournamentCreated={loadTournaments} />
          </div>
        </div>

        <Tabs defaultValue="bracket" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="bracket" className="gap-2">
              <Icon name="Trophy" size={18} />
              Сетка
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Icon name="List" size={18} />
              Турниры
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Icon name="Code" size={18} />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="animate-scale-in">
            {selectedTournament ? (
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-card to-card/50 border-2 border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{selectedTournament.name}</h2>
                      <div className="flex gap-3 flex-wrap">
                        <Badge variant="outline" className="gap-1 bg-primary/10 border-primary text-primary">
                          <Icon name="Weight" size={14} />
                          {selectedTournament.weight_category}
                        </Badge>
                        <Badge variant="outline" className="gap-1 bg-secondary/10 border-secondary text-secondary">
                          <Icon name="Calendar" size={14} />
                          {selectedTournament.age_category}
                        </Badge>
                        <Badge variant="outline" className="gap-1 bg-accent/10 border-accent text-accent">
                          <Icon name="Users" size={14} />
                          {selectedTournament.total_participants} участников
                        </Badge>
                      </div>
                    </div>
                    
                    {tournaments.length > 1 && (
                      <select
                        value={selectedTournament.id}
                        onChange={(e) => loadTournamentDetails(Number(e.target.value))}
                        className="px-4 py-2 bg-input border border-border rounded-md text-foreground focus:ring-2 focus:ring-ring"
                      >
                        {tournaments.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur">
                  <TournamentBracket 
                    matches={matches} 
                    onMatchClick={setSelectedMatch}
                  />
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Icon name="Trophy" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Нет турниров</h3>
                <p className="text-muted-foreground mb-4">Создайте первый турнир, чтобы начать</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tournaments" className="animate-scale-in">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map(tournament => (
                <Card 
                  key={tournament.id} 
                  className="p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl bg-card border-2 hover:border-primary/50"
                  onClick={() => {
                    loadTournamentDetails(tournament.id);
                    document.querySelector('[value="bracket"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon name="Trophy" size={32} className="text-primary" />
                    <Badge variant="secondary">{tournament.status}</Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">{tournament.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Weight" size={16} />
                      {tournament.weight_category}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Calendar" size={16} />
                      {tournament.age_category}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Users" size={16} />
                      {tournament.total_participants} участников
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="animate-scale-in">
            <Card className="p-6 bg-card/50 backdrop-blur">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Code" size={28} />
                API Документация
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Создать турнир</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-accent mb-2">POST {API_URL}</div>
                    <pre className="text-muted-foreground">{`{
  "name": "Чемпионат",
  "weight_category": "до 75 кг",
  "age_category": "18-25 лет",
  "participants": ["Спортсмен 1", "Спортсмен 2", ...]
}`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Получить турнир</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-accent">GET {API_URL}?tournament_id=1</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Обновить результат</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="text-accent mb-2">PUT {API_URL}</div>
                    <pre className="text-muted-foreground">{`{
  "match_id": 1,
  "winner_id": 5,
  "score": "3:1"
}`}</pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold mb-3">Параметры</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <Icon name="CheckCircle" size={18} className="text-accent flex-shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">weight_category</strong> - весовая категория участников</span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="CheckCircle" size={18} className="text-accent flex-shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">age_category</strong> - возрастная категория участников</span>
                    </li>
                    <li className="flex gap-2">
                      <Icon name="CheckCircle" size={18} className="text-accent flex-shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">participants</strong> - массив имен участников</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UpdateMatchDialog
        match={selectedMatch}
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onUpdated={() => selectedTournament && loadTournamentDetails(selectedTournament.id)}
        participants={participants}
      />
    </div>
  );
}
