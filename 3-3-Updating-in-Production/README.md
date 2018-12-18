# Updating in Production

## Update Cluster Version

```sh
aws eks update-cluster-version --name Your-EKS-Cluster --kubernetes-version 1.11
```

Note the `id` field in the output from the above command.

Describe a particular update to see details about the update’s status. Use the `id` field from the previous command as the `UUID` argument here:

```sh
aws eks describe-update --name Your-EKS-Cluster --update-id UUID
```

Your update is complete when the status is shown as `Successful`.

## Patch kube-proxy to Latest Version

```sh
kubectl patch daemonset kube-proxy -n kube-system --patch "$(cat patch-kube-proxy.yaml)"
```

## Switching from kube-dns to CoreDNS

EKS clusters created with Kubernetes 1.11 ship with CoreDNS as the default DNS and service discovery provider. Clusters created with 1.10 shipped with kube-dns. If you have updated a 1.10 cluster to 1.11, and you would like to use CoreDNS, you must install CoreDNS and remove `kube-dns`.

### Patch kube-dns

```sh
kubectl patch -n kube-system deployment/kube-dns --patch "$(cat patch-kube-dns.yaml)"
```

### Deploy CoreDNS

1. Set your cluster's DNS IP address to the `DNS_CLUSTER_IP` environment variable:

```sh
export DNS_CLUSTER_IP=$(kubectl get svc -n kube-system kube-dns -o jsonpath='{.spec.clusterIP}')
```

1. Set your cluster's AWS Region to the `REGION` environment variable:

```sh
export REGION="us-east-1"
```

1. Download the CoreDNS manifest from the Amazon EKS resource bucket:

```sh
curl -O https://amazon-eks.s3-us-west-2.amazonaws.com/cloudformation/2018-12-10/dns.yaml
```

1. Replace the variable placeholders in the `dns.yaml` file with your environment variable values and apply the updated manifest to your cluster\. The following command completes this in one step:

```sh
cat dns.yaml | sed -e "s/REGION/$REGION/g" | sed -e "s/DNS_CLUSTER_IP/$DNS_CLUSTER_IP/g" | kubectl apply -f -
```

1. Fetch the `coredns` pod name from your cluster:

```sh
COREDNS_POD=$(kubectl get pod -n kube-system -l eks.amazonaws.com/component=coredns \
-o jsonpath='{.items[0].metadata.name}')
```

1. Query the `coredns` pod to ensure that it is receiving requests:

```sh
kubectl get --raw /api/v1/namespaces/kube-system/pods/$COREDNS_POD:9153/proxy/metrics \
| grep 'coredns_dns_request_count_total'
```

### Scale `kube-dns` down to 0 replicas

```sh
kubectl  scale -n kube-system deployment/kube-dns --replicas=0
```

### Delete any `kube-dns` resources

```sh
kubectl delete -n kube-system deployment/kube-dns serviceaccount/kube-dns configmap/kube-dns
```

## Updating the Worker Node Group

Scale out to at least 2 replicas, so we can get a rolling deployment to prevent an outage:

```sh
kubectl scale deployments/coredns --replicas=2 -n kube-system
```

Note the instance type and desired count from the worker node autoscaling group. We will use these values to update our CloudFormation stack.

Update the stack, specifying 1 node greater than the desired instance count, so the rolling update can take place.

Specify the AMI ID (you can find these [here](https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-ami.html)).

Acknowledge that the stack might create IAM resources, and then choose Update.
