export type LineItem = { name: string; description?: string | null; quantity: number; unitPrice: number; total: number };

export type QuoteDTO = {
  id: string;
  status: string;
  serviceType: string;
  totalPrice: number;
  subtotal: number;
  tax: number;
  priceLow: number | null;
  priceHigh: number | null;
  lineItemsJson: LineItem[];
  assumptions: string[];
  terms: string;
  customerMessage: string;
  internalNotes: string | null;
  generatedBy: string;
  publicToken: string;
  createdAt: string;
  approvedAt: string | null;
  sentAt: string | null;
};

export type MessageDTO = {
  id: string;
  channel: string;
  content: string;
  subject: string | null;
  messageType: string;
  status: string;
  recipient: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type AppointmentDTO = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  appointmentType: string;
  notes: string | null;
  status: string;
  createdAt: string;
};

export type LeadDetailDTO = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceRequested: string | null;
  serviceId: string | null;
  location: string | null;
  inquiryText: string;
  customerNotes: string | null;
  source: string;
  status: string;
  budgetEstimate: number | null;
  urgency: string;
  createdAt: string;
  service: { id: string; name: string } | null;
  attachments: Array<{ id: string; fileName: string; url: string }>;
  quotes: QuoteDTO[];
  messages: MessageDTO[];
  appointments: AppointmentDTO[];
};
