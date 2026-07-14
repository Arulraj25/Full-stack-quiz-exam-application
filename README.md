# Quiz Portal with End-to-End Data Engineering Pipeline

A production-style full-stack **Quiz Portal** built with React, Node.js, Express, and MySQL, containerized using Docker, automatically deployed to **AWS EC2** using **GitHub Actions**, and integrated with a modern **Azure Data Engineering pipeline** for analytics.

The application serves as the operational (OLTP) system, while Azure services continuously ingest, transform, and expose analytical datasets through Synapse SQL views.

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │         GitHub Repo          │
                    └───────────────┬──────────────┘
                                    │
                           Push / Merge to Main
                                    │
                                    ▼
                    GitHub Actions CI/CD Pipeline
                                    │
                  Build → Test → Docker Image Build
                                    │
                            Deploy to AWS EC2
                                    │
                                    ▼
      ┌──────────────────────────────────────────────────┐
      │                  AWS EC2 Instance                  │
      │                                                    │
      │                  Docker Compose                    │
      │  ┌──────────────────┐    ┌──────────────────────┐  │
      │  │  React Frontend  │    │   Node.js Backend    │  │
      │  └──────────────────┘    └───────────┬──────────┘  │
      │                                      │              │
      │                              MySQL Database         │
      └──────────────────────┬───────────────────────────┘
                              │
                    Azure Data Factory Trigger
                              │
                              ▼
                   ADLS Gen2 (Raw Container)
                              │
                       Databricks Job
                              │
                              ▼
                 ADLS Gen2 (Curated Container)
                              │
                              ▼
              Azure Synapse Analytics (Views)
```

The analytics pipeline is completely separated from the operational application, following modern **Medallion-inspired** data engineering practices (Raw → Curated → Serving).

---

## Features

### Student Features
- User Registration
- Secure JWT Authentication
- Browse Available Quizzes
- Take Timed Quizzes
- Resume Quiz Attempts
- Automatic Scoring
- View Quiz History
- View Detailed Results

### Admin Features
- Admin Authentication
- Create / Edit / Delete Quizzes
- Add / Update / Delete Questions
- Monitor Student Attempts
- View Overall Statistics

### DevOps Features
- Dockerized Application
- Docker Compose Deployment
- GitHub Actions CI/CD
- Automatic Deployment to AWS EC2
- Environment Variable Management
- Production-ready Deployment

### Data Engineering Features
- Automated Data Ingestion
- Batch ETL Pipeline
- Azure Data Factory Copy Activities
- Azure Data Lake Storage Gen2
- Databricks PySpark Transformations
- Synapse SQL Views
- Automated Scheduling
- Analytics-ready Curated Data

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, mysql2, JWT Authentication |
| **Database** | MySQL |
| **DevOps** | Docker, Docker Compose, GitHub Actions, AWS EC2 |
| **Cloud (AWS)** | EC2, Security Groups |
| **Cloud (Azure)** | Azure Data Factory, Self Hosted Integration Runtime, ADLS Gen2, Azure Databricks, Azure Synapse Analytics |

---

## CI/CD Workflow

Whenever code is pushed to the `main` branch:

```
Developer
   │
   ▼
Push Code to GitHub
   │
   ▼
GitHub Actions
   │
   ├── Install Dependencies
   ├── Run Build
   ├── Build Docker Images
   ├── Push Deployment Files
   └── SSH into AWS EC2
           │
           ▼
   Docker Compose Pull
           │
           ▼
   Docker Compose Up -d
```

The deployment is fully automated using GitHub Actions, ensuring every successful push updates the production environment running on AWS EC2.

---

## Dockerized Deployment

The application runs entirely inside Docker containers.

```
Docker Compose
├── frontend
│      React + Vite
├── backend
│      Node.js + Express
└── mysql
       Database
```

**Benefits:**
- Consistent environments
- Easy deployment
- Simplified dependency management
- Portable infrastructure
- Faster setup

---

## End-to-End Data Pipeline

The application database acts as the source system.

```
Quiz Portal
   │
   ▼
MySQL Database (AWS EC2)
   │
   ▼
Azure Data Factory
   │
   ▼
ADLS Gen2 Raw
   │
   ▼
Azure Databricks
   │
   ▼
ADLS Curated
   │
   ▼
