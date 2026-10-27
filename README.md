# Devops-Festive-sell (Festival Rush)

A scalable full-stack e-commerce platform built for festive sales with DevOps automation (Docker, Kubernetes, Jenkins CI/CD, Ansible, Terraform).

## Architecture

- **Frontend**: React (Vite), React Router
- **Backend**: Node.js, Express, sql.js / SQLite / PostgreSQL
- **DevOps**:
  - **Docker & Docker Compose**: Multi-container setup for client, server, and database
  - **Kubernetes (k8s)**: Deployment and service manifests
  - **CI/CD**: Jenkins pipeline (`Jenkinsfile`)
  - **Infrastructure as Code**: Terraform configurations
  - **Configuration Management**: Ansible playbooks

## Getting Started

### Local Development

1. **Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Server runs on `http://localhost:3001` (API at `http://localhost:3001/api`).

2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Client runs on `http://localhost:5173`.

### Docker Compose

```bash
docker-compose up --build
```
- Client: `http://localhost:80`
- Server API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
