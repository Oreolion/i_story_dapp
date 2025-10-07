// Mock database service (in production, this would use Prisma with PostgreSQL)
export interface User {
  id: string;
  address: string;
  name: string;
  bio: string;
  avatar?: string;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  hasAudio: boolean;
  ipfsHash: string;
  tokenId: number;
  likes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  description: string;
  entryIds: string[];
  ipfsHash: string;
  tokenId: number;
  coverStyle: string;
  likes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private users: Map<string, User> = new Map();
  private entries: Map<string, JournalEntry> = new Map();
  private books: Map<string, Book> = new Map();

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substring(2, 15),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getUserByAddress(address: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.address === address) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Journal entry operations
  async createEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const entry: JournalEntry = {
      id: Math.random().toString(36).substring(2, 15),
      ...entryData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.entries.set(entry.id, entry);
    return entry;
  }

  async getEntriesByUser(userId: string): Promise<JournalEntry[]> {
    return Array.from(this.entries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEntry(id: string): Promise<JournalEntry | null> {
    return this.entries.get(id) || null;
  }

  async updateEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    const updatedEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date()
    };

    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Book operations
  async createBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<Book> {
    const book: Book = {
      id: Math.random().toString(36).substring(2, 15),
      ...bookData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.books.set(book.id, book);
    return book;
  }

  async getBooksByUser(userId: string): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter(book => book.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBook(id: string): Promise<Book | null> {
    return this.books.get(id) || null;
  }

  // Analytics
  async getUserStats(userId: string): Promise<{
    totalEntries: number;
    totalBooks: number;
    totalLikes: number;
    totalViews: number;
  }> {
    const userEntries = await this.getEntriesByUser(userId);
    const userBooks = await this.getBooksByUser(userId);
    
    const totalLikes = userEntries.reduce((sum, entry) => sum + entry.likes, 0) +
                      userBooks.reduce((sum, book) => sum + book.likes, 0);
    
    const totalViews = userEntries.reduce((sum, entry) => sum + entry.views, 0) +
                      userBooks.reduce((sum, book) => sum + book.views, 0);

    return {
      totalEntries: userEntries.length,
      totalBooks: userBooks.length,
      totalLikes,
      totalViews
    };
  }

  // Seed mock data for development
  async seedMockData(): Promise<void> {
    // Create mock user
    await this.createUser({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Alex Johnson',
      bio: 'Digital storyteller sharing life moments on the blockchain',
      badges: ['Early Adopter', '10-Day Streak', 'Community Star']
    });
  }
}

export const dbService = DatabaseService.getInstance();