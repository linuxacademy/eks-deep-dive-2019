# Learning Activity: Deploying an Application to EKS

In this hands-on AWS learning activity, you will use the `kubectl` command to deploy the `nginx` service to EKS.

## Deploy the Service to EKS

Create the deployment:

`kubectl apply -f deployment.yaml`

Create the service:

`kubectl apply -f service.yaml`

We can watch the progress by looking at the deployment status:

`kubectl get deployment nginx`

Now that we have a running service that is `type: LoadBalancer` we need to find the ELB's address.

`kubectl get service nginx -o wide`

We can also use the JSON output to test connectivity:

```bash
ELB=$(kubectl get service nginx -o json | jq -r '.status.loadBalancer.ingress[].hostname')

curl -m3 -v $ELB
```

It will take several seconds for the ELB to become healthy and start passing traffic to the frontend pods.

You should also be able to copy/paste the loadBalancer hostname into your browser and see the application running.

## Undeploy the Applications

To delete the resources created by the applications, we should delete the application services and deployments:

```bash
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
```
