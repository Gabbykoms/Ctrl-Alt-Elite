# 📚 Bantam Shuttle Documentation

Welcome to the Bantam Shuttle documentation! This folder contains all the guides and documentation for deploying, developing, and maintaining the application.

## 🚀 Deployment Guides

### Cloud Deployment
- **[STUDENT_GKE_QUICKSTART.md](STUDENT_GKE_QUICKSTART.md)** - 5-minute quick start for students using Google Cloud free tier ($300 credits)
- **[GKE_DEPLOYMENT.md](GKE_DEPLOYMENT.md)** - Complete Google Kubernetes Engine deployment guide
- **[K8S_DEPLOYMENT.md](K8S_DEPLOYMENT.md)** - General Kubernetes deployment instructions

### Local & Homelab
- **[LOCAL_DEPLOYMENT_SUCCESS.md](LOCAL_DEPLOYMENT_SUCCESS.md)** - Docker Desktop Kubernetes deployment guide
- **[HOMELAB_DEPLOYMENT.md](HOMELAB_DEPLOYMENT.md)** - Deployment to professor's homelab environment

## 🔧 Development & Configuration

### Backend
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database configuration and schema setup
- **[SETUP_AUTH.md](SETUP_AUTH.md)** - Authentication and authorization setup
- **[ROUTE_STATUS.md](ROUTE_STATUS.md)** - API routes status and documentation

### DevOps
- **[CI_CD.md](CI_CD.md)** - Continuous Integration/Deployment setup
- **[DOCKER.md](DOCKER.md)** - Docker configuration and best practices
- **[SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md)** - Utility scripts documentation

## 📖 Quick Reference

### New to the Project?
1. Start with the main [README.md](../README.md) in the root
2. Choose your deployment:
   - **Student with $300 credits?** → [STUDENT_GKE_QUICKSTART.md](STUDENT_GKE_QUICKSTART.md)
   - **Testing locally?** → [LOCAL_DEPLOYMENT_SUCCESS.md](LOCAL_DEPLOYMENT_SUCCESS.md)
   - **Production deployment?** → [GKE_DEPLOYMENT.md](GKE_DEPLOYMENT.md)

### Setting Up Development
1. [DATABASE_SETUP.md](DATABASE_SETUP.md) - Set up databases
2. [SETUP_AUTH.md](SETUP_AUTH.md) - Configure authentication
3. [DOCKER.md](DOCKER.md) - Build and run containers

### Deploying to Production
1. [GKE_DEPLOYMENT.md](GKE_DEPLOYMENT.md) - Full deployment process
2. [CI_CD.md](CI_CD.md) - Set up automated deployments
3. [SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md) - Useful automation scripts

## 🎯 By Task

| I want to... | Read this |
|--------------|-----------|
| Deploy for free as a student | [STUDENT_GKE_QUICKSTART.md](STUDENT_GKE_QUICKSTART.md) |
| Test locally on my laptop | [LOCAL_DEPLOYMENT_SUCCESS.md](LOCAL_DEPLOYMENT_SUCCESS.md) |
| Deploy to production | [GKE_DEPLOYMENT.md](GKE_DEPLOYMENT.md) |
| Set up the database | [DATABASE_SETUP.md](DATABASE_SETUP.md) |
| Configure authentication | [SETUP_AUTH.md](SETUP_AUTH.md) |
| Build Docker images | [DOCKER.md](DOCKER.md) |
| Set up CI/CD | [CI_CD.md](CI_CD.md) |
| Understand API routes | [ROUTE_STATUS.md](ROUTE_STATUS.md) |
| Use utility scripts | [SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md) |

## 📂 Service-Specific Documentation

Documentation specific to individual services can be found in their respective directories:

- **AI Service**: `/AI_Intergration_Service/kubernetes/` - RAG service deployment
- **Tracking Service**: `/tracking-service/` - API endpoints and schema docs
- **Backend**: Service-wide docs are now here in `/docs/`
- **Frontend**: `/frontend/` - React app documentation

## 🆘 Getting Help

- Check the relevant documentation above
- Review troubleshooting sections in deployment guides
- Look at service-specific READMEs
- Contact: gkoomson@trincoll.edu

---

**Last Updated**: December 9, 2025
