/**
 * Mock Data Seeder for GATE And Tech
 * Creates realistic test data for development and testing
 * 
 * Run with: npx tsx server/seed-mock-data.ts
 */

import { db } from './db';
import { 
  users, 
  tests, 
  testSections,
  questions,
  questionTopics,
  testQuestions, 
  testAttempts, 
  testResponses,
  subjects,
  topics
} from '../shared/schema';
import bcrypt from 'bcrypt';

const PASSWORD = 'password123'; // Same password for all test users

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  // Clear in reverse order of dependencies
  await db.delete(testResponses);
  await db.delete(testAttempts);
  await db.delete(testQuestions);
  await db.delete(testSections);
  await db.delete(tests);
  await db.delete(questions);
  await db.delete(topics);
  await db.delete(subjects);
  await db.delete(users);
  
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  
  const testUsers = [
    {
      name: 'Admin User',
      email: 'admin@gate.com',
      passwordHash: hashedPassword,
      role: 'admin' as const,
      emailVerified: new Date(),
    },
    {
      name: 'Rajesh Kumar',
      email: 'student1@gate.com',
      passwordHash: hashedPassword,
      role: 'student' as const,
      emailVerified: new Date(),
    },
    {
      name: 'Priya Sharma',
      email: 'student2@gate.com',
      passwordHash: hashedPassword,
      role: 'student' as const,
      emailVerified: new Date(),
    },
    {
      name: 'Amit Singh',
      email: 'student3@gate.com',
      passwordHash: hashedPassword,
      role: 'student' as const,
      emailVerified: new Date(),
    },
    {
      name: 'Content Moderator',
      email: 'moderator@gate.com',
      passwordHash: hashedPassword,
      role: 'moderator' as const,
      emailVerified: new Date(),
    },
  ];
  
  const createdUsers = await db.insert(users).values(testUsers).returning();
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

async function seedSubjectsAndTopics() {
  console.log('📚 Seeding subjects and topics...');
  
  const subjectData = [
    { 
      name: 'Mathematics', 
      description: 'Mathematical foundations for Computer Science',
      topics: ['Linear Algebra', 'Calculus', 'Probability', 'Discrete Mathematics']
    },
    { 
      name: 'Data Structures', 
      description: 'Fundamental data structures and algorithms',
      topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Hashing']
    },
    { 
      name: 'Algorithms', 
      description: 'Algorithm design and analysis',
      topics: ['Sorting', 'Searching', 'Dynamic Programming', 'Greedy Algorithms']
    },
    { 
      name: 'Operating Systems', 
      description: 'OS concepts and implementations',
      topics: ['Processes', 'Threads', 'Memory Management', 'File Systems']
    },
    { 
      name: 'Computer Networks', 
      description: 'Network protocols and architecture',
      topics: ['OSI Model', 'TCP/IP', 'Routing', 'Network Security']
    },
  ];
  
  const allTopics = [];
  
  for (const subject of subjectData) {
    const [createdSubject] = await db.insert(subjects).values({
      name: subject.name,
      slug: slugify(subject.name),
      description: subject.description,
    }).returning();
    
    for (const topicName of subject.topics) {
      const [createdTopic] = await db.insert(topics).values({
        name: topicName,
        slug: slugify(topicName),
        subjectId: createdSubject.id,
      }).returning();
      allTopics.push(createdTopic);
    }
  }
  
  console.log(`✅ Created ${subjectData.length} subjects and ${allTopics.length} topics`);
  return allTopics;
}

