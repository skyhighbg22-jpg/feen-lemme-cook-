# Feen Infrastructure - Terraform

This directory contains Terraform configurations for deploying Feen to AWS.

## Architecture

The infrastructure includes:

- **VPC** - Isolated network with public, private, and database subnets
- **ECS Fargate** - Serverless container orchestration
- **RDS PostgreSQL** - Managed database with Multi-AZ for production
- **ElastiCache Redis** - In-memory caching and rate limiting
- **Application Load Balancer** - HTTPS termination and load balancing
- **WAF** - Web Application Firewall for security
- **SQS** - Message queues for webhooks and background jobs
- **Secrets Manager** - Secure secrets storage
- **CloudWatch** - Logging and monitoring

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0
3. S3 bucket and DynamoDB table for Terraform state (see below)

## State Management

Create the S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for state
aws s3 mb s3://feen-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket feen-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name feen-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Usage

### Initialize

```bash
cd terraform
terraform init
```

### Plan (Staging)

```bash
terraform plan -var-file=environments/staging.tfvars
```

### Apply (Staging)

```bash
terraform apply -var-file=environments/staging.tfvars
```

### Plan (Production)

```bash
terraform plan -var-file=environments/production.tfvars
```

### Apply (Production)

```bash
terraform apply -var-file=environments/production.tfvars
```

## Configuration

### Required Variables

Before deploying, update the following in your tfvars file:

1. `acm_certificate_arn` - ARN of your SSL certificate in ACM

### Environment-Specific Settings

| Setting | Staging | Production |
|---------|---------|------------|
| DB Instance | db.t4g.micro | db.t4g.medium |
| Redis Node | cache.t4g.micro | cache.t4g.small |
| ECS Tasks | 1-3 | 2-20 |
| Multi-AZ | No | Yes |

## Outputs

After applying, the following outputs are available:

- `alb_dns_name` - Load balancer DNS name
- `ecr_repository_url` - Docker registry URL
- `database_endpoint` - RDS endpoint
- `redis_endpoint` - ElastiCache endpoint
- `secrets_arn` - Secrets Manager ARN

## DNS Setup

After deployment, create a CNAME record pointing your domain to the ALB DNS name:

```
feen.dev -> <alb_dns_name>
```

Or use Route53 with an A record alias to the ALB.

## Destroying

```bash
# Destroy staging
terraform destroy -var-file=environments/staging.tfvars

# Destroy production (requires manual confirmation)
terraform destroy -var-file=environments/production.tfvars
```

**Warning**: Production has deletion protection enabled on RDS. You must disable it first in the AWS Console or via CLI before destroying.

## Cost Estimation

### Staging (~$50-100/month)
- ECS Fargate (0.25 vCPU, 0.5 GB): ~$10
- RDS t4g.micro: ~$15
- ElastiCache t4g.micro: ~$12
- ALB: ~$18
- NAT Gateway: ~$32
- Other (CloudWatch, etc.): ~$5

### Production (~$300-500/month)
- ECS Fargate (1 vCPU, 2 GB x 2-3): ~$60-100
- RDS t4g.medium Multi-AZ: ~$70
- ElastiCache t4g.small with replica: ~$50
- ALB: ~$20
- NAT Gateway x 3: ~$100
- WAF: ~$10
- Other: ~$20

*Costs vary based on usage and region.*

## Security

- All data encrypted at rest (RDS, ElastiCache, S3)
- All traffic encrypted in transit (TLS)
- WAF protects against common attacks
- Secrets stored in AWS Secrets Manager
- Private subnets for all compute resources
- Security groups follow least privilege principle
