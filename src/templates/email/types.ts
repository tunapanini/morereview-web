export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplateData {
  firstName?: string;
  lastName?: string;
  unsubscribeToken?: string;
  [key: string]: any;
}

export interface EmailTemplateContext {
  brandName: string;
  homeUrl: string;
  unsubscribeUrl?: string;
  data: EmailTemplateData;
}

export type EmailTemplateType = 'welcome' | 'campaign-digest' | 'unsubscribe-confirmation';

export interface TemplateGenerator {
  (context: EmailTemplateContext): EmailTemplate;
}