import { Pencil, Trash2, Unlink, type LucideIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

type ActionButtonProps = {
  onClick: () => void;
  label: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  disabled?: boolean;
};

function ActionButton({ onClick, label, icon: Icon, variant = 'secondary', disabled }: ActionButtonProps) {
  return (
    <Button type="button" variant={variant} size="sm" onClick={onClick} disabled={disabled} aria-label={label}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}

export function EditActionButton({ onClick, label = 'Modifier' }: { onClick: () => void; label?: string }) {
  return <ActionButton onClick={onClick} label={label} icon={Pencil} variant="secondary" />;
}

export function DeleteActionButton({ onClick, label = 'Supprimer' }: { onClick: () => void; label?: string }) {
  return <ActionButton onClick={onClick} label={label} icon={Trash2} variant="danger" />;
}

export function UnlinkActionButton({ onClick, label = 'Retirer' }: { onClick: () => void; label?: string }) {
  return <ActionButton onClick={onClick} label={label} icon={Unlink} variant="outline" />;
}