async function seedQuestions(allTopics: any[], userId: string) {
  console.log('❓ Seeding questions...');
  
  const questionTemplates = [
    // Mathematics
    { topic: 'Linear Algebra', content: 'Find the eigenvalues of the matrix [[2,1],[1,2]]', type: 'mcq_single' as const, marks: 2, negativeMarks: 0.66, difficulty: 'medium' as const, correctAnswer: 'A', options: [
      { id: 'A', text: '1 and 3', isCorrect: true },
      { id: 'B', text: '2 and 2', isCorrect: false },
      { id: 'C', text: '0 and 4', isCorrect: false },
      { id: 'D', text: '1 and 2', isCorrect: false },
    ]},
    { topic: 'Calculus', content: 'What is the derivative of x² + 3x + 2?', type: 'mcq_single' as const, marks: 1, negativeMarks: 0.33, difficulty: 'easy' as const, correctAnswer: 'B', options: [
      { id: 'A', text: 'x + 3', isCorrect: false },
      { id: 'B', text: '2x + 3', isCorrect: true },
      { id: 'C', text: '2x + 2', isCorrect: false },
      { id: 'D', text: 'x² + 3', isCorrect: false },
    ]},
    { topic: 'Probability', content: 'A fair die is rolled. What is the probability of getting an even number?', type: 'numerical' as const, marks: 1, negativeMarks: 0.33, difficulty: 'easy' as const, correctAnswer: '0.5' },
    
    // Data Structures
    { topic: 'Trees', content: 'What is the maximum number of nodes in a binary tree of height h?', type: 'numerical' as const, marks: 2, negativeMarks: 0.66, difficulty: 'medium' as const, correctAnswer: '2^(h+1)-1' },
    { topic: 'Arrays', content: 'What is the time complexity of accessing an element in an array by index?', type: 'mcq_single' as const, marks: 1, negativeMarks: 0.33, difficulty: 'easy' as const, correctAnswer: 'A', options: [
      { id: 'A', text: 'O(1)', isCorrect: true },
      { id: 'B', text: 'O(n)', isCorrect: false },
      { id: 'C', text: 'O(log n)', isCorrect: false },
      { id: 'D', text: 'O(n²)', isCorrect: false },
    ]},
    { topic: 'Linked Lists', content: 'Which operations are efficient in a doubly linked list?', type: 'mcq_multiple' as const, marks: 2, negativeMarks: 0.66, difficulty: 'medium' as const, correctAnswer: 'A,B,C', options: [
      { id: 'A', text: 'Insertion at beginning', isCorrect: true },
      { id: 'B', text: 'Insertion at end', isCorrect: true },
      { id: 'C', text: 'Deletion at end', isCorrect: true },
      { id: 'D', text: 'Random access', isCorrect: false },
    ]},
    { topic: 'Graphs', content: 'In a directed acyclic graph (DAG), which algorithm can be used for topological sorting?', type: 'mcq_single' as const, marks: 2, negativeMarks: 0.66, difficulty: 'hard' as const, correctAnswer: 'C', options: [
      { id: 'A', text: 'Dijkstra\'s algorithm', isCorrect: false },
      { id: 'B', text: 'Bellman-Ford algorithm', isCorrect: false },
      { id: 'C', text: 'DFS-based algorithm', isCorrect: true },
      { id: 'D', text: 'Floyd-Warshall algorithm', isCorrect: false },
    ]},
    
    // Algorithms
    { topic: 'Sorting', content: 'What is the worst-case time complexity of QuickSort?', type: 'mcq_single' as const, marks: 2, negativeMarks: 0.66, difficulty: 'medium' as const, correctAnswer: 'C', options: [
      { id: 'A', text: 'O(n log n)', isCorrect: false },
      { id: 'B', text: 'O(n)', isCorrect: false },
      { id: 'C', text: 'O(n²)', isCorrect: true },
      { id: 'D', text: 'O(log n)', isCorrect: false },
    ]},
    { topic: 'Dynamic Programming', content: 'Which problem can be solved using dynamic programming?', type: 'mcq_multiple' as const, marks: 2, negativeMarks: 0.66, difficulty: 'medium' as const, correctAnswer: 'A,B,C', options: [
      { id: 'A', text: 'Longest Common Subsequence', isCorrect: true },
      { id: 'B', text: 'Knapsack Problem', isCorrect: true },
      { id: 'C', text: 'Matrix Chain Multiplication', isCorrect: true },
      { id: 'D', text: 'Binary Search', isCorrect: false },
    ]},
    
    // Operating Systems
    { topic: 'Processes', content: 'What is the difference between a process and a thread?', type: 'mcq_single' as const, marks: 2, negativeMarks: 0.66, difficulty: 'medium' as const, correctAnswer: 'B', options: [
      { id: 'A', text: 'No difference', isCorrect: false },
      { id: 'B', text: 'Threads share memory, processes don\'t', isCorrect: true },
      { id: 'C', text: 'Processes are faster', isCorrect: false },
      { id: 'D', text: 'Threads cannot be scheduled', isCorrect: false },
    ]},
    { topic: 'Memory Management', content: 'In paging, if page size is 4KB and logical address space is 64KB, how many pages are there?', type: 'numerical' as const, marks: 1, negativeMarks: 0.33, difficulty: 'easy' as const, correctAnswer: '16' },
    
    // Computer Networks
    { topic: 'TCP/IP', content: 'Which layer of the OSI model does TCP operate at?', type: 'mcq_single' as const, marks: 1, negativeMarks: 0.33, difficulty: 'easy' as const, correctAnswer: 'D', options: [
      { id: 'A', text: 'Application Layer', isCorrect: false },
      { id: 'B', text: 'Network Layer', isCorrect: false },
      { id: 'C', text: 'Data Link Layer', isCorrect: false },
      { id: 'D', text: 'Transport Layer', isCorrect: true },
    ]},
  ];
  
  const createdQuestions = [];
  
  for (const template of questionTemplates) {
    const topic = allTopics.find(t => t.name === template.topic);
    if (!topic) continue;
    
    const [question] = await db.insert(questions).values({
      content: template.content,
      type: template.type,
      marks: template.marks,
      negativeMarks: template.negativeMarks.toString(),
      difficulty: template.difficulty,
      createdBy: userId,
      correctAnswer: template.type === 'numerical' ? template.correctAnswer : undefined,
      options: template.type !== 'numerical' ? template.options : undefined,
      explanation: `This tests your understanding of ${template.topic}.`,
      isPublished: true,
    }).returning();
    
    // Link question to topic
    await db.insert(questionTopics).values({
      questionId: question.id,
      topicId: topic.id,
    });
    
    createdQuestions.push(question);
  }
  
  console.log(`✅ Created ${createdQuestions.length} questions`);
  return createdQuestions;
}

