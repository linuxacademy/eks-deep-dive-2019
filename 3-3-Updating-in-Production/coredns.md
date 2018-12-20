# Switching from kube-dns to CoreDNS

EKS clusters created with Kubernetes 1.11 ship with CoreDNS as the default DNS and service discovery provider. Clusters created with 1.10 shipped with kube-dns. If you have updated a 1.10 cluster to 1.11, and you would like to use CoreDNS, you must install CoreDNS and remove `kube-dns`.

## Patch kube-dns

```sh
kubectl patch -n kube-system deployment/kube-dns --patch "$(cat patch-kube-dns.yaml)"
```

## Deploy CoreDNS

1. Set your cluster's DNS IP address to the `DNS_CLUSTER_IP` environment variable:

```sh
export DNS_CLUSTER_IP=$(kubectl get svc -n kube-system kube-dns -o jsonpath='{.spec.clusterIP}')
```

2. Set your cluster's AWS Region to the `REGION` environment variable:

```sh
export REGION="us-east-1"
```

3. Download the CoreDNS manifest from the Amazon EKS resource bucket:

```sh
curl -O https://amazon-eks.s3-us-west-2.amazonaws.com/cloudformation/2018-12-10/dns.yaml
```

4. Replace the variable placeholders in the `dns.yaml` file with your environment variable values and apply the updated manifest to your cluster\. The following command completes this in one step:

```sh
cat dns.yaml | sed -e "s/REGION/$REGION/g" | sed -e "s/DNS_CLUSTER_IP/$DNS_CLUSTER_IP/g" | kubectl apply -f -
```

5. Fetch the `coredns` pod name from your cluster:

```sh
COREDNS_POD=$(kubectl get pod -n kube-system -l eks.amazonaws.com/component=coredns \
-o jsonpath='{.items[0].metadata.name}')
```

6. Query the `coredns` pod to ensure that it is receiving requests:

```sh
kubectl get --raw /api/v1/namespaces/kube-system/pods/$COREDNS_POD:9153/proxy/metrics | grep 'coredns_dns_request_count_total'
```

Note: If this is a new cluster, and you don't see any results, you can generate some DNS traffic in your cluster using the following commands:

```sh
kubectl create -f https://k8s.io/examples/admin/dns/busybox.yaml

kubectl exec -ti busybox -- nslookup kubernetes.default
```

Then repeat the previous `kubectl get` command. You should see output like the following:

```text
coredns_dns_request_count_total{family="1",proto="udp",server="dns://:53",zone="."} 4
```

where the digit at the end of the line is the number of DNS requests received by CoreDNS.

## Scale `kube-dns` down to 0 replicas

```sh
kubectl scale -n kube-system deployment/kube-dns --replicas=0
```

## Delete any `kube-dns` resources

```sh
kubectl delete -n kube-system deployment/kube-dns serviceaccount/kube-dns configmap/kube-dns
```