import { ApiResponse, AiImportDefaults, AiImportDraft, AiImportRequest } from '../types';
import { isValidDomain, isValidUrl } from '../utils/validation';

type ZaiEnv = {
  ZAI_API_KEY?: string;
  ZAI_BASE_URL?: string;
  ZAI_VISION_MODEL?: string;
};

type ZaiMessageContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };

type ZaiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type RawAiImportItem = {
  domainAddress?: unknown;
  registrar?: unknown;
  renewalUrl?: unknown;
  registrationDate?: unknown;
  expiryDate?: unknown;
  usagePeriodYears?: unknown;
  reminderDaysOffset?: unknown;
  reminderEmail?: unknown;
  reminderCount?: unknown;
  confidence?: unknown;
  sourceSnippet?: unknown;
  warnings?: unknown;
};

type ParsedAiPayload = {
  items?: RawAiImportItem[];
  globalWarnings?: unknown;
};

const DEFAULT_BASE_URL = 'https://api.z.ai/api/paas/v4';
const DEFAULT_MODEL = 'GLM-4.6V-Flash';

const REGISTRAR_RENEWAL_URLS: Array<{ patterns: string[]; url: string }> = [
  { patterns: ['cloudflare'], url: 'https://dash.cloudflare.com/' },
  { patterns: ['godaddy', 'go daddy'], url: 'https://dcc.godaddy.com/' },
  { patterns: ['namecheap'], url: 'https://ap.www.namecheap.com/' },
  { patterns: ['spaceship'], url: 'https://www.spaceship.com/domain-management/' },
  { patterns: ['porkbun'], url: 'https://porkbun.com/' },
];

export class AiImportService {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(env: ZaiEnv) {
    this.apiKey = env.ZAI_API_KEY;
    this.baseUrl = (env.ZAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.model = env.ZAI_VISION_MODEL || DEFAULT_MODEL;
  }

  async parseImportRequest(input: AiImportRequest): Promise<ApiResponse<{ drafts: AiImportDraft[]; warnings: string[]; model: string }>> {
    if (!this.apiKey) {
      return {
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'AI import is not configured on the server',
        },
      };
    }

