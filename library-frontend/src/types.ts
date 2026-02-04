export type Role = "ADMIN" | "STUDENT";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paged<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface User {
  id: number;
  name: string;
  email: string;
  nisn?: string | null;
  kelas?: string | null;
  accountStatus?: "ACTIVE" | "RETURN_ONLY" | "INACTIVE" | null;
  statusChangedAt?: string | null;
  statusReason?: string | null;
  twoFactorEnabled?: boolean | null;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
}

export type BookFormat = "PHYSICAL" | "DIGITAL";

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  year?: number | null;
  description?: string | null;
  stock: number;
  format: BookFormat;
  categoryId: number;
  category?: Category;
  coverPath?: string | null;
}

export type BorrowingStatus = "DIPINJAM" | "DIKEMBALIKAN";

export interface Borrowing {
  id: number;
  userId: number;
  bookId: number;
  status: BorrowingStatus;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  lateDays?: number;
  lateFee?: number;
  book?: Book;
  user?: User; // ada jika ADMIN (backend kamu include user)
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: number | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: Pick<User, "id" | "name" | "email" | "role">;
}

export type ReservationStatus = "ACTIVE" | "READY" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export interface Reservation {
  id: number;
  userId: number;
  bookId: number;
  status: ReservationStatus;
  readyAt?: string | null;
  expiresAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  book?: Book;
  user?: User;
}

export type NotificationStatus = "UNREAD" | "READ";
export type NotificationType = "DUE_SOON" | "OVERDUE" | "RESERVATION_READY" | "SYSTEM";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  entity?: string | null;
  entityId?: number | null;
  createdAt: string;
  readAt?: string | null;
}

export interface ReportOverview {
  totals: {
    totalBooks: number;
    totalStudents: number;
    activeBorrowings: number;
    overdueBorrowings: number;
    activeReservations: number;
    totalLateFees: number;
  };
  trends: Record<string, number>;
  topBorrowedBooks: Array<{ bookId: number; title: string; totalBorrowed: number }>;
}
