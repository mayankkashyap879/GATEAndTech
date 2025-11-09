import { Worker, Job } from 'bullmq';
import { storage } from '../storage/index.js';
import type { PercentileCalculationJob } from '../queue.js';

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
 * Calculate percentile for a test attempt
 * Percentile = (number of attempts with score < current score) / (total attempts) * 100
 */
async function calculatePercentile(testId: string, attemptId: string): Promise<number> {
  // Get the current attempt
  const currentAttempt = await storage.getTestAttempt(attemptId);
  if (!currentAttempt) {
    throw new Error(`Attempt ${attemptId} not found`);
  }

  // Get all submitted attempts for this test
  const allAttempts = await storage.getTestAttemptsByTestId(testId, 'submitted');
  
  if (allAttempts.length === 0) {
    return 0; // First attempt or no other attempts
  }

  const currentScore = currentAttempt.score || 0;
  
  // Count attempts with score less than current score
  const attemptsBelow = allAttempts.filter(a => (a.score || 0) < currentScore).length;
  
  // Calculate percentile
  // Using (count below / total) * 100 formula
  // If multiple attempts have same score, we use the lower bound percentile
  const percentile = (attemptsBelow / allAttempts.length) * 100;
  
  // Round to 2 decimal places
  return Math.round(percentile * 100) / 100;
}

/**
 * Recalculate percentiles for all attempts of a test
 * This is useful when a new attempt is submitted
 */
async function recalculateAllPercentiles(testId: string): Promise<void> {
  const allAttempts = await storage.getTestAttemptsByTestId(testId, 'submitted');
  
  // Sort by score (ascending)
  const sortedAttempts = [...allAttempts].sort((a, b) => (a.score || 0) - (b.score || 0));
  
  const totalAttempts = sortedAttempts.length;
  
  // Calculate percentile for each attempt
  for (let i = 0; i < sortedAttempts.length; i++) {
    const attempt = sortedAttempts[i];
    const currentScore = attempt.score || 0;
    
    // Count how many attempts have score strictly less than current
    const attemptsBelow = sortedAttempts.filter(a => (a.score || 0) < currentScore).length;
    
    // Calculate percentile
    const percentile = totalAttempts > 0 ? (attemptsBelow / totalAttempts) * 100 : 0;
    
    // Update the attempt with new percentile
    await storage.updateTestAttempt(attempt.id, {
      percentile: Math.round(percentile * 100) / 100,
    });
  }
}

/**
 * Percentile calculation worker
 * Processes percentile calculation jobs asynchronously
 */
let percentileWorker: Worker | null = null;

if (connection) {
  percentileWorker = new Worker<PercentileCalculationJob>(
    'percentile',
    async (job: Job<PercentileCalculationJob>) => {
      const { testId, attemptId } = job.data;
      
      console.log(`🔄 Calculating percentile for attempt ${attemptId}`);
      
      try {
        // Calculate percentile for this specific attempt
        const percentile = await calculatePercentile(testId, attemptId);
        
        // Update the attempt with calculated percentile
        await storage.updateTestAttempt(attemptId, { percentile });
        
        console.log(`✅ Percentile calculated: ${percentile} for attempt ${attemptId}`);
        
        // Optionally: recalculate all percentiles to keep them accurate
        // This ensures that when a new high score comes in, previous attempts' percentiles are updated
        // Comment out if performance is a concern for tests with many attempts
        await recalculateAllPercentiles(testId);
        console.log(`✅ Recalculated all percentiles for test ${testId}`);
        
        return { percentile, attemptId };
      } catch (error) {
        console.error(`❌ Percentile calculation failed for attempt ${attemptId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5, // Process 5 jobs concurrently
      limiter: {
        max: 50, // Max 50 jobs per duration
        duration: 1000, // 1 second
      },
    }
  );

  // Event handlers
  percentileWorker.on('completed', (job) => {
    console.log(`✅ Percentile worker completed job ${job.id}`);
  });

  percentileWorker.on('failed', (job, err) => {
    console.error(`❌ Percentile worker failed job ${job?.id}:`, err.message);
  });

  percentileWorker.on('error', (err) => {
    console.error('❌ Percentile worker error:', err);
  });

  console.log('✅ Percentile calculation worker initialized');
} else {
  console.warn('⚠️ Percentile worker not initialized - Redis not available');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (percentileWorker) {
    await percentileWorker.close();
    console.log('Percentile worker closed');
  }
});

export { percentileWorker };
