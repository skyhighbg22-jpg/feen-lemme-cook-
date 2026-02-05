# ==========================================
# Feen Infrastructure - Staging Environment
# ==========================================

environment = "staging"
aws_region  = "us-east-1"
app_url     = "https://staging.feen.dev"

# Networking
vpc_cidr = "10.0.0.0/16"

# Database (smaller instances for staging)
db_instance_class        = "db.t4g.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 50

# Redis
redis_node_type = "cache.t4g.micro"

# ECS (smaller for staging)
ecs_cpu           = 256
ecs_memory        = 512
ecs_desired_count = 1
ecs_min_count     = 1
ecs_max_count     = 3

# ACM Certificate (replace with your certificate ARN)
acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"
