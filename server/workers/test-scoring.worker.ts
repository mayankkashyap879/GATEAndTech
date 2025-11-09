import { Worker, Job } from 'bullmq';
import { storage } from '../storage/index.js';
import type { TestScoringJob } from '../queue.js';

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
 * Calculate test score from responses with section-wise statistics
 */
async function calculateTestScore(attemptId: string, testId: string): Promise<{ 
  score: number; 
  maxScore: number;
  summary: any;
}> {
  // Get test and questions
  const test = await storage.getTest(testId);
  const questions = await storage.getTestQuestions(testId);
  const responses = await storage.getTestAttemptResponses(attemptId);
  const sections = await storage.getTestSections(testId);
  
  if (!test) {
    throw new Error(`Test ${testId} not found`);
  }

  // Track overall and per-section statistics
  let totalScore = 0;
  const sectionStats: Record<number, {
    sectionId: number;
    sectionName: string;
    answered: number;
    notAnswered: number;
    marked: number;
    visited: number;
    timeSpent: number;
    score: number;
    totalQuestions: number;
  }> = {};

  // Initialize section stats
  for (const section of sections) {
    sectionStats[section.id] = {
      sectionId: section.id,
      sectionName: section.name,
      answered: 0,
      notAnswered: 0,
      marked: 0,
      visited: 0,
      timeSpent: 0,
      score: 0,
      totalQuestions: 0,
    };
  }

  // Count total questions per section
  for (const question of questions) {
    if (question.sectionId && sectionStats[question.sectionId]) {
      sectionStats[question.sectionId].totalQuestions++;
    }
  }

  // Overall stats
  let overallAnswered = 0;
  let overallNotAnswered = 0;
  let overallMarked = 0;
  let overallVisited = 0;
  let overallTimeSpent = 0;

  // Calculate score and statistics
  for (const response of responses) {
    const question = questions.find(q => q.id === response.questionId);
    if (!question) continue;
    
    let isCorrect = false;
    let marksAwarded = 0;
    const hasAnswer = response.selectedAnswer && response.selectedAnswer.trim() !== "";
    
    // Update overall stats
    if (hasAnswer) overallAnswered++;
    if (response.isVisited && !hasAnswer) overallNotAnswered++;
    if (response.isMarkedForReview) overallMarked++;
    if (response.isVisited) overallVisited++;
    overallTimeSpent += response.timeSpentSeconds || 0;

    // Update section stats
    if (question.sectionId && sectionStats[question.sectionId]) {
      const secStat = sectionStats[question.sectionId];
      if (hasAnswer) secStat.answered++;
      if (response.isVisited && !hasAnswer) secStat.notAnswered++;
      if (response.isMarkedForReview) secStat.marked++;
      if (response.isVisited) secStat.visited++;
      secStat.timeSpent += response.timeSpentSeconds || 0;
    }
    
    // Skip scoring if answer is empty/cleared (unanswered)
    if (!hasAnswer) {
      await storage.updateTestResponse(response.id, {
        isCorrect: false,
        marksAwarded: 0,
      });
      continue;
    }
    
    if (question.type === "numerical") {
      isCorrect = response.selectedAnswer === question.correctAnswer;
      marksAwarded = isCorrect ? question.marks : -question.negativeMarks;
    } else if (question.type === "mcq_single") {
      const correctOption = (question.options as any)?.find((opt: any) => opt.isCorrect);
      isCorrect = response.selectedAnswer === correctOption?.id;
      marksAwarded = isCorrect ? question.marks : -question.negativeMarks;
    } else if (question.type === "mcq_multiple") {
      const correctOptions = (question.options as any)?.filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id).sort().join(",");
      const selectedOptions = response.selectedAnswer?.split(",").filter(Boolean).sort().join(",");
      isCorrect = selectedOptions === correctOptions;
      marksAwarded = isCorrect ? question.marks : -question.negativeMarks;
    }
    
    // Update response with correctness and marks
    await storage.updateTestResponse(response.id, {
      isCorrect,
      marksAwarded,
    });
    
    totalScore += marksAwarded;

    // Update section score
    if (question.sectionId && sectionStats[question.sectionId]) {
      sectionStats[question.sectionId].score += marksAwarded;
    }
  }

  // Build summary object
  const summary = {
    overall: {
      answered: overallAnswered,
      notAnswered: overallNotAnswered,
      marked: overallMarked,
      visited: overallVisited,
      timeSpent: overallTimeSpent,
      totalQuestions: questions.length,
    },
    sections: Object.values(sectionStats),
  };
  
  return {
    score: totalScore,
    maxScore: test.totalMarks || 0,
    summary,
  };
}

/**
 * Test scoring worker
 * Processes test submissions asynchronously
 */
let testScoringWorker: Worker | null = null;

if (connection) {
  testScoringWorker = new Worker<TestScoringJob>(
    'test-scoring',
    async (job: Job<TestScoringJob>) => {
      const { attemptId, userId, testId } = job.data;
      
      console.log(`🔄 Processing test scoring for attempt ${attemptId}`);
      
      try {
        // Calculate score with section-wise statistics
        const { score, maxScore, summary } = await calculateTestScore(attemptId, testId);
        
        // Update attempt with score, status, and summary
        await storage.updateTestAttempt(attemptId, {
          score,
          maxScore,
          status: "submitted",
          summary,
        });
        
        console.log(`✅ Test scored: ${score}/${maxScore} for attempt ${attemptId}`);
        
        // Trigger analytics update and percentile calculation jobs
        const { queueHelpers } = await import('../queue.js');
        await queueHelpers.updateAnalytics(userId, testId);
        await queueHelpers.calculatePercentile(testId, attemptId);
        
        return { score, maxScore, attemptId, summary };
      } catch (error) {
        console.error(`❌ Test scoring failed for attempt ${attemptId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 10, // Process 10 jobs concurrently
      limiter: {
        max: 100, // Max 100 jobs per duration
        duration: 1000, // 1 second
      },
    }
  );

  // Event handlers
  testScoringWorker.on('completed', (job) => {
    console.log(`✅ Test scoring worker completed job ${job.id}`);
  });

  testScoringWorker.on('failed', (job, err) => {
    console.error(`❌ Test scoring worker failed job ${job?.id}:`, err.message);
  });

  testScoringWorker.on('error', (err) => {
    console.error('❌ Test scoring worker error:', err);
  });

  console.log('✅ Test scoring worker initialized');
} else {
  console.warn('⚠️ Test scoring worker not initialized - Redis not available');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (testScoringWorker) {
    await testScoringWorker.close();
    console.log('Test scoring worker closed');
  }
});

export { testScoringWorker };
