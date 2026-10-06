// Shared constants for the DH Araria Hospital Portal

export const HOSPITAL_INFO = {
  name: 'District Hospital Araria',
  shortName: 'DH Araria',
  tagline: 'सेवा परमो धर्मः | Service is Supreme Duty',
  address: 'Araria, Bihar - 854311, India',
  phone: ['+91-6453-222123', '+91-6453-222124'],
  email: ['dh.araria@bihar.gov.in', 'superintendent.dhararia@bihar.gov.in'],
  emergencyPhone: ['108', '102', '+91-6453-222100'],
  ambulancePhone: ['102', '+91-6453-222101'],
  bloodBankPhone: ['+91-6453-222102'],
  website: 'https://dhararia.bihar.gov.in',
  latitude: 26.1507,
  longitude: 87.4797,
  establishedYear: 1985,
  bedCapacity: 300,
  icuBeds: 20,
  nicuBeds: 10,
} as const;

export const DEPARTMENTS = [
  { id: 'general-medicine', name: 'General Medicine', icon: 'stethoscope', description: 'Comprehensive medical care for adults' },
  { id: 'pediatrics', name: 'Pediatrics', icon: 'baby', description: 'Child healthcare and immunization' },
  { id: 'obstetrics-gynecology', name: 'Obstetrics & Gynecology', icon: 'heart', description: 'Women\'s health and maternity care' },
  { id: 'orthopedics', name: 'Orthopedics', icon: 'bone', description: 'Bone, joint, and muscle disorders' },
  { id: 'surgery', name: 'General Surgery', icon: 'scalpel', description: 'Surgical procedures and operations' },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: 'eye', description: 'Eye care and vision treatment' },
  { id: 'ent', name: 'ENT', icon: 'ear', description: 'Ear, nose, and throat disorders' },
  { id: 'dermatology', name: 'Dermatology', icon: 'sparkles', description: 'Skin, hair, and nail conditions' },
  { id: 'psychiatry', name: 'Psychiatry', icon: 'brain', description: 'Mental health and behavioral disorders' },
  { id: 'radiology', name: 'Radiology', icon: 'scan', description: 'Diagnostic imaging services' },
  { id: 'pathology', name: 'Pathology', icon: 'microscope', description: 'Laboratory and diagnostic testing' },
  { id: 'anesthesiology', name: 'Anesthesiology', icon: 'droplet', description: 'Anesthesia and pain management' },
  { id: 'emergency', name: 'Emergency Medicine', icon: 'ambulance', description: '24/7 emergency and trauma care' },
  { id: 'dental', name: 'Dental Surgery', icon: 'tooth', description: 'Oral health and dental procedures' },
  { id: 'physiotherapy', name: 'Physiotherapy', icon: 'activity', description: 'Rehabilitation and physical therapy' },
] as const;

export const BLOOD_GROUPS = [
  { value: 'A+', label: 'A+', rhFactor: 'Positive' },
  { value: 'A-', label: 'A-', rhFactor: 'Negative' },
  { value: 'B+', label: 'B+', rhFactor: 'Positive' },
  { value: 'B-', label: 'B-', rhFactor: 'Negative' },
  { value: 'AB+', label: 'AB+', rhFactor: 'Positive' },
  { value: 'AB-', label: 'AB-', rhFactor: 'Negative' },
  { value: 'O+', label: 'O+', rhFactor: 'Positive' },
  { value: 'O-', label: 'O-', rhFactor: 'Negative' },
] as const;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Confirmation',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  NO_SHOW: 'No Show',
  RESCHEDULED: 'Rescheduled',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'primary',
  NO_SHOW: 'danger',
  RESCHEDULED: 'secondary',
};

export const GRIEVANCE_CATEGORY_LABELS: Record<string, string> = {
  MEDICAL_NEGLIGENCE: 'Medical Negligence',
  STAFF_BEHAVIOR: 'Staff Behavior',
  INFRASTRUCTURE: 'Infrastructure Issues',
  BILLING: 'Billing Disputes',
  APPOINTMENT: 'Appointment Issues',
  MEDICINE_AVAILABILITY: 'Medicine Availability',
  CLEANLINESS: 'Cleanliness & Hygiene',
  OTHER: 'Other',
};

export const NOTICE_CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  RECRUITMENT: 'Recruitment',
  TENDER: 'Tender',
  PUBLIC_HEALTH: 'Public Health Advisory',
  SCHEDULE_CHANGE: 'Schedule Change',
  EMERGENCY: 'Emergency Alert',
};

export const NOTICE_PRIORITY_COLORS: Record<string, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const WORKING_HOURS = {
  opd: 'Monday - Saturday: 9:00 AM - 4:00 PM',
  emergency: '24 Hours / 7 Days',
  pharmacy: 'Monday - Saturday: 8:00 AM - 8:00 PM',
  bloodBank: 'Monday - Saturday: 9:00 AM - 5:00 PM',
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
} as const;

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const JWT_CONSTANTS = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'dh-araria',
  audience: 'dh-araria-users',
} as const;

export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  authMaxRequests: 10,
} as const;

export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
} as const;

export const ABDM_CONSTANTS = {
  sandboxBaseUrl: 'https://dev.abdm.gov.in/gateway',
  productionBaseUrl: 'https://abdm.gov.in/gateway',
  fhirVersion: 'R4',
  consentExpiryDays: 365,
} as const;

export const BHASHINI_CONSTANTS = {
  pipelineSearchUrl: 'https://bhashini.gov.in/api/pipeline/search',
  pipelineConfigUrl: 'https://bhashini.gov.in/api/pipeline/config',
  pipelineComputeUrl: 'https://bhashini.gov.in/api/pipeline/compute',
  supportedLanguages: 22,
} as const;

export const ERPRAAAN_CONSTANTS = {
  authUrl: 'https://epramaan.gov.in/oauth2/authorize',
  tokenUrl: 'https://epramaan.gov.in/oauth2/token',
  userInfoUrl: 'https://epramaan.gov.in/oauth2/userinfo',
  scope: 'openid profile email phone',
} as const;

export const CPGRAMS_CONSTANTS = {
  apiBaseUrl: 'https://pgportal.gov.in/api',
  grievanceEndpoint: '/grievance',
  statusEndpoint: '/grievance/status',
} as const;

export const ERAKTKOSH_CONSTANTS = {
  apiBaseUrl: 'https://eraktkosh.mohfw.gov.in/BLDAHIMS/api',
  bloodStockEndpoint: '/bloodstock',
  bloodBankEndpoint: '/bloodbank',
} as const;

export const CERT_IN_CONSTANTS = {
  logRetentionDays: 180,
  incidentReportingHours: 6,
  ntpServers: ['time.nic.in', 'time.nplindia.org'],
} as const;