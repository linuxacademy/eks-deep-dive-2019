# Enabling Container Logging with Fluentd

Find the IAM role associated with the EC2 worker nodes, and assign it to a variable:

`ROLE_NAME=<worker node role>`

Attach the policy to the Worker Node Role:

`aws iam put-role-policy --role-name $ROLE_NAME --policy-name Logs-Policy-For-Worker --policy-document file://k8s-logs-policy.json`

Validate that the policy is attached to the role:

`aws iam get-role-policy --role-name $ROLE_NAME --policy-name Logs-Policy-For-Worker`

The Fluentd log agent configuration is located in the Kubernetes ConfigMap. Fluentd will be deployed as a DaemonSet, i.e. one pod per worker node. In our case, a 3 node cluster is used and so 3 pods will be shown in the output when we deploy.

Edit `fluentd.yaml` setting the `REGION` and `CLUSTER_NAME` environment variable values around line 196.

Apply the configuration:

`kubectl apply -f fluentd.yml`

Watch for all of the pods to change to running status:

`kubectl get pods -w --namespace=kube-system`

We are now ready to check that logs are arriving in CloudWatch Logs.

Select the region that is mentioned in fluentd.yml to browse the Cloudwatch Log Group if required.