Azure Synapse Analytics
```

### Data Engineering Workflow

**Step 1 — Application Layer**
Students and administrators interact with the Quiz Portal. The backend continuously stores `users`, `quizzes`, `questions`, `attempts`, and `answers` inside MySQL running on AWS EC2.

**Step 2 — Ingestion**
Azure Data Factory automatically starts based on a scheduled trigger. Using a Self Hosted Integration Runtime, it securely connects to the MySQL database hosted on AWS EC2 and copies the `users`, `quizzes`, `questions`, `attempts`, and `answers` tables into the **Raw** container of Azure Data Lake Storage.

**Step 3 — Transformation**
A scheduled Azure Databricks Job executes automatically. The PySpark notebook performs:
- Data Cleaning
- Type Casting
- Deduplication
- Joins
- Aggregations
- Score Calculation
- Question Difficulty Analysis
- Quiz Performance Metrics

The processed data is written into the **Curated** container.

**Step 4 — Serving**
Azure Synapse Analytics reads the curated data directly. External tables and SQL Views provide Quiz Performance, Pass Percentage, Student Attempts, Daily Metrics, Question Difficulty, and Overall Summary Statistics — available for SQL querying without affecting the production database.

---

## Resource Inventory

### AWS
- **EC2** — Hosts Dockerized Quiz Portal, hosts MySQL, public application server
- **MySQL** — Source database containing Users, Quizzes, Questions, Attempts, Answers

### Azure

**Azure Data Factory** — Responsible for ingestion.
- Self Hosted Integration Runtime
- Linked Services
- Datasets
- Copy Activities
- Scheduled Trigger

**Azure Data Lake Storage Gen2**
- Raw Container — stores copied MySQL data
- Curated Container — stores transformed analytical datasets

**Azure Databricks** — Responsible for transformation.
- Workspace
- Job Cluster
- PySpark Notebook
- Scheduled Job
- Outputs: Quiz Performance, Summary Metrics, Question Difficulty

**Azure Synapse Analytics** — Provides SQL-based analytics.
- `vw_quiz_performance`
- `vw_summary_metrics`
- `vw_question_difficulty`

---

## Automation

Two independent scheduled automations keep the analytics pipeline updated:

| Stage | Service | Automation |
|---|---|---|
| Ingestion | Azure Data Factory | Scheduled Trigger |
| Transformation | Azure Databricks | Scheduled Job |

No manual execution is required.

---

## Security

**Application**
- JWT Authentication
- Role-Based Authorization

**Infrastructure**
- Docker Isolation
- Environment Variables

**Database**
- Read-only MySQL account for ADF
- Principle of Least Privilege

**Network**
- EC2 Security Group
- SHIR IP Whitelisting

**Storage**
- Private ADLS Gen2
- Storage Account Authentication

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Student Registration |
| POST | `/api/auth/login` | Login |
| GET | `/api/quizzes` | List Quizzes |
| GET | `/api/quizzes/:id` | Quiz Details |
| POST | `/api/quizzes` | Create Quiz |
| PUT | `/api/quizzes/:id` | Update Quiz |
| DELETE | `/api/quizzes/:id` | Delete Quiz |
| GET | `/api/questions/quiz/:id` | Quiz Questions |
| POST | `/api/questions` | Add Question |
| PUT | `/api/questions/:id` | Update Question |
| DELETE | `/api/questions/:id` | Delete Question |
| POST | `/api/attempts/start` | Start Attempt |
| POST | `/api/attempts/answer` | Save Answer |
| POST | `/api/attempts/submit` | Submit Quiz |
| GET | `/api/attempts/my` | Student Attempts |
| GET | `/api/attempts/all/list` | Admin Attempts |

---

## Project Structure

```
quiz-portal/
│
├── backend/
│   ├── server.js
│   ├── middleware/
│   ├── routes/
│   ├── schema.sql
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── data-engineering/
│   ├── adf/
│   ├── databricks/
│   │     └── transform.ipynb
│   ├── synapse/
│   │     └── synapse_views.sql
│   └── documentation/
│
└── README.md
```

---

## Future Improvements

- Incremental Data Loading
- Change Data Capture (CDC)
- Power BI Dashboard Integration
- Azure Key Vault Secrets
- Terraform Infrastructure as Code
- Kubernetes Deployment
- Azure Monitor & Application Insights
- CI/CD for Azure Data Pipeline

---

## Author

**Arulraj V**
GitHub: [https://github.com/Arulraj25](https://github.com/Arulraj25)

---

This README presents the project as a complete **Full-Stack + DevOps + Data Engineering** solution, showing the flow from GitHub → GitHub Actions → Docker → AWS EC2 → MySQL → Azure Data Factory → ADLS Gen2 → Databricks → Synapse Analytics — a strong portfolio project for both software engineering and data engineering roles.