#!/usr/bin/env bash

# Edit this line, setting your EC2 worker node IAM role name
ROLE_NAME=<worker node role>

##-- DO NOT EDIT BELOW THIS LINE --##

aws iam put-role-policy --role-name $ROLE_NAME --policy-name Logs-Policy-For-Worker --policy-document file://k8s-logs-policy.json
aws iam get-role-policy --role-name $ROLE_NAME --policy-name Logs-Policy-For-Worker
kubectl apply -f fluentd.yml
kubectl get pods -w --namespace=kube-system -l k8s-app=fluentd-cloudwatch
