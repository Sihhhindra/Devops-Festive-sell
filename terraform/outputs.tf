# ─── Output Values ───────────────────────────────────────────────

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "ecr_client_url" {
  description = "ECR repository URL for client"
  value       = aws_ecr_repository.client.repository_url
}

output "ecr_server_url" {
  description = "ECR repository URL for server"
  value       = aws_ecr_repository.server.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_hostname" {
  description = "RDS hostname (without port)"
  value       = aws_db_instance.postgres.address
}
