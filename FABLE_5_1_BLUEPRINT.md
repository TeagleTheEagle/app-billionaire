# Fable 5.1 Blueprint

## Project name
Fable 5.1

## Tagline
AI quote, follow-up, and booking automation for local service businesses

## Product summary
Fable 5.1 is a SaaS tool for local service businesses that need to respond faster, quote more accurately, and convert more leads into booked jobs. The app captures customer inquiries, understands the job request, generates a professional quote using the business's pricing rules, sends a follow-up text/email, allows the business to approve or edit the quote, and helps convert the lead into a booked appointment.

## Target customer
- Small local service businesses
- Plumbers, electricians, landscapers, cleaners, garage door companies, pest control, pool service, remodeling companies, junk removal businesses

## Pain points
- Slow lead response
- Missed inquiries
- Manual quoting
- Repetitive follow-up
- No clear lead pipeline
- Hard to turn leads into booked jobs

## Core value proposition
Turn inbound customer inquiries into accurate estimates, customer-ready messages, and booked appointments automatically.

## MVP scope
- User signup/login
- Business profile setup
- Service catalog and pricing
- Lead intake
- AI quote generation
- Quote approval/edit workflow
- Follow-up text/email generation
- Booking flow
- Dashboard
- Stripe billing

## Product vision
The long-term vision is to become the default AI operations layer for local service businesses, handling quote generation, follow-up automation, scheduling, and lead tracking. The first version will stay narrow and focused.

## Core user stories
- As a business owner, I want to add services and pricing rules so the AI can create realistic quotes.
- As a business owner, I want to receive and review leads quickly.
- As a business owner, I want the AI to generate a professional quote from a customer message.
- As a business owner, I want to edit or approve the quote before sending.
- As a business owner, I want to send follow-up text/email to the customer.
- As a business owner, I want to book the customer into an appointment.
- As a business owner, I want to track all leads in one dashboard.
- As a customer, I want to receive a clear estimate and a simple way to book.

## Primary user flow
1. Business signs up
2. Business fills out profile and services
3. Business adds or receives lead
4. AI reads customer message
5. AI generates quote
6. Business reviews and approves quote
7. Business sends customer quote and follow-up
8. Customer books appointment
9. Business tracks status in dashboard

## App structure
- Authentication
- Dashboard
- Business profile
- Services and pricing
- Leads
- Quotes
- Messages
- Bookings
- Billing
- Settings
- Admin / Activity

## Marketing pages
- Home
- Features
- Pricing
- Demo
- Login
- Signup
- FAQ

## Authenticated app pages
- /dashboard
- /dashboard/leads
- /dashboard/leads/[leadId]
- /dashboard/quotes
- /dashboard/appointments
- /dashboard/settings
- /dashboard/billing
- /settings/profile
- /settings/services
- /settings/pricing
- /settings/templates
- /settings/notifications
- /settings/billing

## Key components
- AppShell
- SidebarNavigation
- TopBar
- StatsCard
- LeadCard
- LeadList
- LeadDetailPanel
- QuotePreview
- ServiceCard
- PricingRuleEditor
- MessageComposer
- BookingModal
- StatusBadge
- EmptyState
- LoadingState
- FormField
- Button
- Modal
- Toast
- Table
- DatePicker
- FileUpload
- Avatar
- NotificationBell
- SubscriptionCard

## Database model

### Users
- id
- email
- passwordHash
- name
- avatarUrl
- createdAt
- updatedAt
- emailVerified
- role

### Businesses
- id
- ownerUserId
- name
- phone
- email
- address
- city
- state
- country
- timezone
- serviceArea
- website
- status
- createdAt
- updatedAt

### BusinessSettings
- id
- businessId
- brandPrimaryColor
- brandSecondaryColor
- logoUrl
- defaultQuoteTerms
- defaultFollowUpText
- defaultFollowUpEmail
- defaultBookingUrl
- autoSendQuotes
- autoSendFollowUps

### Services
- id
- businessId
- name
- category
- description
- pricingType
- basePrice
- minPrice
- maxPrice
- laborHoursEstimate
- minimumCharge
- active
- createdAt
- updatedAt

### PricingRules
- id
- serviceId
- ruleType
- value
- unit
- note
- active
- createdAt

