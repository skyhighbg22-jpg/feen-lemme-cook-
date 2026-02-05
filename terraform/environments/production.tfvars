# ==========================================
# Feen Infrastructure - Production Environment
# ==========================================

environment = "production"
aws_region  = "us-east-1"
app_url     = "https://feen.dev"

# Networking
vpc_cidr = "10.0.0.0/16"

# Database (production-grade instances)
db_instance_class        = "db.t4g.medium"
db_allocated_storage     = 50
db_max_allocated_storage = 500

# Redis
redis_node_type = "cache.t4g.small"

# ECS (production capacity)
ecs_cpu           = 1024
ecs_memory        = 2048
ecs_desired_count = 3
ecs_min_count     = 2
ecs_max_count     = 20

# ACM Certificate (replace with your certificate ARN)
acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"
