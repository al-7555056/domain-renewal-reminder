import { AiImportDraft, AiImportHistoryEntry, AiImportHistoryStatus, AiImportRequest, ApiResponse } from '../types';

type HistoryRow = AiImportHistoryEntry;

type HistoryListItem = {
  id: string;
  sourceType: 'text' | 'image';
  sourceLabel: string;
  status: AiImportHistoryStatus;
  model: string | null;
  drafts: AiImportDraft[];
  warnings: string[];
  errorMessage: string | null;
  resultCount: number;
  retryOfHistoryId: string | null;
  importedAt: number | null;
  createdAt: number;
  updatedAt: number;
  canRetry: boolean;
  canLoadDrafts: boolean;
};

export class AiImportHistoryService {
  constructor(private db: D1Database) {}

  async createAttempt(
    userId: string,
    input: AiImportRequest,
    result:
      | { success: true; drafts: AiImportDraft[]; warnings: string[]; model: string; retryOfHistoryId?: string | null }
      | { success: false; errorMessage: string; retryOfHistoryId?: string | null }
  ): Promise<string | null> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();
      const sourceLabel = this.buildSourceLabel(input);
      const sourceText = input.sourceType === 'text' ? this.normalizeText(input.text) : null;
      const status: AiImportHistoryStatus = result.success ? 'success' : 'failed';
      const draftsJson = result.success ? JSON.stringify(result.drafts) : null;
      const warningsJson = result.success ? JSON.stringify(result.warnings) : null;
      const errorMessage = result.success ? null : ('errorMessage' in result ? result.errorMessage : null);
      const model = result.success ? result.model : null;
      const resultCount = result.success ? result.drafts.length : 0;

      await this.db
        .prepare(
          `INSERT INTO ai_import_history (
            id, user_id, source_type, source_label, source_text, model,
            status, drafts_json, warnings_json, error_message, result_count,
            retry_of_history_id, imported_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
        )
        .bind(
          id,
          userId,
          input.sourceType,
          sourceLabel,
          sourceText,
          model,
          status,
          draftsJson,
          warningsJson,
          errorMessage,
          resultCount,
          result.retryOfHistoryId || null,
          now,
          now
        )
        .run();

      return id;
    } catch (error) {
      console.error('Create AI import history failed:', error);
      return null;
    }
  }

  async listHistory(userId: string, limit: number = 10): Promise<ApiResponse<{ history: HistoryListItem[] }>> {
    try {
      const result = await this.db
        .prepare(
          `SELECT * FROM ai_import_history
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .bind(userId, limit)
        .all<HistoryRow>();

      return {
        success: true,
        data: {
          history: (result.results || []).map((row) => this.toHistoryListItem(row)),
        },
      };
    } catch (error) {
      console.error('List AI import history failed:', error);
      return {
        success: false,
        error: {
          code: 'AI_HISTORY_LIST_FAILED',
          message: 'Failed to load AI import history',
        },
      };
    }
  }

  async getHistoryById(userId: string, historyId: string): Promise<HistoryListItem | null> {
    try {
      const row = await this.db
        .prepare('SELECT * FROM ai_import_history WHERE id = ? AND user_id = ?')
        .bind(historyId, userId)
        .first<HistoryRow>();

      return row ? this.toHistoryListItem(row) : null;
    } catch (error) {
      console.error('Get AI import history failed:', error);
      return null;
    }
  }

  async markImported(userId: string, historyId: string): Promise<ApiResponse> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const result = await this.db
        .prepare(
          `UPDATE ai_import_history
           SET status = 'imported', imported_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ?`
        )
        .bind(now, now, historyId, userId)
        .run();

      if ((result.meta?.changes || 0) === 0) {
        return {
          success: false,
          error: {
            code: 'AI_HISTORY_NOT_FOUND',
            message: 'AI history record not found',
          },
        };
      }

      return {
        success: true,
        message: 'AI import history marked as imported',
      };
    } catch (error) {
      console.error('Mark AI import history imported failed:', error);
      return {
        success: false,
        error: {
          code: 'AI_HISTORY_MARK_IMPORTED_FAILED',
          message: 'Failed to update AI import history',
        },
      };
    }
  }

  private toHistoryListItem(row: HistoryRow): HistoryListItem {
    const drafts = this.parseJson<AiImportDraft[]>(row.drafts_json, []);
    const warnings = this.parseJson<string[]>(row.warnings_json, []);
    const sourceText = this.normalizeText(row.source_text);

    return {
      id: row.id,
      sourceType: row.source_type,
      sourceLabel: row.source_label,
      status: row.status,
      model: row.model || null,
      drafts,
      warnings,
      errorMessage: row.error_message || null,
      resultCount: row.result_count || drafts.length,
      retryOfHistoryId: row.retry_of_history_id || null,
      importedAt: row.imported_at ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      canRetry: row.source_type === 'text' && Boolean(sourceText),
      canLoadDrafts: drafts.length > 0,
    };
  }

  private buildSourceLabel(input: AiImportRequest): string {
    const explicit = this.normalizeText(input.sourceLabel);
    if (explicit) {
      return explicit.slice(0, 120);
    }

    if (input.sourceType === 'text') {
      const text = this.normalizeText(input.text);
      return text ? text.replace(/\s+/g, ' ').slice(0, 120) : '粘贴文字识别';
    }

    return '图片识别';
  }

  private parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
