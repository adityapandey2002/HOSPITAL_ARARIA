# DH Araria Hospital Portal - Accessibility Guide

## Overview

This document describes the accessibility implementation for the DH Araria Hospital Portal, ensuring compliance with **WCAG 2.2 Level AA** and **GIGW 3.0** guidelines as mandated by the Government of India.

## Compliance Standards

### WCAG 2.2 Level AA

The portal meets all **50 Success Criteria** across 4 principles:

| Principle | Criteria | Status |
|-----------|----------|--------|
| **Perceivable** | 1.1.1, 1.2.1-1.2.5, 1.3.1-1.3.5, 1.4.1-1.4.5, 1.4.10-1.4.13 | ✅ |
| **Operable** | 2.1.1-2.1.4, 2.2.1-2.2.6, 2.3.1-2.3.3, 2.4.1-2.4.13, 2.5.1-2.5.8 | ✅ |
| **Understandable** | 3.1.1-3.1.2, 3.2.1-3.2.6, 3.3.1-3.3.9 | ✅ |
| **Robust** | 4.1.1-4.1.3 | ✅ |

### GIGW 3.0 Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Bilingual Content** | English + Hindi (22 languages via Bhashini - Phase 3) |
| **Accessibility Statement** | Dedicated page with contact |
| **Feedback Mechanism** | Grievance portal + contact form |
| **Sitemap** | Auto-generated XML + HTML |
| **Search** | Full-text search with filters |
| **Navigation** | Consistent, keyboard accessible |
| **Content Structure** | Semantic HTML5, heading hierarchy |

---

## Implementation Details

### 1. Perceivable

#### 1.1 Text Alternatives

```tsx
// Images with meaningful alt text
<img 
  src="/hero-hospital.jpg" 
  alt="District Hospital Araria main building with emergency entrance" 
/>

// Decorative images
<img src="/decoration.svg" alt="" role="presentation" />

// Complex images (charts, diagrams)
<figure>
  <img src="/blood-stock-chart.png" alt="Blood stock levels: A+ 45 units, O+ 52 units, B+ 38 units, AB+ 22 units" />
  <figcaption>Current blood inventory as of October 6, 2024</figcaption>
</figure>

// Icons with text labels
<button aria-label="Search doctors">
  <Search className="w-5 h-5" aria-hidden="true" />
</button>
```

#### 1.2 Time-based Media

```tsx
// Video with captions
<video controls>
  <source src="/health-camp.mp4" type="video/mp4" />
  <track kind="captions" src="/health-camp.vtt" srclang="en" label="English" default />
  <track kind="captions" src="/health-camp-hi.vtt" srclang="hi" label="हिन्दी" />
</video>

// Audio with transcript
<audio controls>
  <source src="/announcement.mp3" type="audio/mpeg" />
</audio>
<p><a href="/announcement-transcript.html">Read transcript</a></p>
```

#### 1.3 Adaptable