### Leads
- id
- businessId
- customerName
- customerEmail
- customerPhone
- serviceRequested
- serviceId
- location
- inquiryText
- customerNotes
- source
- status
- budgetEstimate
- urgency
- createdAt
- updatedAt

### LeadAttachments
- id
- leadId
- fileName
- url
- mimeType
- uploadedAt

### Quotes
- id
- leadId
- businessId
- status
- totalPrice
- lineItemsJson
- assumptions
- terms
- createdByUserId
- createdAt
- approvedAt
- sentAt

### Messages
- id
- leadId
- businessId
- channel
- content
- subject
- messageType
- status
- sentAt
- createdAt

### Appointments
- id
- leadId
- businessId
- scheduledAt
- appointmentType
- notes
- status
- createdAt
- updatedAt

### Subscriptions
- id
- businessId
- stripeCustomerId
- stripeSubscriptionId
- planName
- status
- currentPeriodEnd
- createdAt
- updatedAt

### ActivityLog
- id
- businessId
- userId
- entityType
- entityId
- action
- metadataJson
- createdAt

## Lead statuses
- new
- contacted
- quote_created
- quote_sent
- booked
- won
- lost
- archived

## Quote statuses
- draft
- approved
- sent
- rejected
- expired

## Appointment statuses
- pending
- confirmed
- completed
- canceled

## Business logic

### Lead intake
- Support web form, manual creation, and API-based leads
- Fields: customer name, phone, email, service, location, description, attachments, urgency, budget, source
- Validate required fields
- Save all activity

### AI quote generation
- Input: business pricing rules + lead details + service catalog + tone settings
- Output: estimate summary, line items, total, assumptions, terms, customer-facing message, internal notes
- Use pricing rules as the primary source of truth
- If details are missing, note assumptions and provide conservative estimates
- If price cannot be confidently estimated, offer range or subject-to-site-visit wording

### Quote approval
- User can preview quote
- User can edit line items
- User can approve or reject
- Approved quote becomes final
- Quote can be sent to customer

### Messaging
- Auto-generate SMS and email follow-up
- User can edit before sending
- Generated message includes quote summary and CTA
- Business can resend any message

### Booking
- Customer can book consultation or site visit
- Lead status updates to booked
- Appointment is stored in database
- Confirmation message is sent

### Dashboard
- Total leads
- New leads
- Quote sent
- Booked jobs
- Lost leads
- Revenue estimate
- Recent activity
- Lead filter by status/date/source

## API blueprint

### Authentication
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

### Business
- GET /api/business
- PUT /api/business
- POST /api/business/services
- PUT /api/business/services/:id
- DELETE /api/business/services/:id
- GET /api/business/pricing
- POST /api/business/pricing/rules
- PUT /api/business/pricing/rules/:id

### Leads
- GET /api/leads
- POST /api/leads
- GET /api/leads/:id
- PUT /api/leads/:id
- DELETE /api/leads/:id
- POST /api/leads/:id/quote
- POST /api/leads/:id/message
- POST /api/leads/:id/booking

### Quotes
- GET /api/quotes/:id
- POST /api/quotes
- PUT /api/quotes/:id
- POST /api/quotes/:id/approve
- POST /api/quotes/:id/send

### Messages
- POST /api/messages/send
- GET /api/messages?leadId=...

### Appointments
- GET /api/appointments
- POST /api/appointments
- PUT /api/appointments/:id

### Billing
- POST /api/billing/create-checkout-session
- POST /api/billing/webhook
- GET /api/billing/subscription

### Settings
- GET /api/settings
- PUT /api/settings
- POST /api/settings/templates

## AI system design

### AI responsibilities
- Parse inquiry
- Identify likely service
- Compute estimate
- Craft follow-up copy
- Produce quote breakdown
- Assist with approvals
- Summarize lead history

### Prompt architecture
Use a structured prompt system:
- System prompt: business assistant rules
- Lead context prompt: relevant lead details
- Pricing rules prompt: business services and rules
- Tone prompt: owner preferences and brand style
- Output schema prompt: strict JSON output

### Example system prompt
"You are a sales assistant for a local service business. Use the business pricing rules to create a realistic quote. If details are missing, state assumptions. Keep tone professional and concise. Generate a quote, follow-up message, and internal notes in a structured JSON format."

