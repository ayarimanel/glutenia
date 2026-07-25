import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Calendar,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleCheck,
  CirclePlus,
  CircleX,
  ClipboardList,
  CreditCard,
  Edit3,
  Grid3X3,
  Home,
  ImagePlus,
  Leaf,
  List,
  LogIn,
  LogOut,
  MapPin,
  Minus,
  Package,
  ScanLine,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBasket,
  Trash2,
  User,
  UserPlus,
  Users,
  Wheat,
  X,
  // New icons for the redesign
  Bell,
  Compass,
  Heart,
  Phone,
  Navigation,
  Clock,
  Info,
  Star,
  Utensils,
  Croissant,
  Activity,
  Eye,
  PlayCircle,
} from "lucide-react-native";
import type { StyleProp, ViewStyle } from "react-native";

const icons = {
  add: CirclePlus,
  "add-circle": CirclePlus,
  "arrow-back": ArrowLeft,
  basket: ShoppingBasket,
  calendar: Calendar,
  card: CreditCard,
  cash: Banknote,
  checkmark: CircleCheck,
  "checkmark-circle": CircleCheck,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  close: X,
  "close-circle": CircleX,
  cube: Package,
  ellipse: Circle,
  grid: Grid3X3,
  home: Home,
  image: ImagePlus,
  leaf: Leaf,
  list: List,
  location: MapPin,
  "log-in": LogIn,
  "log-out": LogOut,
  "map-pin": MapPin,
  pencil: Edit3,
  people: Users,
  person: User,
  "person-add": UserPlus,
  "person-circle": User,
  receipt: ClipboardList,
  refresh: Circle,
  remove: Minus,
  save: BadgeCheck,
  scan: ScanLine,
  search: Search,
  settings: Settings,
  shield: Shield,
  "shield-check": ShieldCheck,
  trash: Trash2,
  "bread-slice": Wheat,
  noodles: Package,
  "food-variant": ShoppingBasket,
  sack: Package,
  cupcake: Circle,
  
  // New icon mappings
  bell: Bell,
  compass: Compass,
  heart: Heart,
  phone: Phone,
  navigation: Navigation,
  clock: Clock,
  info: Info,
  star: Star,
  utensils: Utensils,
  croissant: Croissant,
  activity: Activity,
  eye: Eye,
  "play-circle": PlayCircle,
};

export type IconName = keyof typeof icons;

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AppIcon({
  name,
  size = 18,
  color = "#000",
  strokeWidth = 2.4,
  fill = "none",
  style,
}: AppIconProps) {
  const Icon = icons[name] || Circle;
  return (
    <Icon
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      fill={fill}
      style={style}
    />
  );
}
