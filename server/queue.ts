import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis, isRedisAvailable, waitForRedis } from './redis';

// Job queue for background processing (only if Redis is available)
const redisUrl = process.env.REDIS_URL;
let connection: any = undefined;

if (redisUrl) {
  const url = new URL(redisUrl);
  connection = {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    // Support TLS for rediss:// URLs
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

// Define job types
export type TestScoringJob = {
  attemptId: string;
  userId: string;
  testId: string;
};

export type ReportGenerationJob = {
  attemptId: string;
  userId: string;
  format: 'pdf' | 'csv';
};

export type AnalyticsUpdateJob = {
  userId: string;
  testId: string;
};

export type InvoiceGenerationJob = {
  purchaseId: string;
  userId: string;
};

export type BulkImportJob = {
  bulkImportId: string;
  userId: string;
  records: any[];
};

// Create queues (only if Redis is available)
// NOTE: Worker implementations will be added in task 5 to actually process these jobs
export const testScoringQueue = connection ? new Queue<TestScoringJob>('test-scoring', { connection }) : null;
export const reportQueue = connection ? new Queue<ReportGenerationJob>('report-generation', { connection }) : null;
export const analyticsQueue = connection ? new Queue<AnalyticsUpdateJob>('analytics-update', { connection }) : null;
export const invoiceQueue = connection ? new Queue<InvoiceGenerationJob>('invoice-generation', { connection }) : null;
export const bulkImportQueue = connection ? new Queue<BulkImportJob>('bulk-import', { connection }) : null;

/**
 * Check if queues are ready to use
 */
export async function areQueuesReady(): Promise<boolean> {
  if (!connection) return false;
  return await waitForRedis();
}

// Queue helper functions with null safety
export const queueHelpers = {
  /**
   * Add test scoring job to queue
   */
  async scoreTest(attemptId: string, userId: string, testId: string) {
    if (!testScoringQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, processing will happen synchronously');
      return;
    }
    try {
      await testScoringQueue.add(
        'score',
        { attemptId, userId, testId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
      console.log(`✅ Test scoring job queued for attempt ${attemptId}`);
    } catch (error) {
      console.error('Failed to queue test scoring job, will process synchronously:', error);
      // Don't throw - degrade gracefully to synchronous processing
    }
  },

  /**
   * Add report generation job to queue
   */
  async generateReport(attemptId: string, userId: string, format: 'pdf' | 'csv' = 'pdf') {
    if (!reportQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, report generation will be handled on-demand');
      return;
    }
    try {
      await reportQueue.add(
        'generate',
        { attemptId, userId, format },
        {
          attempts: 2,
          delay: 1000,
        }
      );
      console.log(`✅ Report generation job queued for attempt ${attemptId}`);
    } catch (error) {
      console.error('Failed to queue report generation job, will handle on-demand:', error);
      // Don't throw - degrade gracefully to on-demand generation
    }
  },

  /**
   * Add analytics update job to queue
   */
  async updateAnalytics(userId: string, testId: string) {
    if (!analyticsQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, analytics will be computed on-demand');
      return;
    }
    try {
      await analyticsQueue.add(
        'update',
        { userId, testId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      );
      console.log(`✅ Analytics update job queued for user ${userId}`);
    } catch (error) {
      console.error('Failed to queue analytics update job, will compute on-demand:', error);
      // Don't throw - degrade gracefully to on-demand analytics
    }
  },

  /**
   * Add invoice generation job to queue
   */
  async generateInvoice(purchaseId: string, userId: string) {
    if (!invoiceQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, invoice will be generated on-demand');
      return;
    }
    try {
      await invoiceQueue.add(
        'generate',
        { purchaseId, userId },
        {
          attempts: 3,
          delay: 500,
        }
      );
      console.log(`✅ Invoice generation job queued for purchase ${purchaseId}`);
    } catch (error) {
      console.error('Failed to queue invoice generation job, will generate on-demand:', error);
      // Don't throw - degrade gracefully to on-demand invoice generation
    }
  },

  /**
   * Add bulk import processing job to queue
   */
  async processBulkImport(bulkImportId: string, records: any[]) {
    if (!bulkImportQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, bulk import will be processed synchronously');
      return;
    }
    try {
      const job = await bulkImportQueue.add(
        'process',
        { bulkImportId, userId: '', records },
        {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        }
      );
      console.log(`✅ Bulk import job queued for import ${bulkImportId}`);
      return job;
    } catch (error) {
      console.error('Failed to queue bulk import job, will process synchronously:', error);
      // Don't throw - degrade gracefully to synchronous processing
    }
  },

  /**
   * Get job status
   */
  async getJobStatus(queue: Queue | null, jobId: string) {
    if (!queue) return null;
    try {
      const job = await queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      return {
        id: job.id,
        state,
        progress: job.progress,
        data: job.data,
        returnValue: job.returnvalue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  },

  /**
   * Clear completed jobs (run periodically)
   */
  async clearCompleted(queue: Queue | null, olderThan: number = 3600000) {
    if (!queue) return;
    try {
      await queue.clean(olderThan, 100, 'completed');
      console.log(`✅ Cleared completed jobs older than ${olderThan}ms`);
    } catch (error) {
      console.error('Failed to clear completed jobs:', error);
    }
  },
};

// Queue events for monitoring (only if connection is available)
let testScoringEvents: QueueEvents | null = null;
if (connection) {
  testScoringEvents = new QueueEvents('test-scoring', { connection });
  testScoringEvents.on('completed', ({ jobId }) => {
    console.log(`✅ Test scoring job ${jobId} completed`);
  });

  testScoringEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ Test scoring job ${jobId} failed:`, failedReason);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (testScoringQueue) await testScoringQueue.close();
  if (reportQueue) await reportQueue.close();
  if (analyticsQueue) await analyticsQueue.close();
  if (invoiceQueue) await invoiceQueue.close();
  if (bulkImportQueue) await bulkImportQueue.close();
  console.log('Job queues closed');
});

export default {
  testScoringQueue,
  reportQueue,
  analyticsQueue,
  invoiceQueue,
  bulkImportQueue,
  queueHelpers,
};
