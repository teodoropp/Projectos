// Províncias de Angola
export const ANGOLA_PROVINCES = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
  'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
  'Namibe', 'Uíge', 'Zaire'
];

// Categorias de serviços
export const SERVICE_CATEGORIES = [
  { id: 'eletricista', name: 'Eletricista', icon: 'flash' },
  { id: 'canalizador', name: 'Canalizador', icon: 'water' },
  { id: 'pedreiro', name: 'Pedreiro', icon: 'construct' },
  { id: 'pintor', name: 'Pintor', icon: 'color-palette' },
  { id: 'informatico', name: 'Informático/TI', icon: 'laptop' },
  { id: 'contabilista', name: 'Contabilista', icon: 'calculator' },
  { id: 'carpinteiro', name: 'Carpinteiro', icon: 'hammer' },
  { id: 'serralheiro', name: 'Serralheiro', icon: 'build' },
  { id: 'mecanico', name: 'Mecânico', icon: 'car' },
  { id: 'jardineiro', name: 'Jardineiro', icon: 'leaf' },
  { id: 'limpeza', name: 'Limpeza', icon: 'sparkles' },
  { id: 'seguranca', name: 'Segurança', icon: 'shield' },
  { id: 'cozinheiro', name: 'Cozinheiro/Chef', icon: 'restaurant' },
  { id: 'motorista', name: 'Motorista', icon: 'car-sport' },
  { id: 'costureira', name: 'Costureira', icon: 'shirt' },
  { id: 'cabeleireiro', name: 'Cabeleireiro', icon: 'cut' },
  { id: 'consultoria', name: 'Consultoria', icon: 'briefcase' },
  { id: 'transporte', name: 'Transporte/Logística', icon: 'cube' },
  { id: 'construcao', name: 'Construção Civil', icon: 'business' },
  { id: 'design', name: 'Design/Criativo', icon: 'color-wand' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone' },
  { id: 'juridico', name: 'Serviços Jurídicos', icon: 'document-text' },
];

// Tipos de utilizador
export const USER_TYPES = [
  { id: 'cliente', name: 'Cliente', description: 'Procuro serviços' },
  { id: 'profissional', name: 'Profissional', description: 'Ofereço meus serviços' },
  { id: 'empresa', name: 'Empresa', description: 'Represento uma empresa' },
];

// Níveis de urgência
export const URGENCY_LEVELS = [
  { id: 'normal', name: 'Normal', color: '#10B981' },
  { id: 'urgente', name: 'Urgente', color: '#F59E0B' },
  { id: 'muito_urgente', name: 'Muito Urgente', color: '#EF4444' },
];

// Estados de verificação
export const VERIFICATION_STATUS = {
  pendente: { label: 'Pendente', color: '#F59E0B', icon: 'time' },
  verificado: { label: 'Verificado', color: '#10B981', icon: 'checkmark-circle' },
  rejeitado: { label: 'Rejeitado', color: '#EF4444', icon: 'close-circle' },
};

// Planos de subscrição
export const SUBSCRIPTION_PLANS = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    price: 0,
    priceLabel: 'Grátis',
    features: ['Perfil básico', 'Até 3 propostas/mês', 'Visibilidade normal'],
    highlighted: false,
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: 5000,
    priceLabel: '5.000 Kz/mês',
    features: ['Perfil verificado', 'Propostas ilimitadas', 'Destaque nas buscas', 'Selo de confiança'],
    highlighted: true,
  },
  {
    id: 'empresa',
    name: 'Empresa',
    price: 15000,
    priceLabel: '15.000 Kz/mês',
    features: ['Tudo do Profissional', 'Múltiplos funcionários', 'Painel de gestão', 'Suporte prioritário'],
    highlighted: false,
  },
];

// Cores do tema
export const COLORS = {
  primary: '#F59E0B',
  primaryDark: '#D97706',
  secondary: '#EF4444',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#475569',
  verified: '#10B981',
  pending: '#F59E0B',
  rejected: '#EF4444',
};
