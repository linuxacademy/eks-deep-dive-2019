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

Read more [here](coredns.md).

## Updating the Worker Node Group

Upgrading the control plane is insufficient to completely upgrade your cluster. You must also upgrade your worker node group.

Read more [here](Updating-Worker-Nodegroup.md).