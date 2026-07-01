export const TOPBAR_COPY = {
  search: {
    placeholder: 'Rechercher ou accéder…',
    placeholderModal: 'Pages, véhicules, conducteurs, actions…',
    ariaMobile: 'Palette de commandes',
    noResults: 'Aucun résultat pour',
    groups: {
      pages: 'Pages',
      actions: 'Actions rapides',
      vehicles: 'Véhicules',
      drivers: 'Conducteurs',
    },
    hints: {
      navigate: 'naviguer',
      select: 'sélectionner',
      close: 'fermer',
    },
  },
  tenant: {
    defaultName: 'Mon organisation',
    allTenants: 'Tous les locataires',
    switchWorkspace: 'Changer d\'espace',
    allTenantsGlobal: 'Tous les locataires (global)',
  },
  notifications: {
    aria: 'Notifications',
    title: 'Notifications',
    unread: (count: number) => `${count} non lue${count > 1 ? 's' : ''}`,
    markRead: 'Tout marquer lu',
    markOneRead: 'Marquer comme lu',
    loading: 'Chargement…',
    emptyTitle: 'Tout est à jour',
    emptySubtitle: 'Aucune notification pour le moment.',
    emptyPageDescription: 'Nous vous préviendrons dès qu\'un événement important se produira.',
    viewAll: 'Voir toutes les notifications',
    loadError: 'Impossible de charger les notifications.',
    markError: 'Impossible de marquer comme lu.',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    relative: {
      justNow: "À l'instant",
      minutes: (n: number) => `Il y a ${n} min`,
      hours: (n: number) => `Il y a ${n} h`,
    },
    types: {
      default: 'Notification',
      vehicle: 'Flotte',
      trip: 'Trajet',
      assignment: 'Affectation',
      maintenance: 'Maintenance',
      billing: 'Facturation',
      security: 'Sécurité',
    },
    detail: {
      unread: 'Non lue',
      receivedAt: 'Reçue le',
      readAt: 'Lue le',
      details: 'Détails',
      close: 'Fermer',
    },
  },
  userMenu: {
    profile: 'Profil',
    logout: 'Déconnexion',
  },
} as const;

export const BILLING_COPY = {
  refresh: 'Actualiser',
  stats: {
    revenue: 'Revenus totaux',
    pending: 'En attente',
    overdue: 'En retard',
  },
  invoices: {
    title: 'Factures',
    tabs: {
      all: 'Toutes',
      pending: 'En attente',
      paid: 'Payées',
      overdue: 'En retard',
    },
    emptyTitle: 'Aucune facture',
    emptyDescription: 'Souscrivez à un plan payant pour générer votre première facture.',
    emptyApiError: 'Impossible de charger les factures. Vérifiez votre connexion et réessayez.',
    pay: 'Payer',
    viewPricing: 'Voir les tarifs',
  },
  errors: {
    load: 'Impossible de charger les factures.',
    details: 'Impossible de charger le détail de la facture.',
    pay: 'Le paiement a échoué.',
  },
} as const;
