import { db } from '../db';
import { subjects, topics } from '@/shared/schema';
import { sql } from 'drizzle-orm';

const GATE_SUBJECTS = [
  { name: 'Discrete Mathematics', slug: 'discrete-mathematics', description: 'Set Theory, Logic, Combinatorics, Graph Theory', displayOrder: 1 },
  { name: 'Engineering Mathematics', slug: 'engineering-mathematics', description: 'Linear Algebra, Calculus, Probability, Statistics', displayOrder: 2 },
  { name: 'C Programming', slug: 'c-programming', description: 'Programming Basics, Arrays, Pointers, Structures', displayOrder: 3 },
  { name: 'Data Structures', slug: 'data-structures', description: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs', displayOrder: 4 },
  { name: 'Algorithms', slug: 'algorithms', description: 'Sorting, Searching, Greedy, Dynamic Programming, Graph Algorithms', displayOrder: 5 },
  { name: 'Theory of Computation', slug: 'theory-of-computation', description: 'Automata, Regular Languages, Context-Free Grammars, Turing Machines', displayOrder: 6 },
  { name: 'Compiler Design', slug: 'compiler-design', description: 'Lexical Analysis, Parsing, Code Generation, Optimization', displayOrder: 7 },
  { name: 'Digital Logic', slug: 'digital-logic', description: 'Boolean Algebra, Logic Gates, Combinational & Sequential Circuits', displayOrder: 8 },
  { name: 'Computer Organisation and Architecture', slug: 'computer-organisation-architecture', description: 'Memory Hierarchy, CPU, Pipelining, I/O Systems', displayOrder: 9 },
  { name: 'Computer Networks', slug: 'computer-networks', description: 'OSI Model, TCP/IP, Routing, Network Security', displayOrder: 10 },
  { name: 'Operating System', slug: 'operating-system', description: 'Process Management, Memory Management, File Systems, Scheduling', displayOrder: 11 },
  { name: 'Database Management System', slug: 'database-management-system', description: 'SQL, Normalization, Transactions, Indexing, Query Optimization', displayOrder: 12 },
];

export async function migrateSubjects() {
  console.log('Starting subjects migration...');

  try {
    // Step 1: Create subjects table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ Subjects table created');

    // Step 2: Create index on display_order
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS subjects_display_order_idx ON subjects(display_order)
    `);
    console.log('✓ Index created on subjects.display_order');

    // Step 3: Insert GATE subjects
    for (const subject of GATE_SUBJECTS) {
      await db.execute(sql`
        INSERT INTO subjects (name, slug, description, display_order)
        VALUES (${subject.name}, ${subject.slug}, ${subject.description}, ${subject.displayOrder})
        ON CONFLICT (name) DO NOTHING
      `);
    }
    console.log('✓ GATE subjects inserted');

    // Step 4: Add subject_id column to topics if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'topics' AND column_name = 'subject_id'
        ) THEN
          ALTER TABLE topics ADD COLUMN subject_id VARCHAR;
        END IF;
      END $$;
    `);
    console.log('✓ subject_id column added to topics');

    // Step 5: Add foreign key constraint
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'topics_subject_id_subjects_id_fk'
        ) THEN
          ALTER TABLE topics 
          ADD CONSTRAINT topics_subject_id_subjects_id_fk 
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    console.log('✓ Foreign key constraint added');

    // Step 6: Create index on subject_id
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS topics_subject_idx ON topics(subject_id)
    `);
    console.log('✓ Index created on topics.subject_id');

    // Step 7: Migrate existing data if old 'subject' column exists
    const hasOldColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' AND column_name = 'subject'
      )
    `);

    if (hasOldColumn.rows[0]?.exists) {
      console.log('Old subject column found, migrating data...');
      
      // Get all existing topics with subject values
      const existingTopics = await db.execute(sql`
        SELECT id, subject FROM topics WHERE subject IS NOT NULL AND subject_id IS NULL
      `);

      // For each topic, try to match to a subject or create a default
      for (const topic of existingTopics.rows) {
        // Try to find matching subject
        const matchingSubject = await db.execute(sql`
          SELECT id FROM subjects 
          WHERE LOWER(name) = LOWER(${topic.subject})
          LIMIT 1
        `);

        if (matchingSubject.rows.length > 0) {
          await db.execute(sql`
            UPDATE topics 
            SET subject_id = ${matchingSubject.rows[0].id} 
            WHERE id = ${topic.id}
          `);
        } else {
          // Use first subject as default
          const firstSubject = await db.execute(sql`
            SELECT id FROM subjects ORDER BY display_order LIMIT 1
          `);
          if (firstSubject.rows.length > 0) {
            await db.execute(sql`
              UPDATE topics 
              SET subject_id = ${firstSubject.rows[0].id} 
              WHERE id = ${topic.id}
            `);
          }
        }
      }

      // Drop old subject column
      await db.execute(sql`
        ALTER TABLE topics DROP COLUMN IF EXISTS subject
      `);
      console.log('✓ Old subject column dropped');
    }

    // Step 8: Make subject_id NOT NULL after migration
    await db.execute(sql`
      DO $$
      BEGIN
        ALTER TABLE topics ALTER COLUMN subject_id SET NOT NULL;
      EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'Could not set subject_id to NOT NULL - there may be null values';
      END $$;
    `);
    console.log('✓ subject_id set to NOT NULL');

    // Step 9: Create unique constraint on slug+subject_id
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'topics_slug_subject_id_unique'
        ) THEN
          ALTER TABLE topics ADD CONSTRAINT topics_slug_subject_id_unique UNIQUE (slug, subject_id);
        END IF;
      END $$;
    `);
    console.log('✓ Unique constraint created on topics(slug, subject_id)');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run immediately
migrateSubjects()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
