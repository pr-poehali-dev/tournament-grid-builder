import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface CreateTournamentDialogProps {
  onTournamentCreated: () => void;
}

export default function CreateTournamentDialog({ onTournamentCreated }: CreateTournamentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    weight_category: '',
    age_category: '',
    participants: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const participantsList = formData.participants
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (participantsList.length < 2) {
        toast({
          title: 'Ошибка',
          description: 'Необходимо минимум 2 участника',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const response = await fetch('https://functions.poehali.dev/ad250640-ab38-4a99-8453-f04f409a3434', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          weight_category: formData.weight_category,
          age_category: formData.age_category,
          participants: participantsList
        })
      });

      if (!response.ok) throw new Error('Ошибка создания турнира');

      const data = await response.json();
      
      toast({
        title: 'Успешно!',
        description: `Турнир "${formData.name}" создан`,
      });

      setFormData({ name: '', weight_category: '', age_category: '', participants: '' });
      setOpen(false);
      onTournamentCreated();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать турнир',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={20} />
          Создать турнир
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Новый турнир</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Название турнира</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Чемпионат по борьбе"
              required
            />
          </div>

          <div>
            <Label htmlFor="weight">Весовая категория</Label>
            <Input
              id="weight"
              value={formData.weight_category}
              onChange={e => setFormData(prev => ({ ...prev, weight_category: e.target.value }))}
              placeholder="до 75 кг"
              required
            />
          </div>

          <div>
            <Label htmlFor="age">Возрастная категория</Label>
            <Input
              id="age"
              value={formData.age_category}
              onChange={e => setFormData(prev => ({ ...prev, age_category: e.target.value }))}
              placeholder="18-25 лет"
              required
            />
          </div>

          <div>
            <Label htmlFor="participants">Участники (каждый с новой строки)</Label>
            <textarea
              id="participants"
              value={formData.participants}
              onChange={e => setFormData(prev => ({ ...prev, participants: e.target.value }))}
              placeholder="Иванов И.И.&#10;Петров П.П.&#10;Сидоров С.С.&#10;Козлов К.К."
              required
              rows={6}
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Создание...' : 'Создать турнир'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
