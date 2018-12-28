# Application Tracing with X-Ray

## Add AWSXRayDaemonWriteAccess to node IAM role

## Build the X-Ray daemon Docker image

`docker build -t xray-daemon .`

## Create an Amazon ECR repository

```sh
$(aws ecr get-login --no-include-email --region us-east-1)
aws ecr create-repository --repository-name xray-daemon
docker tag xray-daemon:latest 629054125090.dkr.ecr.us-east-1.amazonaws.com/xray-daemon:latest
docker push 629054125090.dkr.ecr.us-east-1.amazonaws.com/xray-daemon:latest
```

## Deploy the X-Ray daemon to Kubernetes

Edit line 56, replacing your AWS account ID
`kubectl apply -f xray-k8s-daemonset.yaml`

## Connecting to the X-Ray daemon

```sh
cd demo-app/service-a
docker build -t service-a .
cd ../service-b
docker build -t service-b .
cd ..
aws ecr create-repository --repository-name service-a
aws ecr create-repository --repository-name service-b
docker tag service-a:latest 629054125090.dkr.ecr.us-east-1.amazonaws.com/service-a:latest
docker tag service-b:latest 629054125090.dkr.ecr.us-east-1.amazonaws.com/service-b:latest
docker push 629054125090.dkr.ecr.us-east-1.amazonaws.com/service-a:latest
docker push 629054125090.dkr.ecr.us-east-1.amazonaws.com/service-b:latest
```

Edit `k8s-deploy.yaml` specifying your ECR URIs for both services.

`kubectl apply -f k8s-deploy.yaml`

Send some requests to the `service-a` endpoint.

View the traces in X-Ray

