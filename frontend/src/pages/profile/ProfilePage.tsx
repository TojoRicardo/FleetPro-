import { useEffect, useRef, useState } from 'react';
import {
  User, Shield, Camera, Globe,
  KeyRound, Monitor, Clock, Calendar, Activity, Loader2, Trash2, Upload, LogOut,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProfileAvatar from '@/components/ui/ProfileAvatar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input, Select, PasswordInput } from '@/components/ui/FormFields';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useProfile } from '@/hooks/useQueries';
import { useAuth } from '@/hooks/useAuth';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { getStoredLocale, setStoredLocale, LOCALE_LABELS, type AppLocale } from '@/theme/locale';
import { ROLE_LABELS } from '@/utils/auditLog';
import { cn, formatDateTime } from '@/utils';
import { useToastStore } from '@/store';
import type { UserSession } from '@/types';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type ProfileForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
};

type PasswordForm = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-muted)] text-primary-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] py-3 last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text)]">{value}</span>
    </div>
  );
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function SessionsList({
  loading,
  items,
  revoking,
  onRevoke,
}: {
  loading: boolean;
  items: UserSession[];
  revoking: boolean;
  onRevoke: (id: number) => void;
}) {
  if (loading) {
    return <LoadingLine label="Chargement des sessions…" />;
  }

  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Aucune session active.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((session) => (
        <div
          key={session.id}
          className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--color-surface-secondary)]/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-muted)]">
              <Monitor className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                <span>{session.name}</span>
                {session.is_current && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">· Session actuelle</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                <span>Dernière activité : </span>
                <span>{session.last_used_at ? formatDateTime(session.last_used_at) : '—'}</span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                <span>Créée le </span>
                <span>{formatDateTime(session.created_at)}</span>
              </p>
            </div>
          </div>
          {!session.is_current && (
            <Button variant="outline" size="sm" loading={revoking} onClick={() => onRevoke(session.id)}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Révoquer</span>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivityList({
  loading,
  logs,
}: {
  loading: boolean;
  logs: Array<{
    id: number;
    action: string;
    resource_label?: string;
    entity_type?: string;
    created_at: string;
  }>;
}) {
  if (loading) {
    return <LoadingLine label="Chargement…" />;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Aucune activité récente.</p>;
  }

  return (
    <ul className="space-y-3">
      {logs.map((log) => (
        <li
          key={log.id}
          className={cn(
            'rounded-xl border border-[var(--border)] px-3 py-2.5',
            'bg-[var(--color-surface-secondary)]/30',
          )}
        >
          <p className="text-sm text-[var(--text)]">
            <span className="font-medium capitalize">{log.action}</span>
            <span className="text-[var(--color-text-secondary)]">{` · ${log.resource_label ?? log.entity_type ?? ''}`}</span>
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{formatDateTime(log.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, dialogProps } = useConfirmDialog();
  const { profile, sessions, activity, updateProfile, uploadAvatar, deleteAvatar, updatePassword, revokeSession } = useProfile();
  const toast = useToastStore((s) => s.addToast);
  const [locale, setLocale] = useState<AppLocale>(() => getStoredLocale());
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    name: '',
    username: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const profileUser = profile.data ?? user;
  const activityLogs = activity.data ?? [];

  useEffect(() => {
    if (!profileUser) return;
    setForm({
      name: profileUser.name ?? '',
      username: profileUser.username ?? profileUser.email.split('@')[0] ?? '',
      email: profileUser.email ?? '',
      phone: profileUser.phone ?? '',
      job_title: profileUser.job_title ?? '',
      department: profileUser.department ?? '',
    });
    setAvatarPreview(profileUser.avatar_url ?? null);
  }, [profileUser]);

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('error', 'Veuillez choisir un fichier image (JPEG, PNG, WebP ou GIF).');
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast('error', 'Image trop volumineuse. Taille maximum : 2 Mo.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    uploadAvatar.mutate(file, {
      onSuccess: (user) => {
        setAvatarPreview(user.avatar_url ?? null);
      },
      onError: () => {
        setAvatarPreview(profileUser?.avatar_url ?? null);
      },
      onSettled: () => {
        URL.revokeObjectURL(localPreview);
        if (fileRef.current) fileRef.current.value = '';
      },
    });
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleAvatarChange(e.dataTransfer.files?.[0]);
  };

  const handleDeleteAvatar = () => {
    confirm({
      title: 'Supprimer la photo de profil',
      description: 'Votre photo sera définitivement supprimée. Vous pourrez en importer une nouvelle à tout moment.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      onConfirm: () => {
        deleteAvatar.mutate(undefined, {
          onSuccess: () => setAvatarPreview(null),
        });
      },
    });
  };

  const photoBusy = uploadAvatar.isPending || deleteAvatar.isPending;
  const hasStoredAvatar = Boolean(profileUser?.avatar_url);
  const displayAvatarSrc = avatarPreview?.startsWith('blob:')
    ? avatarPreview
    : (avatarPreview ?? profileUser?.avatar_url);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      name: form.name,
      username: form.username || null,
      phone: form.phone || null,
      job_title: form.job_title || null,
      department: form.department || null,
    });
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePassword.mutate(passwordForm, {
      onSuccess: () => setPasswordForm({ current_password: '', password: '', password_confirmation: '' }),
    });
  };

  const handleLocaleChange = (value: string) => {
    const next = value === 'en' ? 'en' : 'fr';
    setLocale(next);
    setStoredLocale(next);
  };

  if (profile.isLoading && !profile.data) {
    return (
      <div className="grid w-full gap-6 p-4 sm:p-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
        <ConfirmDialog {...dialogProps} />

        {/* En-tête profil */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <ProfileAvatar name={profileUser?.name} src={displayAvatarSrc} size="md" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-[var(--text)]">{profileUser?.name}</h1>
              <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">{profileUser?.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={profileUser?.status ?? 'active'}>{profileUser?.status === 'active' ? 'Actif' : 'Inactif'}</Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-muted)] px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  <Shield className="h-3.5 w-3.5" />
                  {ROLE_LABELS[profileUser?.role ?? ''] ?? profileUser?.role}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Informations personnelles */}
            <SectionCard
              icon={User}
              title="Informations personnelles"
              description="Mettez à jour vos coordonnées et votre rôle au sein de l'organisation."
            >
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Nom complet"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Nom d'utilisateur"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="prenom.nom"
                  />
                  <Input label="Email" type="email" value={form.email} disabled />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                  <Input
                    label="Poste / Fonction"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    placeholder="Responsable flotte"
                  />
                  <Input
                    label="Département"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Opérations"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--border)] bg-[var(--color-surface-secondary)]/50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">Rôle utilisateur</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                      {ROLE_LABELS[profileUser?.role ?? ''] ?? profileUser?.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">Statut du compte</p>
                    <div className="mt-1">
                      <Badge variant={profileUser?.status ?? 'active'}>
                        {profileUser?.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" layout="horizontal" loading={updateProfile.isPending}>
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </SectionCard>

            {/* Sécurité */}
            <SectionCard
              icon={KeyRound}
              title="Sécurité"
              description="Modifiez votre mot de passe et gérez vos sessions actives."
            >
              <form onSubmit={handlePasswordSave} className="mb-8 space-y-4 border-b border-[var(--border)] pb-8">
                <h3 className="text-sm font-semibold text-[var(--text)]">Modifier le mot de passe</h3>
                <PasswordInput
                  label="Mot de passe actuel"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PasswordInput
                    label="Nouveau mot de passe"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    required
                  />
                  <PasswordInput
                    label="Confirmer le mot de passe"
                    value={passwordForm.password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" layout="horizontal" variant="secondary" loading={updatePassword.isPending}>
                    Mettre à jour le mot de passe
                  </Button>
                </div>
              </form>

              <div>
                <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Sessions actives</h3>
                <SessionsList
                  key={sessions.isLoading ? 'sessions-loading' : `sessions-${(sessions.data ?? []).length}`}
                  loading={sessions.isLoading}
                  items={sessions.data ?? []}
                  revoking={revokeSession.isPending}
                  onRevoke={(id) => revokeSession.mutate(id)}
                />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            {/* Photo de profil */}
            <SectionCard
              icon={Camera}
              title="Photo de profil"
              description="Importez ou supprimez votre photo. Formats acceptés : JPEG, PNG, WebP, GIF — max. 2 Mo."
            >
              <div
                className={cn(
                  'relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-6 transition-colors',
                  dragOver
                    ? 'border-primary-500 bg-[var(--color-accent-muted)]/50'
                    : 'border-[var(--border)] bg-[var(--color-surface-secondary)]/30',
                  photoBusy && 'pointer-events-none opacity-70',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleAvatarDrop}
              >
                <div className="relative">
                  <ProfileAvatar name={profileUser?.name} src={displayAvatarSrc} size="xl" />
                  {photoBusy && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--card)]/80">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
                    </div>
                  )}
                </div>

                <p className="text-center text-sm text-[var(--color-text-secondary)]">
                  Glissez-déposez une image ici ou utilisez les boutons ci-dessous
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={photoBusy}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>Choisir</span>
                  </Button>
                  {hasStoredAvatar && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={photoBusy}
                      onClick={handleDeleteAvatar}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>Supprimer</span>
                    </Button>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Préférences */}
            <SectionCard icon={Globe} title="Préférences" description="Langue de l'interface FleetPro.">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                  <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  Langue
                </label>
                <Select value={locale} onChange={(e) => handleLocaleChange(e.target.value)}>
                  {(Object.entries(LOCALE_LABELS) as [AppLocale, string][]).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </Select>
              </div>
            </SectionCard>

            {/* Activité */}
            <SectionCard icon={Activity} title="Activité" description="Historique et informations de connexion.">
              <div className="mb-6 space-y-1">
                <InfoRow
                  label="Date de création du compte"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      {profileUser?.created_at ? formatDateTime(profileUser.created_at) : '—'}
                    </span>
                  }
                />
                <InfoRow
                  label="Dernière connexion"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                      {profileUser?.last_login_at ? formatDateTime(profileUser.last_login_at) : '—'}
                    </span>
                  }
                />
              </div>

              <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Activité récente</h3>
              <ActivityList
                key={activity.isLoading ? 'activity-loading' : `activity-${activityLogs.length}`}
                loading={activity.isLoading} logs={activityLogs} />
            </SectionCard>
          </div>
        </div>
    </div>
  );
}
