export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    abhaId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    PATIENT = "PATIENT",
    DOCTOR = "DOCTOR",
    ADMIN = "ADMIN",
    STAFF = "STAFF"
}
export interface Doctor {
    id: string;
    userId: string;
    name: string;
    specialization: string;
    qualification: string;
    experience: number;
    hprId?: string;
    departmentId: string;
    consultationFee: number;
    availableSlots: TimeSlot[];
    rating: number;
    reviewCount: number;
    languages: string[];
    bio?: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Department {
    id: string;
    name: string;
    description: string;
    icon?: string;
    imageUrl?: string;
    isActive: boolean;
    doctors: Doctor[];
    createdAt: Date;
    updatedAt: Date;
}
export interface TimeSlot {
    id: string;
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    maxAppointments: number;
}
export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    type: AppointmentType;
    reason?: string;
    notes?: string;
    abhaId?: string;
    tokenNumber?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum AppointmentStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
    NO_SHOW = "NO_SHOW",
    RESCHEDULED = "RESCHEDULED"
}
export declare enum AppointmentType {
    OPD = "OPD",
    TELECONSULTATION = "TELECONSULTATION",
    EMERGENCY = "EMERGENCY",
    FOLLOW_UP = "FOLLOW_UP"
}
export interface BloodStock {
    id: string;
    bloodGroup: BloodGroup;
    componentType: BloodComponentType;
    unitsAvailable: number;
    lastUpdated: Date;
}
export declare enum BloodGroup {
    A_POSITIVE = "A+",
    A_NEGATIVE = "A-",
    B_POSITIVE = "B+",
    B_NEGATIVE = "B-",
    AB_POSITIVE = "AB+",
    AB_NEGATIVE = "AB-",
    O_POSITIVE = "O+",
    O_NEGATIVE = "O-"
}
export declare enum BloodComponentType {
    WHOLE_BLOOD = "WHOLE_BLOOD",
    PACKED_RED_CELLS = "PACKED_RED_CELLS",
    PLATELETS = "PLATELETS",
    PLASMA = "PLASMA",
    CRYOPRECIPITATE = "CRYOPRECIPITATE"
}
export interface Grievance {
    id: string;
    userId?: string;
    name: string;
    email: string;
    phone: string;
    category: GrievanceCategory;
    subject: string;
    description: string;
    status: GrievanceStatus;
    cpgramsId?: string;
    assignedTo?: string;
    resolution?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum GrievanceCategory {
    MEDICAL_NEGLIGENCE = "MEDICAL_NEGLIGENCE",
    STAFF_BEHAVIOR = "STAFF_BEHAVIOR",
    INFRASTRUCTURE = "INFRASTRUCTURE",
    BILLING = "BILLING",
    APPOINTMENT = "APPOINTMENT",
    MEDICINE_AVAILABILITY = "MEDICINE_AVAILABILITY",
    CLEANLINESS = "CLEANLINESS",
    OTHER = "OTHER"
}
export declare enum GrievanceStatus {
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    REJECTED = "REJECTED"
}
export interface Notice {
    id: string;
    title: string;
    content: string;
    category: NoticeCategory;
    priority: NoticePriority;
    publishedAt: Date;
    expiresAt?: Date;
    isPublished: boolean;
    attachmentUrl?: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum NoticeCategory {
    GENERAL = "GENERAL",
    RECRUITMENT = "RECRUITMENT",
    TENDER = "TENDER",
    PUBLIC_HEALTH = "PUBLIC_HEALTH",
    SCHEDULE_CHANGE = "SCHEDULE_CHANGE",
    EMERGENCY = "EMERGENCY"
}
export declare enum NoticePriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface ContactInfo {
    address: string;
    phone: string[];
    email: string[];
    emergencyPhone: string[];
    ambulancePhone: string[];
    bloodBankPhone: string[];
    latitude?: number;
    longitude?: number;
    workingHours: {
        opd: string;
        emergency: string;
        pharmacy: string;
        bloodBank: string;
    };
}
export interface Language {
    code: string;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
}
export declare const SUPPORTED_LANGUAGES: Language[];
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FhirBundle {
    resourceType: 'Bundle';
    id: string;
    type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
    timestamp: string;
    total?: number;
    entry?: FhirBundleEntry[];
}
export interface FhirBundleEntry {
    fullUrl?: string;
    resource: FhirResource;
    search?: {
        mode: 'match' | 'include' | 'outcome';
        score?: number;
    };
    request?: {
        method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        url: string;
        ifNoneMatch?: string;
        ifModifiedSince?: string;
        ifMatch?: string;
        ifNoneExist?: string;
    };
    response?: {
        status: string;
        location?: string;
        etag?: string;
        lastModified?: string;
        outcome?: FhirResource;
    };
}
export interface FhirResource {
    resourceType: string;
    id?: string;
    meta?: {
        versionId?: string;
        lastUpdated?: string;
        source?: string;
        profile?: string[];
        security?: Coding[];
        tag?: Coding[];
    };
    implicitRules?: string;
    language?: string;
    text?: Narrative;
    contained?: FhirResource[];
    extension?: Extension[];
    modifierExtension?: Extension[];
}
export interface Coding {
    system?: string;
    version?: string;
    code?: string;
    display?: string;
    userSelected?: boolean;
}
export interface Narrative {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
}
export interface Extension {
    url: string;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDecimal?: number;
    valueDateTime?: string;
    valueCode?: string;
    valueCoding?: Coding;
    valueQuantity?: Quantity;
    valueReference?: Reference;
    extension?: Extension[];
}
export interface Quantity {
    value?: number;
    comparator?: '<' | '<=' | '>=' | '>';
    unit?: string;
    system?: string;
    code?: string;
}
export interface Reference {
    reference?: string;
    type?: string;
    identifier?: Identifier;
    display?: string;
}
export interface Identifier {
    use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
    type?: CodeableConcept;
    system?: string;
    value?: string;
    period?: Period;
    assigner?: Reference;
}
export interface CodeableConcept {
    coding?: Coding[];
    text?: string;
}
export interface Period {
    start?: string;
    end?: string;
}
//# sourceMappingURL=index.d.ts.map