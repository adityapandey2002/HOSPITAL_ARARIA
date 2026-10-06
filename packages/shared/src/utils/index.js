// Shared utility functions for the DH Araria Hospital Portal
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Combines class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Formats a date to a readable string
 */
export function formatDate(date, options) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    });
}
/**
 * Formats a time to a readable string
 */
export function formatTime(time) {
    // Input format: "HH:mm"
    const parts = time.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parts[1] || '00';
    const hour = hours;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}
/**
 * Formats a date and time together
 */
export function formatDateTime(date, time) {
    const formattedDate = formatDate(date);
    if (time) {
        return `${formattedDate} at ${formatTime(time)}`;
    }
    return formattedDate;
}
/**
 * Calculates age from date of birth
 */
export function calculateAge(dateOfBirth) {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}
/**
 * Generates a random token number for appointments
 */
export function generateTokenNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}
/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone) {
    // Indian phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
}
/**
 * Validates Indian phone number
 */
export function isValidIndianPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^(?:(?:\+|0{0,2})91)?[6-9]\d{9}$/.test(cleaned);
}
/**
 * Validates email address
 */
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/**
 * Validates Aadhaar number (Verhoeff algorithm)
 */
export function isValidAadhaar(aadhaar) {
    const cleaned = aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleaned))
        return false;
    // Verhoeff algorithm implementation
    const verhoeffD = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 5, 6, 7, 8, 9, 5, 0],
        [3, 4, 5, 6, 7, 8, 9, 5, 0, 1],
        [4, 5, 6, 7, 8, 9, 5, 0, 1, 2],
        [5, 6, 7, 8, 9, 5, 0, 1, 2, 3],
        [6, 7, 8, 9, 5, 0, 1, 2, 3, 4],
        [7, 8, 9, 5, 0, 1, 2, 3, 4, 5],
        [8, 9, 5, 0, 1, 2, 3, 4, 5, 6],
        [9, 5, 0, 1, 2, 3, 4, 5, 6, 7],
    ];
    const verhoeffP = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];
    const verhoeffInv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
    let c = 0;
    for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[cleaned.length - 1 - i];
        const digit = char ? parseInt(char, 10) : 0;
        const pRow = verhoeffP[i % 8];
        const dRow = pRow && pRow[digit] !== undefined ? pRow[digit] : 0;
        const dRow2 = verhoeffD[c];
        c = dRow2 && dRow2[dRow] !== undefined ? dRow2[dRow] : 0;
    }
    return verhoeffInv[c] === 0;
}
/**
 * Validates PAN number
 */
export function isValidPan(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}
/**
 * Truncates text with ellipsis
 */
export function truncate(text, length) {
    if (text.length <= length)
        return text;
    return text.slice(0, length - 3) + '...';
}
/**
 * Capitalizes first letter of each word
 */
export function titleCase(text) {
    return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
/**
 * Generates slug from string
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Checks if object is empty
 */
export function isEmpty(obj) {
    if (obj === null || obj === undefined)
        return true;
    if (Array.isArray(obj))
        return obj.length === 0;
    if (typeof obj === 'object')
        return Object.keys(obj).length === 0;
    return false;
}
/**
 * Picks keys from object
 */
export function pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
        if (key in obj)
            result[key] = obj[key];
    });
    return result;
}
/**
 * Omits keys from object
 */
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
}
/**
 * Sleep utility for async operations
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry async function with exponential backoff
 */
export async function retry(fn, retries = 3, baseDelay = 1000) {
    try {
        return await fn();
    }
    catch (error) {
        if (retries <= 0)
            throw error;
        await sleep(baseDelay);
        return retry(fn, retries - 1, baseDelay * 2);
    }
}
/**
 * Format file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Get initials from name
 */
export function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
/**
 * Generate random color for avatar
 */
export function getAvatarColor(name) {
    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-green-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-sky-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
        'bg-rose-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}
/**
 * Check if running in browser
 */
export function isBrowser() {
    return typeof window !== 'undefined';
}
/**
 * Get query parameter from URL
 */
export function getQueryParam(param) {
    if (!isBrowser())
        return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
/**
 * Set query parameter in URL without reload
 */
export function setQueryParam(param, value) {
    if (!isBrowser())
        return;
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.replaceState({}, '', url.toString());
}
/**
 * Remove query parameter from URL
 */
export function removeQueryParam(param) {
    if (!isBrowser())
        return;
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState({}, '', url.toString());
}
