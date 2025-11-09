import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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

interface UpdateMatchDialogProps {
  match: Match | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  participants: Array<{ id: number; name: string }>;
}

export default function UpdateMatchDialog({ match, open, onClose, onUpdated, participants }: UpdateMatchDialogProps) {
  const [score, setScore] = useState('');
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!match) return null;

  const participant1 = participants.find(p => p.name === match.participant1);
  const participant2 = participants.find(p => p.name === match.participant2);

  const handleSubmit = async () => {
    if (!selectedWinner) {
      toast({
        title: 'Ошибка',
        description: 'Выберите победителя',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/ad250640-ab38-4a99-8453-f04f409a3434', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          match_id: match.id,
          winner_id: selectedWinner,
          score: score
        })
      });

      if (!response.ok) throw new Error('Ошибка обновления');

      toast({
        title: 'Успешно!',
        description: 'Результат матча обновлен',
      });

      setScore('');
      setSelectedWinner(null);
      onClose();
      onUpdated();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить результат',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Результат матча</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-3">
            <Label>Победитель</Label>
            
            {participant1 && (
              <button
                type="button"
                onClick={() => setSelectedWinner(participant1.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  selectedWinner === participant1.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon name="User" size={20} />
                <span className="flex-1 text-left">{participant1.name}</span>
                {selectedWinner === participant1.id && (
                  <Icon name="Check" size={20} className="text-accent" />
                )}
              </button>
            )}

            {participant2 && (
              <button
                type="button"
                onClick={() => setSelectedWinner(participant2.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  selectedWinner === participant2.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon name="User" size={20} />
                <span className="flex-1 text-left">{participant2.name}</span>
                {selectedWinner === participant2.id && (
                  <Icon name="Check" size={20} className="text-accent" />
                )}
              </button>
            )}
          </div>

          <div>
            <Label htmlFor="score">Счет (необязательно)</Label>
            <Input
              id="score"
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="3:1"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedWinner}
            className="w-full"
          >
            {loading ? 'Сохранение...' : 'Сохранить результат'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
