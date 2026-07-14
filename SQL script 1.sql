-- ============================================================
-- Quiz Portal - Synapse Serverless SQL setup script (safe to re-run)
-- Run this against the "Built-in" serverless SQL pool.
-- Assumes quizportal_db already exists.
-- Each batch is separated by GO (required - CREATE VIEW must be
-- the first statement in its batch in this environment).
-- ============================================================

USE quizportal_db;
GO

CREATE OR ALTER VIEW dbo.vw_quiz_performance AS
SELECT *
FROM OPENROWSET(
    BULK 'https://stgquizdata.dfs.core.windows.net/curated/quiz_performance/**',
    FORMAT = 'PARQUET'
) AS result;
GO

CREATE OR ALTER VIEW dbo.vw_question_difficulty AS
SELECT *
FROM OPENROWSET(
    BULK 'https://stgquizdata.dfs.core.windows.net/curated/question_difficulty/**',
    FORMAT = 'PARQUET'
) AS result;
GO

CREATE OR ALTER VIEW dbo.vw_summary_metrics AS
SELECT *
FROM OPENROWSET(
    BULK 'https://stgquizdata.dfs.core.windows.net/curated/summary_metrics/**',
    FORMAT = 'PARQUET'
) AS result;
GO

USE quizportal_db;
GO

SELECT 'quiz_performance' AS source_view, COUNT(*) AS row_count FROM dbo.vw_quiz_performance
UNION ALL
SELECT 'question_difficulty', COUNT(*) FROM dbo.vw_question_difficulty
UNION ALL
SELECT 'summary_metrics', COUNT(*) FROM dbo.vw_summary_metrics;
GO