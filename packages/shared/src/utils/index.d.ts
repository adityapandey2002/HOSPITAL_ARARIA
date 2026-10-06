import { type ClassValue } from 'clsx';
/**
 * Combines class names with Tailwind CSS conflict resolution
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Formats a date to a readable string
 */
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Formats a time to a readable string
 */
export declare function formatTime(time: string): string;
/**
 * Formats a date and time together
 */
export declare function formatDateTime(date: Date | string, time?: string): string;
/**
 * Calculates age from date of birth
 */
export declare function calculateAge(dateOfBirth: Date | string): number;
/**
 * Generates a random token number for appointments
 */
export declare function generateTokenNumber(): number;
/**
 * Formats phone number for display
 */
export declare function formatPhoneNumber(phone: string): string;
/**
 * Validates Indian phone number
 */
export declare function isValidIndianPhone(phone: string): boolean;
/**
 * Validates email address
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validates Aadhaar number (Verhoeff algorithm)
 */
export declare function isValidAadhaar(aadhaar: string): boolean;
/**
 * Validates PAN number
 */
export declare function isValidPan(pan: string): boolean;
/**
 * Truncates text with ellipsis
 */
export declare function truncate(text: string, length: number): string;
/**
 * Capitalizes first letter of each word
 */
export declare function titleCase(text: string): string;
/**
 * Generates slug from string
 */
export declare function slugify(text: string): string;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttle function
 */
export declare function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Deep clone object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Checks if object is empty
 */
export declare function isEmpty(obj: unknown): boolean;
/**
 * Picks keys from object
 */
export declare function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omits keys from object
 */
export declare function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Sleep utility for async operations
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry async function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, retries?: number, baseDelay?: number): Promise<T>;
/**
 * Format file size
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Get initials from name
 */
export declare function getInitials(name: string): string;
/**
 * Generate random color for avatar
 */
export declare function getAvatarColor(name: string): string;
/**
 * Check if running in browser
 */
export declare function isBrowser(): boolean;
/**
 * Get query parameter from URL
 */
export declare function getQueryParam(param: string): string | null;
/**
 * Set query parameter in URL without reload
 */
export declare function setQueryParam(param: string, value: string): void;
/**
 * Remove query parameter from URL
 */
export declare function removeQueryParam(param: string): void;
//# sourceMappingURL=index.d.ts.map