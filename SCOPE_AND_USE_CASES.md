# ClearCare+ - Detailed Scope, Roles & Use Cases

## Table of Contents
1. [Project Scope](#project-scope)
2. [Roles & Permissions](#roles--permissions)
3. [Detailed Use Cases](#detailed-use-cases)
4. [Business Rules](#business-rules)
5. [Non-Functional Requirements](#non-functional-requirements)

---

## Project Scope

### In-Scope Features

#### 1. Care Instruction Management

**Core Functionality:**
- **Instruction Creation**
  - Create new care instructions from scratch
  - Use pre-defined templates for common scenarios
  - Support for multiple instruction types:
    - Medication instructions (dosage, frequency, duration, special notes)
    - Lifestyle modifications (diet, exercise, activity restrictions)
    - Follow-up requirements (appointments, lab work, imaging)
    - Warning signs and emergency protocols
  - Rich text formatting for instruction content
  - Attach supporting documents (PDFs, images)
  - Set priority levels (low, medium, high, urgent)
  - Set expiration dates for instructions
  - Version control for instruction modifications

- **Instruction Assignment**
  - Assign instructions to specific patients
  - Bulk assignment to multiple patients (same instruction)
  - Customize instructions per patient assignment
  - Set acknowledgment deadlines
  - Schedule future instruction assignments
  - Recurring instruction assignments

- **Instruction Templates**
  - Create reusable instruction templates
  - Organize templates by category (specialty, condition, procedure)
  - Template versioning
  - Share templates across organization
  - Template approval workflow (optional)

- **Instruction Lifecycle**
  - Draft → Active → Acknowledged → Completed → Archived
  - Status tracking and updates
  - Instruction modifications (creates new version)
  - Instruction cancellation
  - Instruction expiration handling

#### 2. Patient Portal & Acknowledgment

**Patient Dashboard:**
- View all assigned care instructions (active and historical)
- Filter instructions by status, type, date, priority
- Search instructions by keywords
- View instruction details with full content
- Download instruction documents
- View compliance progress

**Acknowledgment System:**
- **Receipt Acknowledgment**
  - Confirm patient has received the instruction
  - Timestamp and IP address logging
  - Device information capture

- **Understanding Acknowledgment**
  - Confirm patient understands the instruction
  - Optional comprehension quiz for complex instructions
  - Time-to-acknowledgment metrics

- **Compliance Commitment**
  - Patient commits to following the instruction
  - Optional commitment statement signing

- **Acknowledgment Features**
  - Reminder notifications for unacknowledged instructions
  - Escalation to provider if acknowledgment overdue
  - Multiple acknowledgment types per instruction
  - Immutable acknowledgment records

#### 3. Compliance Tracking

**Medication Adherence:**
- Patient self-reporting of medication intake
- Adherence percentage calculation
- Missed dose tracking and reasons
- Refill reminders and tracking
- Medication schedule visualization
- Adherence trends over time

**Appointment Compliance:**
- Follow-up appointment scheduling integration
- Appointment reminder system
- Attendance tracking
- No-show reporting
- Rescheduling tracking

**Lifestyle Compliance:**
- Progress tracking for lifestyle modifications
- Milestone achievements
- Patient self-reporting (daily/weekly)
- Photo/video evidence upload (optional)
- Progress charts and visualizations

**Compliance Metrics:**
- Overall compliance score per patient
- Compliance by instruction type
- Compliance trends and patterns
- Provider-facing compliance dashboards
- Automated alerts for non-compliance

#### 4. Provider Dashboard

**Patient Management:**
- View assigned patients list
- Patient search and filtering
- Quick access to patient profiles
- Patient instruction history

**Instruction Management:**
- Create new instructions
- View all assigned instructions
- Monitor acknowledgment status
- Track compliance metrics
- Generate patient-specific reports

**Compliance Monitoring:**
- Real-time compliance dashboard
- Non-compliance alerts
- Compliance trend analysis
- Patient comparison views
- Intervention recommendations

**Reporting:**
- Patient-specific compliance reports
- Instruction effectiveness reports
- Acknowledgment rate reports
- Time-to-acknowledgment analysis
- Export reports (PDF, CSV, Excel)

#### 5. Administrative Functions

**User Management:**
- Create, edit, and deactivate user accounts
- User role assignment
- Bulk user operations
- User import/export
- User activity monitoring
- Account lockout management

**Role & Permission Management:**
- Create custom roles
- Define granular permissions
- Permission inheritance
- Role assignment to users
- Permission audit trail

**System Configuration:**
- Application settings
- Notification preferences
- Session timeout configuration
- Password policy settings
- Data retention policies
- Feature flags

**Organization Management:**
- Multi-tenant support (organizations/departments)
- Organization-specific settings
- User-organization assignment
- Organization-level reporting

#### 6. Audit & Compliance

**Audit Logging:**
- Comprehensive logging of all PHI access
- User authentication events
- Data modification events
- Permission changes
- Configuration changes
- Report generation
- Data export events

**Audit Log Features:**
- Immutable audit trail (append-only)
- Tamper-evident design
- Searchable and filterable logs
- Export capabilities
- Real-time audit monitoring
- Automated anomaly detection

**Compliance Reporting:**
- HIPAA compliance reports
- Access pattern analysis
- Breach risk assessments
- Regulatory compliance metrics
- De-identified aggregate reports

**Security Monitoring:**
- Failed login attempt tracking
- Unauthorized access attempts
- Suspicious activity alerts
- Security incident management
- Breach notification tools

#### 7. Notification System

**Email Notifications:**
- New instruction assignments
- Acknowledgment reminders
- Compliance alerts
- System notifications
- Report delivery

**In-App Notifications:**
- Real-time notification center
- Notification preferences
- Notification history
- Mark as read/unread

**SMS Notifications (Future):**
- Critical instruction alerts
- Appointment reminders
- Compliance alerts

### Out-of-Scope Features

#### EHR Functionality
- ❌ Full Electronic Health Record system
- ❌ Appointment scheduling (integration only, not built-in)
- ❌ Billing and insurance management
- ❌ Lab results management and storage
- ❌ Imaging storage and viewing (DICOM)
- ❌ Clinical documentation (progress notes, SOAP notes)
- ❌ Prescription management (e-prescribing)
- ❌ Insurance eligibility verification

#### Communication Features
- ❌ In-app messaging or chat
- ❌ Video conferencing
- ❌ Telemedicine capabilities
- ❌ Push notifications (email only in initial phase)
- ❌ Patient-provider direct communication

#### Third-Party Integrations (Initial Phase)
- ❌ EHR system integration (Epic, Cerner, etc.) - Future phase
- ❌ Pharmacy system integration - Future phase
- ❌ Lab system integration (HL7) - Future phase
- ❌ Insurance portal integration - Future phase
- ❌ Payment processing - Future phase

#### Mobile Applications
- ❌ Native iOS application
- ❌ Native Android application
- ✅ Responsive web design (mobile-friendly)

#### Advanced Analytics
- ❌ Predictive analytics
- ❌ Machine learning models
- ❌ Population health analytics
- ❌ Clinical decision support

#### Additional Features
- ❌ Patient portal for scheduling
- ❌ Online bill pay
- ❌ Prescription refill requests
- ❌ Test result viewing
- ❌ Medical record requests

---

## Roles & Permissions

### 1. Patient

**Role Description:**
End-users who receive care instructions and must acknowledge and comply with them. Patients can only access their own data.

**Permissions:**

**Read Permissions:**
- ✅ View own care instructions (active and historical)
- ✅ View own compliance records
- ✅ View own profile information
- ✅ View own acknowledgment history
- ✅ View own audit log (read-only, own actions only)
- ✅ Download own instruction documents

**Write Permissions:**
- ✅ Acknowledge care instructions (receipt, understanding, commitment)
- ✅ Update own compliance data (medication adherence, lifestyle progress)
- ✅ Update own profile (non-PHI fields: email, phone, preferences)
- ✅ Upload compliance evidence (photos, documents)

**Restrictions:**
- ❌ Cannot view other patients' data
- ❌ Cannot create or modify instructions
- ❌ Cannot view provider or admin functions
- ❌ Cannot access system configuration
- ❌ Cannot view audit logs of other users

**OAuth Scopes:**
- `openid` - OpenID Connect identification
- `profile` - Basic profile information
- `email` - Email address
- `read:own-instructions` - Read own care instructions
- `write:own-acknowledgment` - Acknowledge instructions
- `read:own-compliance` - View own compliance data
- `write:own-compliance` - Update own compliance data
- `read:own-profile` - View own profile
- `write:own-profile` - Update own profile (non-PHI)

---

### 2. Healthcare Provider

**Role Description:**
Medical professionals (physicians, nurse practitioners, physician assistants) who create and assign care instructions to patients. Providers can only access data for their assigned patients.

**Permissions:**

**Read Permissions:**
- ✅ View assigned patients' care instructions
- ✅ View assigned patients' compliance data
- ✅ View assigned patients' acknowledgment history
- ✅ View assigned patients' profiles (PHI access)
- ✅ View own instruction templates
- ✅ View organization-wide instruction templates
- ✅ View own audit logs
- ✅ View compliance reports for assigned patients
- ✅ View patient instruction history

**Write Permissions:**
- ✅ Create new care instructions
- ✅ Edit own instructions (creates new version)
- ✅ Assign instructions to assigned patients
- ✅ Create and edit instruction templates
- ✅ Cancel or modify instruction assignments
- ✅ Add notes to patient compliance records
- ✅ Generate compliance reports

**Management Permissions:**
- ✅ Manage own instruction templates
- ✅ Set instruction priorities and deadlines
- ✅ Schedule instruction assignments

**Restrictions:**
- ❌ Cannot access patients not assigned to them
- ❌ Cannot modify other providers' instructions
- ❌ Cannot access administrative functions
- ❌ Cannot view system-wide audit logs
- ❌ Cannot modify user roles or permissions
- ❌ Cannot access system configuration

**OAuth Scopes:**
- `openid`, `profile`, `email`
- `read:patients` - Read assigned patients' data
- `read:instructions` - Read care instructions
- `write:instructions` - Create and update instructions
- `read:compliance` - View patient compliance data
- `read:reports` - Generate compliance reports
- `write:templates` - Manage instruction templates
- `read:own-audit` - View own audit logs

---

### 3. Administrator

**Role Description:**
System administrators who manage users, roles, system configuration, and have access to system-wide audit logs and reports.

**Permissions:**

**User Management:**
- ✅ Create, edit, and deactivate user accounts
- ✅ Assign roles to users
- ✅ Reset user passwords
- ✅ Unlock locked accounts
- ✅ View all user accounts
- ✅ Import/export user data
- ✅ Manage user-organization assignments

**Role & Permission Management:**
- ✅ Create custom roles
- ✅ Define and modify permissions
- ✅ Assign roles to users
- ✅ View role assignments
- ✅ Manage permission inheritance

**System Configuration:**
- ✅ Configure application settings
- ✅ Manage notification preferences
- ✅ Configure session timeouts
- ✅ Set password policies
- ✅ Configure data retention policies
- ✅ Manage feature flags
- ✅ Configure OAuth clients
- ✅ Manage organization settings

**Audit & Monitoring:**
- ✅ View all audit logs (system-wide)
- ✅ Search and filter audit logs
- ✅ Export audit logs
- ✅ View security incidents
- ✅ Monitor system health
- ✅ View system metrics

**Reporting:**
- ✅ Generate system-wide compliance reports
- ✅ Generate administrative reports
- ✅ Generate de-identified aggregate reports
- ✅ Export reports in multiple formats

**Restrictions:**
- ❌ Cannot directly access PHI (only through audit logs)
- ❌ Cannot create or modify care instructions
- ❌ Cannot acknowledge instructions on behalf of patients
- ❌ Cannot modify compliance data

**OAuth Scopes:**
- `openid`, `profile`, `email`
- `admin:users` - Manage users
- `admin:roles` - Manage roles and permissions
- `admin:system` - System configuration
- `admin:audit` - View all audit logs
- `admin:reports` - Generate system-wide reports
- `admin:organizations` - Manage organizations

---

## Detailed Use Cases

### Patient Use Cases

#### UC-P-001: View Care Instructions

**Actor:** Patient

**Precondition:**
- Patient is authenticated via OAuth
- Patient has at least one assigned care instruction

**Main Flow:**
1. Patient logs into the system using OAuth
2. Patient navigates to "My Instructions" dashboard
3. System displays list of all assigned instructions with:
   - Instruction title and type
   - Assigned date
   - Status (pending acknowledgment, acknowledged, completed)
   - Priority indicator
   - Provider name
4. Patient can filter instructions by:
   - Status (all, pending, acknowledged, completed, expired)
   - Type (medication, lifestyle, follow-up, warning)
   - Date range
   - Priority level
5. Patient selects an instruction to view details
6. System displays full instruction details:
   - Complete instruction content
   - Medication details (if applicable): name, dosage, frequency, duration
   - Lifestyle modifications (if applicable)
   - Follow-up requirements (if applicable)
   - Warning signs and emergency contacts
   - Attached documents (downloadable)
   - Acknowledgment status
   - Compliance progress (if applicable)
7. Patient can download instruction as PDF
8. Patient can print instruction

**Alternative Flows:**
- **3a.** Patient has no instructions: System displays message "No instructions assigned"
- **5a.** Instruction has expired: System displays expiration notice

**Postcondition:**
- Patient has viewed their care instruction
- Access is logged in audit trail

**Business Rules:**
- Patients can only view their own instructions
- All instruction views are logged with timestamp and IP address
- Expired instructions are marked but still viewable
- Instruction access does not count as acknowledgment

---

#### UC-P-002: Acknowledge Care Instruction

**Actor:** Patient

**Precondition:**
- Patient is authenticated
- Patient has at least one unacknowledged instruction
- Patient has viewed the instruction details

**Main Flow:**
1. Patient views an unacknowledged instruction
2. Patient reads through all instruction details
3. System displays acknowledgment options:
   - "I have received this instruction" (Receipt)
   - "I understand this instruction" (Understanding)
   - "I commit to following this instruction" (Commitment)
4. Patient selects acknowledgment type(s)
5. For "Understanding" acknowledgment, if instruction is complex:
   - System displays comprehension questions (optional)
   - Patient answers questions
   - System validates answers
6. Patient clicks "Acknowledge" button
7. System displays confirmation dialog with acknowledgment summary
8. Patient confirms acknowledgment
9. System records acknowledgment with:
   - Timestamp (UTC)
   - IP address
   - User agent
   - Device information
   - Acknowledgment type(s)
   - Comprehension quiz results (if applicable)
10. System creates immutable audit record
11. System updates instruction status to "Acknowledged"
12. System sends notification to assigned provider
13. System displays success message
14. System updates patient dashboard

**Alternative Flows:**
- **6a.** Patient cancels: Flow returns to instruction view
- **9a.** Network error: System displays error, allows retry
- **5a.** Comprehension quiz failed: System allows retry or marks as "needs clarification"

**Postcondition:**
- Instruction is marked as acknowledged
- Immutable acknowledgment record is created
- Provider is notified
- Audit log entry is created

**Business Rules:**
- Acknowledgment cannot be undone (immutable record)
- Multiple acknowledgment types can be selected in one action
- Each acknowledgment creates a separate audit record
- Acknowledgment deadline tracking (overdue status)
- Time-to-acknowledgment is calculated and stored

---

#### UC-P-003: Track Medication Adherence

**Actor:** Patient

**Precondition:**
- Patient is authenticated
- Patient has acknowledged medication instructions
- Medication tracking is enabled for the instruction

**Main Flow:**
1. Patient navigates to "Compliance" section
2. System displays compliance dashboard with:
   - Active medication instructions
   - Daily medication schedule
   - Adherence percentage
   - Missed doses
3. Patient selects a medication instruction
4. System displays medication details and adherence calendar
5. For each scheduled dose:
   - Patient marks as "Taken" or "Missed"
   - If missed, patient selects reason (optional):
     - Forgot
     - Side effects
     - Out of medication
     - Other (with notes)
6. Patient can mark multiple doses at once (bulk update)
7. System calculates adherence percentage:
   - (Doses taken / Total scheduled doses) × 100
8. System updates compliance record
9. System logs compliance update in audit trail
10. If adherence drops below threshold:
    - System sends alert to provider
    - System displays warning to patient

**Alternative Flows:**
- **5a.** Patient marks future dose: System displays error
- **5b.** Patient tries to modify past compliance: System allows with audit log

**Postcondition:**
- Medication adherence is updated
- Compliance metrics are recalculated
- Provider is notified if threshold breached

**Business Rules:**
- Patients can only update their own compliance
- Past compliance can be updated (with audit trail)
- Adherence percentage updates in real-time
- Provider receives alerts for non-compliance
- Compliance data is immutable (history preserved)

---

#### UC-P-004: Track Lifestyle Compliance

**Actor:** Patient

**Precondition:**
- Patient is authenticated
- Patient has acknowledged lifestyle modification instructions

**Main Flow:**
1. Patient navigates to "Compliance" → "Lifestyle"
2. System displays active lifestyle instructions:
   - Dietary modifications
   - Exercise requirements
   - Activity restrictions
   - Sleep recommendations
3. Patient selects a lifestyle instruction
4. System displays compliance tracking interface:
   - Progress indicators
   - Milestone tracking
   - Daily/weekly check-ins
5. Patient updates compliance:
   - Marks daily activities as completed
   - Records progress metrics (weight, steps, etc.)
   - Uploads photos/videos as evidence (optional)
   - Adds notes about challenges or successes
6. System updates compliance record
7. System calculates overall compliance percentage
8. System displays progress visualization (charts)
9. System logs update in audit trail

**Postcondition:**
- Lifestyle compliance is updated
- Progress is visualized
- Provider can view updated compliance

**Business Rules:**
- Self-reported data (patient responsibility)
- Evidence uploads are optional
- Progress milestones can be set by provider
- Compliance trends are tracked over time

---

#### UC-P-005: View Compliance History

**Actor:** Patient

**Precondition:**
- Patient is authenticated
- Patient has historical instructions

**Main Flow:**
1. Patient navigates to "History" section
2. System displays chronological list of all past instructions:
   - Instruction title and type
   - Date range (assigned to completed)
   - Final compliance percentage
   - Status (completed, expired, cancelled)
3. Patient can filter by:
   - Date range
   - Instruction type
   - Provider
   - Compliance status
4. Patient selects a historical instruction
5. System displays detailed history:
   - Full instruction content
   - Acknowledgment date and type
   - Compliance timeline
   - Compliance breakdown by category
   - Provider notes (if any)
   - Final compliance report
6. Patient can download historical report as PDF

**Postcondition:**
- Patient has reviewed their compliance history

**Business Rules:**
- Historical data is read-only
- All historical instructions are retained per retention policy
- Compliance history cannot be deleted

---

### Provider Use Cases

#### UC-PR-001: Create Care Instruction

**Actor:** Healthcare Provider

**Precondition:**
- Provider is authenticated
- Provider has at least one assigned patient

**Main Flow:**
1. Provider navigates to "Create Instruction"
2. Provider selects patient from authorized patient list
3. Provider chooses instruction creation method:
   - **Option A:** Create from template
     - Provider selects template category
     - System displays relevant templates
     - Provider selects template
     - System pre-fills instruction fields
   - **Option B:** Create custom instruction
     - Provider starts with blank form
4. Provider fills in instruction details:
   - **Basic Information:**
     - Instruction title
     - Instruction type (medication, lifestyle, follow-up, warning)
     - Priority level (low, medium, high, urgent)
     - Expiration date (optional)
   - **Medication Details** (if medication type):
     - Medication name
     - Dosage and unit
     - Frequency (daily, twice daily, as needed, etc.)
     - Duration (days, weeks, months)
     - Special instructions (with/without food, time of day)
     - Refill information
     - Side effects to watch for
   - **Lifestyle Modifications** (if lifestyle type):
     - Modification category (diet, exercise, activity, sleep)
     - Detailed instructions
     - Goals and milestones
     - Tracking requirements
   - **Follow-Up Requirements** (if follow-up type):
     - Appointment type
     - Timeframe
     - Preparation instructions
     - Contact information
   - **Warning Signs** (if warning type):
     - Symptoms to monitor
     - When to seek immediate care
     - Emergency contact information
   - **General:**
     - Rich text content
     - Attach documents (PDFs, images)
     - Patient-friendly language toggle
5. Provider sets compliance tracking options:
   - Enable medication adherence tracking
   - Enable lifestyle compliance tracking
   - Set compliance thresholds
   - Set reminder preferences
6. Provider sets acknowledgment requirements:
   - Require receipt acknowledgment
   - Require understanding acknowledgment
   - Require commitment acknowledgment
   - Set acknowledgment deadline
7. Provider reviews instruction preview
8. Provider submits instruction
9. System validates all required fields
10. System creates instruction record
11. System assigns instruction to selected patient
12. System sends notification to patient
13. System logs creation in audit trail
14. System displays success message with instruction ID

**Alternative Flows:**
- **2a.** Provider has no assigned patients: System displays message and suggests contacting administrator
- **9a.** Validation fails: System displays errors, provider corrects and resubmits
- **3a.** Provider saves as draft: Instruction saved but not assigned

**Postcondition:**
- Care instruction is created and assigned to patient
- Patient is notified
- Audit log entry is created

**Business Rules:**
- Provider can only assign to their assigned patients
- All required fields must be completed based on instruction type
- Instruction creation is logged with provider ID and timestamp
- Instructions cannot be deleted, only cancelled or expired
- Instruction modifications create new versions

---

#### UC-PR-002: Assign Instruction Template to Patient

**Actor:** Healthcare Provider

**Precondition:**
- Provider is authenticated
- Instruction template exists
- Provider has assigned patients

**Main Flow:**
1. Provider navigates to "Instruction Templates"
2. Provider browses or searches templates by:
   - Category (specialty, condition, procedure)
   - Keyword search
   - Organization templates vs. personal templates
3. Provider selects a template
4. System displays template preview with all fields
5. Provider selects "Assign to Patient"
6. Provider selects patient from authorized list
7. System pre-fills instruction form with template data
8. Provider customizes instruction for patient:
   - Modifies medication dosages if needed
   - Adjusts timelines
   - Adds patient-specific notes
   - Personalizes content
9. Provider reviews customized instruction
10. Provider sets assignment details:
    - Acknowledgment deadline
    - Compliance tracking options
    - Priority level
11. Provider submits assignment
12. System validates assignment
13. System creates patient-specific instruction from template
14. System links instruction to original template
15. System sends notification to patient
16. System logs assignment in audit trail

**Postcondition:**
- Instruction is assigned to patient
- Template usage is tracked
- Patient is notified

**Business Rules:**
- Template assignment creates new instruction instance
- Template modifications don't affect already-assigned instructions
- Template usage statistics are tracked

---

#### UC-PR-003: Monitor Patient Acknowledgment Status

**Actor:** Healthcare Provider

**Precondition:**
- Provider is authenticated
- Provider has assigned instructions to patients

**Main Flow:**
1. Provider navigates to "Patient Instructions" dashboard
2. System displays list of all assigned instructions with:
   - Patient name
   - Instruction title and type
   - Assigned date
   - Acknowledgment status (pending, acknowledged, overdue)
   - Time to acknowledgment (if acknowledged)
   - Priority level
3. Provider can filter by:
   - Patient
   - Status (all, pending, acknowledged, overdue)
   - Date range
   - Instruction type
   - Priority
4. Provider selects an instruction to view details
5. System displays detailed acknowledgment information:
   - Instruction content
   - Patient information
   - Acknowledgment status breakdown:
     - Receipt acknowledgment: Yes/No, timestamp
     - Understanding acknowledgment: Yes/No, timestamp
     - Commitment acknowledgment: Yes/No, timestamp
   - Acknowledgment details:
     - Timestamp (UTC)
     - IP address
     - Device information
     - Time to acknowledgment
     - Comprehension quiz results (if applicable)
6. For overdue acknowledgments:
   - System highlights overdue status
   - Provider can send reminder
   - Provider can view reminder history
7. Provider can view patient's compliance progress (if applicable)

**Alternative Flows:**
- **2a.** No instructions assigned: System displays empty state
- **5a.** Instruction not yet acknowledged: System shows "Pending" status with time since assignment

**Postcondition:**
- Provider has reviewed acknowledgment status

**Business Rules:**
- Provider can only view their assigned patients' data
- All views are logged in audit trail
- Overdue threshold is configurable per organization
- Acknowledgment reminders can be sent automatically or manually

---

#### UC-PR-004: Track Patient Compliance

**Actor:** Healthcare Provider

**Precondition:**
- Provider is authenticated
- Patient has acknowledged instructions
- Compliance tracking is enabled

**Main Flow:**
1. Provider navigates to "Compliance" dashboard
2. Provider selects a patient from assigned patients list
3. System displays patient compliance overview:
   - Overall compliance score
   - Active instructions with compliance status
   - Compliance by category (medication, lifestyle, appointments)
   - Compliance trends (charts)
4. Provider drills down into specific instruction:
   - **Medication Compliance:**
     - Adherence percentage
     - Doses taken vs. scheduled
     - Missed doses with reasons
     - Adherence calendar
     - Trends over time
   - **Lifestyle Compliance:**
     - Progress toward goals
     - Milestone achievements
     - Patient-reported updates
     - Evidence uploads (if any)
   - **Appointment Compliance:**
     - Follow-up appointment status
     - Attendance records
     - Rescheduling history
5. Provider reviews compliance data
6. Provider can add clinical notes:
   - Observations
   - Recommendations
   - Follow-up actions
7. Provider saves notes
8. System updates compliance record
9. System logs note addition in audit trail

**Alternative Flows:**
- **4a.** Compliance below threshold: System highlights with alert
- **6a.** Provider identifies non-compliance: Provider can create follow-up instruction

**Postcondition:**
- Provider has reviewed compliance data
- Clinical notes are added (if applicable)

**Business Rules:**
- Compliance data is read-only for providers (patients update it)
- All access is logged
- Clinical notes are appended (not editable)
- Compliance alerts are generated automatically

---

#### UC-PR-005: Generate Compliance Report

**Actor:** Healthcare Provider

**Precondition:**
- Provider is authenticated
- Provider has assigned instructions

**Main Flow:**
1. Provider navigates to "Reports" section
2. Provider selects report type:
   - Patient-specific compliance report
   - Instruction effectiveness report
   - Acknowledgment rate report
   - Time-to-acknowledgment analysis
3. Provider sets report parameters:
   - **For patient-specific:**
     - Select patient(s)
     - Date range
     - Instruction types to include
   - **For aggregate:**
     - Date range
     - Instruction types
     - Patient filters
   - **For acknowledgment:**
     - Date range
     - Instruction types
     - Status filters
4. Provider selects report format:
   - PDF (formatted report)
   - CSV (data export)
   - Excel (with charts)
5. Provider clicks "Generate Report"
6. System validates parameters
7. System compiles data based on parameters
8. System generates report in selected format
9. System displays report preview (for PDF)
10. Provider downloads report
11. System logs report generation in audit trail

**Alternative Flows:**
- **7a.** No data matches criteria: System displays message, allows parameter adjustment
- **8a.** Large dataset: System processes asynchronously, sends notification when ready

**Postcondition:**
- Compliance report is generated and downloaded
- Report generation is logged

**Business Rules:**
- Reports only include data for provider's assigned patients
- Report generation is logged with patient IDs accessed
- Reports are de-identified for aggregate reporting
- Report retention follows data retention policy

---

#### UC-PR-006: Create Instruction Template

**Actor:** Healthcare Provider

**Precondition:**
- Provider is authenticated

**Main Flow:**
1. Provider navigates to "Templates" section
2. Provider clicks "Create Template"
3. Provider fills in template details:
   - Template name
   - Category (specialty, condition, procedure type)
   - Description
   - Tags for searchability
4. Provider creates instruction content (same as creating instruction):
   - Instruction type
   - Standard fields with placeholders
   - Default values
   - Rich text content
5. Provider marks fields as:
   - Required (must be filled when assigning)
   - Optional (can be customized)
   - Fixed (cannot be changed when assigning)
6. Provider sets default compliance tracking options
7. Provider sets default acknowledgment requirements
8. Provider saves template
9. System validates template
10. System creates template record
11. System sets template visibility:
    - Personal (only this provider)
    - Organization (all providers in organization)
12. System displays success message

**Alternative Flows:**
- **9a.** Validation fails: System displays errors
- **11a.** Provider selects organization visibility: May require approval (if enabled)

**Postcondition:**
- Instruction template is created
- Template is available for assignment

**Business Rules:**
- Templates are versioned (modifications create new versions)
- Deleted templates are soft-deleted (retained for audit)
- Organization templates require appropriate permissions
- Template usage statistics are tracked

---

### Administrator Use Cases

#### UC-A-001: Create User Account

**Actor:** Administrator

**Precondition:**
- Administrator is authenticated
- Administrator has user management permissions

**Main Flow:**
1. Administrator navigates to "User Management"
2. Administrator clicks "Create User"
3. Administrator selects user type:
   - Patient
   - Healthcare Provider
   - Administrator
4. Administrator fills in user details:
   - First name, last name
   - Email address (used as username)
   - Phone number
   - Date of birth (for patients)
   - License number (for providers)
   - Specialty (for providers)
5. Administrator assigns role(s)
6. Administrator assigns to organization/department
7. For providers: Administrator links to patients (if applicable)
8. Administrator sets account status:
   - Active
   - Inactive (requires activation)
9. Administrator selects authentication method:
   - **Option A:** Send invitation email
     - System generates temporary password
     - System sends invitation with setup link
   - **Option B:** Set initial password
     - Administrator sets password (meets policy requirements)
     - User must change on first login
10. Administrator reviews user summary
11. Administrator submits user creation
12. System validates all fields
13. System creates user account
14. System creates OAuth client (if needed)
15. System sends invitation/notification (if applicable)
16. System logs user creation in audit trail
17. System displays success message with user ID

**Alternative Flows:**
- **12a.** Validation fails: System displays errors (duplicate email, invalid format, etc.)
- **9a.** Email sending fails: System displays error, allows retry

**Postcondition:**
- User account is created
- User receives invitation (if applicable)
- Audit log entry is created

**Business Rules:**
- Email addresses must be unique
- Password must meet policy requirements
- User accounts are created in "pending activation" status if invitation sent
- All user creation is logged
- OAuth scopes are assigned based on role

---

#### UC-A-002: Manage User Roles and Permissions

**Actor:** Administrator

**Precondition:**
- Administrator is authenticated
- Administrator has role management permissions

**Main Flow:**
1. Administrator navigates to "Roles & Permissions"
2. Administrator views existing roles:
   - Default roles (Patient, Provider, Administrator)
   - Custom roles
3. Administrator selects action:
   - **Option A:** Create new role
     - Administrator clicks "Create Role"
     - Administrator enters role name and description
     - Administrator selects permissions from list:
       - Resource-based permissions (read:patients, write:instructions, etc.)
       - Action-based permissions (create, read, update, delete)
       - Scope-based permissions (own, assigned, all)
     - Administrator saves role
   - **Option B:** Edit existing role
     - Administrator selects role
     - Administrator modifies permissions
     - System shows permission changes summary
     - Administrator saves changes
   - **Option C:** Assign role to user
     - Administrator selects user
     - Administrator assigns role(s)
     - System validates role assignments
     - Administrator saves assignments
4. System validates role configuration
5. System updates role/permissions
6. System logs role changes in audit trail
7. System notifies affected users (if permissions reduced)
8. System displays success message

**Alternative Flows:**
- **4a.** Cannot delete role assigned to users: System displays error, lists affected users
- **3a.** Administrator tries to modify default role: System requires confirmation

**Postcondition:**
- Role is created/updated
- Permissions are assigned
- Audit log entry is created

**Business Rules:**
- Default roles cannot be deleted
- Roles assigned to users cannot be deleted (must unassign first)
- Permission changes are logged
- Users are notified if their permissions are reduced
- Role changes take effect immediately

---

#### UC-A-003: View System-Wide Audit Logs

**Actor:** Administrator

**Precondition:**
- Administrator is authenticated
- Administrator has audit log access permissions

**Main Flow:**
1. Administrator navigates to "Audit Logs"
2. Administrator sets filters:
   - Date range (required)
   - User(s)
   - Action type (login, PHI access, data modification, etc.)
   - Resource type (patient, instruction, compliance, etc.)
   - Resource ID (specific patient, instruction, etc.)
   - IP address
   - Result (success, failure, error)
3. Administrator clicks "Search"
4. System queries audit logs based on filters
5. System displays audit log entries in table format:
   - Timestamp (UTC)
   - User (name, email, role)
   - Action performed
   - Resource type and ID
   - PHI accessed (patient ID, instruction ID)
   - IP address
   - User agent
   - Request ID
   - Result (success/failure)
   - Error details (if failure)
6. Administrator can:
   - Sort by any column
   - Export filtered results (CSV, JSON)
   - View detailed entry (expanded view)
   - Search within results
7. Administrator selects an entry for details
8. System displays full audit log entry:
   - All captured data
   - Request/response details (if available)
   - Related audit entries (same request ID)
   - User session information

**Alternative Flows:**
- **4a.** Large result set: System paginates results, shows total count
- **4b.** No results: System displays "No matching audit logs"

**Postcondition:**
- Administrator has reviewed audit logs
- Audit log access is itself logged

**Business Rules:**
- Audit logs are immutable (read-only)
- All audit log access is logged
- Export of audit logs requires additional authorization
- Audit logs are retained per retention policy (minimum 6 years)
- Sensitive audit log exports are logged and may require approval

---

#### UC-A-004: Generate System-Wide Compliance Report

**Actor:** Administrator

**Precondition:**
- Administrator is authenticated
- Administrator has reporting permissions

**Main Flow:**
1. Administrator navigates to "Compliance Reports"
2. Administrator selects report type:
   - Organization-wide compliance metrics
   - Provider performance report
   - Patient compliance trends
   - Instruction effectiveness analysis
   - Acknowledgment rate analysis
   - Regulatory compliance report
3. Administrator sets report parameters:
   - Date range
   - Organization/department filters
   - Provider filters
   - Patient filters (de-identified)
   - Instruction type filters
   - Metrics to include
4. Administrator selects aggregation level:
   - Aggregate (de-identified)
   - Provider-level (identified)
   - Patient-level (requires additional authorization)
5. Administrator selects report format:
   - PDF (formatted with charts)
   - CSV (raw data)
   - Excel (with pivot tables)
6. Administrator clicks "Generate Report"
7. System validates parameters and authorization
8. System compiles data:
   - Aggregates metrics
   - De-identifies patient data (if aggregate)
   - Calculates statistics
   - Generates visualizations
9. System generates report in selected format
10. System displays report preview (for PDF)
11. Administrator downloads report
12. System logs report generation in audit trail:
    - Report type
    - Parameters used
    - Data accessed (patient IDs, if applicable)
    - User who generated report

**Alternative Flows:**
- **7a.** Insufficient authorization: System requires additional approval
- **8a.** Large dataset: System processes asynchronously, sends email when ready

**Postcondition:**
- Compliance report is generated
- Report generation is logged

**Business Rules:**
- Aggregate reports are de-identified
- Patient-level reports require additional authorization
- Report generation is logged with all parameters
- Reports are retained per retention policy
- Sensitive reports may require approval workflow

---

#### UC-A-005: Configure System Settings

**Actor:** Administrator

**Precondition:**
- Administrator is authenticated
- Administrator has system configuration permissions

**Main Flow:**
1. Administrator navigates to "System Settings"
2. Administrator selects configuration category:
   - **Security Settings:**
     - Session timeout (minutes)
     - Maximum concurrent sessions per user
     - Password policy (complexity, length, expiration)
     - MFA requirements
     - Account lockout policy (failed attempts, lockout duration)
   - **OAuth Settings:**
     - OAuth client configuration
     - Token expiration times (access, refresh, ID)
     - Redirect URI whitelist
     - Scope definitions
   - **Notification Settings:**
     - Email notification preferences
     - Notification templates
     - Reminder schedules
   - **Data Retention:**
     - Audit log retention (years)
     - Instruction retention (years)
     - Compliance data retention (years)
     - Deleted data retention (years)
   - **Application Settings:**
     - Organization name and details
     - Default timezone
     - Date/time formats
     - Language settings
   - **Feature Flags:**
     - Enable/disable features
     - Beta feature access
3. Administrator modifies settings
4. System validates settings:
   - Value ranges
   - Format validation
   - Dependency checks
5. Administrator reviews changes summary
6. Administrator saves configuration
7. System applies configuration
8. System logs configuration changes in audit trail
9. System displays success message
10. For critical settings: System may require restart or displays warning

**Alternative Flows:**
- **4a.** Validation fails: System displays errors
- **6a.** Critical setting change: System requires confirmation and may require restart

**Postcondition:**
- System configuration is updated
- Changes are logged
- Settings take effect (immediately or after restart)

**Business Rules:**
- All configuration changes are logged
- Critical settings require confirmation
- Some settings require system restart
- Configuration history is maintained
- Rollback capability for configuration changes

---

## Business Rules

### General Rules

1. **Data Immutability**
   - Audit logs are immutable (append-only, no updates or deletes)
   - Acknowledgment records cannot be modified once created
   - Historical compliance data cannot be deleted
   - Instruction versions are immutable once published

2. **PHI Access Control**
   - All PHI access requires authentication
   - PHI access is logged in audit trail
   - Users can only access PHI they are authorized to view
   - Minimum necessary principle: users see only required data

3. **Data Retention**
   - Audit logs: Minimum 6 years (HIPAA requirement)
   - Care instructions: Per organization policy (typically 7-10 years)
   - Compliance data: Per organization policy
   - Deleted data: Soft-delete with retention period

4. **Acknowledgment Rules**
   - Acknowledgment cannot be undone
   - Multiple acknowledgment types can be recorded
   - Acknowledgment deadline tracking is mandatory
   - Overdue acknowledgments trigger alerts

5. **Compliance Tracking**
   - Patients self-report compliance data
   - Providers can view but not modify patient compliance
   - Compliance thresholds trigger automated alerts
   - Compliance history is preserved

6. **Instruction Lifecycle**
   - Instructions cannot be deleted, only cancelled or expired
   - Instruction modifications create new versions
   - Historical versions are preserved
   - Cancelled instructions are retained for audit

7. **User Management**
   - Email addresses must be unique
   - User accounts are soft-deleted (retained for audit)
   - Role changes are logged
   - Password changes require current password verification

8. **OAuth & Authentication**
   - All authentication events are logged
   - Failed login attempts are tracked
   - Account lockout after configured failed attempts
   - Session timeout after inactivity
   - Token refresh required before expiration

9. **Reporting**
   - Report generation is logged
   - Patient-level reports require authorization
   - Aggregate reports are de-identified
   - Reports are retained per retention policy

10. **Audit Logging**
    - All PHI access is logged
    - All data modifications are logged
    - All permission changes are logged
    - All configuration changes are logged
    - Audit log access is itself logged

### Role-Specific Rules

**Patient:**
- Can only view own data
- Cannot modify instructions
- Cannot view other patients' data
- Compliance data is self-reported

**Provider:**
- Can only access assigned patients
- Cannot modify other providers' instructions
- Can view but not modify patient compliance
- Must have active license (if applicable)

**Administrator:**
- Cannot directly access PHI (only through audit logs)
- Cannot create or modify instructions
- Cannot acknowledge on behalf of patients
- All administrative actions are logged

---

## Non-Functional Requirements

### Performance Requirements

1. **Response Time**
   - Page load time: < 2 seconds
   - API response time: < 500ms (p95)
   - Report generation: < 30 seconds for standard reports
   - Search results: < 1 second

2. **Throughput**
   - Support 1000 concurrent users
   - Handle 100 API requests per second per user
   - Database queries optimized with indexes

3. **Scalability**
   - Horizontal scaling capability
   - Database read replicas for reporting
   - Caching for frequently accessed data

### Security Requirements

1. **Authentication**
   - OAuth 2.0 with PKCE
   - Multi-factor authentication support
   - Session timeout: 30 minutes inactivity
   - Password complexity requirements

2. **Authorization**
   - Role-based access control (RBAC)
   - Resource-level authorization
   - Scope-based API access

3. **Data Protection**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.2+)
   - Encrypted backups
   - Secure key management

4. **Audit & Compliance**
   - Comprehensive audit logging
   - Immutable audit trail
   - 6-year audit log retention (minimum)
   - Real-time security monitoring

### Availability Requirements

1. **Uptime**
   - 99.9% availability (8.76 hours downtime/year)
   - Planned maintenance windows
   - Disaster recovery plan

2. **Backup & Recovery**
   - Daily automated backups
   - Point-in-time recovery capability
   - Recovery time objective (RTO): 4 hours
   - Recovery point objective (RPO): 1 hour

### Usability Requirements

1. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation support
   - Screen reader compatibility
   - Responsive design (mobile, tablet, desktop)

2. **User Experience**
   - Intuitive navigation
   - Clear error messages
   - Help documentation
   - Multi-language support (future)

### Maintainability Requirements

1. **Code Quality**
   - TypeScript strict mode
   - Code coverage > 80%
   - Comprehensive documentation
   - Code review process

2. **Monitoring**
   - Application performance monitoring (APM)
   - Error tracking and alerting
   - System health dashboards
   - Log aggregation and analysis

### Compliance Requirements

1. **HIPAA Compliance**
   - Administrative safeguards
   - Physical safeguards
   - Technical safeguards
   - Privacy rule compliance

2. **Data Privacy**
   - Patient data minimization
   - Right to access
   - Right to amendment
   - Breach notification procedures

---

## Appendix: Use Case Summary

### Patient Use Cases (5)
- UC-P-001: View Care Instructions
- UC-P-002: Acknowledge Care Instruction
- UC-P-003: Track Medication Adherence
- UC-P-004: Track Lifestyle Compliance
- UC-P-005: View Compliance History

### Provider Use Cases (6)
- UC-PR-001: Create Care Instruction
- UC-PR-002: Assign Instruction Template to Patient
- UC-PR-003: Monitor Patient Acknowledgment Status
- UC-PR-004: Track Patient Compliance
- UC-PR-005: Generate Compliance Report
- UC-PR-006: Create Instruction Template

### Administrator Use Cases (5)
- UC-A-001: Create User Account
- UC-A-002: Manage User Roles and Permissions
- UC-A-003: View System-Wide Audit Logs
- UC-A-004: Generate System-Wide Compliance Report
- UC-A-005: Configure System Settings

**Total Use Cases: 16**

---

*This document is a living document and will be updated as the project evolves.*