### Example AI output schema
```json
{
  "serviceType": "Fence replacement",
  "lineItems": [
    { "name": "Materials", "value": 1200 },
    { "name": "Labor", "value": 900 },
    { "name": "Permit", "value": 150 }
  ],
  "subtotal": 2250,
  "tax": 180,
  "total": 2430,
  "assumptions": [
    "Standard installation",
    "No retaining wall work included"
  ],
  "terms": "Final pricing subject to site verification",
  "customerMessage": "Thanks for reaching out...",
  "internalNotes": "Customer wants quick estimate..."
}
```

### Guardrails
- Do not invent unsupported pricing data
- Do not claim customer specifics not in the lead
- Do not ignore price rules
- If ambiguous, provide ranges
- Keep customer language straightforward and not robotic
- Include CTA to book or respond

## UI/UX blueprint
The app must feel simple, fast, clear, modern, and not overwhelming.

### Key design principles
- Prioritize the lead pipeline above all
- Keep quote preview front and center
- Do not hide important actions
- Keep friction low
- Allow quick editing before sending
- Preserve clarity of lead status

### Main UX patterns
- list page for leads
- detail page for lead
- compact quote preview
- one-tap action buttons
- timeline of events

### Focus states
- active lead
- draft quote
- approved quote
- quote sent
- booked

## Business onboarding flow
1. Create account
2. Add business info
3. Add services
4. Add pricing rules
5. Customize brand
6. Test with first lead
7. Start using app

## Example service catalog
- Landscaping
- Plumbing
- Electrical
- Handyman
- Cleaning
- Painting
- Garage door
- Pool service
- Pest control

## Example services
- Lawn mowing
- Fence installation
- Drain cleaning
- HVAC repair
- Patio installation
- Water heater replacement

## Example pricing rules
### Fence installation
- Base labor rate: $65/hour
- Material markup: 25%
- Minimum charge: $500
- Add-ons: gate installation + $250
- Permit fee: +$150

### Lawn service
- Weekly mowing: $35
- Edging: +$10
- Trimming: +$15

### Plumbing
- Service call: $95
- Labor: $120/hour
- Minimum: $180
- After-hours fee: +20%

## Quote generation examples
### Example customer message
"Need a fence replaced around the backyard, about 150 ft. We just need a rough estimate. Thanks."

### AI output
- Service type: Fence replacement
- Total: $2,950
- Assumptions: Standard installation, no retaining wall
- Terms: Final pricing subject to final site inspection
- Follow-up: "Thanks for reaching out! Based on your project details, we estimate around $2,950 for a standard fence replacement. If you'd like, we can schedule a quick site visit or provide a more exact quote. Reply YES to book a consultation."

## Messaging capabilities
### SMS template
"Hi [Name], thanks for reaching out. We’ve prepared a preliminary quote for your [service]. Total estimate: $[amount]. Would you like to book a quick consultation? Reply YES or call us at [phone]."

### Email template
Subject: Your estimate for [service]

Hi [Name],
Thanks for contacting [Business]. Based on your request, here is a preliminary estimate:
- Service: [Service]
- Total: $[amount]
- Notes: [assumptions]
Would you like to book a consultation or review the details?
Best,
[Business]

## Booking flow details
### Booking modal
- Appointment type
- Date
- Time
- Notes
- Contact method
- Customer confirmation

### Booking types
- Consultation
- Quote review
- Site walk
- Installation
- Callback

## Admin and management
### Admin features
- User roles
- Team members
- Business ownership
- Activity logs
- Metrics
- Audits

### Roles
- admin
- manager
- staff
- read-only

## Billing plan
- Starter: $49/month
- Pro: $149/month
- Growth: $399/month

## Security and compliance
- Encrypted passwords
- Secure API endpoints
- Role-based access controls
- JWT or session-based auth
- CSRF protection
- Secure file uploads
- Basic rate limiting
- Environment variable protection

## Storage and infrastructure
Recommended stack:
- Next.js
- TypeScript
- Tailwind CSS
- Postgres
- Prisma or Supabase
- Vercel
- OpenAI API
- Stripe
- Resend or SendGrid
- Twilio
- Cloud storage (Supabase Storage or S3)

