/**
 * Sync legacy Quiz camelCase columns into snake_case without dropping data.
 * Run: npx tsx scripts/sync-quiz-legacy-columns.ts
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  // Copy quizType → quiz_type when snake_case is empty/default and camelCase has a value
  const quizTypeUpdated = await prisma.$executeRawUnsafe(`
    UPDATE "Quiz"
    SET quiz_type = UPPER(TRIM("quizType"))
    WHERE "quizType" IS NOT NULL
      AND TRIM("quizType") <> ''
      AND (
        quiz_type IS NULL
        OR TRIM(quiz_type) = ''
        OR UPPER(TRIM(quiz_type)) <> UPPER(TRIM("quizType"))
      )
  `);

  // Copy parentQuizId → parent_quiz_id when snake_case is null
  const parentUpdated = await prisma.$executeRawUnsafe(`
    UPDATE "Quiz"
    SET parent_quiz_id = "parentQuizId"
    WHERE parent_quiz_id IS NULL
      AND "parentQuizId" IS NOT NULL
      AND TRIM("parentQuizId") <> ''
  `);

  // Keep camelCase in sync the other way so both stay consistent
  await prisma.$executeRawUnsafe(`
    UPDATE "Quiz"
    SET "quizType" = UPPER(TRIM(quiz_type))
    WHERE quiz_type IS NOT NULL
      AND TRIM(quiz_type) <> ''
      AND (
        "quizType" IS NULL
        OR TRIM("quizType") = ''
        OR UPPER(TRIM("quizType")) <> UPPER(TRIM(quiz_type))
      )
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Quiz"
    SET "parentQuizId" = parent_quiz_id
    WHERE "parentQuizId" IS NULL
      AND parent_quiz_id IS NOT NULL
      AND TRIM(parent_quiz_id) <> ''
  `);

  console.log(`Synced quiz_type from quizType (rows touched: ${quizTypeUpdated})`);
  console.log(`Synced parent_quiz_id from parentQuizId (rows touched: ${parentUpdated})`);
  console.log("Legacy columns kept — safe to run: npx prisma db push");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