async function seedTests(createdQuestions: any[], userId: string) {
  console.log('📝 Seeding tests...');
  
  // Test 1: Full GATE Mock Test (with sections)
  const [test1] = await db.insert(tests).values({
    title: 'GATE 2024 Mock Test - Computer Science',
    description: 'Complete mock test covering all CS topics with sectional timing',
    duration: 180, // 3 hours
    totalMarks: 100,
    allowCalculator: true,
    showSolutionsAfterSubmit: true,
    status: 'published' as const,
    isPro: false,
    createdBy: userId,
  }).returning();
  
  // Create sections for test1
  const [section1] = await db.insert(testSections).values({
    testId: test1.id,
    name: 'Mathematics',
    orderIndex: 1,
    durationSeconds: 3600, // 1 hour
  }).returning();
  
  const [section2] = await db.insert(testSections).values({
    testId: test1.id,
    name: 'Data Structures & Algorithms',
    orderIndex: 2,
    durationSeconds: 3600,
  }).returning();
  
  const [section3] = await db.insert(testSections).values({
    testId: test1.id,
    name: 'Operating Systems & Networks',
    orderIndex: 3,
    durationSeconds: 3600,
  }).returning();
  
  // Assign questions to sections
  let orderIndex = 1;
  for (const question of createdQuestions) {
    let sectionId = null;
    if (['Linear Algebra', 'Calculus', 'Probability'].includes(question.topicId)) {
      sectionId = section1.id;
    } else if (['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting', 'Dynamic Programming'].includes(question.topicId)) {
      sectionId = section2.id;
    } else {
      sectionId = section3.id;
    }
    
    await db.insert(testQuestions).values({
      testId: test1.id,
      questionId: question.id,
      sectionId,
      orderIndex: orderIndex++,
    });
  }
  
  // Test 2: Quick Practice Test (no sections)
  const [test2] = await db.insert(tests).values({
    title: 'Data Structures Quick Test',
    description: 'Quick 30-minute test on basic data structures',
    duration: 30,
    totalMarks: 20,
    allowCalculator: false,
    showSolutionsAfterSubmit: true,
    status: 'published' as const,
    isPro: false,
    createdBy: userId,
  }).returning();
  
  // Add first 5 DS questions to test2
  orderIndex = 1;
  for (const question of createdQuestions.slice(3, 8)) {
    await db.insert(testQuestions).values({
      testId: test2.id,
      questionId: question.id,
      orderIndex: orderIndex++,
    });
  }
  
  console.log(`✅ Created 2 tests with sections`);
  return [test1, test2];
}

