# ==========================================
# Feen Infrastructure - Outputs
# ==========================================

# ==========================================
# VPC
# ==========================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "Database subnet IDs"
  value       = module.vpc.database_subnets
}

# ==========================================
# Load Balancer
# ==========================================

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.arn
}

output "alb_zone_id" {
  description = "ALB zone ID for Route53"
  value       = module.alb.zone_id
}

# ==========================================
# Database
# ==========================================

output "database_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = module.rds.db_instance_name
}

# ==========================================
# Redis
# ==========================================

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

# ==========================================
# ECS
# ==========================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

# ==========================================
# ECR
# ==========================================

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

# ==========================================
# SQS
# ==========================================

output "webhooks_queue_url" {
  description = "Webhooks SQS queue URL"
  value       = aws_sqs_queue.webhooks.url
}

output "background_jobs_queue_url" {
  description = "Background jobs SQS queue URL"
  value       = aws_sqs_queue.background_jobs.url
}

# ==========================================
# Secrets
# ==========================================

output "secrets_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

# ==========================================
# CloudWatch
# ==========================================

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.app.name
}

# ==========================================
# WAF
# ==========================================

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}
