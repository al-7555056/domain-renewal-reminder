/**
 * Domain management routes
 */

import { Hono } from 'hono';
import { AiImportRequest } from '../types';
import { DomainService } from '../services/domain';
import { AiImportService } from '../services/aiImport';
import { AiImportHistoryService } from '../services/aiImportHistory';
import { requireAuth } from '../middleware/auth';

const domains = new Hono();

// All domain routes require authentication
domains.use('*', requireAuth);

/**
 * POST /domains/ai-parse
 * Parse domain records from text or image using AI
 */
domains.post('/ai-parse', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const input = (await c.req.json()) as AiImportRequest;
    const aiImportService = new AiImportService(c.env);
    const historyService = new AiImportHistoryService(c.env.DB as D1Database);
    const result = await aiImportService.parseImportRequest(input);

    const historyId = await historyService.createAttempt(
      userId,
      input,
      result.success
        ? {
            success: true,
            drafts: result.data?.drafts || [],
            warnings: result.data?.warnings || [],
            model: result.data?.model || '',
          }
        : {
            success: false,
            errorMessage: result.error?.message || 'AI parsing failed',
          }
    );

    if (result.success && result.data) {
      return c.json(
        {
          ...result,
          data: {
            ...result.data,
            historyId,
          },
        },
        200
      );
    }

    return c.json(
      {
        ...result,
        data: historyId ? { historyId } : undefined,
      },
      400
    );
  } catch (error) {
    console.error('AI parse domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while parsing domains with AI',
        },
      },
      500
    );
  }
});

/**
 * GET /domains/ai-history
 * Get AI import history for current user
 */
domains.get('/ai-history', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 20);
    const historyService = new AiImportHistoryService(c.env.DB as D1Database);
    const result = await historyService.listHistory(userId, Number.isFinite(limit) ? limit : 10);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Get AI history route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching AI history',
        },
      },
      500
    );
  }
});

/**
 * POST /domains/ai-history/:id/retry
 * Retry a previous text-based AI import
 */
domains.post('/ai-history/:id/retry', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const historyId = c.req.param('id');
    const historyService = new AiImportHistoryService(c.env.DB as D1Database);
    const existing = await historyService.getHistoryById(userId, historyId);

    if (!existing) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AI_HISTORY_NOT_FOUND',
            message: 'AI history record not found',
          },
        },
        404
      );
    }

    if (!existing.canRetry) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AI_HISTORY_NOT_RETRYABLE',
            message: 'This AI history entry cannot be retried automatically',
          },
        },
        400
      );
    }

    const record = await (c.env.DB as D1Database)
      .prepare('SELECT source_text FROM ai_import_history WHERE id = ? AND user_id = ?')
      .bind(historyId, userId)
      .first<{ source_text: string | null }>();

    const sourceText = record?.source_text?.trim();
    if (!sourceText) {
      return c.json(
        {
          success: false,
          error: {
            code: 'AI_HISTORY_NOT_RETRYABLE',
            message: 'Original text source is not available for retry',
          },
        },
        400
      );
    }

    const body = (await c.req.json().catch(() => ({}))) as Partial<AiImportRequest>;
    const input: AiImportRequest = {
      sourceType: 'text',
      text: sourceText,
      sourceLabel: `${existing.sourceLabel}（重试）`,
      defaults: body.defaults,
    };

    const aiImportService = new AiImportService(c.env);
    const result = await aiImportService.parseImportRequest(input);
    const newHistoryId = await historyService.createAttempt(
      userId,
      input,
      result.success
        ? {
            success: true,
            drafts: result.data?.drafts || [],
            warnings: result.data?.warnings || [],
            model: result.data?.model || '',
            retryOfHistoryId: historyId,
          }
        : {
            success: false,
            errorMessage: result.error?.message || 'AI retry failed',
            retryOfHistoryId: historyId,
          }
    );

    if (result.success && result.data) {
      return c.json(
        {
          ...result,
          data: {
            ...result.data,
            historyId: newHistoryId,
          },
        },
        200
      );
    }

    return c.json(
      {
        ...result,
        data: newHistoryId ? { historyId: newHistoryId } : undefined,
      },
      400
    );
  } catch (error) {
    console.error('Retry AI history route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrying AI history',
        },
      },
      500
    );
  }
});

