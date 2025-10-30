import { Worker, Job } from 'bullmq';
import { storage } from '../storage';
import type { BulkImportJob } from '../queue';

const redisUrl = process.env.REDIS_URL;
let connection: any = undefined;

if (redisUrl) {
  const url = new URL(redisUrl);
  connection = {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

async function processBulkImport(job: Job<BulkImportJob>) {
  const { bulkImportId, records } = job.data;
  
  console.log(`Processing bulk import ${bulkImportId} with ${records.length} records`);

  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    try {
      const questionData = {
        type: record.type || 'mcq_single',
        difficulty: record.difficulty || 'medium',
        subject: record.subject,
        topic: record.topic,
        statement: record.statement,
        options: record.options ? JSON.parse(record.options) : null,
        correctAnswer: record.correctAnswer,
        explanation: record.explanation || '',
        marks: parseFloat(record.marks) || 1,
        negativeMarks: parseFloat(record.negativeMarks) || 0,
        isPublished: record.isPublished === 'true' || record.isPublished === true,
      };

      const question = await storage.createQuestion(questionData as any);
      
      if (record.topicId) {
        await storage.addQuestionTopic(question.id, record.topicId);
      }

      successCount++;
      
      await storage.updateBulkImportProgress(bulkImportId, i + 1, successCount, errorCount);
      
      await job.updateProgress((i + 1) / records.length * 100);
    } catch (error: any) {
      errorCount++;
      errors.push({
        row: i + 1,
        data: record,
        error: error.message,
      });
      
      await storage.updateBulkImportProgress(bulkImportId, i + 1, successCount, errorCount);
    }
  }

  if (errorCount > 0) {
    await storage.completeBulkImport(bulkImportId, errors);
  } else {
    await storage.completeBulkImport(bulkImportId);
  }

  console.log(`Bulk import ${bulkImportId} completed: ${successCount} success, ${errorCount} errors`);
  
  return {
    bulkImportId,
    successCount,
    errorCount,
    errors,
  };
}

if (connection) {
  const worker = new Worker<BulkImportJob>('bulk-import', processBulkImport, {
    connection,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 1000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ Bulk import job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Bulk import job ${job?.id} failed:`, err);
  });

  console.log('Bulk import worker started');
} else {
  console.log('⚠️ Bulk import worker not started (Redis not available)');
}
