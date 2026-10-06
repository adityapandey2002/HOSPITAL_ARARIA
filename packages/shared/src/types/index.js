"use strict";
// Shared types for the DH Araria Hospital Portal
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_LANGUAGES = exports.NoticePriority = exports.NoticeCategory = exports.GrievanceStatus = exports.GrievanceCategory = exports.BloodComponentType = exports.BloodGroup = exports.AppointmentType = exports.AppointmentStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["PATIENT"] = "PATIENT";
    UserRole["DOCTOR"] = "DOCTOR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["STAFF"] = "STAFF";
})(UserRole || (exports.UserRole = UserRole = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
    AppointmentStatus["RESCHEDULED"] = "RESCHEDULED";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["OPD"] = "OPD";
    AppointmentType["TELECONSULTATION"] = "TELECONSULTATION";
    AppointmentType["EMERGENCY"] = "EMERGENCY";
    AppointmentType["FOLLOW_UP"] = "FOLLOW_UP";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var BloodGroup;
(function (BloodGroup) {
    BloodGroup["A_POSITIVE"] = "A+";
    BloodGroup["A_NEGATIVE"] = "A-";
    BloodGroup["B_POSITIVE"] = "B+";
    BloodGroup["B_NEGATIVE"] = "B-";
    BloodGroup["AB_POSITIVE"] = "AB+";
    BloodGroup["AB_NEGATIVE"] = "AB-";
    BloodGroup["O_POSITIVE"] = "O+";
    BloodGroup["O_NEGATIVE"] = "O-";
})(BloodGroup || (exports.BloodGroup = BloodGroup = {}));
var BloodComponentType;
(function (BloodComponentType) {
    BloodComponentType["WHOLE_BLOOD"] = "WHOLE_BLOOD";
    BloodComponentType["PACKED_RED_CELLS"] = "PACKED_RED_CELLS";
    BloodComponentType["PLATELETS"] = "PLATELETS";
    BloodComponentType["PLASMA"] = "PLASMA";
    BloodComponentType["CRYOPRECIPITATE"] = "CRYOPRECIPITATE";
})(BloodComponentType || (exports.BloodComponentType = BloodComponentType = {}));
var GrievanceCategory;
(function (GrievanceCategory) {
    GrievanceCategory["MEDICAL_NEGLIGENCE"] = "MEDICAL_NEGLIGENCE";
    GrievanceCategory["STAFF_BEHAVIOR"] = "STAFF_BEHAVIOR";
    GrievanceCategory["INFRASTRUCTURE"] = "INFRASTRUCTURE";
    GrievanceCategory["BILLING"] = "BILLING";
    GrievanceCategory["APPOINTMENT"] = "APPOINTMENT";
    GrievanceCategory["MEDICINE_AVAILABILITY"] = "MEDICINE_AVAILABILITY";
    GrievanceCategory["CLEANLINESS"] = "CLEANLINESS";
    GrievanceCategory["OTHER"] = "OTHER";
})(GrievanceCategory || (exports.GrievanceCategory = GrievanceCategory = {}));
var GrievanceStatus;
(function (GrievanceStatus) {
    GrievanceStatus["SUBMITTED"] = "SUBMITTED";
    GrievanceStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    GrievanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GrievanceStatus["RESOLVED"] = "RESOLVED";
    GrievanceStatus["CLOSED"] = "CLOSED";
    GrievanceStatus["REJECTED"] = "REJECTED";
})(GrievanceStatus || (exports.GrievanceStatus = GrievanceStatus = {}));
var NoticeCategory;
(function (NoticeCategory) {
    NoticeCategory["GENERAL"] = "GENERAL";
    NoticeCategory["RECRUITMENT"] = "RECRUITMENT";
    NoticeCategory["TENDER"] = "TENDER";
    NoticeCategory["PUBLIC_HEALTH"] = "PUBLIC_HEALTH";
    NoticeCategory["SCHEDULE_CHANGE"] = "SCHEDULE_CHANGE";
    NoticeCategory["EMERGENCY"] = "EMERGENCY";
})(NoticeCategory || (exports.NoticeCategory = NoticeCategory = {}));
var NoticePriority;
(function (NoticePriority) {
    NoticePriority["LOW"] = "LOW";
    NoticePriority["MEDIUM"] = "MEDIUM";
    NoticePriority["HIGH"] = "HIGH";
    NoticePriority["CRITICAL"] = "CRITICAL";
})(NoticePriority || (exports.NoticePriority = NoticePriority = {}));
exports.SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', direction: 'ltr' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', direction: 'ltr' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
    { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', direction: 'ltr' },
];
//# sourceMappingURL=index.js.map