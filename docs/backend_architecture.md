# Backend Architecture
![[elo-시스템디자인.drawio.png]]

- Application Server: nest.js(node js), TypeORM
- Web Server: nginx
- Database: postgreSQL
- Blockchain Network
    - test: polygon amoy
    - main net: very main net
- 외부 저장소: S3

- Deploy
    - EC2 + RDS + S3
    - DNS: Route53
    - CI/CD: Github Actions + Docker Hub + Docker