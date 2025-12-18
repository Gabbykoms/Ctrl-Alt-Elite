# Harbor Registry - Login, Retag, and Push

## Harbor Registry Details

- **Registry URL**: `your_harbor_url`
- **Username**: `your_robot_usrname`
- **Password**: `your_harbor_password`

## Step 1: Login to Harbor

```bash
docker login your_harbor_url
```

When prompted:
- **Username**: `your_robot_usrname`
- **Password**: `your_harbor_password`

**Expected output:**
```
Login Succeeded
```

## Step 2: Retag Your Images

After building images locally, retag them for Harbor using the following format:

```bash
docker tag <local-image-name>:<tag> your_harbor_url/library/elite-<service>:<version>
```

### Example: Retag Backend Image

```bash
docker tag elite-backend:latest harbor.javajon-gke.duckdns.org/library/elite-backend:v1.0.0
```

### Example: Retag Frontend Image

```bash
docker tag elite-frontend:latest harbor.javajon-gke.duckdns.org/library/elite-frontend:v1.0.0
```

### Example: Retag Tracking Service Image

```bash
docker tag elite-tracking-service:latest harbor.javajon-gke.duckdns.org/library/elite-tracking-service:v1.0.0
```

### Example: Retag AI Service Image

```bash
docker tag elite-ai-service:latest harbor.javajon-gke.duckdns.org/library/elite-ai-service:v1.0.0
```

## Step 3: Push Images to Harbor

Push each retagged image to the Harbor registry:

```bash
docker push your_harbor_url/library/elite-<service>:<version>
# example
docker push harbor.javajon-gke.duckdns.org/library/elite-frontend:v1.0.0
```

## Verify Images in Harbor

Once pushed, verify your images are in the Harbor registry by visiting the harbor registry website.


## Troubleshooting

### Login Fails
- Verify credentials are correct
- Check network connectivity to your `harbor_url` by using `ping harbor_url` 
- Ensure Docker is running

### Push Fails
- Ensure you're logged in: `docker login harbor_url`
- Verify the image exists locally: `docker images`
- Check Harbor project `library` exists and you have push permissions
- Check network connectivity

### Image Not Found After Push
- Wait a few seconds for the registry to update
- Refresh the Harbor UI
- Verify push command output shows `digest: sha256:...`