    if (input.sourceType !== 'text' && input.sourceType !== 'image') {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Unsupported AI import source type',
        },
      };
    }

    if (input.sourceType === 'text' && !this.normalizeText(input.text)) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Text content is required',
        },
      };
    }

    if (input.sourceType === 'image' && !this.normalizeText(input.imageDataUrl)) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Image data is required',
        },
      };
    }

    try {
      const content = this.buildUserContent(input);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en',
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(),
            },
            {
              role: 'user',
              content,
            },
          ],
        }),
      });

      const payload = (await response.json()) as ZaiChatResponse;
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'AI_REQUEST_FAILED',
            message: payload.error?.message || 'AI parsing request failed',
          },
        };
      }

      const rawContent = this.extractMessageContent(payload);
      const parsed = this.parseModelResponse(rawContent);
      const normalized = this.normalizeItems(parsed.items || [], input.defaults || {});
      const warnings = this.normalizeWarnings(parsed.globalWarnings);

      if (normalized.length === 0) {
        warnings.push('AI 没有识别出可导入的域名记录，请检查图片是否清晰，或改用文字输入。');
      }

      return {
        success: true,
        data: {
          drafts: normalized,
          warnings,
          model: this.model,
        },
      };
    } catch (error) {
      console.error('AI import parse error:', error);
      return {
        success: false,
        error: {
          code: 'AI_PARSE_FAILED',
          message: 'Failed to parse domains with AI',
        },
      };
    }
  }

  private buildSystemPrompt(): string {
    return [
      'You extract domain renewal records from text or screenshots.',
      'Return only a JSON object with this shape:',
      '{"items":[{"domainAddress":"","registrar":"","renewalUrl":"","registrationDate":"YYYY-MM-DD or null","expiryDate":"YYYY-MM-DD or null","usagePeriodYears":1,"reminderDaysOffset":30,"reminderEmail":"","reminderCount":3,"confidence":0.0,"sourceSnippet":"","warnings":[""]}],"globalWarnings":[""]}',
      'Rules:',
      '- Extract one item per domain.',
      '- Keep unknown fields as null or empty string.',
      '- Prefer exact values visible in the source. Do not invent dates, emails, or URLs.',
      '- confidence must be between 0 and 1.',
      '- sourceSnippet should briefly quote or summarize the source row or text for traceability.',
      '- warnings should explain ambiguities such as unreadable dates, guessed registrar URLs, or duplicate-looking domains.',
      '- registrationDate should be the registration or renewal cycle start date only if explicit. If only expiry date is visible, keep registrationDate null and fill expiryDate.',
      '- registrar should be included when it can be identified from the screenshot, bill, or text.',
      '- renewalUrl should only be included when clearly visible.',
      '- Do not wrap the JSON in markdown fences.',
    ].join('\n');
  }

  private buildUserContent(input: AiImportRequest): string | ZaiMessageContentPart[] {
    const defaults = input.defaults || {};
    const defaultsText = [
      'Current import defaults:',
      `renewalUrl: ${defaults.renewalUrl || '(empty)'}`,
      `usagePeriodYears: ${defaults.usagePeriodYears ?? '(empty)'}`,
      `reminderDaysOffset: ${defaults.reminderDaysOffset ?? '(empty)'}`,
      `reminderEmail: ${defaults.reminderEmail || '(empty)'}`,
      `reminderCount: ${defaults.reminderCount ?? '(empty)'}`,
    ].join('\n');

    if (input.sourceType === 'image') {
      return [
        {
          type: 'text',
          text: `${defaultsText}\nRead the screenshot and extract domain renewal records.`,
        },
        {
          type: 'image_url',
          image_url: {
            url: input.imageDataUrl || '',
          },
        },
      ];
    }

    return `${defaultsText}\nParse the following text into domain renewal records:\n${input.text || ''}`;
  }

  private extractMessageContent(response: ZaiChatResponse): string {
    const content = response.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => part.text || '')
        .join('\n')
        .trim();
    }

    throw new Error('Missing AI response content');
  }

  private parseModelResponse(content: string): ParsedAiPayload {
    const cleaned = content.trim();
    const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fencedMatch?.[1] || this.extractJsonBlock(cleaned);
    return JSON.parse(candidate) as ParsedAiPayload;
  }

  private extractJsonBlock(content: string): string {
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('No JSON object found in AI response');
    }

    return content.slice(firstBrace, lastBrace + 1);
  }

  private normalizeItems(items: RawAiImportItem[], defaults: AiImportDefaults): AiImportDraft[] {
    return items
      .map((item) => this.normalizeItem(item, defaults))
      .filter((item): item is AiImportDraft => item !== null);
  }

  private normalizeItem(item: RawAiImportItem, defaults: AiImportDefaults): AiImportDraft | null {
    const usagePeriodYears = this.normalizeInteger(item.usagePeriodYears, defaults.usagePeriodYears ?? 1, 1, 100);
    const reminderDaysOffset = this.normalizeInteger(item.reminderDaysOffset, defaults.reminderDaysOffset ?? 30, 1, 365);
    const reminderCount = this.normalizeInteger(item.reminderCount, defaults.reminderCount ?? 3, 1, 30);
    const registrar = this.normalizeText(item.registrar);
    const renewalUrl =
      this.normalizeUrl(item.renewalUrl) ||
      this.normalizeUrl(defaults.renewalUrl) ||
      this.inferRenewalUrl(registrar, item.sourceSnippet) ||
      '';
    const reminderEmail = this.normalizeEmail(item.reminderEmail) || this.normalizeEmail(defaults.reminderEmail) || '';
    const domainAddress = this.normalizeDomain(item.domainAddress);
    const warnings = this.normalizeWarnings(item.warnings);
    const registrationDate =
      this.normalizeDate(item.registrationDate) ||
      this.deriveRegistrationDate(this.normalizeDate(item.expiryDate), usagePeriodYears) ||
      '';

    if (!domainAddress && !registrationDate && !renewalUrl && !reminderEmail) {
      return null;
    }

    if (!domainAddress) {
      warnings.push('未识别出有效域名，请手动补充。');
    }

    if (!registrationDate) {
      warnings.push('未识别出注册日期，也无法从到期日期反推，请手动填写。');
    }

    if (!renewalUrl) {
      warnings.push('未识别出续费网址，导入前请确认。');
    } else if (!this.normalizeUrl(item.renewalUrl) && registrar) {
      warnings.push(`已根据注册商 ${registrar} 自动补全续费入口，请导入前确认。`);
    }

    if (!reminderEmail) {
      warnings.push('未识别出提醒邮箱，导入前请确认。');
    }

    return {
      domainAddress,
      renewalUrl,
      registrationDate,
      usagePeriodYears,
      reminderDaysOffset,
      reminderEmail,
      reminderCount,
      confidence: this.normalizeConfidence(item.confidence),
      sourceSnippet: this.normalizeText(item.sourceSnippet),
      warnings: Array.from(new Set(warnings)),
    };
  }

  private deriveRegistrationDate(expiryDate: string | null, usagePeriodYears: number): string | null {
    if (!expiryDate) {
      return null;
    }

    const parsed = new Date(`${expiryDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    parsed.setUTCFullYear(parsed.getUTCFullYear() - usagePeriodYears);
    return parsed.toISOString().slice(0, 10);
  }

  private normalizeDomain(value: unknown): string {
    const text = this.normalizeText(value);
    if (!text) {
      return '';
    }

    const normalized = text
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim();

    return isValidDomain(normalized) ? normalized : '';
  }

  private normalizeUrl(value: unknown): string | null {
    const text = this.normalizeText(value);
    if (!text) {
      return null;
    }

    return isValidUrl(text) ? text : null;
  }

  private normalizeEmail(value: unknown): string | null {
    const text = this.normalizeText(value);
    if (!text) {
      return null;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
  }

  private normalizeDate(value: unknown): string | null {
    const text = this.normalizeText(value);
    if (!text) {
      return null;
    }

    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const parsed = new Date(`${text}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return text;
  }

  private normalizeInteger(value: unknown, fallback: number, min: number, max: number): number {
    const raw = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
    if (Number.isInteger(raw) && raw >= min && raw <= max) {
      return raw;
    }

    return fallback;
  }

  private normalizeConfidence(value: unknown): number | null {
    const raw = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : NaN;
    if (Number.isFinite(raw)) {
      return Math.min(1, Math.max(0, raw));
    }

    return null;
  }

  private normalizeWarnings(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.normalizeText(item))
      .filter((item): item is string => Boolean(item));
  }

  private inferRenewalUrl(registrar: string | null, sourceSnippet: unknown): string | null {
    const snippet = this.normalizeText(sourceSnippet);
    const haystack = [registrar, snippet].filter(Boolean).join(' ').toLowerCase();
    if (!haystack) {
      return null;
    }

    for (const candidate of REGISTRAR_RENEWAL_URLS) {
      if (candidate.patterns.some((pattern) => haystack.includes(pattern))) {
        return candidate.url;
      }
    }

    return null;
  }

  private normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
