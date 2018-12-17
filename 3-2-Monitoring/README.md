# Monitoring an EKS Cluster

## Configure Storage Class

```sh
kubectl create -f prometheus-storageclass.yaml
```

## Deploy Prometheus

```sh
helm install -f prometheus-values.yaml stable/prometheus --name prometheus --namespace prometheus
```

Check if Prometheus components deployed as expected

```sh
kubectl get all -n prometheus
```

You should see all the Prometheus pods, services, daemonsets, deployments, and replicasets are all ready and available.

You can access Prometheus server URL by going to any one of your Worker node IP address and specify port `:30900/targets` (for ex, `52.12.161.128:30900/targets`. Remember to open port 30900 in your Worker nodes Security Group. In the web UI, you can see all the targets and metrics being monitored by Prometheus

## Deploy Grafana

```sh
helm install -f grafana-values.yaml stable/grafana --name grafana --namespace grafana
```

Check if Grafana components are deployed as expected

```sh
kubectl get all -n grafana
```

You should see the Grafana po, service, deployment, and replicaset all ready and available.

You can get Grafana ELB URL using this command. Copy & Paste the value into browser to access Grafana web UI:

```
export ELB=$(kubectl get svc -n grafana grafana -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "http://$ELB"
```