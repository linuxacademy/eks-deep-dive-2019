#!/usr/bin/env bash

# Edit this line, setting your EC2 worker node IAM role name
ROLE_NAME=<worker node role>

##-- DO NOT EDIT BELOW THIS LINE --##

aws iam delete-role-policy --role-name $ROLE_NAME --policy-name Logs-Policy-For-Worker
kubectl delete -f fluentd.yml