async function seedTestAttempts(allTests: any[], allQuestions: any[], allUsers: any[]) {
  console.log('🎯 Seeding test attempts with realistic data...');
  
  const students = allUsers.filter(u => u.role === 'student');
  const [test1, test2] = allTests;
  
  // Get questions for each test
  const test1Questions = await db.query.testQuestions.findMany({
    where: (tq, { eq }) => eq(tq.testId, test1.id),
    with: { question: true },
  });
  
  const test2Questions = await db.query.testQuestions.findMany({
    where: (tq, { eq }) => eq(tq.testId, test2.id),
    with: { question: true },
  });
  
  // Create multiple attempts for each student with varying scores
  for (const student of students) {
    // Test 1 attempts (varying performance)
    const scores = [45, 62, 58, 71]; // Progressive improvement
    
    for (let i = 0; i < scores.length; i++) {
      const targetScore = scores[i];
      const timeTaken = 9000 + Math.random() * 1800; // 2.5-3 hours
      
      const [attempt] = await db.insert(testAttempts).values({
        testId: test1.id,
        userId: student.id,
        status: 'submitted' as const,
        score: targetScore,
        maxScore: test1.totalMarks,
        timeTaken: Math.floor(timeTaken),
        startedAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000), // Weeks ago
        submittedAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000 + timeTaken * 1000),
        sectionState: null,
        summary: {
          overall: {
            answered: Math.floor(test1Questions.length * 0.9),
            notAnswered: Math.ceil(test1Questions.length * 0.1),
            marked: Math.floor(test1Questions.length * 0.15),
            visited: test1Questions.length,
            timeSpent: Math.floor(timeTaken),
            totalQuestions: test1Questions.length,
          },
          sections: [],
        },
      }).returning();
      
      // Create responses
      let currentScore = 0;
      for (const tq of test1Questions) {
        const question = tq.question;
        const shouldAnswer = Math.random() > 0.1; // 90% answer rate
        const isCorrect = shouldAnswer && (currentScore + question.marks <= targetScore);
        
        await db.insert(testResponses).values({
          attemptId: attempt.id,
          questionId: question.id,
          selectedAnswer: shouldAnswer ? (isCorrect ? question.correctAnswer || 'A' : 'B') : '',
          isCorrect: shouldAnswer ? isCorrect : false,
          isMarkedForReview: Math.random() > 0.85,
          isVisited: true,
          timeSpentSeconds: Math.floor(30 + Math.random() * 120),
          marksAwarded: shouldAnswer ? (isCorrect ? question.marks : -question.negativeMarks) : 0,
          lastSavedAt: new Date(),
        });
        
        if (shouldAnswer && isCorrect) {
          currentScore += question.marks;
        }
      }
    }
    
    // Test 2 attempt
    const score2 = 12 + Math.floor(Math.random() * 6); // 12-18 out of 20
    const [attempt2] = await db.insert(testAttempts).values({
      testId: test2.id,
      userId: student.id,
      status: 'submitted' as const,
      score: score2,
      maxScore: test2.totalMarks,
      timeTaken: Math.floor(1200 + Math.random() * 600),
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1500 * 1000),
    }).returning();
    
    // Create responses for test 2
    let currentScore2 = 0;
    for (const tq of test2Questions) {
      const question = tq.question;
      const shouldAnswer = Math.random() > 0.05;
      const isCorrect = shouldAnswer && (currentScore2 + question.marks <= score2);
      
      await db.insert(testResponses).values({
        attemptId: attempt2.id,
        questionId: question.id,
        selectedAnswer: shouldAnswer ? (isCorrect ? question.correctAnswer || 'A' : 'B') : '',
        isCorrect: shouldAnswer ? isCorrect : false,
        isMarkedForReview: Math.random() > 0.9,
        isVisited: true,
        timeSpentSeconds: Math.floor(60 + Math.random() * 120),
        marksAwarded: shouldAnswer ? (isCorrect ? question.marks : -question.negativeMarks) : 0,
        lastSavedAt: new Date(),
      });
      
      if (shouldAnswer && isCorrect) {
        currentScore2 += question.marks;
      }
    }
  }
  
  console.log(`✅ Created test attempts for ${students.length} students`);
}

async function main() {
  try {
    console.log('🚀 Starting mock data seeding...\n');
    
    await clearDatabase();
    
    const allUsers = await seedUsers();
    const admin = allUsers.find(u => u.role === 'admin')!;
    
    const allTopics = await seedSubjectsAndTopics();
    const allQuestions = await seedQuestions(allTopics, admin.id);
    const allTests = await seedTests(allQuestions, admin.id);
    
    await seedTestAttempts(allTests, allQuestions, allUsers);
    
    console.log('\n✅ Mock data seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@gate.com / password123');
    console.log('   Student 1: student1@gate.com / password123');
    console.log('   Student 2: student2@gate.com / password123');
    console.log('   Student 3: student3@gate.com / password123');
    console.log('   Moderator: moderator@gate.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    process.exit(1);
  }
}

main();
