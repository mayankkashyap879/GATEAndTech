import { Worker, Job } from 'bullmq';
import { storage } from '../storage/index.js';
import { cache } from '../redis.js';
import type { AnalyticsUpdateJob } from '../queue.js';

// Redis connection from environment
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

/**
 * Calculate percentile for a user's score
 */
async function calculatePercentile(testId: string, score: number): Promise<number> {
  // Get all submitted attempts for this test
  const allAttempts = await storage.getTestAttemptsByTestId(testId, 'submitted');
  
  if (allAttempts.length === 0) return 0;
  
  // Count how many attempts scored less than this score
  const scoresBelow = allAttempts.filter(a => (a.score || 0) < score).length;
  
  // Calculate percentile
  const percentile = Math.round((scoresBelow / allAttempts.length) * 100);
  
  return percentile;
}

/**
 * Update cached analytics for a test
 */
async function updateTestAnalyticsCache(testId: string): Promise<void> {
  const allAttempts = await storage.getTestAttemptsByTestId(testId, 'submitted');
  
  if (allAttempts.length === 0) return;
  
  // Calculate aggregate stats
  const scores = allAttempts.map(a => a.score || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  // Cache test analytics
  await cache.set(`analytics:test:${testId}`, {
    totalAttempts: allAttempts.length,
    avgScore,
    maxScore,
    minScore,
    updatedAt: new Date().toISOString(),
  }, 300); // Cache for 5 minutes
  
  console.log(`✅ Updated analytics cache for test ${testId}`);
}

/**
 * Analytics worker
 * Updates percentiles and aggregates analytics
 */
let analyticsWorker: Worker | null = null;

if (connection) {
  analyticsWorker = new Worker<AnalyticsUpdateJob>(
    'analytics-update',
    async (job: Job<AnalyticsUpdateJob>) => {
      const { userId, testId } = job.data;
      
      console.log(`🔄 Updating analytics for user ${userId}, test ${testId}`);
      
      try {
        // Get all user's attempts for this test, then filter for submitted ones
        const allUserAttempts = await storage.getUserTestAttempts(userId, 100);
        const userAttempts = allUserAttempts.filter(a => 
          a.testId === testId && a.status === 'submitted'
        );
        
        if (userAttempts.length === 0) {
          console.warn(`No submitted attempts found for user ${userId}, test ${testId}`);
          return;
        }
        
        const latestAttempt = userAttempts.sort((a, b) => 
          new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
        )[0];
        
        // Calculate percentile
        const percentile = await calculatePercentile(testId, latestAttempt.score || 0);
        
        // Update attempt with percentile
        await storage.updateTestAttempt(latestAttempt.id, {
          percentile,
        });
        
        // Update test-level analytics cache
        await updateTestAnalyticsCache(testId);
        
        // Cache user's percentile
        await cache.set(
          `percentile:${userId}:${testId}`,
          percentile,
          300 // 5 minutes
        );
        
        console.log(`✅ Analytics updated: ${percentile}th percentile for user ${userId}`);
        
        return { percentile, userId, testId };
      } catch (error) {
        console.error(`❌ Analytics update failed for user ${userId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 50,
        duration: 1000,
      },
    }
  );

  // Event handlers
  analyticsWorker.on('completed', (job) => {
    console.log(`✅ Analytics worker completed job ${job.id}`);
  });

  analyticsWorker.on('failed', (job, err) => {
    console.error(`❌ Analytics worker failed job ${job?.id}:`, err.message);
  });

  analyticsWorker.on('error', (err) => {
    console.error('❌ Analytics worker error:', err);
  });

  console.log('✅ Analytics worker initialized');
} else {
  console.warn('⚠️ Analytics worker not initialized - Redis not available');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (analyticsWorker) {
    await analyticsWorker.close();
    console.log('Analytics worker closed');
  }
});

export { analyticsWorker };
