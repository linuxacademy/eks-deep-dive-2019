# Picture Upload

A multi-project repo of services that work together to form a demo to enable users to get and upload photos to Amazon S3.

## About this project

This project is composed of independent Node.js services:

- web-client: a front-end client for viewing and storing images
- photo-filter: a REST API for applying filters to a given image
- photo-storage: a REST API for creating, reading, and deleting images in Amazon S3

## Prerequisites

All prerequisite tools can be installed using the [prereq.sh](prereq.sh) script provided

## Development Installation

1. Requires [Node.js 6+](https://nodejs.org) and [Go 1.11+](https://golang.org).
1. Clone the repository into your local machine
1. Go into the new folder `picture-upload` folder and run `make install` to install all the packages for each app.

## Development Deployment

### Using your local machine

1. Install via `Development Installation` instructions
1. Ensure that you have completed AWS CLI configuration on your host machine (see: [Configuring the AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html))
1. Go into each folder in `picture-upload/apps` and run `npm run dev`. For `photo-filter`, run `go build` and then `go run main.go` instead.

### Verifying Deployment

1. Navigate to the web-client homepage at [localhost:3000](localhost:3000)
2. Select an image file (jpeg, png, bmp only) and upload
3. Observe the image has had a greyscale filter applied to it and added to the list of images

## Environment Variables

### Environment Variable Reference

**web-client:**

- `PORT`:
  - Default: "3000"
  - Description: The port number to listen on
- `FILTER_HOST`:
  - Default: "localhost"
  - Description: The host name of the url that the `photo-filter` service is listening on.
- `FILTER_PORT`:
  - Default: "3002"
  - Description: The port number of the url that the `photo-filter` service is listening on.
- `STORAGE_HOST`:
  - Default: "localhost"
  - Description: The host name of the url that the `photo-storage` service is listening on.
- `STORAGE_PORT`:
  - Default: "3001"
  - Description: The port number of the url that the `photo-filter` service is listening on.
- `AWS_REGION`:
  - Default: "us-east-1"
  - Description: The region to send AWS S3 Requests to
- `DEBUG`
  - Default: none
  - Description: Print logs of a specified type for debugging purposes
  - Possible Values: none, 'APP_VARS', '*'

**photo-filter:**

- `PORT`:
  - Default: "3002"
  - Description: The port number to listen on

**photo-storage:**

- `PORT`:
  - Default: "3001"
  - Description: The port number to listen on
- `STAGE`:
  - Default: none
  - Description: The deployment environment
- `AWS_REGION`:
  - Default: "us-east-1"
  - Description: The region to send AWS S3 Requests to

## Deploy the Backend Services to EKS

The containers listen on ports 3000 (web-client), 3001 (photo-storage), and 3002 (photo-filter), and native service discovery will be used to locate the running containers and communicate with them.

Let's bring up the photo-filter API:

```bash
kubectl apply -f ./apps/photo-filter/k8s/deployment.yaml
kubectl apply -f ./apps/photo-filter/k8s/service.yaml
```

We can watch the progress by looking at the deployment status:

`kubectl get deployment photo-filter-deployment`

Let's bring up the photo-storage API:

```bash
kubectl apply -f ./apps/photo-storage/k8s/deployment.yaml
kubectl apply -f ./apps/photo-storage/k8s/service.yaml
```

We can watch the progress by looking at the deployment status:

`kubectl get deployment photo-storage-deployment`

The `photo-filter` and `photo-storage` services are of the default type `ClusterIP`. This exposes these services on cluster-internal IPs. Choosing this value makes the service only reachable from within the cluster.

### Ensure the ELB Service Role Exists

In AWS accounts that have never created a load balancer before, it is possible that the service role for ELB might not exist yet.

We can check for the role, and create it if it is missing.

`aws iam get-role --role-name "AWSServiceRoleForElasticLoadBalancing" || aws iam create-service-linked-role --aws-service-name "elasticloadbalancing.amazonaws.com"`

## Deploy the Frontend Services to EKS

The `web-client` service is of type `LoadBalancer`. This will configure an ELB to handle incoming traffic to this service.

Let's bring up the `web-client` frontend:

```bash
kubectl apply -f ./apps/web-client/k8s/deployment.yaml
kubectl apply -f ./apps/web-client/k8s/service.yaml
```

We can watch the progress by looking at the deployment status:

`kubectl get deployment web-client-deployment`

Now that we have a running service that is `type: LoadBalancer` we need to find the ELB's address.

`kubectl get service web-client -o wide`

We can also use the JSON output to test connectivity:

```bash
ELB=$(kubectl get service web-client -o json | jq -r '.status.loadBalancer.ingress[].hostname')

curl -m3 -v $ELB
```

It will take several seconds for the ELB to become healthy and start passing traffic to the frontend pods.

You should also be able to copy/paste the loadBalancer hostname into your browser and see the application running.

## Scaling the Backend Services

When we launched our services, we only launched one container of each. We can confirm this by viewing the running pods:

`kubectl get deployments`

Now let’s scale up the backend services:

```bash
kubectl scale deployment photo-filter-deployment --replicas=3
kubectl scale deployment photo-storage-deployment --replicas=3
```

Confirm by looking at deployments again:

`kubectl get deployments`

Let’s also scale our frontend service the same way:

```bash
kubectl get deployments
kubectl scale deployment web-client-deployment --replicas=3
kubectl get deployments
```

## Undeploy the Applications

To delete the resources created by the applications, we should delete the application services and deployments:

```bash
kubectl delete -f ./apps/web-client/k8s/service.yaml
kubectl delete -f ./apps/web-client/k8s/deployment.yaml

kubectl delete -f ./apps/photo-filter/k8s/service.yaml
kubectl delete -f ./apps/photo-filter/k8s/deployment.yaml

kubectl delete -f ./apps/photo-storage/k8s/service.yaml
kubectl delete -f ./apps/photo-storage/k8s/deployment.yaml
```

## Logging with Fluentd

[Fluentd](https://www.fluentd.org/) is an open source data collector providing a unified logging layer, supported by 500+ plugins connecting to many types of systems.

See the [Fluentd](fluentd/README.md) section for more info.