## Suggested project structure
```text
app/
  (auth)/
  (dashboard)/
  api/
  landing/
components/
  auth/
  dashboard/
  common/
  forms/
  modals/
  charts/
lib/
  auth/
  ai/
  pricing/
  bookings/
  stripe/
  utils/
prisma/
  schema.prisma
services/
  lead-service.ts
  quote-service.ts
  message-service.ts
  booking-service.ts
  billing-service.ts
types/
  business.ts
  lead.ts
  quote.ts
  appointment.ts
hooks/
  useAuth.ts
  useLeads.ts
  useBusiness.ts
middleware.ts
.env.example
```

## Implementation phases
### Phase 1: Foundation
- auth
- business profile
- database schema
- app shell
- dashboard skeleton
- email/password login

### Phase 2: Service and pricing
- service catalog
- pricing rules
- edit and save flows
- validation

### Phase 3: Leads
- lead creation
- lead list
- lead detail
- status fields

### Phase 4: AI quote generation
- pricing-aware prompt
- structured output
- quote preview
- approval workflow

### Phase 5: Messaging
- generate text/email
- send message via provider
- log sent message

### Phase 6: Booking
- booking modal
- schedule appointment
- status changes
- notifications

### Phase 7: Billing
- Stripe integration
- subscription setup
- checkout and webhook
- plan gating

### Phase 8: Polish
- onboarding checklist
- improved dashboard
- better UX
- notifications
- analytics

## Build checklist
### Authentication
- sign up
- login
- logout
- reset password
- profile update

### Business setup
- create business
- edit business details
- add services
- add pricing rules
- update brand info

### Lead management
- create lead
- list leads
- filter leads
- lead detail
- status change

### Quote generation
- generate quote from lead
- preview quote
- edit quote
- approve quote
- reject quote
- send quote

### Messaging
- generate SMS
- generate email
- send message
- store message log

### Booking
- book consultation
- schedule appointment
- confirm
- view bookings

### Billing
- create subscription
- checkout
- handle webhooks
- plan gating

## Acceptance criteria for the full product
The app is successful if:
- a business owner can sign up and onboard in under 10 minutes
- they can add services and pricing without technical help
- a lead can become a quote in under 10 seconds
- quote approval is easy and fast
- customer communication is professional and clear
- booking is simple and tracked
- the business sees all lead state in one dashboard
- the app monetizes through subscriptions

## Risks and mitigation
### Risk: AI quote accuracy is poor
Mitigation: base quote generation on business pricing rules, require business review before sending, and mark generated estimates as draft or preliminary.

### Risk: too much complexity
Mitigation: keep MVP narrow, no full CRM, no broad automation until product-market fit.

### Risk: local businesses do not trust AI
Mitigation: strong approval workflow, human review, customizable tone and terms, and clear labeling of quote status.

### Risk: low conversion
Mitigation: lead follow-up must be quick, CTA must be visible, templates must be strong, and booking flow should be frictionless.

## Future roadmap
- Team accounts
- Multi-location businesses
- Smart lead assignment
- Recurring service contracts
- Automation triggers
- AI-generated marketing
- Custom dashboards
- Outbound lead generation
- CRM sync
- API access
- White-label partner offering

## Product positioning
Fable 5.1 is not a general AI app. It is a focused conversion tool for local service businesses. Its core job is simple: turn incoming customer inquiries into clearly communicated estimates and booked appointments.

## Final build prompt for Claude Code
"Build Fable 5.1, a SaaS MVP for local service businesses. The product helps business owners turn customer inquiries into professional estimates, follow-up messages, and booked appointments using AI. Focus on one workflow: lead intake → AI quote generation → approval → customer messaging → booking. Include a modern dashboard, service catalog with pricing rules, lead management, quote approval/editing, booking actions, and Stripe subscriptions. The user is a non-technical business owner. Prioritize simplicity, speed, trust, and conversion. Do not overbuild. Use a modern web stack such as Next.js, Tailwind, Postgres, and serverless APIs. Include all required database tables, API routes, authentication, and pricing logic."

## Summary
Fable 5.1 is a narrow SaaS product for local service businesses that turns customer inquiries into vetted estimates, follow-up messages, and booked appointments using AI while keeping business review and human control in the loop.

## Suggested repo README insertion
If you want a short summary for the repo, use this:

"Fable 5.1 is an AI-powered lead-to-booking system for local service businesses. It turns customer inquiries into professional estimates, follow-up texts/emails, and booked appointments while keeping the business in control. Built for small service companies that want to quote faster and win more jobs."