```tsx
// Semantic HTML structure
<main id="main-content">
  <header>
    <h1>District Hospital Araria</h1>
    <nav aria-label="Main navigation">...</nav>
  </header>
  
  <section aria-labelledby="services-heading">
    <h2 id="services-heading">Our Services</h2>
    <article>
      <h3>Emergency Care</h3>
      <p>24/7 emergency services...</p>
    </article>
  </section>
  
  <aside aria-label="Quick links">
    <nav>...</nav>
  </aside>
</main>

// Responsive layout (no horizontal scroll at 320px)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

#### 1.4 Distinguishable

```css
/* Color contrast ratios */
.text-primary { color: #0369a1; }  /* 7:1 on white */
.text-secondary { color: #075985; } /* 5.5:1 on white */
.text-danger { color: #b91c1c; }    /* 5.5:1 on white */

/* Focus indicators */
*:focus-visible {
  outline: 2px solid #0369a1;
  outline-offset: 2px;
}

/* Text sizing */
html { font-size: 16px; }
@media (max-width: 640px) { html { font-size: 14px; } }

/* Line height */
p { line-height: 1.6; }

/* Link underline */
a:not([class]) { text-decoration: underline; }
```

### 2. Operable

#### 2.1 Keyboard Accessible

```tsx
// All interactive elements keyboard accessible
<button 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
  onClick={handleClick}
>
  Book Appointment
</button>

// Custom components with keyboard support
<div 
  role="button" 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
  onClick={handleClick}
>
  Custom Card
</div>

// Skip to main content
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  background: #0369a1;
  color: white;
  padding: 0.5rem 1rem;
  z-index: 100;
  transition: top 0.3s;
}
.skip-link:focus { top: 0; }
</style>
```

#### 2.2 Enough Time

```tsx
// Session timeout warning
<SessionTimeout 
  warningTime={5 * 60 * 1000}  // 5 minutes
  timeoutTime={60 * 60 * 1000} // 1 hour
  onExtend={() => refreshToken()}
  onLogout={() => logout()}
/>

// Auto-advancing content controls
<Carousel 
  autoPlay={false}  // Disabled by default
  pauseOnHover 
  pauseOnFocus 
/>
```

#### 2.3 Seizures and Physical Reactions

```tsx
// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// No flashing content > 3 times/second
// All animations respect prefers-reduced-motion
```

#### 2.4 Navigable

```tsx// Heading hierarchy
<h1>District Hospital Araria</h1>
  <section>
    <h2>Our Services</h2>
    <article>
      <h3>Emergency Care</h3>
    </article>
    <article>
      <h3>Outpatient Services</h3>
    </article>
  </section>

// Page title
<title>Book Appointment | District Hospital Araria</title>

// Landmarks
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main" id="main-content">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>

// Focus order matches visual order
<div style={{ display: 'flex', flexDirection: 'column' }}>
  <button>First</button>   {/* tabIndex 0 */}
  <button>Second</button>  {/* tabIndex 0 */}
  <button>Third</button>   {/* tabIndex 0 */}
</div>

// Link purpose
<a href="/appointments" aria-label="Book new appointment">
  Book Appointment
</a>
```

#### 2.5 Input Modalities

```tsx// Touch target size (minimum 44x44 CSS pixels)
<button className="min-h-[44px] min-w-[44px] px-4 py-3">
  Book
</button>

// Pointer gestures - no complex gestures required
// All functionality via single pointer

// Motion actuation - alternative input available
// No motion-only interactions
```

### 3. Understandable

#### 3.1 Readable

```tsx// Language declaration
<html lang="en">  // Default
<html lang="hi">  // Hindi version

// Language switching
<select aria-label="Select language" onChange={handleLanguageChange}>
  <option value="en">English</option>
  <option value="hi">हिन्दी</option>
  <option value="bn">বাংলা</option>
</select>

// Unusual words defined
<p>
  <dfn title="Ayushman Bharat Health Account">ABHA</dfn> 
  is your digital health ID.
</p>

// Abbreviations
<abbr title="Ayushman Bharat Digital Mission">ABDM</abbr>
```

#### 3.2 Predictable

```tsx// Consistent navigation
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/doctors">Doctors</a></li>
    <li><a href="/appointments">Appointments</a></li>
  </ul>
</nav>

// Consistent components
<Button variant="primary">Primary Action</Button>  // Same everywhere

// No unexpected context changes
// Form submission doesn't auto-navigate without warning
<form onSubmit={handleSubmit}>
  <button type="submit">Submit</button>
</form>
```

#### 3.3 Input Assistance

```tsx// Labels
<label htmlFor="email">Email Address</label>
<input id="email" type="email" required />

// Error identification
<div className="error-message" role="alert" aria-live="polite">
  <AlertCircle className="w-4 h-4" aria-hidden="true" />
  <span>Please enter a valid email address</span>
</div>

// Error suggestion
<input 
  aria-invalid="true"
  aria-describedby="email-error"
  aria-errormessage="email-error"
/>
<div id="email-error" role="alert">
  Please enter a valid email address (e.g., user@example.com)
</div>

// Error prevention (legal/financial/health data)
<form onSubmit={handleSubmit}>
  <h2>Confirm Appointment</h2>
  <p>Please review your appointment details before confirming.</p>
  <AppointmentSummary appointment={appointment} />
  <button type="submit">Confirm Booking</button>
  <button type="button" onClick={goBack}>Go Back</button>
</form>
```

### 4. Robust

#### 4.1 Compatible

```tsx// Valid HTML5
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

// ARIA roles only when needed
<div role="alert" aria-live="polite">
  <p>Appointment booked successfully!</p>
</div>

// Custom widgets with proper ARIA
<div 
  role="combobox" 
  aria-expanded={isOpen} 
  aria-controls="listbox"
  aria-activedescendant={selectedId}
>
  <input 
    role="textbox" 
    aria-autocomplete="list" 
    aria-controls="listbox"
  />
  <ul role="listbox" id="listbox">
    <li role="option" id="opt-1" aria-selected={true}>Option 1</li>
  </ul>
</div>
```

---

## Component Accessibility Patterns

### Buttons

```tsx// Primary button
<Button variant="primary" onClick={handleSubmit}>
  Book Appointment
</Button>

// Icon button with label
<Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
  <X className="w-5 h-5" aria-hidden="true" />
</Button>

// Loading state
<Button loading disabled>
  Processing...
</Button>

// Disabled state
<Button disabled>Not Available</Button>
```

### Forms

```tsx// Accessible form field
<div className="form-field">
  <label htmlFor="patient-name" className="form-label">
    Patient Name <span className="text-danger-500" aria-hidden="true">*</span>
  </label>
  <input
    id="patient-name"
    type="text"
    required
    aria-required="true"
    aria-describedby="name-hint name-error"
    className="form-input"
    aria-invalid={!!errors.name}
  />
  <p id="name-hint" className="form-hint">Enter full name as per Aadhaar</p>
  {errors.name && (
    <p id="name-error" className="form-error" role="alert">
      {errors.name.message}
    </p>
  )}
</div>

// Fieldset for grouped inputs
<fieldset>
  <legend>Appointment Type</legend>
  <div className="radio-group">
    <label>
      <input type="radio" name="type" value="OPD" />
      <span>OPD Consultation</span>
    </label>
    <label>
      <input type="radio" name="type" value="TELECONSULTATION" />
      <span>Teleconsultation</span>
    </label>
  </div>
</fieldset>
```

### Tables

```tsx// Accessible data table
<table className="w-full" role="grid">
  <caption>Available Doctors - Cardiology</caption>
  <thead>
    <tr>
      <th scope="col">Doctor</th>
      <th scope="col">Specialization</th>
      <th scope="col">Available</th>
      <th scope="col">Fee</th>
      <th scope="col">Action</th>
    </tr>
  </thead>
  <tbody>
    {doctors.map(doctor => (
      <tr key={doctor.id}>
        <td><strong>{doctor.name}</strong></td>
        <td>{doctor.specialization}</td>
        <td>{doctor.availableDays.join(', ')}</td>
        <td>₹{doctor.consultationFee}</td>
        <td>
          <button 
            onClick={() => bookAppointment(doctor.id)}
            aria-label={`Book appointment with ${doctor.name}`}
          >
            Book
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Modals/Dialogs

```tsx// Accessible modal
<Dialog 
  isOpen={isOpen} 
  onClose={onClose} 
  title="Confirm Appointment" 
  description="Please review the details before confirming"
>
  <AppointmentSummary appointment={appointment} />
  <div className="flex justify-end gap-3 mt-6">
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={confirm}>Confirm</Button>
  </div>
</Dialog>

// Dialog implementation handles:
// - Focus trap
// - Focus restoration on close
// - ESC to close
// - ARIA attributes
// - Background scroll lock
```

### Notifications

```tsx// Toast notifications
<Toaster 
  position="top-right"
  toastOptions={{
    className: 'bg-white text-gray-900',
    duration: 5000,
    ariaLive: 'polite',
  }}
/>

// Alert components
<Alert variant="success" title="Success">
  Appointment booked successfully. Token: A-15
</Alert>

<Alert variant="error" title="Error">
  Failed to book appointment. Please try again.
</Alert>
```

### Navigation

```tsx// Breadcrumb
<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
  <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
  <Link href="/services" className="text-gray-500 hover:text-gray-700">Services</Link>
  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
  <span className="text-gray-900" aria-current="page">Cardiology</span>
</nav>

// Pagination
<nav aria-label="Pagination" className="flex items-center gap-2">
  <button 
    aria-label="Previous page" 
    disabled={page === 1}
    aria-disabled={page === 1}
  >
    <ChevronLeft aria-hidden="true" />
  </button>
  <span aria-current="page">Page {page} of {totalPages}</span>
  <button 
    aria-label="Next page" 
    disabled={page === totalPages}
    aria-disabled={page === totalPages}
  >
    <ChevronRight aria-hidden="true" />
  </button>
</nav>
```

---

## Testing Checklist

### Automated Testing

```bash
# axe-core integration
npm run test:a11y

# jest-axe in component tests
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

#### Screen Reader Testing

| Screen Reader | Browser | OS |
|---------------|---------|-----|
| **NVDA** | Firefox/Chrome | Windows |
| **JAWS** | Chrome/Edge | Windows |
| **VoiceOver** | Safari | macOS/iOS |
| **TalkBack** | Chrome | Android |

#### Test Scenarios

- [ ] Navigate entire site with keyboard only
- [ ] All forms submit with Enter key
- [ ] All modals trap focus
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces all content
- [ ] Images have appropriate alt text
- [ ] Form errors announced
- [ ] Dynamic content announced
- [ ] Language changes announced
- [ ] Tables navigable with headers
- [ ] Charts/graphs have text alternatives
- [ ] Videos have captions
- [ ] Color not sole means of information

#### Browser Testing

| Browser | Version | Accessibility Support |
|---------|---------|----------------------|
| Chrome | Latest | Excellent |
| Firefox | Latest | Excellent |
| Safari | Latest | Good |
| Edge | Latest | Excellent |

#### Zoom Testing

- [ ] 100% - Normal
- [ ] 125% - Windows default
- [ ] 150% - Common zoom
- [ ] 200% - Maximum required
- [ ] 400% - No horizontal scroll

#### High Contrast

- [ ] Windows High Contrast Mode
- [ ] macOS Increase Contrast
- [ ] Custom contrast ratios maintained

---

## Multilingual Accessibility (Phase 3)

### Bhashini Integration

```tsx// Language selector with native names
<select aria-label="Select language">
  <option value="en">English</option>
  <option value="hi">हिन्दी</option>
  <option value="bn">বাংলা</option>
  <option value="te">తెలుగు</option>
  <option value="mr">मराठी</option>
  <option value="ta">தமிழ்</option>
  <option value="gu">ગુજરાતી</option>
  <option value="kn">ಕನ್ನಡ</option>
  <option value="ml">മലയാളം</option>
  <option value="or">ଓଡ଼ିଆ</option>
  <option value="pa">ਪੰਜਾਬੀ</option>
  <option value="as">অসমীয়া</option>
  <option value="ur" dir="rtl">اردو</option>
  <option value="sa">संस्कृतम्</option>
</select>

// RTL support
<html lang="ur" dir="rtl">
```

### Voice Features

```tsx// Speech recognition (ASR)
<VoiceSearch 
  onResult={handleVoiceSearch}
  languages={['en-IN', 'hi-IN', 'bn-IN']}
  placeholder="Speak to search..."
/>

// Text-to-speech (TTS)
<ReadAloud 
  text={content}
  language="hi-IN"
  voice="female"
/>
```

---

## Accessibility Statement

### Template

```
Accessibility Statement for District Hospital Araria Portal

This website is run by District Hospital Araria, Government of Bihar. 
We want as many people as possible to be able to use this website.

Compliance Status:
- WCAG 2.2 Level AA - Compliant
- GIGW 3.0 - Compliant

Known Issues:
- PDF documents published before 2024 may not be fully accessible
- Some third-party embeds may not meet standards

Reporting Problems:
Email: accessibility@dhararia.gov.in
Phone: +91-6453-222123

Enforcement:
Contact the Office of the Chief Commissioner for Persons with Disabilities
```

---

## Tools & Resources

### Development Tools

| Tool | Purpose |
|------|---------|
| **axe-core** | Automated testing |
| **eslint-plugin-jsx-a11y** | Linting |
| **storybook-addon-a11y** | Component testing |
| **color-contrast-checker** | Color validation |
| **axe DevTools** | Browser extension |

### Design Resources

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [GIGW 3.0 Guidelines](https://guidelines.india.gov.in/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)

### Testing Tools

- **NVDA** - Free Windows screen reader
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Built-in Chrome audits
- **axe DevTools** - Browser extension

---

## Continuous Monitoring

### CI/CD Integration

```yaml
# .github/workflows/accessibility.yml
- name: Accessibility Tests
  run: |
    npm run test:a11y
    npm run build
    npx http-server apps/frontend/out -p 3000 &
    npx axe-cli http://localhost:3000 --tags wcag2aa --save results.json
```

### Regression Prevention

- **axe-core** in every PR
- **eslint-plugin-jsx-a11y** on every commit
- **Manual testing** for major releases
- **User testing** with disability groups (quarterly)

---

## Training

### Team Training Plan

| Role | Training | Frequency |
|------|----------|-----------|
| **Developers** | Accessible component patterns | Quarterly |
| **Designers** | Inclusive design principles | Bi-annually |
| **QA** | Screen reader testing | Quarterly |
| **Content Authors** | Accessible content creation | Bi-annually |
| **Managers** | Accessibility compliance | Annually |

---

*Document Version: 1.0*  
*Last Updated: 2024-10-06*  
*Classification: Internal - Government Use*