/**
 * POST /domains/ai-history/:id/mark-imported
 * Mark an AI parse history entry as imported
 */
domains.post('/ai-history/:id/mark-imported', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const historyId = c.req.param('id');
    const historyService = new AiImportHistoryService(c.env.DB as D1Database);
    const result = await historyService.markImported(userId, historyId);

    return c.json(result, result.success ? 200 : result.error?.code === 'AI_HISTORY_NOT_FOUND' ? 404 : 500);
  } catch (error) {
    console.error('Mark AI history imported route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating AI history',
        },
      },
      500
    );
  }
});

/**
 * POST /domains/batch
 * Batch add multiple domains
 */
domains.post('/batch', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const inputs = await c.req.json();

    if (!Array.isArray(inputs)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Expected an array of domain inputs',
          },
        },
        400
      );
    }

    // Convert date strings to Date objects
    const processedInputs = inputs.map((input) => ({
      ...input,
      registrationDate: input.registrationDate ? new Date(input.registrationDate) : undefined,
    }));

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.batchAddDomains(userId, processedInputs);

    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Batch add domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while batch adding domains',
        },
      },
      500
    );
  }
});

/**
 * POST /domains
 * Add a new domain
 */
domains.post('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const input = await c.req.json();

    // Convert date string to Date object
    if (input.registrationDate) {
      input.registrationDate = new Date(input.registrationDate);
    }

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.addDomain(userId, input);

    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Add domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while adding domain',
        },
      },
      500
    );
  }
});

/**
 * GET /domains
 * Get user's domains with optional filters and pagination
 */
domains.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const renewalUrl = c.req.query('renewalUrl');
    const usagePeriodYears = c.req.query('usagePeriodYears');
    const reminderCount = c.req.query('reminderCount');
    const status = c.req.query('status');
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);

    const filters: any = {};
    if (renewalUrl) filters.renewalUrl = renewalUrl;
    if (usagePeriodYears) filters.usagePeriodYears = parseInt(usagePeriodYears, 10);
    if (reminderCount) filters.reminderCount = parseInt(reminderCount, 10);
    if (status) filters.status = status;

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.getUserDomains(userId, filters, page, pageSize);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Get domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching domains',
        },
      },
      500
    );
  }
});

/**
 * GET /domains/grouped
 * Get domains grouped by renewal URL
 */
domains.get('/grouped', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.groupByRenewalUrl(userId);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Group domains route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while grouping domains',
        },
      },
      500
    );
  }
});

/**
 * PUT /domains/:id
 * Update a domain
 */
domains.put('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const domainId = c.req.param('id');
    const updates = await c.req.json();

    // Convert date string to Date object if present
    if (updates.registrationDate) {
      updates.registrationDate = new Date(updates.registrationDate);
    }

    if (updates.reminderStartDate && typeof updates.reminderStartDate === 'string') {
      updates.reminderStartDate = Math.floor(new Date(updates.reminderStartDate).getTime() / 1000);
    }

    if (updates.processedAt !== undefined && typeof updates.processedAt === 'string') {
      updates.processedAt = updates.processedAt
        ? Math.floor(new Date(updates.processedAt).getTime() / 1000)
        : null;
    }

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.updateDomain(userId, domainId, updates);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Update domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating domain',
        },
      },
      500
    );
  }
});

/**
 * POST /domains/:id/renew
 * Mark a domain as renewed and roll dates forward
 */
domains.post('/:id/renew', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const domainId = c.req.param('id');

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.renewDomain(userId, domainId);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Renew domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while renewing domain',
        },
      },
      500
    );
  }
});

/**
 * DELETE /domains/:id
 * Delete a domain
 */
domains.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const domainId = c.req.param('id');

    const domainService = new DomainService(c.env.DB as D1Database);
    const result = await domainService.deleteDomain(userId, domainId);

    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    console.error('Delete domain route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting domain',
        },
      },
      500
    );
  }
});

export default domains;
