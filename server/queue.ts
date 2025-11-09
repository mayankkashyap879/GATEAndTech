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

export type EmailJob = {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
};

export type NotificationJob = {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
};

export type ImportJob = {
  importId: string;
  userId: string;
  fileUrl: string;
  type: 'csv' | 'qti';
  mapping: Record<string, string>;
};

export type GamificationJob = {
  userId: string;
  eventType: string;
  data: Record<string, any>;
};

export type PercentileCalculationJob = {
  testId: string;
  attemptId: string;
};

// Create queues (only if Redis is available)
// NOTE: Worker implementations will be added in milestones to actually process these jobs
export const testScoringQueue = connection ? new Queue<TestScoringJob>('test-scoring', { connection }) : null;
export const reportQueue = connection ? new Queue<ReportGenerationJob>('report-generation', { connection }) : null;
export const analyticsQueue = connection ? new Queue<AnalyticsUpdateJob>('analytics-update', { connection }) : null;
export const invoiceQueue = connection ? new Queue<InvoiceGenerationJob>('invoice-generation', { connection }) : null;
export const bulkImportQueue = connection ? new Queue<BulkImportJob>('bulk-import', { connection }) : null;
export const emailQueue = connection ? new Queue<EmailJob>('email', { connection }) : null;
export const notificationQueue = connection ? new Queue<NotificationJob>('notification', { connection }) : null;
export const importQueue = connection ? new Queue<ImportJob>('import', { connection }) : null;
export const gamificationQueue = connection ? new Queue<GamificationJob>('gamification', { connection }) : null;
export const percentileQueue = connection ? new Queue<PercentileCalculationJob>('percentile', { connection }) : null;

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
   * Send email via queue
   */
  async sendEmail(to: string, subject: string, template: string, data: Record<string, any>) {
    if (!emailQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, email will be sent synchronously');
      return;
    }
    try {
      await emailQueue.add(
        'send',
        { to, subject, template, data },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
      );
      console.log(`✅ Email job queued for ${to}`);
    } catch (error) {
      console.error('Failed to queue email job:', error);
    }
  },

  /**
   * Create notification
   */
  async createNotification(userId: string, type: string, title: string, message: string, data?: Record<string, any>) {
    if (!notificationQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, notification will be created synchronously');
      return;
    }
    try {
      await notificationQueue.add(
        'create',
        { userId, type, title, message, data },
        { attempts: 2 }
      );
      console.log(`✅ Notification job queued for user ${userId}`);
    } catch (error) {
      console.error('Failed to queue notification job:', error);
    }
  },

  /**
   * Process import job
   */
  async processImport(importId: string, userId: string, fileUrl: string, type: 'csv' | 'qti', mapping: Record<string, string>) {
    if (!importQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, import will be processed synchronously');
      return;
    }
    try {
      const job = await importQueue.add(
        'process',
        { importId, userId, fileUrl, type, mapping },
        { attempts: 1, timeout: 600000 } // 10 minute timeout for large imports
      );
      console.log(`✅ Import job queued with ID ${job.id}`);
      return job.id;
    } catch (error) {
      console.error('Failed to queue import job:', error);
    }
  },

  /**
   * Process gamification event
   */
  async processGamification(userId: string, eventType: string, data: Record<string, any>) {
    if (!gamificationQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, gamification will be processed synchronously');
      return;
    }
    try {
      await gamificationQueue.add(
        'process',
        { userId, eventType, data },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
      );
      console.log(`✅ Gamification job queued for user ${userId}, event ${eventType}`);
    } catch (error) {
      console.error('Failed to queue gamification job:', error);
    }
  },

  /**
   * Calculate percentile
   */
  async calculatePercentile(testId: string, attemptId: string) {
    if (!percentileQueue || !(await areQueuesReady())) {
      console.warn('⚠️ Queue not available, percentile will be calculated synchronously');
      return;
    }
    try {
      await percentileQueue.add(
        'calculate',
        { testId, attemptId },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
      );
      console.log(`✅ Percentile calculation job queued for attempt ${attemptId}`);
    } catch (error) {
      console.error('Failed to queue percentile calculation:', error);
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
  console.log('Closing job queues...');
  const closePromises = [];
  
  if (testScoringQueue) closePromises.push(testScoringQueue.close());
  if (reportQueue) closePromises.push(reportQueue.close());
  if (analyticsQueue) closePromises.push(analyticsQueue.close());
  if (invoiceQueue) closePromises.push(invoiceQueue.close());
  if (bulkImportQueue) closePromises.push(bulkImportQueue.close());
  if (emailQueue) closePromises.push(emailQueue.close());
  if (notificationQueue) closePromises.push(notificationQueue.close());
  if (importQueue) closePromises.push(importQueue.close());
  if (gamificationQueue) closePromises.push(gamificationQueue.close());
  if (percentileQueue) closePromises.push(percentileQueue.close());
  
  await Promise.all(closePromises);
  console.log('✅ All job queues closed');
});

export default {
  testScoringQueue,
  reportQueue,
  analyticsQueue,
  invoiceQueue,
  bulkImportQueue,
  emailQueue,
  notificationQueue,
  importQueue,
  gamificationQueue,
  percentileQueue,
  queueHelpers,
};
