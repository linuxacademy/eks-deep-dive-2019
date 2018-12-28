# Application Tracing with X-Ray

## Add XRay Managed Policy to Worker Node IAM Role

1. Find the EC2 worker node instance IAM role
1. Click **Attach policies**
1. Add the `AWSXRayDaemonWriteAccess` managed policy

## Build the X-Ray daemon Docker image

Using the `Dockerfile` in this directory, build the `xray-daemon` image:

```sh
docker build -t xray-daemon .
```

## Create an Amazon ECR repository

Create an ECR repository for the `xray-daemon`. Replace `us-east-1` with your region, if desired.

```sh
$(aws ecr get-login --no-include-email --region us-east-1)

aws ecr create-repository --repository-name xray-daemon
```

Tag and push the image to ECR. Replace `123456789012` in the commands below with your AWS account ID.

```sh
docker tag xray-daemon:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/xray-daemon:latest

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/xray-daemon:latest
```

## Deploy the X-Ray daemon to Kubernetes

Edit line 56 of `xray-k8s-daemonset.yaml`, replacing your AWS account ID

Apply the configuration:

```sh
kubectl apply -f xray-k8s-daemonset.yaml
```

To view the status of the X-Ray DaemonSet:

```sh
kubectl describe daemonset xray-daemon
```

Ensure all pods are running. To view the logs for all of the X-Ray daemon pods run the following:

```sh
kubectl logs -l app=xray-daemon
```

## Build the Two Demo Applications

```sh
cd demo-app/service-a
docker build -t service-a .
cd ../service-b
docker build -t service-b .
cd ..
```

## Create ECR Repositories for the Demo Applications

```sh
aws ecr create-repository --repository-name service-a
aws ecr create-repository --repository-name service-b
```

## Tag and Push Both Demo Applications to ECR

Replace `123456789012` with your AWS account ID in the commands below:

```sh
docker tag service-a:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/service-a:latest

docker tag service-b:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/service-b:latest

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/service-a:latest

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/service-b:latest
```

## Deploy the Demo Applications to EKS

Edit `k8s-deploy.yaml` specifying your ECR URIs for both services.

Deploy the services:

```sh
kubectl apply -f k8s-deploy.yaml
```

When the services are first deployed, it can take up to several minutes for the ELB to be created and DNS updated.

## Generate Traffic to `service-a`

Find the `service-a` load balancer endpoint DNS name using

`kubectl get service service-a -o wide`

Send some requests to the `service-a` endpoint using `curl` or a browser. The endpoint name ends in `elb.amazonaws.com`.

## View the Traces in X-Ray

Nagivate to AWS X-Ray in the AWS Management Console.

## Cleanup

Delete the example applications:

```sh
kubectl delete deployments service-a service-b
```

Delete the X-Ray DaemonSet:

```sh
kubectl delete -f xray-k8s-daemonset.yaml
```