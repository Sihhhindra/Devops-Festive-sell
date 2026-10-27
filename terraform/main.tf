# ─── Terraform Configuration for Festival Rush ──────────────────
# Provisions: VPC, EKS, ECR, RDS on AWS

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Store state in S3 (optional — can use local state for demos)
  # backend "s3" {
  #   bucket = "festival-rush-tfstate"
  #   key    = "terraform.tfstate"
  #   region = "ap-south-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "festival-rush"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
